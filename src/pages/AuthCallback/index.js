import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { APPROVAL_PENDING, useAuth } from "contexts/AuthContext";
import { consumePostLoginPath } from "utils/postLoginRedirect";
import { COLORS, alpha } from "constants/styles";

function AuthCallback() {
  const [status, setStatus] = useState("processing"); // processing, success, error, pending
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
          timeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        if (error) {
          setStatus("error");
          setMessage(`Google 로그인이 취소되었습니다: ${error}`);
          timeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("인증 코드를 받을 수 없습니다.");
          timeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        // 백엔드로 코드 전송 및 로그인 처리
        const result = await handleGoogleCallback(code);

        if (result.success) {
          setStatus("success");
          setMessage("로그인이 완료되었습니다.");
          navigate(consumePostLoginPath(), { replace: true });
          return;
        }

        if (result.code === APPROVAL_PENDING) {
          // 승인 전까지는 다시 시도해도 같으므로 자동 이동하지 않는다
          setStatus("pending");
          setMessage(
            `${
              result.email || "이 계정"
            }은(는) 관리자 승인 대기 중입니다. 승인 후 다시 로그인해주세요.`
          );
          return;
        }

        setStatus("error");
        setMessage(result.error || "로그인 처리 중 문제가 발생했습니다.");
        timeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 3000);
      } catch (error) {
        setStatus("error");
        setMessage("로그인 처리 중 예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        timeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 3000);
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

      {status === "pending" && (
        <>
          <Alert severity="info" sx={{ mb: 3, width: "100%", maxWidth: 400 }}>
            {message}
          </Alert>
          <Button variant="outlined" onClick={() => navigate("/login", { replace: true })}>
            로그인 화면으로
          </Button>
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
