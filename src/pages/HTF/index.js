import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import ListIcon from "@mui/icons-material/List";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SettingsIcon from "@mui/icons-material/Settings";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import Typography from "@mui/material/Typography";
import AppHeader from "components/AppHeader";
import routes from "routes";

import { useNotification } from "components/NotificationSystem/NotificationSystem";
import { useFinancialData } from "hooks/useFinancialData";
import { useAutotradingConfig } from "hooks/useAutotradingConfig";
import { useTradingForm } from "hooks/useTradingForm";
import { useChartInteractions } from "hooks/useChartInteractions";
import { useHTFStockData } from "hooks/useHTFStockData";
import FinancialModal from "components/FinancialModal/FinancialModal";
import AutotradingAccordion from "components/AutotradingAccordion/AutotradingAccordion";
import ChartContainer from "components/ChartContainer/ChartContainer";
import StockInfoHeader from "components/StockInfoHeader/StockInfoHeader";
import HTFStockList from "components/HTFStockList/HTFStockList";
import { COLORS, alpha } from "constants/styles";
import { formatNumber } from "utils/formatters";
import ChartbookHeader from "components/ChartbookHeader/ChartbookHeader";

// Chartbook: 수치·티커·기계 출력 폰트
const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";

// RS 순위 강도색 (배지는 이 색을 채움이 아니라 테두리·글자로만 쓴다)
const rsBandColor = (rank) => {
  if (rank >= 90) return COLORS.CHARTBOOK.BAND_STRONG;
  if (rank >= 70) return COLORS.CHARTBOOK.BAND_MID;
  if (rank >= 60) return COLORS.CHARTBOOK.BAND_WEAK;
  if (rank >= 50) return COLORS.CHARTBOOK.PANEL_BLUE;
  return COLORS.TEXT_MUTED;
};

