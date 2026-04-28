/**
 * 매매복기 목록 페이지
 * - Autobot에서 생성한 매매복기 데이터 조회 및 표시
 * - DataTables 방식으로 구현
 * - 인증 불필요 (Autobot 데이터 직접 조회)
 */

import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

// @mui icons
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ShowChartIcon from "@mui/icons-material/ShowChart";

// Enhanced components
import FullWidthContainer from "components/FullWidthContainer";
import EnhancedDataTable from "components/EnhancedDataTable";
import ResponsiveTableWrapper from "components/ResponsiveTableWrapper";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

// Notification system
import { useNotification } from "components/NotificationSystem/NotificationSystem";

// Utility functions
const formatCurrency = (value) => {
  if (!value) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

const getTradingModeLabel = (tradingMode) => {
  const labels = {
    manual: "Manual",
    turtle: "Turtle",
    atr: "ATR",
  };
  return labels[tradingMode] || tradingMode;
};

const getTradingModeColor = (tradingMode) => {
  const colors = {
    manual: "#2196f3", // 파란색 - 수동 매매
    turtle: "#0d47a1", // 진한 네이비 블루 - 터틀 매매
    atr: "#0d47a1", // 진한 네이비 블루 - 자동 매매
  };
  return colors[tradingMode] || "#9e9e9e";
};

const getFinalStatusLabel = (status) => {
  const labels = {
    CLOSED: "청산완료",
    HOLDING: "보유중",
    PARTIAL: "부분청산",
  };
  return labels[status] || status;
};

const getFinalStatusColor = (status) => {
  const colors = {
    CLOSED: "success",
    HOLDING: "info", 
    PARTIAL: "warning",
  };
  return colors[status] || "default";
};

// 배경색에 따른 텍스트 색상 결정 함수
const getTextColor = (backgroundColor) => {
  const darkColors = ["#0d47a1"];
  return darkColors.includes(backgroundColor) ? "white" : "black";
};

export default function TradingReviews() {
  const { showSnackbar, NotificationComponent } = useNotification();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradingReviews, setTradingReviews] = useState([]);
  const [stats, setStats] = useState(null);

  // 상세 모달 State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [tradeEntries, setTradeEntries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // API Base URL
  const API_BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

  // DataTable 컬럼 정의
  const columns = [
    {
      name: "종목",
      selector: (row) => row.stock_name,
      sortable: true,
      minWidth: "150px",
      cell: (row) => (
        <Box>
          <MKTypography variant="body2" fontWeight="bold" color="dark" sx={{ lineHeight: 1.2 }}>
            {row.stock_name}
          </MKTypography>
          <MKTypography variant="caption" color="text" opacity={0.7} sx={{ lineHeight: 1 }}>
            {row.stock_code}
          </MKTypography>
        </Box>
      ),
    },
    {
      name: "거래모드",
      selector: (row) => row.trading_mode,
      sortable: true,
      minWidth: "90px",
      cell: (row) => {
        const bgColor = getTradingModeColor(row.trading_mode);
        return (
          <Chip
            label={getTradingModeLabel(row.trading_mode)}
            variant="filled"
            size="small"
            sx={{
              fontSize: "0.7rem",
              height: "24px",
              fontWeight: "bold",
              backgroundColor: bgColor,
              "& .MuiChip-label": {
                padding: "0 8px",
                color: `${getTextColor(bgColor)} !important`,
              },
            }}
          />
        );
      },
    },
    {
      name: "최종상태",
      selector: (row) => row.final_status,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Chip
          label={getFinalStatusLabel(row.final_status)}
          color={getFinalStatusColor(row.final_status)}
          size="small"
          sx={{
            fontSize: "0.7rem",
            height: "24px",
            "& .MuiChip-label": { padding: "0 8px" },
          }}
        />
      ),
    },
    {
      name: "첫진입일",
      selector: (row) => row.first_entry_date,
      sortable: true,
      minWidth: "110px",
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {formatDate(row.first_entry_date)}
        </MKTypography>
      ),
    },
    {
      name: "최종청산일",
      selector: (row) => row.last_exit_date,
      sortable: true,
      minWidth: "110px",
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {formatDate(row.last_exit_date)}
        </MKTypography>
      ),
    },
    {
      name: "보유일수",
      selector: (row) => row.holding_days,
      sortable: true,
      minWidth: "80px",
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.holding_days ? `${row.holding_days.toFixed(1)}일` : "-"}
        </MKTypography>
      ),
    },
    {
      name: "매수금액",
      selector: (row) => row.total_buy_amount,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <MKTypography variant="body2" color="info" sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
          {formatCurrency(row.total_buy_amount)}원
        </MKTypography>
      ),
    },
    {
      name: "매도금액",
      selector: (row) => row.total_sell_amount,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <MKTypography variant="body2" color="warning" sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
          {formatCurrency(row.total_sell_amount)}원
        </MKTypography>
      ),
    },
    {
      name: "손익금액",
      selector: (row) => row.total_profit_loss,
      sortable: true,
      minWidth: "140px",
      cell: (row) => {
        const isProfit = row.total_profit_loss >= 0;
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            {isProfit ? (
              <TrendingUpIcon sx={{ fontSize: "16px", color: "success.main" }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: "16px", color: "error.main" }} />
            )}
            <MKTypography
              variant="body2"
              color={isProfit ? "success" : "error"}
              sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(row.total_profit_loss)}원
            </MKTypography>
          </Box>
        );
      },
    },
    {
      name: "수익률",
      selector: (row) => row.profit_loss_percent,
      sortable: true,
      minWidth: "80px",
      cell: (row) => {
        const isProfit = row.profit_loss_percent >= 0;
        return (
          <MKTypography
            variant="body2"
            color={isProfit ? "success" : "error"}
            sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
          >
            {isProfit ? "+" : ""}
            {formatPercent(row.profit_loss_percent)}
          </MKTypography>
        );
      },
    },
    {
      name: "최대낙폭",
      selector: (row) => row.max_drawdown,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <MKTypography
          variant="body2"
          color={row.max_drawdown ? "error" : "text"}
          sx={{ fontSize: "0.8rem" }}
        >
          {row.max_drawdown ? formatPercent(row.max_drawdown) : "-"}
        </MKTypography>
      ),
    },
    {
      name: "최고수익률",
      selector: (row) => row.max_profit_percent,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <MKTypography
          variant="body2"
          color={row.max_profit_percent ? "success" : "text"}
          sx={{ fontSize: "0.8rem" }}
        >
          {row.max_profit_percent ? formatPercent(row.max_profit_percent) : "-"}
        </MKTypography>
      ),
    },
    {
      name: "진입/청산",
      selector: (row) => row.entry_count,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Box>
          <MKTypography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.2 }}>
            <span style={{ color: "#2196f3", fontWeight: "bold" }}>
              진입 {row.entry_count}회
            </span>
          </MKTypography>
          <MKTypography variant="caption" sx={{ fontSize: "0.7rem", lineHeight: 1.2 }}>
            <span style={{ color: "#ff9800", fontWeight: "bold" }}>
              청산 {row.exit_count}회
            </span>
          </MKTypography>
        </Box>
      ),
    },
    {
      name: "평균보유일",
      selector: (row) => row.avg_holding_days,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.avg_holding_days ? `${row.avg_holding_days.toFixed(1)}일` : "-"}
        </MKTypography>
      ),
    },
    {
      name: "액션",
      cell: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="상세 보기">
            <IconButton
              size="small"
              color="info"
              sx={{ padding: "4px" }}
              onClick={() => handleViewDetail(row)}
            >
              <VisibilityIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              color="error"
              sx={{ padding: "4px" }}
              onClick={() => handleDelete(row)}
            >
              <DeleteIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // 매매복기 데이터 조회
  const fetchTradingReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/autobot/trading-summary-data`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result.success && result.data) {
        setTradingReviews(result.data);
        calculateStats(result.data);
        showSnackbar(`${result.data.length}개의 매매복기를 불러왔습니다.`, "success");
      } else {
        throw new Error("데이터를 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("매매복기 목록 조회 실패:", err);
      setError(err.message || "데이터를 불러올 수 없습니다.");
      setTradingReviews([]);
      showSnackbar("매매복기를 불러오는데 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats(null);
      return;
    }

    const total_count = data.length;
    const closed_count = data.filter(item => item.final_status === 'CLOSED').length;
    const holding_count = data.filter(item => item.final_status === 'HOLDING').length;
    
    const total_profit_loss = data.reduce((sum, item) => sum + (item.total_profit_loss || 0), 0);
    const avg_profit_loss = total_count > 0 ? total_profit_loss / total_count : 0;
    
    const profitable_count = data.filter(item => (item.total_profit_loss || 0) > 0).length;
    const win_rate = total_count > 0 ? (profitable_count / total_count * 100) : 0;

    const total_buy_amount = data.reduce((sum, item) => sum + (item.total_buy_amount || 0), 0);
    const total_sell_amount = data.reduce((sum, item) => sum + (item.total_sell_amount || 0), 0);

    setStats({
      total_count,
      closed_count,
      holding_count,
      total_profit_loss,
      avg_profit_loss,
      win_rate,
      profitable_count,
      total_buy_amount,
      total_sell_amount,
      loss_count: total_count - profitable_count
    });
  };

  // 삭제 핸들러
  const handleDelete = async (row) => {
    if (!window.confirm(`"${row.stock_name}" 매매복기를 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/autobot/trading-summary/${row.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setTradingReviews((prev) => prev.filter((r) => r.id !== row.id));
      showSnackbar(`"${row.stock_name}" 매매복기가 삭제되었습니다.`, "success");
    } catch (err) {
      console.error("매매복기 삭제 실패:", err);
      showSnackbar("삭제에 실패했습니다.", "error");
    }
  };

  // 상세 보기 핸들러
  const handleViewDetail = async (row) => {
    setSelectedReview(row);
    setDetailTab(0);
    setTradeEntries([]);
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/api/autobot/trading-summary/${row.id}/entries`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTradeEntries(result.data || []);
        }
      }
    } catch (err) {
      console.error("거래 내역 조회 실패:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedReview(null);
    setTradeEntries([]);
  };

  // 초기 로드
  useEffect(() => {
    fetchTradingReviews();
  }, []);

  return (
    <>
      <DefaultNavbar routes={routes} sticky />

      <MKBox component="section" sx={{ minHeight: "80vh", pt: 12, pb: 4 }}>
        <FullWidthContainer>
          {/* 페이지 헤더와 통계 요약 */}
          {!loading && !error && stats && (
            <Box
              display="flex"
              flexDirection={{ xs: "column", lg: "row" }}
              alignItems={{ lg: "flex-start" }}
              gap={4}
              mb={4}
            >
              {/* 페이지 헤더 */}
              <MKBox sx={{ minWidth: "300px" }}>
                <MKTypography variant="h3" color="dark" fontWeight="bold">
                  매매복기 목록
                </MKTypography>
                <MKTypography variant="body2" color="text" opacity={0.7}>
                  Autobot 자동매매 거래 기록
                </MKTypography>
              </MKBox>

              {/* 통계 요약 */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" flexDirection="row" gap={1.5} flexWrap="wrap">
                  {/* 전체 거래 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        전체 거래
                      </MKTypography>
                      <MKTypography variant="h6" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                        {stats.total_count}건
                      </MKTypography>
                    </CardContent>
                  </Card>

                  {/* 청산완료 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        청산완료
                      </MKTypography>
                      <MKTypography variant="h6" fontWeight="bold" color="success" sx={{ mt: 0.5 }}>
                        {stats.closed_count}건
                      </MKTypography>
                    </CardContent>
                  </Card>

                  {/* 보유중 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        보유중
                      </MKTypography>
                      <MKTypography variant="h6" fontWeight="bold" color="info" sx={{ mt: 0.5 }}>
                        {stats.holding_count}건
                      </MKTypography>
                    </CardContent>
                  </Card>

                  {/* 총 손익 */}
                  <Card sx={{ flex: 1, minWidth: "150px", minHeight: "80px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        총 손익
                      </MKTypography>
                      <MKTypography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mt: 0.5,
                          color: stats.total_profit_loss >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        {stats.total_profit_loss >= 0 ? "+" : ""}
                        {formatCurrency(stats.total_profit_loss)}원
                      </MKTypography>
                    </CardContent>
                  </Card>

                </Box>
              </Box>
            </Box>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <MKBox display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </MKBox>
          )}

          {/* 에러 상태 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 매매복기 DataTable */}
          {!loading && !error && (
            <MKBox>
              {tradingReviews.length === 0 ? (
                <Card>
                  <CardContent>
                    <MKBox textAlign="center" py={6}>
                      <ShowChartIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                      <MKTypography variant="h5" color="text" mb={2}>
                        매매복기 데이터가 없습니다
                      </MKTypography>
                      <MKTypography variant="body1" color="text" opacity={0.7} mb={3}>
                        아직 기록된 매매 내역이 없습니다.
                      </MKTypography>
                    </MKBox>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveTableWrapper>
                  <EnhancedDataTable
                    columns={columns}
                    data={tradingReviews}
                    autoOptimizeColumns={true}
                    defaultSortFieldId={4} // 첫진입일로 기본 정렬
                    defaultSortAsc={false} // 최신순 정렬
                  />
                </ResponsiveTableWrapper>
              )}
            </MKBox>
          )}

          {/* 새로고침 버튼 */}
          {!loading && (
            <MKBox textAlign="center" mt={4}>
              <MKButton variant="outlined" color="info" onClick={fetchTradingReviews}>
                데이터 새로고침
              </MKButton>
            </MKBox>
          )}
        </FullWidthContainer>
      </MKBox>

      <DefaultFooter content={footerRoutes} />
      <NotificationComponent />

      {/* 상세 보기 모달 */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, maxHeight: "90vh" } }}
      >
        {selectedReview && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <MKTypography variant="h5" fontWeight="bold" color="dark">
                    {selectedReview.stock_name}
                  </MKTypography>
                  <MKTypography variant="caption" color="text" opacity={0.7}>
                    {selectedReview.stock_code} · {getTradingModeLabel(selectedReview.trading_mode)} ·{" "}
                    <Chip
                      label={getFinalStatusLabel(selectedReview.final_status)}
                      color={getFinalStatusColor(selectedReview.final_status)}
                      size="small"
                      sx={{ fontSize: "0.65rem", height: "20px", ml: 0.5 }}
                    />
                  </MKTypography>
                </Box>
                <IconButton onClick={handleCloseDetail} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{ mt: 1 }}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="거래 종합정보" />
                <Tab label="거래현황" />
              </Tabs>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
              {/* ── 탭 0: 거래 종합정보 ── */}
              {detailTab === 0 && (
                <Box sx={{ p: 3 }}>
                  {/* 거래 기간 */}
                  <MKTypography variant="subtitle2" fontWeight="bold" color="text" mb={1}>
                    거래 기간
                  </MKTypography>
                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(160px, 1fr))"
                    gap={1.5}
                    mb={3}
                  >
                    {[
                      { label: "첫 진입일", value: formatDate(selectedReview.first_entry_date) },
                      { label: "최종 청산일", value: formatDate(selectedReview.last_exit_date) },
                      {
                        label: "보유 일수",
                        value: selectedReview.holding_days
                          ? `${selectedReview.holding_days.toFixed(1)}일`
                          : "-",
                      },
                      {
                        label: "평균 보유일",
                        value: selectedReview.avg_holding_days
                          ? `${selectedReview.avg_holding_days.toFixed(1)}일`
                          : "-",
                      },
                    ].map(({ label, value }) => (
                      <Card key={label} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <MKTypography variant="caption" color="text.secondary">
                            {label}
                          </MKTypography>
                          <MKTypography variant="body2" fontWeight="bold">
                            {value}
                          </MKTypography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* 거래 금액 */}
                  <MKTypography variant="subtitle2" fontWeight="bold" color="text" mb={1}>
                    거래 금액
                  </MKTypography>
                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(160px, 1fr))"
                    gap={1.5}
                    mb={3}
                  >
                    {[
                      {
                        label: "총 매수 금액",
                        value: `${formatCurrency(selectedReview.total_buy_amount)}원`,
                      },
                      {
                        label: "총 매도 금액",
                        value: `${formatCurrency(selectedReview.total_sell_amount)}원`,
                      },
                    ].map(({ label, value }) => (
                      <Card key={label} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <MKTypography variant="caption" color="text.secondary">
                            {label}
                          </MKTypography>
                          <MKTypography variant="body2" fontWeight="bold">
                            {value}
                          </MKTypography>
                        </CardContent>
                      </Card>
                    ))}
                    {/* 순 손익 - 컬러 강조 */}
                    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <MKTypography variant="caption" color="text.secondary">
                          순 손익
                        </MKTypography>
                        <MKTypography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color:
                              selectedReview.total_profit_loss >= 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {selectedReview.total_profit_loss >= 0 ? "+" : ""}
                          {formatCurrency(selectedReview.total_profit_loss)}원
                        </MKTypography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <MKTypography variant="caption" color="text.secondary">
                          수익률
                        </MKTypography>
                        <MKTypography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color:
                              selectedReview.profit_loss_percent >= 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {selectedReview.profit_loss_percent >= 0 ? "+" : ""}
                          {formatPercent(selectedReview.profit_loss_percent)}
                        </MKTypography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* 성과 분석 */}
                  <MKTypography variant="subtitle2" fontWeight="bold" color="text" mb={1}>
                    성과 분석
                  </MKTypography>
                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))"
                    gap={1.5}
                    mb={3}
                  >
                    {[
                      { label: "진입 횟수", value: `${selectedReview.entry_count}회` },
                      { label: "청산 횟수", value: `${selectedReview.exit_count}회` },
                      {
                        label: "최대 낙폭",
                        value: selectedReview.max_drawdown
                          ? formatPercent(selectedReview.max_drawdown)
                          : "-",
                      },
                      {
                        label: "최고 수익률",
                        value: selectedReview.max_profit_percent
                          ? formatPercent(selectedReview.max_profit_percent)
                          : "-",
                      },
                    ].map(({ label, value }) => (
                      <Card key={label} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <MKTypography variant="caption" color="text.secondary">
                            {label}
                          </MKTypography>
                          <MKTypography variant="body2" fontWeight="bold">
                            {value}
                          </MKTypography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {/* 메모 */}
                  {selectedReview.memo && (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      <MKTypography variant="subtitle2" fontWeight="bold" color="text" mb={1}>
                        메모
                      </MKTypography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <MKTypography variant="body2" color="text">
                          {selectedReview.memo}
                        </MKTypography>
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {/* ── 탭 1: 거래현황 ── */}
              {detailTab === 1 && (
                <Box sx={{ p: 3 }}>
                  {detailLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : tradeEntries.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <MKTypography variant="body2" color="text" opacity={0.6}>
                        거래 내역이 없습니다.
                      </MKTypography>
                    </Box>
                  ) : (
                    <Box sx={{ position: "relative" }}>
                      {/* 타임라인 세로선 */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: 20,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          bgcolor: "grey.200",
                          zIndex: 0,
                        }}
                      />
                      {tradeEntries.map((entry, idx) => {
                        const isBuy = entry.trade_type === "BUY";
                        const entryTypeLabels = {
                          INITIAL: "최초진입",
                          PYRAMIDING: "피라미딩",
                          EXIT_PARTIAL: "부분청산",
                          EXIT_FULL: "전량청산",
                          STOP_LOSS: "손절",
                          TRAILING_STOP: "트레일링스탑",
                        };
                        const statusLabels = {
                          SUBMITTED: "접수",
                          FILLED: "체결",
                          PARTIAL: "부분체결",
                          CANCELLED: "취소",
                          FAILED: "실패",
                        };
                        const timeStr = entry.filled_at || entry.ordered_at || entry.created_at;

                        return (
                          <Box
                            key={entry.id}
                            display="flex"
                            gap={2}
                            mb={2}
                            sx={{ position: "relative", zIndex: 1 }}
                          >
                            {/* 타임라인 아이콘 */}
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: isBuy ? "success.main" : "error.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                boxShadow: 1,
                              }}
                            >
                              {isBuy ? (
                                <ArrowUpwardIcon sx={{ color: "white", fontSize: 18 }} />
                              ) : (
                                <ArrowDownwardIcon sx={{ color: "white", fontSize: 18 }} />
                              )}
                            </Box>

                            {/* 내용 카드 */}
                            <Card
                              variant="outlined"
                              sx={{
                                flex: 1,
                                borderRadius: 1.5,
                                borderColor: isBuy ? "success.light" : "error.light",
                              }}
                            >
                              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                {/* 헤더 행 */}
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  mb={0.5}
                                >
                                  <Box display="flex" alignItems="center" gap={0.8}>
                                    <MKTypography
                                      variant="body2"
                                      fontWeight="bold"
                                      sx={{ color: isBuy ? "success.main" : "error.main" }}
                                    >
                                      {isBuy ? "매수" : "매도"}
                                    </MKTypography>
                                    <Chip
                                      label={entryTypeLabels[entry.entry_type] || entry.entry_type}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.65rem", height: "18px" }}
                                    />
                                    <Chip
                                      label={statusLabels[entry.status] || entry.status}
                                      size="small"
                                      color={entry.status === "FILLED" ? "success" : "default"}
                                      sx={{ fontSize: "0.65rem", height: "18px" }}
                                    />
                                  </Box>
                                  <MKTypography variant="caption" color="text.secondary">
                                    {timeStr
                                      ? new Date(timeStr).toLocaleString("ko-KR", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </MKTypography>
                                </Box>

                                {/* 거래 수치 */}
                                <Box display="flex" gap={3} flexWrap="wrap">
                                  <Box>
                                    <MKTypography variant="caption" color="text.secondary">
                                      체결가
                                    </MKTypography>
                                    <MKTypography variant="body2" fontWeight="bold">
                                      {formatCurrency(entry.filled_price)}원
                                    </MKTypography>
                                  </Box>
                                  <Box>
                                    <MKTypography variant="caption" color="text.secondary">
                                      수량
                                    </MKTypography>
                                    <MKTypography variant="body2" fontWeight="bold">
                                      {entry.filled_quantity}주
                                    </MKTypography>
                                  </Box>
                                  <Box>
                                    <MKTypography variant="caption" color="text.secondary">
                                      체결금액
                                    </MKTypography>
                                    <MKTypography variant="body2" fontWeight="bold">
                                      {formatCurrency(entry.filled_amount)}원
                                    </MKTypography>
                                  </Box>
                                  {entry.profit_loss !== null && entry.profit_loss !== undefined && (
                                    <Box>
                                      <MKTypography variant="caption" color="text.secondary">
                                        손익
                                      </MKTypography>
                                      <MKTypography
                                        variant="body2"
                                        fontWeight="bold"
                                        sx={{
                                          color:
                                            entry.profit_loss >= 0 ? "success.main" : "error.main",
                                        }}
                                      >
                                        {entry.profit_loss >= 0 ? "+" : ""}
                                        {formatCurrency(entry.profit_loss)}원
                                        {entry.profit_loss_percent !== null && (
                                          <span style={{ marginLeft: 4, fontWeight: "normal" }}>
                                            ({entry.profit_loss_percent >= 0 ? "+" : ""}
                                            {formatPercent(entry.profit_loss_percent)})
                                          </span>
                                        )}
                                      </MKTypography>
                                    </Box>
                                  )}
                                  {entry.stop_price && (
                                    <Box>
                                      <MKTypography variant="caption" color="text.secondary">
                                        손절가
                                      </MKTypography>
                                      <MKTypography variant="body2" fontWeight="bold">
                                        {formatCurrency(entry.stop_price)}원
                                      </MKTypography>
                                    </Box>
                                  )}
                                </Box>

                                {/* 비고 */}
                                {entry.note && (
                                  <MKTypography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: "block" }}
                                  >
                                    {entry.note}
                                  </MKTypography>
                                )}
                              </CardContent>
                            </Card>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <MKButton variant="outlined" color="secondary" onClick={handleCloseDetail}>
                닫기
              </MKButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}