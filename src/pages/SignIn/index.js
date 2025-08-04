import React from "react";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";

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
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={3}
        p={2}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="white" fontWeight="bold">
              Dolpha
            </Typography>
            <Box display="flex" gap={2}>
              <Typography
                component="a"
                href="/"
                variant="button"
                color="white"
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
              <MKBox
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                mx={2}
                mt={-3}
                p={3}
                mb={1}
                textAlign="center"
              >
                <MKTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                  로그인
                </MKTypography>
                <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
                  <Grid item xs={2}>
                    <MKTypography component="span" variant="body1" color="white">
                      <Box component="i" className="fab fa-facebook" sx={{ fontSize: "1.5rem" }} />
                    </MKTypography>
                  </Grid>
                  <Grid item xs={2}>
                    <MKTypography component="span" variant="body1" color="white">
                      <Box component="i" className="fab fa-github" sx={{ fontSize: "1.5rem" }} />
                    </MKTypography>
                  </Grid>
                  <Grid item xs={2}>
                    <MKTypography component="span" variant="body1" color="white">
                      <Box component="i" className="fab fa-google" sx={{ fontSize: "1.5rem" }} />
                    </MKTypography>
                  </Grid>
                </Grid>
              </MKBox>

              {/* Card Body */}
              <MKBox pt={4} pb={3} px={3}>
                <Box component="form">
                  {/* Google Login Button */}
                  <MKBox mt={2} mb={3}>
                    <GoogleLoginButton
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginError}
                    />
                  </MKBox>

                  {/* Remember Me Switch */}
                  <MKBox mt={3} display="flex" alignItems="center">
                    <Switch color="info" />
                    <MKTypography
                      variant="button"
                      fontWeight="regular"
                      color="text"
                      ml={1}
                      sx={{ cursor: "pointer", userSelect: "none" }}
                    >
                      로그인 상태 유지
                    </MKTypography>
                  </MKBox>

                  {/* Disabled Login Button */}
                  <MKBox mt={4} mb={1}>
                    <MKButton variant="gradient" color="secondary" fullWidth disabled>
                      간편 로그인을 이용해주세요
                    </MKButton>
                  </MKBox>

                  {/* Sign Up Link */}
                  <MKBox mt={3} mb={1} textAlign="center">
                    <MKTypography variant="button" color="text">
                      처음 이용하시나요?{" "}
                      <MKTypography
                        component="span"
                        variant="button"
                        color="info"
                        fontWeight="medium"
                        textGradient
                        sx={{ cursor: "pointer" }}
                      >
                        Google로 간편가입
                      </MKTypography>
                    </MKTypography>
                  </MKBox>
                </Box>
              </MKBox>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        py={2}
        textAlign="center"
        zIndex={3}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
            © 2024 Dolpha. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default SignIn;
