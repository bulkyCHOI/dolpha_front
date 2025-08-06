import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import ListIcon from "@mui/icons-material/List";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Material Design Icons for stars
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import routes from "routes";

import { useNotification } from "components/NotificationSystem/NotificationSystem";
import { useFinancialData } from "hooks/useFinancialData";
import { useAutotradingConfig } from "hooks/useAutotradingConfig";
import { useTradingForm } from "hooks/useTradingForm";
import { useChartInteractions } from "hooks/useChartInteractions";
import { useFavoritesData } from "hooks/useFavoritesData";
import FinancialModal from "components/FinancialModal/FinancialModal";
import AutotradingAccordion from "components/AutotradingAccordion/AutotradingAccordion";
import ChartContainer from "components/ChartContainer/ChartContainer";
import StockInfoHeader from "components/StockInfoHeader/StockInfoHeader";
import { GRADIENT_COLORS, LAYOUT } from "constants/styles";
import { formatNumber } from "utils/formatters";

function Favorites() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileTab, setMobileTab] = useState(0); // 0: 즐겨찾기, 1: 차트, 2: 자동매매
  const [searchQuery, setSearchQuery] = useState("");
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
  } = useAutotradingConfig(authenticatedFetch, showSnackbar, "favorites");

  const {
    favoriteStocks,
    searchResults,
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
    searchStocks,
    toggleFavorite,
    clearSearch,
  } = useFavoritesData(authenticatedFetch, showSnackbar);

  const tradingForm = useTradingForm(selectedStock, authenticatedFetch, showSnackbar, "favorites");

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

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    // 입력값이 비어있으면 검색 결과를 즉시 클리어
    if (!query.trim()) {
      clearSearch();
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchStocks(searchQuery.trim());
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    clearSearch();
  };

  const handleToggleFavorite = async (stock) => {
    try {
      await toggleFavorite(stock);
    } catch (error) {
      showSnackbar(`즐겨찾기 설정 중 오류가 발생했습니다: ${error.message}`, "error");
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchAutotradingList();
    }
  }, [activeTab]);

  // 즐겨찾기 탭에서는 항상 즐겨찾기 목록만 표시
  const displayStocks = favoriteStocks;

  // 데스크탑 레이아웃
  const desktopLayout = (
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
                    ⭐
                  </MKTypography>
                </MKBox>
                <MKTypography variant="h6" color="text" textAlign="center">
                  즐겨찾기 종목을 선택하세요
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
      </Grid>

      {/* 오른쪽 즐겨찾기 목록 */}
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
          {/* 검색창 - 탭 위쪽으로 이동 */}
          <MKBox sx={{ p: 2, borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="종목명 또는 코드 검색 (Enter로 검색)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#667eea" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667eea",
                  },
                },
              }}
            />
          </MKBox>

          {/* 검색 결과가 없을 때만 탭 표시 */}
          {!searchQuery.trim() && (
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
                <Tab label="즐겨찾기" />
                <Tab label="자동매매" />
              </Tabs>
            </MKBox>
          )}

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

          {/* 검색 결과 영역 */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <>
              {/* 검색 결과 헤더 */}
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
                  <Grid item xs={1}>
                    <MKTypography
                      variant="subtitle2"
                      color="white"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                    >
                      ⭐
                    </MKTypography>
                  </Grid>
                  <Grid item xs={4}>
                    <MKTypography
                      variant="subtitle2"
                      color="white"
                      fontWeight="bold"
                      sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                    >
                      종목명
                    </MKTypography>
                  </Grid>
                  <Grid item xs={3}>
                    <MKTypography
                      variant="subtitle2"
                      color="white"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                    >
                      현재가
                    </MKTypography>
                  </Grid>
                  <Grid item xs={2}>
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
                  <Grid item xs={2}>
                    <MKTypography
                      variant="subtitle2"
                      color="white"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                    >
                      변화율
                    </MKTypography>
                  </Grid>
                </Grid>
              </MKBox>

              {/* 검색 결과 목록 */}
              <MKBox
                sx={{
                  flex: 1,
                  overflow: "auto",
                }}
              >
                {searchResults.map((stock, index) => (
                  <MKBox
                    key={stock.code}
                    onClick={() => handleStockClick(stock)}
                    sx={{
                      p: 1,
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      backgroundColor:
                        selectedStock?.code === stock.code ||
                        selectedStock?.stock_code === stock.code
                          ? "#f8f9ff"
                          : index % 2 === 0
                          ? "#fafafa"
                          : "white",
                      "&:hover": {
                        backgroundColor: "#f0f4ff",
                      },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <Grid container spacing={0} alignItems="center">
                      <Grid item xs={1}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(stock);
                          }}
                          sx={{
                            p: 0.5,
                            color: stock.is_favorite ? "#ff6b6b" : "#ddd",
                            "&:hover": {
                              color: "#ff6b6b",
                            },
                          }}
                        >
                          {stock.is_favorite ? <StarIcon /> : <StarOutlineIcon />}
                        </IconButton>
                      </Grid>
                      <Grid item xs={4}>
                        <MKBox>
                          <MKTypography
                            variant="subtitle2"
                            sx={{
                              fontSize: { xs: "0.7rem", md: "0.8rem" },
                              fontWeight: "bold",
                              color: "#333",
                              lineHeight: 1.2,
                            }}
                          >
                            {stock.name}
                          </MKTypography>
                          <MKTypography
                            variant="caption"
                            sx={{
                              fontSize: { xs: "0.65rem", md: "0.7rem" },
                              color: "#666",
                              lineHeight: 1,
                            }}
                          >
                            {stock.code}
                          </MKTypography>
                        </MKBox>
                      </Grid>
                      <Grid item xs={3}>
                        <MKTypography
                          variant="body2"
                          textAlign="center"
                          sx={{
                            fontSize: { xs: "0.7rem", md: "0.8rem" },
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {stock.current_price
                            ? stock.current_price.toLocaleString()
                            : "-"}
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MKTypography
                          variant="body2"
                          textAlign="center"
                          sx={{
                            fontSize: { xs: "0.7rem", md: "0.8rem" },
                            color: "#666",
                          }}
                        >
                          {stock.rsRank ? stock.rsRank.toFixed(1) : "-"}
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MKTypography
                          variant="body2"
                          textAlign="center"
                          sx={{
                            fontSize: { xs: "0.7rem", md: "0.8rem" },
                            fontWeight: "bold",
                            color:
                              stock.change_percent > 0
                                ? "#d32f2f"
                                : stock.change_percent < 0
                                ? "#1976d2"
                                : "#666",
                          }}
                        >
                          {stock.change_percent
                            ? `${stock.change_percent > 0 ? "+" : ""}${stock.change_percent.toFixed(2)}%`
                            : "-"}
                        </MKTypography>
                      </Grid>
                    </Grid>
                  </MKBox>
                ))}
              </MKBox>
            </>
          )}

          {/* 검색 결과가 없는 경우 메시지 */}
          {searchQuery.trim() && searchResults.length === 0 && !loading && (
            <MKBox
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 2,
                p: 2,
              }}
            >
              <MKTypography variant="h6" color="text" textAlign="center">
                검색 결과가 없습니다
              </MKTypography>
              <MKTypography variant="body2" color="text" textAlign="center">
                다른 검색어로 시도해보세요
              </MKTypography>
            </MKBox>
          )}

          {!loading && !error && !searchQuery.trim() && (
            <>
              {/* 즐겨찾기 탭 내용 */}
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
                      <Grid item xs={1}>
                        <MKTypography
                          variant="subtitle2"
                          color="white"
                          fontWeight="bold"
                          textAlign="center"
                          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                        >
                          ⭐
                        </MKTypography>
                      </Grid>
                      <Grid item xs={4}>
                        <MKTypography
                          variant="subtitle2"
                          color="white"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                        >
                          종목명
                        </MKTypography>
                      </Grid>
                      <Grid item xs={3}>
                        <MKTypography
                          variant="subtitle2"
                          color="white"
                          fontWeight="bold"
                          textAlign="center"
                          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                        >
                          현재가
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2}>
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
                      <Grid item xs={2}>
                        <MKTypography
                          variant="subtitle2"
                          color="white"
                          fontWeight="bold"
                          textAlign="center"
                          sx={{ fontSize: { xs: "0.65rem", md: "0.8rem" } }}
                        >
                          변동률
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
                    {displayStocks.length === 0 && (
                      <MKBox
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "200px",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <MKTypography variant="h6" color="text">
                          즐겨찾기가 비어있습니다
                        </MKTypography>
                        <MKTypography variant="body2" color="text" textAlign="center">
                          검색을 통해 종목을 찾고
                          <br />
                          별표를 클릭하여 즐겨찾기에 추가하세요
                        </MKTypography>
                      </MKBox>
                    )}

                    {displayStocks.map((stock, rowIndex) => (
                      <MKBox
                        key={stock.code || stock.stock_code || rowIndex}
                        onClick={() => handleStockClick(stock)}
                        sx={{
                          p: 0.5,
                          borderBottom:
                            rowIndex === displayStocks.length - 1 ? "none" : "1px solid #f0f0f0",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          backgroundColor:
                            selectedStock?.code === (stock.code || stock.stock_code) ||
                            selectedStock?.stock_code === (stock.code || stock.stock_code)
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
                          ...((selectedStock?.code === (stock.code || stock.stock_code) ||
                               selectedStock?.stock_code === (stock.code || stock.stock_code)) && {
                            borderLeft: "3px solid #667eea",
                            boxShadow: "0 2px 12px rgba(102, 126, 234, 0.2)",
                          }),
                        }}
                      >
                        <Grid container spacing={0} alignItems="center">
                          <Grid item xs={1}>
                            <MKBox display="flex" justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(stock);
                                }}
                                sx={{
                                  padding: "4px",
                                  color: stock.is_favorite ? "#ffc107" : "#ccc",
                                  "&:hover": {
                                    color: "#ffc107",
                                    backgroundColor: "rgba(255, 193, 7, 0.1)",
                                  },
                                }}
                              >
                                {stock.is_favorite ? (
                                  <StarIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <StarOutlineIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </MKBox>
                          </Grid>
                          <Grid item xs={4}>
                            <MKBox>
                              <MKTypography
                                variant="body2"
                                fontWeight={(selectedStock?.code === (stock.code || stock.stock_code) ||
                                             selectedStock?.stock_code === (stock.code || stock.stock_code)) ? "bold" : "medium"}
                                color={(selectedStock?.code === (stock.code || stock.stock_code) ||
                                        selectedStock?.stock_code === (stock.code || stock.stock_code)) ? "info" : "text"}
                                sx={{
                                  fontSize: { xs: "0.7rem", md: "0.8rem" },
                                  lineHeight: 1.1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {stock.name || "-"}
                              </MKTypography>
                              <MKTypography
                                variant="caption"
                                color="text"
                                sx={{
                                  fontSize: { xs: "0.6rem", md: "0.7rem" },
                                  display: { xs: "none", sm: "block" },
                                }}
                              >
                                {stock.code || ""}
                              </MKTypography>
                            </MKBox>
                          </Grid>
                          <Grid item xs={3}>
                            <MKBox display="flex" justifyContent="center" alignItems="center">
                              <MKTypography
                                variant="body2"
                                textAlign="center"
                                fontWeight="bold"
                                sx={{
                                  fontSize: { xs: "0.7rem", md: "0.8rem" },
                                }}
                              >
                                {stock.current_price ? `${formatNumber(stock.current_price)}원` : "-"}
                              </MKTypography>
                            </MKBox>
                          </Grid>
                          <Grid item xs={2}>
                            <MKBox display="flex" justifyContent="center">
                              <Chip
                                label={Math.floor(stock.rsRank) || "-"}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    stock.rsRank >= 90
                                      ? "#f44336"
                                      : stock.rsRank >= 80
                                      ? "#ff5722"
                                      : stock.rsRank >= 70
                                      ? "#ffc107"
                                      : stock.rsRank >= 60
                                      ? "#4caf50"
                                      : stock.rsRank >= 50
                                      ? "#2196f3"
                                      : "#9e9e9e",
                                  color:
                                    stock.rsRank >= 70 && stock.rsRank < 80 ? "black" : "white",
                                  fontWeight: "bold",
                                  fontSize: { xs: "0.6rem", md: "0.7rem" },
                                  minWidth: { xs: "25px", md: "30px" },
                                  height: { xs: "18px", md: "20px" },
                                }}
                              />
                            </MKBox>
                          </Grid>
                          <Grid item xs={2}>
                            <MKBox display="flex" justifyContent="center" alignItems="center">
                              <MKTypography
                                variant="body2"
                                textAlign="center"
                                fontWeight="bold"
                                sx={{
                                  fontSize: { xs: "0.65rem", md: "0.75rem" },
                                  color:
                                    stock.change_percent > 0
                                      ? "#f44336"
                                      : stock.change_percent < 0
                                      ? "#2196f3"
                                      : "inherit",
                                }}
                              >
                                {stock.change_percent
                                  ? `${stock.change_percent > 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`
                                  : "-"}
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
                        strategyType="favorites"
                      />
                    </MKBox>
                  )}
                </MKBox>
              )}
            </>
          )}
        </MKBox>
      </Grid>
    </Grid>
  );

  // 모바일 즐겨찾기 탭 렌더링
  const renderMobileFavoritesTab = () => (
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
            즐겨찾기
          </MKTypography>
        </MKBox>
        <MKBox sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {/* 검색창 */}
          <MKBox sx={{ p: 2, borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="종목명 또는 코드 검색 (Enter로 검색)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#667eea" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667eea",
                  },
                },
              }}
            />
          </MKBox>

          {/* 검색 결과 영역 */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <MKBox sx={{ flex: 1, overflow: "auto" }}>
              {searchResults.map((stock, index) => (
                <MKBox
                  key={stock.code}
                  onClick={() => handleStockClick(stock)}
                  sx={{
                    p: 1.5,
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    backgroundColor:
                      selectedStock?.code === stock.code ||
                      selectedStock?.stock_code === stock.code
                        ? "#f8f9ff"
                        : index % 2 === 0
                        ? "#fafafa"
                        : "white",
                    "&:hover": {
                      backgroundColor: "#f0f4ff",
                    },
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={2}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(stock);
                        }}
                        sx={{
                          p: 0.5,
                          color: stock.is_favorite ? "#ff6b6b" : "#ddd",
                          "&:hover": {
                            color: "#ff6b6b",
                          },
                        }}
                      >
                        {stock.is_favorite ? <StarIcon sx={{ fontSize: 20 }} /> : <StarOutlineIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </Grid>
                    <Grid item xs={6}>
                      <MKBox>
                        <MKTypography
                          variant="subtitle2"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            color: "#333",
                            lineHeight: 1.2,
                          }}
                        >
                          {stock.name}
                        </MKTypography>
                        <MKTypography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            color: "#666",
                            lineHeight: 1,
                          }}
                        >
                          {stock.code}
                        </MKTypography>
                      </MKBox>
                    </Grid>
                    <Grid item xs={4}>
                      <MKBox textAlign="right">
                        <MKTypography
                          variant="body2"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {stock.current_price
                            ? stock.current_price.toLocaleString()
                            : "-"}
                        </MKTypography>
                        <MKTypography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            color:
                              stock.change_percent > 0
                                ? "#d32f2f"
                                : stock.change_percent < 0
                                ? "#1976d2"
                                : "#666",
                          }}
                        >
                          {stock.change_percent
                            ? `${stock.change_percent > 0 ? "+" : ""}${stock.change_percent.toFixed(2)}%`
                            : "-"}
                        </MKTypography>
                      </MKBox>
                    </Grid>
                  </Grid>
                </MKBox>
              ))}
            </MKBox>
          )}

          {/* 검색 결과가 없는 경우 */}
          {searchQuery.trim() && searchResults.length === 0 && !loading && (
            <MKBox
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 2,
                p: 2,
              }}
            >
              <MKTypography variant="h6" color="text" textAlign="center">
                검색 결과가 없습니다
              </MKTypography>
              <MKTypography variant="body2" color="text" textAlign="center">
                다른 검색어로 시도해보세요
              </MKTypography>
            </MKBox>
          )}

          {/* 검색하지 않은 경우 즐겨찾기 목록 표시 */}
          {!searchQuery.trim() && (
            <MKBox sx={{ flex: 1, overflow: "auto" }}>
              {favoriteStocks.length === 0 ? (
                <MKBox
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "200px",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <MKTypography variant="h6" color="text">
                    즐겨찾기가 비어있습니다
                  </MKTypography>
                  <MKTypography variant="body2" color="text" textAlign="center">
                    검색을 통해 종목을 찾고
                    <br />
                    별표를 클릭하여 즐겨찾기에 추가하세요
                  </MKTypography>
                </MKBox>
              ) : (
                favoriteStocks.map((stock, index) => (
                  <MKBox
                    key={stock.stock_code}
                    onClick={() => handleStockClick(stock)}
                    sx={{
                      p: 1.5,
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      backgroundColor:
                        selectedStock?.code === stock.stock_code ||
                        selectedStock?.stock_code === stock.stock_code
                          ? "#f8f9ff"
                          : index % 2 === 0
                          ? "#fafafa"
                          : "white",
                      "&:hover": {
                        backgroundColor: "#f0f4ff",
                      },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={2}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite({
                              code: stock.stock_code,
                              name: stock.stock_name,
                              is_favorite: true
                            });
                          }}
                          sx={{
                            p: 0.5,
                            color: "#ff6b6b",
                            "&:hover": {
                              color: "#ff6b6b",
                            },
                          }}
                        >
                          <StarIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Grid>
                      <Grid item xs={6}>
                        <MKBox>
                          <MKTypography
                            variant="subtitle2"
                            sx={{
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              color: "#333",
                              lineHeight: 1.2,
                            }}
                          >
                            {stock.stock_name}
                          </MKTypography>
                          <MKTypography
                            variant="caption"
                            sx={{
                              fontSize: "0.7rem",
                              color: "#666",
                              lineHeight: 1,
                            }}
                          >
                            {stock.stock_code}
                          </MKTypography>
                        </MKBox>
                      </Grid>
                      <Grid item xs={4}>
                        <MKBox textAlign="right">
                          <MKTypography
                            variant="body2"
                            sx={{
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            {stock.current_price
                              ? stock.current_price.toLocaleString()
                              : "-"}
                          </MKTypography>
                          <MKTypography
                            variant="caption"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color:
                                stock.change_percent > 0
                                  ? "#d32f2f"
                                  : stock.change_percent < 0
                                  ? "#1976d2"
                                  : "#666",
                            }}
                          >
                            {stock.change_percent
                              ? `${stock.change_percent > 0 ? "+" : ""}${stock.change_percent.toFixed(2)}%`
                              : "-"}
                          </MKTypography>
                        </MKBox>
                      </Grid>
                    </Grid>
                  </MKBox>
                ))
              )}
            </MKBox>
          )}
        </MKBox>
      </MKBox>
    </MKBox>
  );

  // 모바일 차트 탭 렌더링 (기존과 동일)
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
                  ⭐
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
                즐겨찾기 보기
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

  // 모바일 자동매매 탭 렌더링 (기존과 동일)
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
                즐겨찾기 보기
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
              strategyType="favorites"
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
          <Box sx={{ height: "80px", flexShrink: 0 }} />

          <Box sx={{ flex: 1, p: 1 }}>
            {mobileTab === 0 && renderMobileFavoritesTab()}
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
                label="즐겨찾기"
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
          <Box sx={{ height: "80px", flexShrink: 0 }} />
          {desktopLayout}
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

export default Favorites;