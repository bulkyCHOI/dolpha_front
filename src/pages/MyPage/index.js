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
import ChartbookHeader from "components/ChartbookHeader/ChartbookHeader";

// Routes
import routes from "routes";

// MyPage sections
import Profile from "./sections/Profile";
import TradingDefaults from "./sections/TradingDefaults";
import ScreenerFilterSettings from "./sections/ScreenerFilterSettings";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { COLORS, alpha } from "constants/styles";

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
      case 2:
        return <ScreenerFilterSettings />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      <AppHeader routes={routes} sticky />
      <Box sx={{ height: "80px", flexShrink: 0, backgroundColor: COLORS.CHARTBOOK.GROUND }} />
      <ChartbookHeader
        strategyName="마이페이지"
        date={new Date().toLocaleDateString("ko-KR")}
      />
      <Box
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          p: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
            <Grid item xs={12}>
              <Box mb={{ xs: 3, md: 4 }} sx={{ borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: COLORS.CHARTBOOK.INK,
                      height: 2,
                    },
                    "& .MuiTab-root": {
                      color: COLORS.TEXT_SECONDARY,
                      fontWeight: 500,
                      fontSize: { xs: "0.95rem", md: "1rem" },
                      minWidth: { xs: "auto", md: "auto" },
                      padding: { xs: "12px 20px", md: "12px 24px" },
                      textTransform: "none",
                      transition: "all 0.2s ease",
                      "&.Mui-selected": {
                        color: COLORS.CHARTBOOK.INK,
                        fontWeight: 600,
                        backgroundColor: "transparent",
                      },
                      "&:hover": {
                        backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06),
                      },
                    },
                  }}
                >
                  <Tab label="프로필" />
                  <Tab label="자동매매 기본설정" />
                  <Tab label="종목 필터" />
                </Tabs>
              </Box>
              <Box>{renderTabContent()}</Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <AppFooter />
    </>
  );
}

export default MyPage;
