import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서 사용되어야 합니다.");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isCallbackProcessingRef = useRef(false); // Google 콜백 처리 중복 방지

  // 로컬 스토리지에서 토큰 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const userInfo = localStorage.getItem("user_info");

        if (token && userInfo) {
          try {
            const parsedUser = JSON.parse(userInfo);
            // 토큰 유효성 검증
            const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

            const testResponse = await fetch(`${baseUrl}/api/mypage/profile`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            if (testResponse.ok) {
              setUser(parsedUser);
              setIsAuthenticated(true);
            } else {
              logout();
            }
          } catch (parseError) {
            // 저장된 사용자 정보가 손상된 경우
            logout();
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // 인증 상태 확인 중 오류 발생시 조용히 로그아웃
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Google OAuth 코드를 받아서 백엔드로 전송
  const handleGoogleCallback = async (code) => {
    // 이미 처리 중이면 중복 호출 방지
    if (isCallbackProcessingRef.current) {
      return { success: false, error: "이미 로그인 처리 중입니다." };
    }

    try {
      isCallbackProcessingRef.current = true;
      setLoading(true);

      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${baseUrl}/api/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: `${window.location.origin}/auth/callback`,
        }),
      });

      if (!response.ok) {
        let errorMessage = "서버 연결에 문제가 있습니다";
        try {
          const errorData = await response.json();
          // 서버 에러 메시지를 사용자 친화적으로 변환
          if (errorData.error) {
            if (errorData.error.includes("code")) {
              errorMessage = "인증 코드가 올바르지 않습니다";
            } else if (errorData.error.includes("token")) {
              errorMessage = "토큰 처리 중 오류가 발생했습니다";
            } else {
              errorMessage = "인증 처리 중 문제가 발생했습니다";
            }
          }
        } catch {
          // JSON 파싱 실패 시 네트워크 에러로 간주
          errorMessage = "네트워크 연결을 확인해주세요";
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // 더미 토큰 감지
      if (data.access_token && data.access_token.includes("dummy")) {
        throw new Error(
          "서버에서 더미 응답을 반환했습니다. 실제 Google OAuth가 구성되지 않았습니다."
        );
      }

      if (!data.access_token || !data.refresh_token || !data.user) {
        throw new Error("서버 응답에서 필수 데이터가 누락되었습니다.");
      }

      // 토큰과 사용자 정보 저장
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_info", JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      // 에러 타입에 따라 사용자 친화적 메시지 제공
      let userFriendlyMessage = "로그인 처리 중 문제가 발생했습니다";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        userFriendlyMessage =
          "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요";
      } else if (error.message.includes("Failed to fetch")) {
        userFriendlyMessage = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요";
      } else if (
        error.message.includes("네트워크") ||
        error.message.includes("서버") ||
        error.message.includes("인증")
      ) {
        userFriendlyMessage = error.message;
      }

      return { success: false, error: userFriendlyMessage };
    } finally {
      setLoading(false);
      isCallbackProcessingRef.current = false; // 처리 완료 표시
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
    setUser(null);
    setIsAuthenticated(false);
  };

  // 토큰 갱신
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        throw new Error("리프레시 토큰이 없습니다.");
      }

      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refresh,
        }),
      });

      if (!response.ok) {
        throw new Error("토큰 갱신 실패");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);

      return data.access_token;
    } catch (error) {
      // 토큰 갱신 실패시 조용히 로그아웃
      logout();
      throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    }
  };

  // API 호출을 위한 인증된 fetch 함수
  const authenticatedFetch = async (url, options = {}) => {
    let token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error("인증 토큰이 없습니다.");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // 토큰 만료 시 자동 갱신 시도
    if (response.status === 401) {
      try {
        token = await refreshToken();
        headers.Authorization = `Bearer ${token}`;

        response = await fetch(url, {
          ...options,
          headers,
        });

        if (response.status === 401) {
          logout();
          throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }
      } catch (refreshError) {
        logout();
        throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    return response;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    handleGoogleCallback,
    logout,
    refreshToken,
    authenticatedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
