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

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import routes from "routes";

import { useNotification } from "components/NotificationSystem/NotificationSystem";
import { useFinancialData } from "hooks/useFinancialData";
import { useAutotradingConfig } from "hooks/useAutotradingConfig";
import { useTradingForm } from "hooks/useTradingForm";
import { useChartInteractions } from "hooks/useChartInteractions";
import { useStockData } from "hooks/useStockData";
import FinancialModal from "components/FinancialModal/FinancialModal";
import AutotradingAccordion from "components/AutotradingAccordion/AutotradingAccordion";
import ChartContainer from "components/ChartContainer/ChartContainer";
import StockInfoHeader from "components/StockInfoHeader/StockInfoHeader";
import StockList from "components/StockList/StockList";
import { GRADIENT_COLORS, LAYOUT } from "constants/styles";
import { formatNumber } from "utils/formatters";

function MTT() {
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
  } = useAutotradingConfig(authenticatedFetch, showSnackbar, 'mtt');

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
  } = useStockData();

  const tradingForm = useTradingForm(selectedStock, authenticatedFetch, showSnackbar, 'mtt');

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
      // 자동매매 목록 먼저 로드
      fetchAutotradingList().then(() => {
        // 선택된 종목이 있으면 해당 종목의 설정 로드
        if (selectedStock && selectedStock.code) {
          tradingForm.loadAutobotConfig(selectedStock.code);
          handleAccordionChange(selectedStock.code);
        }
      });
    }
  };

  const handleMobileTabChange = (_, newValue) => {
    if (newValue === 2) {
      // 자동매매 탭
      if (!authLoading && !isAuthenticated) {
        showSnackbar("자동매매 기능을 사용하려면 로그인이 필요합니다.", "warning");
        navigate("/pages/authentication/sign-in");
        return;
      }
      // 자동매매 목록 로드
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
    // 자동매매 탭에서만 설정 로드
    if (activeTab === 1) {
      tradingForm.loadAutobotConfig(stock.code);
    }
  };

  // 아코디언 확장 시 스크롤 처리를 위한 커스텀 핸들러
  const handleAccordionChangeWithScroll = (stockCode) => {
    handleAccordionChange(stockCode);
    
    // 아코디언이 확장될 때만 스크롤 처리
    if (stockCode) {
      // 약간의 지연을 두어 아코디언 확장 애니메이션 완료 후 스크롤
      setTimeout(() => {
        const accordionElement = document.querySelector(`[data-accordion-id="${stockCode}"]`);
        if (accordionElement) {
          // 아코디언 상단이 스크롤 컨테이너의 상단과 맞춰지도록 스크롤
          accordionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchAutotradingList();
    }
  }, [activeTab]);

  // 모바일 종목 탭 렌더링
  const renderMobileStockTab = () => (
    <MKBox sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <MKBox
        sx={{
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <MKBox sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0" }}>
          <MKTypography variant="h6" fontWeight="bold">
            종목 선택
          </MKTypography>
        </MKBox>
        <MKBox sx={{ flex: 1, overflow: "auto" }}>
          <StockList
            stocks={stockData}
            loading={loading}
            error={error}
            selectedStock={selectedStock}
            onStockClick={(stock) => {
              handleStockClick(stock);
              // 종목 선택 후 차트 탭으로 자동 전환
              setMobileTab(1);
            }}
          />
        </MKBox>
      </MKBox>
    </MKBox>
  );

  // 모바일 차트 탭 렌더링
  const renderMobileChartTab = () => (
    <MKBox sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <MKBox
        sx={{
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <MKBox
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": { background: "#a1a1a1" },
            },
          }}
        >
          {!selectedStock && (
            <MKBox
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
              <MKBox
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <MKTypography variant="h4" color="white">
                  📈
                </MKTypography>
              </MKBox>
              <MKTypography variant="h6" color="text" textAlign="center">
                종목을 선택하세요
              </MKTypography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setMobileTab(0)}
                sx={{ mt: 2 }}
              >
                종목 선택하기
              </Button>
            </MKBox>
          )}

          {selectedStock && (
            <MKBox sx={{ p: 2 }}>
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
                activeTab={activeTab}
                onIndexChange={handleIndexChange}
                onEntryPointChange={tradingForm.setEntryPoint}
                onPyramidingEntryChange={tradingForm.handlePyramidingEntryChange}
                onShowSnackbar={showSnackbar}
              />
            </MKBox>
          )}
        </MKBox>
      </MKBox>
    </MKBox>
  );

  // 모바일 자동매매 탭 렌더링
  const renderMobileAutotradingTab = () => (
    <MKBox sx={{ height: "calc(100vh - 160px)", overflow: "hidden" }}>
      <MKBox
        sx={{
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <MKBox sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0" }}>
          <MKTypography variant="h6" fontWeight="bold">
            자동매매 설정
          </MKTypography>
          {selectedStock && (
            <MKTypography variant="body2" sx={{ color: "text.secondary" }}>
              {selectedStock.name} ({selectedStock.code})
            </MKTypography>
          )}
        </MKBox>
        <MKBox sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {!selectedStock ? (
            <MKBox
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <MKTypography variant="h6" color="text" textAlign="center">
                종목을 선택하세요
              </MKTypography>
              <Button variant="contained" color="primary" onClick={() => setMobileTab(0)}>
                종목 선택하기
              </Button>
            </MKBox>
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
              strategyType="mtt"
            />
          )}
        </MKBox>
      </MKBox>
    </MKBox>
  );

  return (
    <>
      <DefaultNavbar routes={routes} sticky />

      {/* 모바일 레이아웃 */}
      {isMobile ? (
        <Box
          sx={{
            height: "100vh",
            width: "100%",
            backgroundColor: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 네비게이션 바 높이만큼 패딩 추가 */}
          <Box sx={{ height: "80px", flexShrink: 0 }} />

          {/* 메인 콘텐츠 */}
          <Box sx={{ flex: 1, p: 1 }}>
            {mobileTab === 0 && renderMobileStockTab()}
            {mobileTab === 1 && renderMobileChartTab()}
            {mobileTab === 2 && renderMobileAutotradingTab()}
          </Box>

          {/* 하단 네비게이션 */}
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
                label="종목"
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
            backgroundColor: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 네비게이션 바 높이만큼 패딩 추가 */}
          <Box sx={{ height: "80px", flexShrink: 0 }} />

          <Grid
            container
            spacing={0.5}
            sx={{
              height: "calc(100vh - 80px)",
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
              <MKBox
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* 스크롤 가능한 차트 영역 */}
                <MKBox
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#c1c1c1",
                      borderRadius: "4px",
                      "&:hover": {
                        background: "#a1a1a1",
                      },
                    },
                  }}
                >
                  {!selectedStock && (
                    <MKBox
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
                      <MKBox
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <MKTypography variant="h4" color="white">
                          📈
                        </MKTypography>
                      </MKBox>
                      <MKTypography variant="h6" color="text" textAlign="center">
                        종목을 선택하세요
                      </MKTypography>
                      <MKTypography variant="body2" color="text" textAlign="center">
                        오른쪽 목록에서 종목을 클릭하면
                        <br />
                        캔들스틱 차트가 표시됩니다
                      </MKTypography>
                    </MKBox>
                  )}

                  {selectedStock && (
                    <MKBox sx={{ p: { xs: 1, md: 2 } }}>
                      {/* 스크롤 영역 안의 종목 정보 헤더 */}
                      <StockInfoHeader
                        selectedStock={selectedStock}
                        ohlcvData={ohlcvData}
                        analysisData={analysisData}
                        onOpenFinancialModal={handleOpenFinancialModal}
                      />

                      {/* 차트 컨테이너 */}
                      <ChartContainer
                        ohlcvData={ohlcvData}
                        analysisData={analysisData}
                        indexOhlcvData={indexOhlcvData}
                        indexData={indexData}
                        selectedIndexCode={selectedIndexCode}
                        selectedStock={selectedStock}
                        entryPoint={tradingForm.entryPoint}
                        pyramidingEntries={tradingForm.pyramidingEntries}
                        activeTab={activeTab}
                        onIndexChange={handleIndexChange}
                        onEntryPointChange={tradingForm.setEntryPoint}
                        onPyramidingEntryChange={tradingForm.handlePyramidingEntryChange}
                        onShowSnackbar={showSnackbar}
                      />
                    </MKBox>
                  )}
                </MKBox>
              </MKBox>
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
              <MKBox
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* 탭 헤더 */}
                <MKBox sx={{ flexShrink: 0, borderBottom: "1px solid #e0e0e0" }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      minHeight: { xs: "44px", md: "48px" },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#667eea",
                        height: "3px",
                      },
                      "& .MuiTab-root": {
                        fontWeight: "bold",
                        fontSize: { xs: "0.8rem", md: "0.9rem" },
                        color: "#666",
                        minWidth: "auto",
                        padding: { xs: "8px 12px", md: "12px 16px" },
                        "&.Mui-selected": {
                          color: "#667eea",
                        },
                      },
                    }}
                  >
                    <Tab label="투자목록" />
                    <Tab label="자동매매" />
                  </Tabs>
                </MKBox>

                {loading && (
                  <MKBox
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </MKBox>
                )}

                {error && (
                  <MKBox
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MKTypography color="error">
                      데이터 로드 중 오류가 발생했습니다: {error}
                    </MKTypography>
                  </MKBox>
                )}

                {!loading && !error && stockData.length > 0 && (
                  <>
                    {/* 투자목록 탭 내용 */}
                    {activeTab === 0 && (
                      <>
                        {/* 테이블 헤더 */}
                        <MKBox
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            flexShrink: 0,
                          }}
                        >
                          <Grid container spacing={0}>
                            <Grid item xs={4} sm={3.5}>
                              <MKTypography
                                variant="subtitle2"
                                color="white"
                                fontWeight="bold"
                                sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                              >
                                종목명
                              </MKTypography>
                            </Grid>
                            <Grid item xs={2} sm={2.5}>
                              <MKTypography
                                variant="subtitle2"
                                color="white"
                                fontWeight="bold"
                                textAlign="center"
                                sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                              >
                                RS
                              </MKTypography>
                            </Grid>
                            <Grid item xs={3} sm={3}>
                              <MKTypography
                                variant="subtitle2"
                                color="white"
                                fontWeight="bold"
                                textAlign="center"
                                sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                              >
                                매출
                              </MKTypography>
                            </Grid>
                            <Grid item xs={3} sm={3}>
                              <MKTypography
                                variant="subtitle2"
                                color="white"
                                fontWeight="bold"
                                textAlign="center"
                                sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                              >
                                영업익
                              </MKTypography>
                            </Grid>
                          </Grid>
                        </MKBox>

                        {/* 스크롤 가능한 테이블 바디 */}
                        <MKBox
                          sx={{
                            flex: 1,
                            overflow: "auto",
                            backgroundColor: "white",
                            "&::-webkit-scrollbar": {
                              width: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: "#f1f1f1",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              background: "#c1c1c1",
                              borderRadius: "4px",
                              "&:hover": {
                                background: "#a1a1a1",
                              },
                            },
                          }}
                        >
                          {stockData.map((row, rowIndex) => (
                            <MKBox
                              key={row.code || rowIndex}
                              onClick={() => handleStockClick(row)}
                              sx={{
                                p: 0.5,
                                borderBottom:
                                  rowIndex === stockData.length - 1 ? "none" : "1px solid #f0f0f0",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                backgroundColor:
                                  selectedStock?.code === row.code
                                    ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                                    : rowIndex % 2 === 0
                                    ? "#fafafa"
                                    : "white",
                                "&:hover": {
                                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                                  transform: "translateX(4px)",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                  borderLeft: "3px solid #667eea",
                                },
                                ...(selectedStock?.code === row.code && {
                                  borderLeft: "3px solid #667eea",
                                  boxShadow: "0 2px 12px rgba(102, 126, 234, 0.2)",
                                }),
                              }}
                            >
                              <Grid container spacing={0} alignItems="center">
                                <Grid item xs={4} sm={3.5}>
                                  <MKBox>
                                    <MKTypography
                                      variant="body2"
                                      fontWeight={
                                        selectedStock?.code === row.code ? "bold" : "medium"
                                      }
                                      color={selectedStock?.code === row.code ? "info" : "text"}
                                      sx={{
                                        fontSize: { xs: "0.7rem", md: "0.8rem" },
                                        lineHeight: 1.1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {row.name || "-"}
                                    </MKTypography>
                                    <MKTypography
                                      variant="caption"
                                      color="text"
                                      sx={{
                                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                                        display: { xs: "none", sm: "block" },
                                      }}
                                    >
                                      {row.code || ""}
                                    </MKTypography>
                                  </MKBox>
                                </Grid>
                                <Grid item xs={2} sm={2.5}>
                                  <MKBox display="flex" justifyContent="center">
                                    <Chip
                                      label={Math.floor(row.rsRank) || "-"}
                                      size="small"
                                      sx={{
                                        backgroundColor:
                                          row.rsRank >= 90
                                            ? "#f44336"  // 90 이상: 빨강
                                            : row.rsRank >= 80
                                            ? "#ff5722"  // 80 이상: 주황
                                            : row.rsRank >= 70
                                            ? "#ffc107"  // 70 이상: 노랑
                                            : row.rsRank >= 60
                                            ? "#4caf50"  // 60 이상: 초록
                                            : row.rsRank >= 50
                                            ? "#2196f3"  // 50 이상: 파랑
                                            : "#9e9e9e", // 50 이하: 회색
                                        color: row.rsRank >= 70 && row.rsRank < 80 
                                          ? "black"  // 노란색일 때는 검은색 텍스트
                                          : "white",
                                        fontWeight: "bold",
                                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                                        minWidth: { xs: "40px", md: "35px" },
                                        height: { xs: "32px", md: "20px" },
                                        cursor: "pointer",
                                        "&:hover": {
                                          opacity: 0.8,
                                        },
                                      }}
                                    />
                                  </MKBox>
                                </Grid>
                                <Grid item xs={3} sm={3}>
                                  <MKBox display="flex" justifyContent="center" alignItems="center">
                                    <MKTypography
                                      variant="body2"
                                      textAlign="center"
                                      color={row["당기매출"] < 0 ? "info" : "text"}
                                      fontWeight={row["당기매출"] < 0 ? "bold" : "bold"}
                                      sx={{
                                        fontSize: { xs: "0.65rem", md: "0.75rem" },
                                        color: row["당기매출"] < 0 ? "#1976d2" : "inherit",
                                        fontWeight: row["당기매출"] < 0 ? "bold" : "bold",
                                      }}
                                    >
                                      {formatNumber(row["당기매출"]) || "0"}
                                    </MKTypography>
                                  </MKBox>
                                </Grid>
                                <Grid item xs={3} sm={3}>
                                  <MKBox display="flex" justifyContent="center" alignItems="center">
                                    <MKTypography
                                      variant="body2"
                                      textAlign="center"
                                      color={row["당기영업이익"] < 0 ? "info" : "text"}
                                      fontWeight={row["당기영업이익"] < 0 ? "bold" : "bold"}
                                      sx={{
                                        fontSize: { xs: "0.65rem", md: "0.8rem" },
                                        color: row["당기영업이익"] < 0 ? "#1976d2" : "inherit",
                                        fontWeight: row["당기영업이익"] < 0 ? "bold" : "bold",
                                      }}
                                    >
                                      {formatNumber(row["당기영업이익"]) || "0"}
                                    </MKTypography>
                                  </MKBox>
                                </Grid>
                              </Grid>
                            </MKBox>
                          ))}
                        </MKBox>
                      </>
                    )}

                    {/* 자동매매 탭 내용 */}
                    {activeTab === 1 && (
                      <MKBox
                        sx={{
                          flex: 1,
                          overflow: "auto",
                          p: { xs: 1, md: 2 },
                          "&::-webkit-scrollbar": {
                            width: "6px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: "#f1f1f1",
                            borderRadius: "3px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: "#c1c1c1",
                            borderRadius: "3px",
                            "&:hover": {
                              background: "#a1a1a1",
                            },
                          },
                        }}
                      >
                        {!isAuthenticated ? (
                          <MKBox
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              py: 4,
                              textAlign: "center",
                            }}
                          >
                            <MKTypography variant="h5" sx={{ mb: 2, color: "#666" }}>
                              로그인이 필요합니다
                            </MKTypography>
                            <MKTypography variant="body1" sx={{ mb: 3, color: "#888" }}>
                              자동매매 기능을 사용하려면 Google 로그인이 필요합니다.
                            </MKTypography>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => navigate("/pages/authentication/sign-in")}
                              sx={{
                                background: GRADIENT_COLORS.PRIMARY,
                                color: "white",
                                px: 4,
                                py: 1.5,
                                "&:hover": {
                                  background: GRADIENT_COLORS.PRIMARY_HOVER,
                                },
                              }}
                            >
                              로그인 하러 가기
                            </Button>
                          </MKBox>
                        ) : (
                          <>
                            {/* 종목별 자동매매 설정 아코디언 */}
                            <MKBox>
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
                                strategyType="mtt"
                              />
                            </MKBox>
                          </>
                        )}
                      </MKBox>
                    )}

                    {!loading && !error && stockData.length === 0 && (
                      <MKBox
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MKTypography color="text">데이터가 없습니다.</MKTypography>
                      </MKBox>
                    )}
                  </>
                )}
              </MKBox>
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

export default MTT;
