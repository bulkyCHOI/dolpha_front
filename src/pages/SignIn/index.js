import React from "react";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// Material Kit 2 React components
import Button from "@mui/material/Button";

// Custom components
import GoogleLoginButton from "components/GoogleLoginButton";

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
        background: "linear-gradient(195deg, #42A5F5, #478ED1)",
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
            <Typography variant="h6" color="white.main" fontWeight="bold">
              Dolpha
            </Typography>
            <Box display="flex" gap={2}>
              <Typography
                component="a"
                href="/"
                variant="button"
                color="white.main"
                sx={{ textDecoration: "none", opacity: 0.8, "&:hover": { opacity: 1 } }}
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
            <Card
              sx={{
                boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
                borderRadius: "15px",
                overflow: "visible",
              }}
            >
              {/* Card Header */}
              <Box
                mx={2}
                mt={-3}
                p={3}
                mb={1}
                textAlign="center"
                sx={({ palette, functions, borders, boxShadows }) => ({
                  background: functions.linearGradient(
                    palette.gradients.info.main,
                    palette.gradients.info.state
                  ),
                  borderRadius: borders.borderRadius.lg,
                  boxShadow: boxShadows.colored.info,
                })}
              >
                <Typography variant="h4" fontWeight="medium" color="white.main" mt={1}>
                  로그인
                </Typography>
                <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
                  <Grid item xs={2}>
                    <Typography component="span" variant="body1" color="white.main">
                      <Box component="i" className="fab fa-facebook" sx={{ fontSize: "1.5rem" }} />
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography component="span" variant="body1" color="white.main">
                      <Box component="i" className="fab fa-github" sx={{ fontSize: "1.5rem" }} />
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography component="span" variant="body1" color="white.main">
                      <Box component="i" className="fab fa-google" sx={{ fontSize: "1.5rem" }} />
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Card Body */}
              <Box pt={4} pb={3} px={3}>
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
                    <Button variant="gradient" color="secondary" fullWidth disabled>
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
                        fontWeight="medium"
                        sx={({ palette, functions }) => ({
                          cursor: "pointer",
                          // MK의 textGradient 대체 — 글자에 그라데이션을 입힌다
                          backgroundImage: functions.linearGradient(
                            palette.gradients.info.main,
                            palette.gradients.info.state
                          ),
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        })}
                      >
                        Google로 간편가입
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box position="absolute" bottom={0} left={0} right={0} py={2} textAlign="center" zIndex={3}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="white.main" sx={{ opacity: 0.8 }}>
            © 2024 Dolpha. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default SignIn;
