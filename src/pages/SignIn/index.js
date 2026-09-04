import React from "react";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import Button from "@mui/material/Button";

// Custom components
import GoogleLoginButton from "components/GoogleLoginButton";
import { COLORS } from "constants/styles";

function SignIn() {
  const handleLoginSuccess = () => {
    console.log("Google 로그인 시작");
  };

  const handleLoginError = (error) => {
    console.error("Google 로그인 오류:", error);
    alert(`로그인 중 오류가 발생했습니다: ${error}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: COLORS.CHARTBOOK.GROUND,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Navigation placeholder */}
      <Box position="absolute" top={0} left={0} right={0} zIndex={3} p={2}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color={COLORS.CHARTBOOK.INK} fontWeight="bold">
              Dolpha
            </Typography>
            <Box display="flex" gap={2}>
              <Typography
                component="a"
                href="/"
                variant="button"
                color={COLORS.CHARTBOOK.INK}
                sx={{ textDecoration: "none", opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                홈
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main content */}
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Grid container justifyContent="center">
          <Grid item xs={12} sm={10} md={8} lg={6}>
            <Box
              sx={{
                border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                borderRadius: "2px",
                overflow: "visible",
              }}
            >
              {/* Card Header */}
              <Box
                p={3}
                textAlign="center"
                sx={{
                  borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                  backgroundColor: COLORS.CHARTBOOK.GROUND,
                }}
              >
                <Typography variant="h4" fontWeight="bold" color={COLORS.CHARTBOOK.INK} mt={1}>
                  로그인
                </Typography>
              </Box>

              {/* Card Body */}
              <Box pt={4} pb={3} px={3} sx={{ backgroundColor: COLORS.CHARTBOOK.GROUND }}>
                <Box component="form">
                  {/* Google Login Button */}
                  <Box mt={2} mb={3}>
                    <GoogleLoginButton onSuccess={handleLoginSuccess} onError={handleLoginError} />
                  </Box>

                  {/* Remember Me Switch */}
                  <Box mt={3} display="flex" alignItems="center">
                    <Switch color="info" />
                    <Typography
                      variant="button"
                      fontWeight="regular"
                      color="text.secondary"
                      ml={1}
                      sx={{ cursor: "pointer", userSelect: "none" }}
                    >
                      로그인 상태 유지
                    </Typography>
                  </Box>

                  {/* Disabled Login Button */}
                  <Box mt={4} mb={1}>
                    <Button variant="contained" fullWidth disabled sx={{ backgroundColor: COLORS.CHARTBOOK.GRID }}>
                      간편 로그인을 이용해주세요
                    </Button>
                  </Box>

                  {/* Sign Up Link */}
                  <Box mt={3} mb={1} textAlign="center">
                    <Typography variant="button" color="text.secondary">
                      처음 이용하시나요?{" "}
                      <Typography
                        component="span"
                        variant="button"
                        fontWeight="bold"
                        sx={{ cursor: "pointer", color: COLORS.CHARTBOOK.INK }}
                      >
                        Google로 간편가입
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box position="absolute" bottom={0} left={0} right={0} py={2} textAlign="center" zIndex={3}>
        <Container maxWidth="lg">
          <Typography variant="body2" color={COLORS.CHARTBOOK.INK} sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} Dolpha. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default SignIn;
