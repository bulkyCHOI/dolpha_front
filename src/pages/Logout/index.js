import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { COLORS } from "constants/styles";

function Logout() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      if (isAuthenticated) {
        // 로그아웃 실행
        logout();

        // 잠시 대기 후 홈페이지로 리다이렉트
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } else {
        // 이미 로그아웃 상태인 경우 바로 홈으로
        navigate("/", { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate, isAuthenticated]);

  return (
    <Box
      component="section"
      position="relative"
      py={6}
      px={{ xs: 2, lg: 0 }}
      mx={-2}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.SURFACE_ALT,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          textAlign: "center",
        }}
      >
        <CircularProgress size={60} sx={{ color: COLORS.PRIMARY }} />
        <Typography variant="h4" color="text.secondary">
          로그아웃 중...
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.7 }}>
          잠시 후 홈페이지로 이동합니다.
        </Typography>
      </Box>
    </Box>
  );
}

export default Logout;
