import { useEffect } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "assets/theme";
import darkTheme from "assets/theme/dark";

import routes from "routes";

// Auth components
import { AuthProvider } from "contexts/AuthContext";
import { ThemeModeProvider, useThemeMode } from "contexts/ThemeModeContext";
import AuthCallback from "pages/AuthCallback";
import SignIn from "pages/SignIn";
import RequireAuth from "components/RequireAuth";
import { DEFAULT_AFTER_LOGIN } from "utils/postLoginRedirect";

export default function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}

/** 테마 모드를 읽어 실제 화면을 그린다. */
function ThemedApp() {
  const { mode } = useThemeMode();
  const { pathname } = useLocation();

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  return (
    <ThemeProvider theme={mode === "dark" ? darkTheme : theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* 공개: 로그인 관련 화면만 */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pages/authentication/sign-in" element={<Navigate to="/login" replace />} />

          {/* 그 외 모든 화면은 로그인 필요 */}
          <Route element={<RequireAuth />}>
            {getRoutes(routes)}
            <Route path="/" element={<Navigate to={DEFAULT_AFTER_LOGIN} replace />} />
            <Route path="*" element={<Navigate to={DEFAULT_AFTER_LOGIN} replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
