import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COLORS } from "constants/styles";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/pages/authentication/sign-in");
    }
  }, [isAuthenticated, loading, navigate]);

  // 로딩 중
  if (loading) {
    return (
      <Box
        minHeight="100vh"
        width="100%"
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography variant="h4" color={COLORS.CHARTBOOK.INK}>
          로그인 상태 확인 중...
        </Typography>
      </Box>
    );
  }

  // 인증되지 않음
  if (!isAuthenticated) {
    return (
      <Box
        minHeight="100vh"
        width="100%"
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography variant="h4" color={COLORS.CHARTBOOK.INK}>
          로그인이 필요합니다. 리다이렉트 중...
        </Typography>
      </Box>
    );
  }

  // 인증됨 - 실제 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;
