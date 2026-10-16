import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  getAccessToken,
  getApiBaseUrl,
  getRefreshToken,
  getStoredUser,
  refreshAccessToken,
  saveSession,
} from "utils/apiClient";

const AuthContext = createContext();

/** 백엔드가 승인 대기 계정에 돌려주는 코드 */
export const APPROVAL_PENDING = "APPROVAL_PENDING";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서 사용되어야 합니다.");
  }
  return context;
};

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // 세션이 끊긴 사유 (expired | pending). 로그인 화면 안내에 쓴다.
  const [sessionEndReason, setSessionEndReason] = useState(null);
  const isCallbackProcessingRef = useRef(false); // Google 콜백 처리 중복 방지

  const isAuthenticated = Boolean(user);

  const logout = useCallback(() => {
    const refresh = getRefreshToken();
    if (refresh) {
      // refresh 토큰 블랙리스트 처리. 실패해도 로컬 세션은 지운다.
      fetch(`${getApiBaseUrl()}/api/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    clearSession();
    setUser(null);
  }, []);

  // 저장된 토큰이 아직 유효한지 서버에 확인한다 (만료 시 apiClient가 refresh까지 시도)
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/me/`);
        if (response.ok) {
          const data = await readJson(response);
          saveSession({ accessToken: getAccessToken(), user: data.user });
          setUser(data.user);
        } else {
          clearSession();
          setUser(null);
        }
      } catch (error) {
        // 서버에 닿지 못한 경우: 저장된 정보로 화면은 열어 두고, 이후 API 호출에서 다시 검증된다
        console.error("[AuthContext] 로그인 상태 확인 실패:", error);
        setUser(getStoredUser());
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 어느 API 호출에서든 토큰 갱신이 실패하면 로그아웃 상태로 전환한다
  useEffect(() => {
    const handleExpired = (event) => {
      setSessionEndReason(event.detail?.reason || null);
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  /**
   * Google OAuth 코드를 백엔드로 보내 JWT를 받는다.
   * @returns {{success: true, user} | {success: false, code?: string, email?: string, error: string}}
   */
  const handleGoogleCallback = useCallback(async (code) => {
    if (isCallbackProcessingRef.current) {
      return { success: false, error: "이미 로그인 처리 중입니다." };
    }
    isCallbackProcessingRef.current = true;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: `${window.location.origin}/auth/callback`,
        }),
      });
      const data = await readJson(response);

      if (!response.ok) {
        if (data.code === APPROVAL_PENDING) {
          return {
            success: false,
            code: APPROVAL_PENDING,
            email: data.email,
            error: "관리자 승인 대기 중인 계정입니다.",
          };
        }
        return { success: false, error: "인증 처리 중 문제가 발생했습니다. 다시 로그인해주세요." };
      }

      if (!data.access_token || !data.refresh_token || !data.user) {
        return { success: false, error: "서버 응답에서 필수 데이터가 누락되었습니다." };
      }

      saveSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
      setSessionEndReason(null);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error("[AuthContext] Google 로그인 처리 실패:", error);
      return {
        success: false,
        error: "서버에 연결할 수 없습니다. 네트워크를 확인하고 잠시 후 다시 시도해주세요.",
      };
    } finally {
      isCallbackProcessingRef.current = false;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const token = await refreshAccessToken();
    if (!token) {
      throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    }
    return token;
  }, []);

  // 토큰 첨부·401 갱신은 전역 fetch 래퍼(apiClient)가 처리한다. 기존 호출부 호환용.
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    if (!getAccessToken()) {
      throw new Error("인증 토큰이 없습니다.");
    }
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (response.status === 401) {
      throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    }
    return response;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      sessionEndReason,
      handleGoogleCallback,
      logout,
      refreshToken,
      authenticatedFetch,
    }),
    [
      user,
      isAuthenticated,
      loading,
      sessionEndReason,
      handleGoogleCallback,
      logout,
      refreshToken,
      authenticatedFetch,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
