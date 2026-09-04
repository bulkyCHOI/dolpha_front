import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAuth } from "contexts/AuthContext";
import { COLORS, alpha } from "constants/styles";

function AuthCallback() {
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Google 로그인을 처리하고 있습니다...");
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const isProcessingRef = useRef(false); // 중복 처리 방지
  const timeoutRef = useRef(null); // 타이머 참조

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessingRef.current) {
      return;
    }

    const processGoogleCallback = async () => {
      // 처리 시작 표시
      isProcessingRef.current = true;

      try {
        // URL에서 인증 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const state = urlParams.get("state");

        // State 검증 (CSRF 보호)
        if (state && !state.startsWith("dolpha_login_")) {
          setStatus("error");
          setMessage("잘못된 인증 요청입니다.");
          timeoutRef.current = setTimeout(() => navigate("/pages/authentication/sign-in"), 3000);
          return;
        }

        if (error) {
          setStatus("error");
          setMessage(`Google 로그인이 취소되었습니다: ${error}`);
          timeoutRef.current = setTimeout(() => navigate("/pages/authentication/sign-in"), 3000);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("인증 코드를 받을 수 없습니다.");
          timeoutRef.current = setTimeout(() => navigate("/pages/authentication/sign-in"), 3000);
          return;
        }

        // 백엔드로 코드 전송 및 로그인 처리
        const result = await handleGoogleCallback(code);

        if (result.success) {
          setStatus("success");
          setMessage("로그인이 완료되었습니다. 메인 페이지로 이동합니다...");
          timeoutRef.current = setTimeout(() => navigate("/presentation"), 2000);
        } else {
          setStatus("error");
          // 사용자 친화적인 에러 메시지로 변환
          let userFriendlyMessage = "로그인 처리 중 문제가 발생했습니다.";

          if (result.error) {
            if (result.error.includes("fetch")) {
              userFriendlyMessage = "네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
            } else if (result.error.includes("401") || result.error.includes("403")) {
              userFriendlyMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
            } else if (result.error.includes("500")) {
              userFriendlyMessage = "서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.";
            }
          }

          setMessage(userFriendlyMessage);
          timeoutRef.current = setTimeout(() => navigate("/pages/authentication/sign-in"), 3000);
        }
      } catch (error) {
        setStatus("error");
        setMessage("로그인 처리 중 예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        timeoutRef.current = setTimeout(() => navigate("/pages/authentication/sign-in"), 3000);
      }
    };

    processGoogleCallback();

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 3,
        backgroundColor: COLORS.CHARTBOOK.GROUND,
      }}
    >
      {status === "processing" && (
        <>
          <CircularProgress size={60} sx={{ mb: 3, color: COLORS.CHARTBOOK.INK }} />
          <Typography variant="h5" sx={{ mb: 2, color: COLORS.CHARTBOOK.INK }}>
            로그인 처리 중...
          </Typography>
          <Typography variant="body2" color={COLORS.TEXT_SECONDARY}>
            잠시만 기다려주세요.
          </Typography>
        </>
      )}

      {status === "success" && (
        <>
          <Alert severity="success" sx={{ mb: 3, width: "100%", maxWidth: 400 }}>
            {message}
          </Alert>
        </>
      )}

      {status === "error" && (
        <>
          <Alert severity="error" sx={{ mb: 3, width: "100%", maxWidth: 400 }}>
            {message}
          </Alert>
          <Typography variant="body2" color={COLORS.TEXT_SECONDARY}>
            3초 후 로그인 페이지로 이동합니다...
          </Typography>
        </>
      )}
    </Box>
  );
}

export default AuthCallback;
