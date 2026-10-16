import { Navigate, Outlet, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { useAuth } from "contexts/AuthContext";
import { COLORS } from "constants/styles";

/**
 * 로그인한 사용자만 하위 라우트를 볼 수 있게 하는 레이아웃 라우트.
 * 미로그인 시 /login으로 보내고, 원래 가려던 경로는 location.state.from으로 넘긴다.
 */
function RequireAuth() {
  const { isAuthenticated, loading, sessionEndReason } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        sx={{ display: "grid", placeItems: "center", backgroundColor: COLORS.CHARTBOOK.GROUND }}
      >
        <CircularProgress sx={{ color: COLORS.CHARTBOOK.INK }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    const search = sessionEndReason ? `?reason=${sessionEndReason}` : "";
    return <Navigate to={`/login${search}`} replace state={{ from }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
