// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import AppHeader from "components/AppHeader";
import AppFooter from "components/AppFooter";

// Routes
import routes from "routes";

// MyPage sections
import Profile from "./sections/Profile";
import TradingDefaults from "./sections/TradingDefaults";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function MyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const location = useLocation();

  // 다른 페이지에서 특정 탭으로 이동한 경우 처리
  useEffect(() => {
    if (location.state && typeof location.state.activeTab === "number") {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <Profile />;
      case 1:
        return <TradingDefaults />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      <AppHeader routes={routes} sticky />
      <Box
        minHeight={{ xs: "25vh", md: "30vh" }}
        width="100%"
        sx={{
          backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "top",
          display: "grid",
          placeItems: "center",
          pt: { xs: 8, md: 2 },
          pb: { xs: 1, md: 2 },
        }}
      >
        <Container>
          <Grid container item xs={12} lg={6} justifyContent="center" mx="auto">
            <Typography
              variant="h2"
              color="white.main"
              mb={0.5}
              sx={({ breakpoints, typography: { size } }) => ({
                fontWeight: 700,
                textAlign: "center",
                [breakpoints.down("md")]: {
                  fontSize: size["xl"],
                },
                [breakpoints.down("sm")]: {
                  fontSize: size["lg"],
                },
              })}
            >
              마이페이지
            </Typography>
            <Typography
              variant="body2"
              color="white.main"
              textAlign="center"
              sx={{
                fontSize: { xs: "0.85rem", md: "0.95rem" },
                opacity: 0.85,
                lineHeight: 1.3,
              }}
            >
              프로필 및 자동매매 설정 관리
            </Typography>
          </Grid>
        </Container>
      </Box>
      <Card
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mx: { xs: 2, sm: 3, lg: 4 },
          mt: { xs: -4, md: -6 },
          mb: 2,
          backgroundColor: ({ palette: { white }, functions: { rgba } }) => rgba(white.main, 0.95),
          backdropFilter: "saturate(200%) blur(30px)",
          boxShadow: ({ boxShadows: { xxl } }) => xxl,
          borderRadius: 3,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
            <Grid item xs={12}>
              <Box mb={{ xs: 3, md: 4 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  centered
                  variant="fullWidth"
                  sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#667eea",
                      height: 3,
                      borderRadius: "4px 4px 0 0",
                    },
                    "& .MuiTab-root": {
                      color: "#666",
                      fontWeight: 500,
                      fontSize: { xs: "0.95rem", md: "1.1rem" },
                      minWidth: { xs: "auto", md: 180 },
                      padding: { xs: "12px 20px", md: "16px 32px" },
                      textTransform: "none",
                      borderRadius: "8px 8px 0 0",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        color: "#667eea",
                        fontWeight: 600,
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.04)",
                      },
                    },
                  }}
                >
                  <Tab label="프로필" />
                  <Tab label="자동매매 기본설정" />
                </Tabs>
              </Box>
              <Box>{renderTabContent()}</Box>
            </Grid>
          </Grid>
        </Container>
      </Card>
      <Box pt={2} px={1} mt={2}>
        <AppFooter />
      </Box>
    </>
  );
}

export default MyPage;
