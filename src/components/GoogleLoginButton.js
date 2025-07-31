import React from "react";
import { Button } from "@mui/material";
import { Google } from "@mui/icons-material";
import PropTypes from "prop-types";
import MKBox from "components/MKBox";

const GoogleLoginButton = ({ onSuccess, onError, disabled = false }) => {
  const handleGoogleLogin = async () => {
    try {
      // Google Client ID 확인
      const clientId = window.REACT_APP_GOOGLE_CLIENT_ID;

      if (!clientId || clientId === "your-google-client-id-here") {
        onError("Google Client ID가 설정되지 않았습니다. .env 파일을 확인해주세요.");
        return;
      }

      // Google OAuth URL 생성
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope =
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid";
      const responseType = "code";

      const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope,
        response_type: responseType,
        access_type: "offline",
        prompt: "consent",
        state: "dolpha_login_" + Date.now(),
      });

      const authUrl = `${baseUrl}?${params.toString()}`;

      // Google 로그인 페이지로 리디렉션
      onSuccess();
      window.location.href = authUrl;
    } catch (error) {
      // Google 로그인 오류
      onError("Google 로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <MKBox sx={{ width: "100%", mt: 2 }}>
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        onClick={handleGoogleLogin}
        disabled={disabled}
        startIcon={<Google />}
        sx={{
          py: 1.5,
          borderColor: "#4285f4",
          color: "#4285f4",
          "&:hover": {
            borderColor: "#3367d6",
            backgroundColor: "rgba(66, 133, 244, 0.04)",
          },
          "&:disabled": {
            borderColor: "#e0e0e0",
            color: "#9e9e9e",
          },
        }}
      >
        Google로 로그인
      </Button>
    </MKBox>
  );
};

GoogleLoginButton.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default GoogleLoginButton;
