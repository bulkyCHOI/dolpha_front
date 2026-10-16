import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";

// @mui material components
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Custom components
import GoogleLoginButton from "components/GoogleLoginButton";
import { COLORS } from "constants/styles";
import { useAuth } from "contexts/AuthContext";
import { AUTH_REASON } from "utils/apiClient";
import { consumePostLoginPath, savePostLoginPath } from "utils/postLoginRedirect";
import ChartbookPlate from "./ChartbookPlate";

const ARCHIVO_STACK = "'Archivo', 'Helvetica', 'Arial', sans-serif";
const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const HAIRLINE = `1px solid ${COLORS.CHARTBOOK.GRID}`;

const REASON_MESSAGES = {
  [AUTH_REASON.EXPIRED]: "로그인이 만료되었습니다. 다시 로그인해주세요.",
  [AUTH_REASON.PENDING]: "관리자 승인이 해제된 계정입니다. 관리자에게 문의해주세요.",
};

const STRATEGIES = [
  { code: "MTT", label: "트렌드 템플릿" },
  { code: "HTF", label: "하이 타이트 플래그" },
  { code: "TURTLE", label: "ATR 피라미딩" },
  { code: "THEME", label: "급등 테마" },
];

const MarkLabel = ({ children }) => (
  <Typography
    component="span"
    sx={{
      fontFamily: MONO_STACK,
      fontSize: "0.6875rem",
      letterSpacing: "0.08em",
      color: COLORS.CHARTBOOK.SECONDARY,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Typography>
);

MarkLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

function StrategyIndex() {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: HAIRLINE,
      }}
    >
      {STRATEGIES.map(({ code, label }, i) => (
        <Box
          component="li"
          key={code}
          sx={{
            py: 1.5,
            pr: 2,
            pl: i ? 2 : 0,
            borderLeft: i ? HAIRLINE : "none",
          }}
        >
          <MarkLabel>{`0${i + 1} · ${code}`}</MarkLabel>
          <Typography sx={{ fontSize: "0.875rem", color: COLORS.CHARTBOOK.INK, mt: 0.5 }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function SignIn() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loginError, setLoginError] = useState(null);
  const reasonMessage = REASON_MESSAGES[searchParams.get("reason")];

  // Google로 나갔다 돌아온 뒤 원래 가려던 화면으로 보내기 위해 저장해 둔다
  useEffect(() => {
    savePostLoginPath(location.state?.from);
  }, [location.state]);

  if (!loading && isAuthenticated) {
    return <Navigate to={location.state?.from || consumePostLoginPath()} replace />;
  }

  const handleLoginError = (error) => {
    console.error("Google 로그인 오류:", error);
    setLoginError("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: COLORS.CHARTBOOK.GROUND,
        color: COLORS.CHARTBOOK.INK,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.45fr) minmax(360px, 1fr)" },
      }}
    >
      {/* 왼쪽: 도판 */}
      <Box
        component="section"
        sx={{
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 3, md: 5 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, md: 4 },
          borderRight: { md: HAIRLINE },
          borderBottom: { xs: HAIRLINE, md: "none" },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography
            sx={{
              fontFamily: ARCHIVO_STACK,
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
            }}
          >
            Dolpha
          </Typography>
          <MarkLabel>KRX · NASDAQ · NYSE</MarkLabel>
        </Box>

        <Box sx={{ maxWidth: 560 }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              wordBreak: "keep-all",
            }}
          >
            추세를 읽고,
            <br />
            규칙대로 매매합니다.
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: "1rem",
              lineHeight: 1.7,
              color: COLORS.TEXT_SECONDARY,
              wordBreak: "keep-all",
            }}
          >
            강한 추세의 종목을 골라내고, 정해 둔 진입·청산 규칙에 따라 자동으로 주문합니다.
          </Typography>
        </Box>

        <Box
          component="figure"
          sx={{ m: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <ChartbookPlate />
          <Box
            component="figcaption"
            sx={{
              mt: 1.5,
              display: { xs: "none", md: "flex" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <MarkLabel>Fig. 1 — Volatility Contraction → Pivot Breakout</MarkLabel>
            <MarkLabel>Illustrative</MarkLabel>
          </Box>
        </Box>

        {/* 모바일에서는 로그인 버튼이 첫 화면에 들어오도록 생략 */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <StrategyIndex />
        </Box>
      </Box>

      {/* 오른쪽: 로그인 */}
      <Box
        component="main"
        sx={{
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 5, md: 5 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 5,
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <MarkLabel>Members only</MarkLabel>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
          <Typography
            component="h2"
            sx={{ fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.01em" }}
          >
            로그인
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: "0.9375rem",
              color: COLORS.TEXT_SECONDARY,
              wordBreak: "keep-all",
            }}
          >
            Google 계정으로 계속하세요.
          </Typography>

          {(reasonMessage || loginError) && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              {loginError || reasonMessage}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <GoogleLoginButton onSuccess={() => setLoginError(null)} onError={handleLoginError} />
          </Box>

          <Box sx={{ mt: 4, pt: 2, borderTop: HAIRLINE }}>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                lineHeight: 1.7,
                color: COLORS.TEXT_SECONDARY,
                wordBreak: "keep-all",
              }}
            >
              처음 로그인한 계정은 관리자 승인 후 이용할 수 있습니다. 실계좌 자동매매가 연결된
              서비스라 승인된 사용자만 접근합니다.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <MarkLabel>{`© ${new Date().getFullYear()} Dolpha`}</MarkLabel>
        </Box>
      </Box>
    </Box>
  );
}

export default SignIn;