function HTF() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileTab, setMobileTab] = useState(0); // 0: 종목, 1: 차트, 2: 자동매매

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, authenticatedFetch, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar, NotificationComponent } = useNotification();

  const {
    openFinancialModal,
    financialData,
    financialLoading,
    financialError,
    handleOpenFinancialModal,
    handleCloseFinancialModal,
  } = useFinancialData();

  const {
    autotradingList,
    expandedAccordion,
    fetchAutotradingList,
    deleteAutotradingConfig,
    toggleAutotradingConfig,
    handleAccordionChange,
  } = useAutotradingConfig(authenticatedFetch, showSnackbar, "htf");

  const {
    stockData,
    loading,
    error,
    selectedStock,
    ohlcvData,
    indexData,
    indexOhlcvData,
    selectedIndexCode,
    analysisData,
    handleStockClick,
    handleIndexChange,
    setSelectedStock,
    fetchHTFStocks,
  } = useHTFStockData();

  const tradingForm = useTradingForm(selectedStock, authenticatedFetch, showSnackbar, "htf");

  const chartInteractions = useChartInteractions(
    tradingForm.entryPoint,
    tradingForm.pyramidingEntries,
    activeTab,
    tradingForm.setEntryPoint,
    tradingForm.handlePyramidingEntryChange,
    showSnackbar
  );

  const saveAutotradingConfig = async () => {
    if (!isAuthenticated) {
      showSnackbar("로그인이 필요합니다.", "warning");
      return;
    }

    const success = await tradingForm.saveAutotradingConfig(autotradingList, navigate);
    if (success) {
      await Promise.all([
        fetchAutotradingList(),
        tradingForm.loadAutobotConfig(selectedStock.code, true),
      ]);
    }
    return success;
  };

  const handleTabChange = (_, newValue) => {
    if (newValue === 1) {
      if (!authLoading && !isAuthenticated) {
        showSnackbar("자동매매 기능을 사용하려면 로그인이 필요합니다.", "warning");
        navigate("/pages/authentication/sign-in");
        return;
      }
    }

    setActiveTab(newValue);

    if (newValue === 1) {
      fetchAutotradingList().then(() => {
        if (selectedStock && selectedStock.code) {
          tradingForm.loadAutobotConfig(selectedStock.code);
          handleAccordionChange(selectedStock.code);
        }
      });
    }
  };

  const handleMobileTabChange = (_, newValue) => {
    if (newValue === 2) {
      if (!authLoading && !isAuthenticated) {
        showSnackbar("자동매매 기능을 사용하려면 로그인이 필요합니다.", "warning");
        navigate("/pages/authentication/sign-in");
        return;
      }
      fetchAutotradingList().then(() => {
        if (selectedStock && selectedStock.code) {
          tradingForm.loadAutobotConfig(selectedStock.code);
          handleAccordionChange(selectedStock.code);
        }
      });
    }
    setMobileTab(newValue);
  };

  const handleStockSelection = (stock) => {
    setSelectedStock(stock);
    handleAccordionChange(stock.code);
    if (activeTab === 1) {
      tradingForm.loadAutobotConfig(stock.code);
    }
  };

  const handleAccordionChangeWithScroll = (stockCode) => {
    handleAccordionChange(stockCode);

    if (stockCode) {
      setTimeout(() => {
        const accordionElement = document.querySelector(`[data-accordion-id="${stockCode}"]`);
        if (accordionElement) {
          accordionElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);
    }
  };

  // HTF 상승률에 따른 색상 결정
  const getGainColor = (gain) => {
    if (gain >= 300) return COLORS.CHARTBOOK.BAND_STRONG; // 300% 이상: 강함
    if (gain >= 200) return COLORS.CHARTBOOK.BAND_STRONG; // 200% 이상: 강함
    if (gain >= 150) return COLORS.CHARTBOOK.BAND_MID; // 150% 이상: 중간
    if (gain >= 100) return COLORS.CHARTBOOK.BAND_WEAK; // 100% 이상: 약함
    return COLORS.TEXT_MUTED; // 미만: 회색
  };

  // HTF 조정폭에 따른 색상 결정
  const getPullbackColor = (pullback) => {
    if (pullback <= 10) return COLORS.CHARTBOOK.BAND_WEAK; // 10% 이하: 약한 조정
    if (pullback <= 15) return COLORS.CHARTBOOK.BAND_WEAK; // 15% 이하: 약한 조정
    if (pullback <= 20) return COLORS.CHARTBOOK.BAND_MID; // 20% 이하: 중간 조정
    if (pullback <= 25) return COLORS.CHARTBOOK.BAND_MID; // 25% 이하: 중간 조정
    return COLORS.CHARTBOOK.BAND_STRONG; // 초과: 강한 조정
  };

  // HTF 상태에 따른 색상과 텍스트 결정
  const getStatusChip = (status) => {
    const statusConfig = {
      rising: { color: COLORS.CHARTBOOK.BAND_WEAK, text: "상승중" },
      pullback: { color: COLORS.CHARTBOOK.BAND_MID, text: "조정중" },
      breakout: { color: COLORS.CHARTBOOK.BAND_STRONG, text: "돌파" },
      none: { color: COLORS.TEXT_MUTED, text: "해당없음" },
      // 한국어 상태도 지원 (호환성)
      상승중: { color: COLORS.CHARTBOOK.BAND_WEAK, text: "상승중" },
      조정중: { color: COLORS.CHARTBOOK.BAND_MID, text: "조정중" },
      돌파: { color: COLORS.CHARTBOOK.BAND_STRONG, text: "돌파" },
      해당없음: { color: COLORS.TEXT_MUTED, text: "해당없음" },
    };

    return statusConfig[status] || statusConfig.none;
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchAutotradingList();
    }
  }, [activeTab]);

  // 모바일 종목 탭 렌더링
  const renderMobileStockTab = () => (
    <Box sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          borderRadius: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
          <Typography variant="h6" fontWeight="bold">
            HTF 패턴 종목
          </Typography>
          <Typography variant="caption" color="text.secondary">
            High Tight Flag 패턴 (8주 100%↑ + 25%↓ 조정)
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <HTFStockList
            stocks={stockData}
            loading={loading}
            error={error}
            selectedStock={selectedStock}
            onStockClick={(stock) => {
              handleStockClick(stock);
              setMobileTab(1);
            }}
            getGainColor={getGainColor}
            getPullbackColor={getPullbackColor}
            getStatusChip={getStatusChip}
          />
        </Box>
      </Box>
    </Box>
  );

  // 모바일 차트 탭 렌더링
  const renderMobileChartTab = () => (
    <Box sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          borderRadius: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              background: COLORS.DIVIDER,
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: COLORS.BORDER_STRONG,
              borderRadius: "4px",
              "&:hover": { background: COLORS.TEXT_MUTED },
            },
          }}
        >
          {!selectedStock && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexDirection: "column",
                gap: 2,
                p: 2,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: COLORS.CHARTBOOK.INK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h4" color={COLORS.CHARTBOOK.GROUND}>
                  🚀
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                HTF 종목을 선택하세요
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setMobileTab(0)}
                sx={{ mt: 2 }}
              >
                종목 선택하기
              </Button>
            </Box>
          )}

          {selectedStock && (
            <Box sx={{ p: 2 }}>
              <StockInfoHeader
                selectedStock={selectedStock}
                ohlcvData={ohlcvData}
                analysisData={analysisData}
                onOpenFinancialModal={handleOpenFinancialModal}
              />
              <ChartContainer
                ohlcvData={ohlcvData}
                analysisData={analysisData}
                indexOhlcvData={indexOhlcvData}
                indexData={indexData}
                selectedIndexCode={selectedIndexCode}
                selectedStock={selectedStock}
                entryPoint={tradingForm.entryPoint}
                pyramidingEntries={tradingForm.pyramidingEntries}
                tradingMode={tradingForm.tradingMode}
                activeTab={activeTab}
                onIndexChange={handleIndexChange}
                onEntryPointChange={tradingForm.setEntryPoint}
                onPyramidingEntryChange={tradingForm.handlePyramidingEntryChange}
                onShowSnackbar={showSnackbar}
                chartType="htf"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  // 모바일 자동매매 탭 렌더링
  const renderMobileAutotradingTab = () => (
    <Box sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          borderRadius: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
          <Typography variant="h6" fontWeight="bold">
            HTF 자동매매 설정
          </Typography>
          {selectedStock && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {selectedStock.name} ({selectedStock.code})
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {!selectedStock ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary" textAlign="center">
                HTF 종목을 선택하세요
              </Typography>
              <Button variant="contained" color="primary" onClick={() => setMobileTab(0)}>
                종목 선택하기
              </Button>
            </Box>
          ) : (
            <AutotradingAccordion
              selectedStock={selectedStock}
              autotradingList={autotradingList}
              expandedAccordion={expandedAccordion}
              tradingForm={tradingForm}
              onAccordionChange={handleAccordionChangeWithScroll}
              onDelete={deleteAutotradingConfig}
              onToggle={toggleAutotradingConfig}
              onStockSelect={handleStockSelection}
              onRefresh={fetchAutotradingList}
              authenticatedFetch={authenticatedFetch}
              showSnackbar={showSnackbar}
              strategyType="htf"
            />
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <AppHeader routes={routes} sticky />
      <Box sx={{ height: "80px", flexShrink: 0, backgroundColor: COLORS.CHARTBOOK.GROUND }} />
      <ChartbookHeader
        strategyName="HTF 패턴"
        date={new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
        candidateCount={stockData.length}
      />

      {/* 모바일 레이아웃 */}
      {isMobile ? (
        <Box
          sx={{
            height: "100vh",
            width: "100%",
            backgroundColor: COLORS.CHARTBOOK.GROUND,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ flex: 1, p: 1 }}>
            {mobileTab === 0 && renderMobileStockTab()}
            {mobileTab === 1 && renderMobileChartTab()}
            {mobileTab === 2 && renderMobileAutotradingTab()}
          </Box>

          <Paper
            sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
            elevation={3}
          >
            <BottomNavigation
              value={mobileTab}
              onChange={handleMobileTabChange}
              sx={{
                height: "80px",
                "& .MuiBottomNavigationAction-root": {
                  fontSize: "0.75rem",
                  minWidth: 80,
                  paddingTop: "6px",
                },
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.75rem",
                  "&.Mui-selected": {
                    fontSize: "0.75rem",
                  },
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "28px",
                },
              }}
            >
              <BottomNavigationAction
                label="HTF종목"
                value={0}
                icon={<ListIcon sx={{ fontSize: "28px" }} />}
                sx={{
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                }}
              />
              <BottomNavigationAction
                label="차트"
                value={1}
                icon={<ShowChartIcon sx={{ fontSize: "28px" }} />}
                sx={{
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                }}
              />
              <BottomNavigationAction
                label="자동매매"
                value={2}
                icon={<SettingsIcon sx={{ fontSize: "28px" }} />}
                sx={{
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                }}
              />
            </BottomNavigation>
          </Paper>
        </Box>
      ) : (
        /* 데스크탑 레이아웃 */
        <Box
          sx={{
            height: "100vh",
            width: "100%",
            backgroundColor: COLORS.CHARTBOOK.GROUND,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Grid
            container
            spacing={0.5}
            sx={{
              height: "100%",
              p: { xs: 0.5, sm: 0.5 },
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* 왼쪽 차트 영역 */}
            <Grid
              item
              xs={12}
              md={9}
              sx={{
                height: { xs: "60vh", md: "100%" },
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                order: { xs: 1, md: 1 },
              }}
            >
              <Box
                sx={{
                  backgroundColor: COLORS.CHARTBOOK.GROUND,
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: COLORS.DIVIDER,
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: COLORS.BORDER_STRONG,
                      borderRadius: "4px",
                      "&:hover": {
                        background: COLORS.TEXT_MUTED,
                      },
                    },
                  }}
                >
                  {!selectedStock && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        flexDirection: "column",
                        gap: 2,
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          backgroundColor: COLORS.CHARTBOOK.INK,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h4" color={COLORS.CHARTBOOK.GROUND}>
                          🚀
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="text.secondary" textAlign="center">
                        HTF 패턴 종목을 선택하세요
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        오른쪽 목록에서 HTF 패턴 종목을 클릭하면
                        <br />
                        패턴 분석 차트가 표시됩니다
                      </Typography>
                    </Box>
                  )}

                  {selectedStock && (
                    <Box sx={{ p: { xs: 1, md: 2 } }}>
                      <StockInfoHeader
                        selectedStock={selectedStock}
                        ohlcvData={ohlcvData}
                        analysisData={analysisData}
                        onOpenFinancialModal={handleOpenFinancialModal}
                      />

                      <ChartContainer
                        ohlcvData={ohlcvData}
                        analysisData={analysisData}
                        indexOhlcvData={indexOhlcvData}
                        indexData={indexData}
                        selectedIndexCode={selectedIndexCode}
                        selectedStock={selectedStock}
                        entryPoint={tradingForm.entryPoint}
                        pyramidingEntries={tradingForm.pyramidingEntries}
                        tradingMode={tradingForm.tradingMode}
                        activeTab={activeTab}
                        onIndexChange={handleIndexChange}
                        onEntryPointChange={tradingForm.setEntryPoint}
                        onPyramidingEntryChange={tradingForm.handlePyramidingEntryChange}
                        onShowSnackbar={showSnackbar}
                        chartType="htf"
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* 오른쪽 종목 목록 */}
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                height: { xs: "calc(40vh - 80px)", md: "100%" },
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                order: { xs: 2, md: 2 },
              }}
            >
              <Box
                sx={{
                  backgroundColor: COLORS.CHARTBOOK.GROUND,
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* 탭 헤더 */}
                <Box sx={{ flexShrink: 0, borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      minHeight: { xs: "44px", md: "48px" },
                      "& .MuiTabs-indicator": {
                        backgroundColor: COLORS.CHARTBOOK.INK,
                        height: "2px",
                      },
                      "& .MuiTab-root": {
                        fontWeight: "bold",
                        fontSize: { xs: "0.8rem", md: "0.9rem" },
                        color: COLORS.TEXT_SECONDARY,
                        minWidth: "auto",
                        padding: { xs: "8px 12px", md: "12px 16px" },
                        "&.Mui-selected": {
                          color: COLORS.CHARTBOOK.INK,
                        },
                      },
                    }}
                  >
                    <Tab label="HTF목록" />
                    <Tab label="자동매매" />
                  </Tabs>
                </Box>

                {loading && (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                {error && (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="error.main">
                      데이터 로드 중 오류가 발생했습니다: {error}
                    </Typography>
                  </Box>
                )}

                {!loading && !error && (
                  <>
                    {/* HTF 목록 탭 내용 */}
                    {activeTab === 0 && (
                      <>
                        <Box
                          sx={{
                            flex: 1,
                            overflow: "auto",
                            backgroundColor: COLORS.CHARTBOOK.GROUND,
                            "&::-webkit-scrollbar": {
                              width: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: COLORS.DIVIDER,
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              background: COLORS.BORDER_STRONG,
                              borderRadius: "4px",
                              "&:hover": {
                                background: COLORS.TEXT_MUTED,
                              },
                            },
                          }}
                        >
                          <HTFStockList
                            stocks={stockData}
                            loading={loading}
                            error={error}
                            selectedStock={selectedStock}
                            onStockClick={handleStockClick}
                            getGainColor={getGainColor}
                            getPullbackColor={getPullbackColor}
                            getStatusChip={getStatusChip}
                          />
                        </Box>
                      </>
                    )}

                    {/* 자동매매 탭 내용 */}
                    {activeTab === 1 && (
                      <Box
                        sx={{
                          flex: 1,
                          overflow: "auto",
                          p: { xs: 1, md: 2 },
                          "&::-webkit-scrollbar": {
                            width: "6px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: COLORS.DIVIDER,
                            borderRadius: "3px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: COLORS.BORDER_STRONG,
                            borderRadius: "3px",
                            "&:hover": {
                              background: COLORS.TEXT_MUTED,
                            },
                          },
                        }}
                      >
                        {!isAuthenticated ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              py: 4,
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="h5" sx={{ mb: 2, color: COLORS.TEXT_SECONDARY }}>
                              로그인이 필요합니다
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, color: COLORS.TEXT_MUTED }}>
                              HTF 자동매매 기능을 사용하려면 Google 로그인이 필요합니다.
                            </Typography>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => navigate("/pages/authentication/sign-in")}
                              sx={{
                                backgroundColor: COLORS.CHARTBOOK.INK,
                                color: COLORS.CHARTBOOK.GROUND,
                                px: 4,
                                py: 1.5,
                                "&:hover": {
                                  backgroundColor: COLORS.CHARTBOOK.INK,
                                  opacity: 0.8,
                                },
                              }}
                            >
                              로그인 하러 가기
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <AutotradingAccordion
                              autotradingList={autotradingList}
                              expandedAccordion={expandedAccordion}
                              onAccordionChange={handleAccordionChangeWithScroll}
                              onToggle={toggleAutotradingConfig}
                              onDelete={deleteAutotradingConfig}
                              onRefresh={fetchAutotradingList}
                              onStockSelect={handleStockSelection}
                              selectedStock={selectedStock}
                              showSnackbar={showSnackbar}
                              authenticatedFetch={authenticatedFetch}
                              tradingForm={tradingForm}
                              strategyType="htf"
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Financial Modal Component */}
      <FinancialModal
        open={openFinancialModal}
        onClose={handleCloseFinancialModal}
        selectedStock={selectedStock}
        financialData={financialData}
        loading={financialLoading}
        error={financialError}
      />

      {/* Notification System */}
      <NotificationComponent />
    </>
  );
}

export default HTF;
