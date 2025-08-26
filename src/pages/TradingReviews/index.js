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

// @mui icons
import VisibilityIcon from "@mui/icons-material/Visibility";
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

  // API Base URL
  const API_BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

  // DataTable 컬럼 정의
  const columns = [
    {
      name: "종목",
      selector: (row) => row.stock_name,
      sortable: true,
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
      name: "승률",
      selector: (row) => row.win_rate,
      sortable: true,
      cell: (row) => {
        const winRate = row.win_rate || 0;
        let color = "text";
        if (winRate >= 60) color = "success";
        else if (winRate >= 40) color = "warning";
        else if (winRate > 0) color = "error";
        
        return (
          <MKTypography
            variant="body2"
            color={color}
            sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
          >
            {formatPercent(winRate)}
          </MKTypography>
        );
      },
    },
    {
      name: "평균보유일",
      selector: (row) => row.avg_holding_days,
      sortable: true,
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
        </Box>
      ),
    },
  ];

  // 매매복기 데이터 조회
  const fetchTradingReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/autobot/trading-summary-data`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        }
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

  // 상세 보기 핸들러
  const handleViewDetail = (row) => {
    const detail = `
=== ${row.stock_name} (${row.stock_code}) 매매 상세 ===

거래 모드: ${getTradingModeLabel(row.trading_mode)}
최종 상태: ${getFinalStatusLabel(row.final_status)}

=== 거래 기간 ===
첫 진입일: ${formatDate(row.first_entry_date)}
최종 청산일: ${formatDate(row.last_exit_date)}
보유 일수: ${row.holding_days ? `${row.holding_days.toFixed(1)}일` : "-"}
평균 보유일: ${row.avg_holding_days ? `${row.avg_holding_days.toFixed(1)}일` : "-"}

=== 거래 현황 ===
총 매수 금액: ${formatCurrency(row.total_buy_amount)}원
총 매도 금액: ${formatCurrency(row.total_sell_amount)}원
순 손익: ${row.total_profit_loss >= 0 ? '+' : ''}${formatCurrency(row.total_profit_loss)}원
수익률: ${row.profit_loss_percent >= 0 ? '+' : ''}${formatPercent(row.profit_loss_percent)}

=== 성과 분석 ===
진입 횟수: ${row.entry_count}회
청산 횟수: ${row.exit_count}회
승률: ${formatPercent(row.win_rate || 0)}
최대 낙폭: ${row.max_drawdown ? formatPercent(row.max_drawdown) : "-"}
최고 수익률: ${row.max_profit_percent ? formatPercent(row.max_profit_percent) : "-"}

메모: ${row.memo || "없음"}
    `;

    alert(detail);
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

                  {/* 승률 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        승률
                      </MKTypography>
                      <MKTypography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mt: 0.5,
                          color: stats.win_rate >= 50 ? "success.main" : "error.main",
                        }}
                      >
                        {formatPercent(stats.win_rate)}
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
    </>
  );
}