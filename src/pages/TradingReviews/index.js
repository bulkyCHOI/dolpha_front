/**
 * 매매복기 목록 페이지
 * - Autobot에서 생성한 매매복기 데이터 조회 및 표시
 * - DataTables 방식으로 구현
 * - 인증 불필요 (Autobot 데이터 직접 조회)
 */

import { useState, useEffect, useRef, useCallback } from "react";

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
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import TextField from "@mui/material/TextField";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import AccountCharts from "./components/AccountCharts";

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

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import AppHeader from "components/AppHeader";
import AppFooter from "components/AppFooter";
import ChartbookHeader from "components/ChartbookHeader/ChartbookHeader";

// Routes
import routes from "routes";

// Auth
import { useAuth } from "contexts/AuthContext";

// Notification system
import { useNotification } from "components/NotificationSystem/NotificationSystem";
import { COLORS } from "constants/styles";

// Utility functions
const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
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
    manual: COLORS.DOWN, // 파란색 - 수동 매매
    turtle: COLORS.DOWN, // 진한 네이비 블루 - 터틀 매매
    atr: COLORS.DOWN, // 진한 네이비 블루 - 자동 매매
  };
  return colors[tradingMode] || COLORS.TEXT_MUTED;
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

// Chartbook: 헤어라인 칩 스타일 (채워진 알약 금지)
const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const STATUS_TOKEN = {
  success: COLORS.SUCCESS,
  info: COLORS.CHARTBOOK.PANEL_BLUE,
  warning: COLORS.WARNING,
  default: COLORS.CHARTBOOK.SECONDARY,
};
const hairlineChipSx = (c) => ({
  backgroundColor: "transparent",
  border: `1px solid ${c}`,
  borderRadius: "2px",
  fontFamily: MONO_STACK,
  "& .MuiChip-label": { color: `${c} !important` },
});

export default function TradingReviews() {
  const { showSnackbar, NotificationComponent } = useNotification();
  const { authenticatedFetch, loading: authLoading } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradingReviews, setTradingReviews] = useState([]);
  const [stats, setStats] = useState(null);

  // 계좌 잔고
  const [accountBalance, setAccountBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // 현재 보유종목
  const [holdingPositions, setHoldingPositions] = useState({});
  const [holdingLoading, setHoldingLoading] = useState(false);

  // 상세 모달 State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [tradeEntries, setTradeEntries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // 계좌 일별 스냅샷 (라인 차트)
  const [accountSnapshots, setAccountSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  // 일자별 확정 손익 (매도 체결 기준)
  const [dailyPnl, setDailyPnl] = useState([]);

  // 매매사유 편집 State: { [entryId]: { editing: bool, value: string, saving: bool } }
  const [noteStates, setNoteStates] = useState({});

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
          <Typography
            variant="body2"
            fontWeight="bold"
            color="text.primary"
            sx={{ lineHeight: 1.2 }}
          >
            {row.stock_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" opacity={0.7} sx={{ lineHeight: 1 }}>
            {row.stock_code}
          </Typography>
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
            variant="outlined"
            size="small"
            sx={{
              fontSize: "0.7rem",
              height: "24px",
              fontWeight: 500,
              ...hairlineChipSx(bgColor),
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
          variant="outlined"
          size="small"
          sx={{
            fontSize: "0.7rem",
            height: "24px",
            ...hairlineChipSx(STATUS_TOKEN[getFinalStatusColor(row.final_status)] || STATUS_TOKEN.default),
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
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {formatDate(row.first_entry_date)}
        </Typography>
      ),
    },
    {
      name: "최종청산일",
      selector: (row) => row.last_exit_date,
      sortable: true,
      minWidth: "110px",
      cell: (row) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {formatDate(row.last_exit_date)}
        </Typography>
      ),
    },
    {
      name: "보유일수",
      selector: (row) => row.holding_days,
      sortable: true,
      minWidth: "80px",
      cell: (row) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.holding_days ? `${row.holding_days.toFixed(1)}일` : "-"}
        </Typography>
      ),
    },
    {
      name: "매수금액",
      selector: (row) => row.total_buy_amount,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <Typography
          variant="body2"
          color="info.main"
          sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
        >
          {formatCurrency(row.total_buy_amount)}원
        </Typography>
      ),
    },
    {
      name: "매도금액",
      selector: (row) => row.total_sell_amount,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <Typography
          variant="body2"
          color="warning.main"
          sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
        >
          {formatCurrency(row.total_sell_amount)}원
        </Typography>
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
            <Typography
              variant="body2"
              color={isProfit ? "success" : "error"}
              sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(row.total_profit_loss)}원
            </Typography>
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
          <Typography
            variant="body2"
            color={isProfit ? "success" : "error"}
            sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
          >
            {isProfit ? "+" : ""}
            {formatPercent(row.profit_loss_percent)}
          </Typography>
        );
      },
    },
    {
      name: "최대낙폭",
      selector: (row) => row.max_drawdown,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Typography
          variant="body2"
          color={row.max_drawdown ? "error" : "text"}
          sx={{ fontSize: "0.8rem" }}
        >
          {row.max_drawdown ? formatPercent(row.max_drawdown) : "-"}
        </Typography>
      ),
    },
    {
      name: "최고수익률",
      selector: (row) => row.max_profit_percent,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Typography
          variant="body2"
          color={row.max_profit_percent ? "success" : "text"}
          sx={{ fontSize: "0.8rem" }}
        >
          {row.max_profit_percent ? formatPercent(row.max_profit_percent) : "-"}
        </Typography>
      ),
    },
    {
      name: "진입/청산",
      selector: (row) => row.entry_count,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.2 }}>
            <span style={{ color: COLORS.DOWN, fontWeight: "bold" }}>진입 {row.entry_count}회</span>
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.7rem", lineHeight: 1.2 }}>
            <span style={{ color: COLORS.WARNING, fontWeight: "bold" }}>
              청산 {row.exit_count}회
            </span>
          </Typography>
        </Box>
      ),
    },
    {
      name: "평균보유일",
      selector: (row) => row.avg_holding_days,
      sortable: true,
      minWidth: "90px",
      cell: (row) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.avg_holding_days ? `${row.avg_holding_days.toFixed(1)}일` : "-"}
        </Typography>
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

  // 계좌 잔고 조회
  const fetchAccountBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/mypage/account-balance`);
      const result = await res.json();
      if (result.success) setAccountBalance(result.data);
    } catch (err) {
      console.error("계좌 잔고 조회 실패:", err);
    } finally {
      setBalanceLoading(false);
    }
  }, [API_BASE_URL]);

  // 현재 보유종목 조회
  const fetchHoldingPositions = useCallback(async () => {
    setHoldingLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/mypage/trading-status`);
      const result = await res.json();
      if (result.success) setHoldingPositions(result.data || {});
    } catch (err) {
      console.error("보유종목 조회 실패:", err);
    } finally {
      setHoldingLoading(false);
    }
  }, [API_BASE_URL]);

  // 계좌 일별 스냅샷 조회 (페이지 접근 시 오늘 스냅샷 저장 후 조회)
  // save-today 응답의 balance를 재사용해 별도 GetBalance 호출 방지 (KIS API 경합 방지)
  const fetchAccountSnapshots = useCallback(async () => {
    setSnapshotsLoading(true);
    setBalanceLoading(true);
    try {
      const saveRes = await authenticatedFetch(
        `${API_BASE_URL}/api/mypage/account-snapshots/save-today`,
        {
          method: "POST",
        }
      );
      const saveResult = await saveRes.json();
      if (saveResult.success && saveResult.balance) {
        setAccountBalance(saveResult.balance);
      } else {
        // fallback: save-today에 balance 없으면 별도 조회
        try {
          const balRes = await authenticatedFetch(`${API_BASE_URL}/api/mypage/account-balance`);
          const balResult = await balRes.json();
          if (balResult.success) setAccountBalance(balResult.data);
        } catch (e) {
          console.error("계좌 잔고 조회 실패:", e);
        }
      }
      setBalanceLoading(false);

      const [snapshotRes, pnlRes] = await Promise.all([
        authenticatedFetch(`${API_BASE_URL}/api/mypage/account-snapshots?days=90`),
        authenticatedFetch(`${API_BASE_URL}/api/mypage/daily-realized-pnl?days=90`),
      ]);
      const snapshotResult = await snapshotRes.json();
      const pnlResult = await pnlRes.json();
      if (snapshotResult.success) setAccountSnapshots(snapshotResult.data || []);
      if (pnlResult.success) setDailyPnl(pnlResult.data || []);
    } catch (err) {
      console.error("계좌 스냅샷 조회 실패:", err);
      setBalanceLoading(false);
    } finally {
      setSnapshotsLoading(false);
    }
  }, [API_BASE_URL]);

  // 매매복기 데이터 조회
  const fetchTradingReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/autobot/trading-summary-data`,
        {
          method: "GET",
        }
      );

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
  }, [API_BASE_URL]);

  // 통계 계산
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats(null);
      return;
    }

    const total_count = data.length;
    const closed_count = data.filter((item) => item.final_status === "CLOSED").length;
    const holding_count = data.filter((item) => item.final_status === "HOLDING").length;

    const total_profit_loss = data.reduce((sum, item) => sum + (item.total_profit_loss || 0), 0);
    const avg_profit_loss = total_count > 0 ? total_profit_loss / total_count : 0;

    const closed_items = data.filter((item) => item.final_status === "CLOSED");
    const profitable_count = closed_items.filter(
      (item) => (item.total_profit_loss || 0) > 0
    ).length;
    const win_rate = closed_count > 0 ? (profitable_count / closed_count) * 100 : 0;

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
      loss_count: closed_count - profitable_count,
    });
  };

  // 삭제 핸들러
  const handleDelete = async (row) => {
    if (!window.confirm(`"${row.stock_name}" 매매복기를 삭제하시겠습니까?`)) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/trading-summary/${row.id}`, {
        method: "DELETE",
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
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/autobot/trading-summary/${row.id}/entries`
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
    setNoteStates({});
  };

  const startEditNote = (entry) => {
    setNoteStates((prev) => ({
      ...prev,
      [entry.id]: { editing: true, value: entry.note || "", saving: false },
    }));
  };

  const saveNote = async (entryId) => {
    const state = noteStates[entryId];
    if (!state) return;
    setNoteStates((prev) => ({ ...prev, [entryId]: { ...prev[entryId], saving: true } }));
    try {
      const res = await authenticatedFetch(
        `${API_BASE_URL}/api/autobot/trade-entry/${entryId}/note`,
        {
          method: "PATCH",
          body: JSON.stringify({ note: state.value }),
        }
      );
      if (!res.ok) throw new Error("저장 실패");
      setTradeEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, note: state.value } : e))
      );
      setNoteStates((prev) => ({
        ...prev,
        [entryId]: { editing: false, value: state.value, saving: false },
      }));
    } catch {
      setNoteStates((prev) => ({ ...prev, [entryId]: { ...prev[entryId], saving: false } }));
      showSnackbar("매매사유 저장에 실패했습니다.", "error");
    }
  };

  // 초기 로드 — authLoading이 false로 바뀌는 시점에 단 1회 실행
  // fetchAccountBalance는 fetchAccountSnapshots 내부에서 처리 (KIS API 경합 방지)
  useEffect(() => {
    if (authLoading) return;
    fetchTradingReviews();
    fetchHoldingPositions();
    fetchAccountSnapshots();
  }, [authLoading]);

  // 계좌 요약 카드 렌더
  const renderAccountSummary = () => {
    const balanceItems = accountBalance
      ? [
          {
            label: "총 평가금액",
            value: `${formatCurrency(Math.round(accountBalance.TotalMoney))}원`,
            color: "dark",
          },
          {
            label: "주식 평가금액",
            value: `${formatCurrency(Math.round(accountBalance.StockMoney))}원`,
            color: "info",
          },
          {
            label: "예수금",
            value: `${formatCurrency(Math.round(accountBalance.RemainMoney))}원`,
            color: "dark",
          },
          {
            label: "평가손익",
            value: `${accountBalance.StockRevenue >= 0 ? "+" : ""}${formatCurrency(
              Math.round(accountBalance.StockRevenue)
            )}원`,
            color: accountBalance.StockRevenue >= 0 ? "success" : "error",
          },
          {
            label: "수익률",
            value: (() => {
              const cost = accountBalance.StockMoney - accountBalance.StockRevenue;
              if (!cost) return "-";
              const rate = (accountBalance.StockRevenue / cost) * 100;
              return `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
            })(),
            color: accountBalance.StockRevenue >= 0 ? "success" : "error",
          },
        ]
      : [];

    return (
      <Card sx={{ mb: 3, p: 0.5 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <AccountBalanceIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
              계좌 요약
            </Typography>
          </Box>
          {balanceLoading ? (
            <Box display="flex" gap={1.5}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rounded" width={120} height={60} />
              ))}
            </Box>
          ) : !accountBalance ? (
            <Typography variant="caption" color="text.secondary">
              계좌 정보를 불러올 수 없습니다.
            </Typography>
          ) : (
            <Box display="flex" gap={1.5} flexWrap="wrap">
              {balanceItems.map(({ label, value, color }) => (
                <Card key={label} variant="outlined" sx={{ minWidth: 120, flex: 1 }}>
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={color}
                      sx={{ mt: 0.3, fontSize: "0.85rem" }}
                    >
                      {value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // 보유종목 섹션 렌더
  const renderHoldingPositions = () => {
    const codes = Object.keys(holdingPositions);
    if (!holdingLoading && codes.length === 0) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <TrendingFlatIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
              현재 보유종목
            </Typography>
            {!holdingLoading && (
              <Chip
                label={`${codes.length}종목`}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.65rem", ...hairlineChipSx(STATUS_TOKEN.info) }}
              />
            )}
          </Box>
          {holdingLoading ? (
            <Box display="flex" gap={1.5} flexWrap="wrap">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" width={240} height={200} />
              ))}
            </Box>
          ) : (
            <Box display="flex" gap={1.5} flexWrap="wrap">
              {codes.map((code) => {
                const pos = holdingPositions[code];
                const stockName = pos.stock_name || code;
                const plAmount = pos.profit_loss_amount;
                const plRate = pos.profit_loss_rate;
                const isProfit = plAmount != null ? plAmount >= 0 : null;
                const plColor =
                  isProfit == null ? "text.secondary" : isProfit ? COLORS.UP : COLORS.DOWN;
                const isAtr = pos.trading_mode === "atr" || pos.trading_mode === "turtle";

                return (
                  <Card
                    key={code}
                    variant="outlined"
                    sx={{
                      minWidth: 220,
                      flex: "0 1 240px",
                      borderRadius: "2px",
                      border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                      boxShadow: "none",
                    }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      {/* 종목명 + 종목코드 */}
                      <Box display="flex" alignItems="baseline" gap={0.8} mb={0.3}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="text.primary"
                          sx={{ lineHeight: 1.3 }}
                        >
                          {stockName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {code}
                        </Typography>
                      </Box>

                      {/* 현재가 + 손익 */}
                      {pos.current_price != null && (
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={0.6}
                        >
                          <Typography variant="body2" fontWeight="bold" color="text.primary">
                            {formatCurrency(pos.current_price)}원
                          </Typography>
                          {plAmount != null && (
                            <Box textAlign="right">
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                sx={{ color: plColor, display: "block", lineHeight: 1.2 }}
                              >
                                {plAmount >= 0 ? "+" : ""}
                                {formatCurrency(plAmount)}원
                              </Typography>
                              {plRate != null && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: plColor, display: "block", lineHeight: 1.2 }}
                                >
                                  ({plRate >= 0 ? "+" : ""}
                                  {plRate.toFixed(2)}%)
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}

                      <Divider sx={{ my: 0.6 }} />

                      {/* 기본 정보 */}
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          평단가
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {formatCurrency(pos.avg_price)}원
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          수량
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {pos.total_quantity}주
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          보유금액
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {formatCurrency(Math.round(pos.holding_amount))}원
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          진입
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {pos.actual_entries}/{pos.total_possible_entries}차
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 0.6 }} />

                      {/* 손절가 / 트레일링 스탑 */}
                      {pos.stop_price != null && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            손절가{isAtr && pos.atr ? ` (${pos.atr.toFixed(0)} ATR기준)` : ""}
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.UP }}>
                            {formatCurrency(pos.stop_price)}원
                          </Typography>
                        </Box>
                      )}
                      {pos.trailing_stop_price != null && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Trailing Stop
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ color: COLORS.WARNING }}
                          >
                            {formatCurrency(pos.trailing_stop_price)}원
                          </Typography>
                        </Box>
                      )}

                      {/* 분할 매수 진입가 (차수별, 가격+비중) */}
                      {(pos.entry_slots || []).some((s) => s.price != null) && (
                        <>
                          <Divider sx={{ my: 0.6 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.3 }}
                          >
                            분할 매수가
                          </Typography>
                          {(pos.entry_slots || []).map((slot, idx) => {
                            if (slot.price == null) return null;
                            return (
                              <Box key={idx} display="flex" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">
                                  {slot.label}
                                  {slot.weight != null ? ` (${slot.weight}%)` : ""}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontWeight={slot.is_done ? "bold" : "regular"}
                                  sx={{
                                    color: slot.is_done ? "success.main" : "text.secondary",
                                    textDecoration: slot.is_done ? "line-through" : "none",
                                  }}
                                >
                                  {formatCurrency(slot.price)}원{slot.is_done ? " ✓" : ""}
                                </Typography>
                              </Box>
                            );
                          })}
                        </>
                      )}

                      {/* 분할 매도 설정 */}
                      {pos.staged_exit_info && (
                        <>
                          <Divider sx={{ my: 0.6 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.3 }}
                          >
                            분할 매도 ({pos.staged_exit_info.type_label})
                          </Typography>
                          {pos.staged_exit_info.stages.map((stage) => (
                            <Box key={stage.stage} display="flex" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                {stage.stage}단계: {stage.trigger}
                              </Typography>
                              <Typography
                                variant="caption"
                                fontWeight={stage.is_done ? "bold" : "regular"}
                                sx={{
                                  color: stage.is_done ? "text.secondary" : "warning.main",
                                  textDecoration: stage.is_done ? "line-through" : "none",
                                }}
                              >
                                {stage.sell_pct}%{stage.is_done ? " ✓" : ""}
                              </Typography>
                            </Box>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <AppHeader routes={routes} sticky />
      <Box sx={{ height: "80px", flexShrink: 0, backgroundColor: COLORS.CHARTBOOK.GROUND }} />
      <ChartbookHeader
        strategyName="매매 복기"
        date={new Date().toLocaleDateString("ko-KR")}
        candidateCount={tradingReviews.length}
      />

      <Box component="section" sx={{ minHeight: "80vh", pt: 2, pb: 4, backgroundColor: COLORS.CHARTBOOK.GROUND }}>
        <FullWidthContainer>
          {/* 계좌 요약 */}
          {renderAccountSummary()}

          {/* 현재 보유종목 */}
          {renderHoldingPositions()}

          {/* 계좌 일별 현황 차트 */}
          <AccountCharts
            accountSnapshots={accountSnapshots}
            dailyPnl={dailyPnl}
            loading={snapshotsLoading}
          />

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
              <Box sx={{ minWidth: "300px" }}>
                <Typography variant="h3" color="text.primary" fontWeight="bold">
                  매매복기 목록
                </Typography>
                <Typography variant="body2" color="text.secondary" opacity={0.7}>
                  Autobot 자동매매 거래 기록
                </Typography>
              </Box>

              {/* 통계 요약 */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" flexDirection="row" gap={1.5} flexWrap="wrap">
                  {/* 전체 거래 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px", elevation: 0, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, backgroundColor: COLORS.CHARTBOOK.GROUND, borderRadius: "2px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        전체 거래
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={COLORS.CHARTBOOK.INK}
                        sx={{ mt: 0.5 }}
                      >
                        {stats.total_count}건
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 청산완료 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px", elevation: 0, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, backgroundColor: COLORS.CHARTBOOK.GROUND, borderRadius: "2px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        청산완료
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={COLORS.SUCCESS}
                        sx={{ mt: 0.5 }}
                      >
                        {stats.closed_count}건
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 보유중 */}
                  <Card sx={{ flex: 1, minWidth: "120px", minHeight: "80px", elevation: 0, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, backgroundColor: COLORS.CHARTBOOK.GROUND, borderRadius: "2px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        보유중
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color={COLORS.CHARTBOOK.PANEL_BLUE} sx={{ mt: 0.5 }}>
                        {stats.holding_count}건
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 총 손익 */}
                  <Card sx={{ flex: 1, minWidth: "150px", minHeight: "80px", elevation: 0, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, backgroundColor: COLORS.CHARTBOOK.GROUND, borderRadius: "2px" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        총 손익
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mt: 0.5,
                          color: stats.total_profit_loss >= 0 ? COLORS.SUCCESS : COLORS.UP,
                        }}
                      >
                        {stats.total_profit_loss >= 0 ? "+" : ""}
                        {formatCurrency(stats.total_profit_loss)}원
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          )}

          {/* 에러 상태 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 매매복기 DataTable */}
          {!loading && !error && (
            <Box>
              {tradingReviews.length === 0 ? (
                <Card>
                  <CardContent>
                    <Box textAlign="center" py={6}>
                      <ShowChartIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" mb={2}>
                        매매복기 데이터가 없습니다
                      </Typography>
                      <Typography variant="body1" color="text.secondary" opacity={0.7} mb={3}>
                        아직 기록된 매매 내역이 없습니다.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveTableWrapper>
                  <EnhancedDataTable
                    columns={columns}
                    data={tradingReviews}
                    autoOptimizeColumns={true}
                    defaultSortFieldId={5} // 최종청산일로 기본 정렬
                    defaultSortAsc={false} // 최신순 정렬
                  />
                </ResponsiveTableWrapper>
              )}
            </Box>
          )}

          {/* 새로고침 버튼 */}
          {!loading && (
            <Box textAlign="center" mt={4}>
              <Button variant="outlined" color="info" onClick={fetchTradingReviews}>
                데이터 새로고침
              </Button>
            </Box>
          )}
        </FullWidthContainer>
      </Box>

      <AppFooter />
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
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {selectedReview.stock_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" opacity={0.7}>
                    {selectedReview.stock_code} · {getTradingModeLabel(selectedReview.trading_mode)}{" "}
                    ·{" "}
                    <Chip
                      label={getFinalStatusLabel(selectedReview.final_status)}
                      variant="outlined"
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        height: "20px",
                        ml: 0.5,
                        ...hairlineChipSx(
                          STATUS_TOKEN[getFinalStatusColor(selectedReview.final_status)] ||
                            STATUS_TOKEN.default
                        ),
                      }}
                    />
                  </Typography>
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
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                    거래 기간
                  </Typography>
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
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {value}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* 거래 금액 */}
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                    거래 금액
                  </Typography>
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
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {value}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                    {/* 순 손익 - 컬러 강조 */}
                    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">
                          순 손익
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color:
                              selectedReview.total_profit_loss >= 0 ? "success.main" : "error.main",
                          }}
                        >
                          {selectedReview.total_profit_loss >= 0 ? "+" : ""}
                          {formatCurrency(selectedReview.total_profit_loss)}원
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">
                          수익률
                        </Typography>
                        <Typography
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
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* 성과 분석 */}
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                    성과 분석
                  </Typography>
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
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {value}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {/* 메모 */}
                  {selectedReview.memo && (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="text.secondary"
                        mb={1}
                      >
                        메모
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: COLORS.CHARTBOOK.GROUND,
                          borderRadius: "2px",
                          border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {selectedReview.memo}
                        </Typography>
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
                      <Typography variant="body2" color="text.secondary" opacity={0.6}>
                        거래 내역이 없습니다.
                      </Typography>
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
                              }}
                            >
                              {isBuy ? (
                                <ArrowUpwardIcon sx={{ color: COLORS.UP, fontSize: 18 }} />
                              ) : (
                                <ArrowDownwardIcon sx={{ color: COLORS.DOWN, fontSize: 18 }} />
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
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                      sx={{ color: isBuy ? "success.main" : "error.main" }}
                                    >
                                      {isBuy ? "매수" : "매도"}
                                    </Typography>
                                    <Chip
                                      label={entryTypeLabels[entry.entry_type] || entry.entry_type}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.65rem", height: "18px" }}
                                    />
                                    <Chip
                                      label={statusLabels[entry.status] || entry.status}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.65rem", height: "18px", ...hairlineChipSx(entry.status === "FILLED" ? STATUS_TOKEN.success : STATUS_TOKEN.default) }}
                                    />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {timeStr
                                      ? new Date(timeStr).toLocaleString("ko-KR", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </Typography>
                                </Box>

                                {/* 거래 수치 */}
                                <Box display="flex" gap={3} flexWrap="wrap">
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      체결가
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {formatCurrency(entry.filled_price)}원
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      수량
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {entry.filled_quantity}주
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      체결금액
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {formatCurrency(entry.filled_amount)}원
                                    </Typography>
                                  </Box>
                                  {entry.profit_loss !== null &&
                                    entry.profit_loss !== undefined && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          손익
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight="bold"
                                          sx={{
                                            color:
                                              entry.profit_loss >= 0
                                                ? "success.main"
                                                : "error.main",
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
                                        </Typography>
                                      </Box>
                                    )}
                                  {entry.stop_price && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">
                                        손절가
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {formatCurrency(entry.stop_price)}원
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>

                                {/* 매매사유 */}
                                {(() => {
                                  const ns = noteStates[entry.id];
                                  const isEditing = ns?.editing;
                                  const isSaving = ns?.saving;
                                  const currentNote = isEditing ? ns.value : entry.note || "";
                                  return (
                                    <Box
                                      sx={{
                                        mt: 1,
                                        pt: 1,
                                        borderTop: "1px solid",
                                        borderColor: COLORS.BORDER,
                                      }}
                                    >
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        mb={0.5}
                                      >
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          fontWeight="bold"
                                        >
                                          매매사유
                                        </Typography>
                                        {!isEditing ? (
                                          <IconButton
                                            size="small"
                                            onClick={() => startEditNote(entry)}
                                            sx={{ p: 0.3 }}
                                            title="편집"
                                          >
                                            <EditIcon
                                              sx={{ fontSize: 14, color: "text.secondary" }}
                                            />
                                          </IconButton>
                                        ) : (
                                          <IconButton
                                            size="small"
                                            onClick={() => saveNote(entry.id)}
                                            disabled={isSaving}
                                            sx={{ p: 0.3 }}
                                            title="저장"
                                          >
                                            <CheckIcon
                                              sx={{ fontSize: 14, color: "success.main" }}
                                            />
                                          </IconButton>
                                        )}
                                      </Box>
                                      {isEditing ? (
                                        <TextField
                                          multiline
                                          minRows={2}
                                          maxRows={5}
                                          fullWidth
                                          size="small"
                                          placeholder="매매 사유를 입력하세요 (예: RS 개선 확인, 지지선 반등, ATR 기준 충족)"
                                          value={ns.value}
                                          onChange={(e) =>
                                            setNoteStates((prev) => ({
                                              ...prev,
                                              [entry.id]: {
                                                ...prev[entry.id],
                                                value: e.target.value,
                                              },
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                                              saveNote(entry.id);
                                          }}
                                          disabled={isSaving}
                                          sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem" } }}
                                          autoFocus
                                        />
                                      ) : (
                                        <Typography
                                          variant="caption"
                                          color={currentNote ? "text" : "text.secondary"}
                                          sx={{
                                            display: "block",
                                            cursor: "pointer",
                                            minHeight: 20,
                                          }}
                                          onClick={() => startEditNote(entry)}
                                        >
                                          {currentNote || "클릭하여 사유를 입력하세요"}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                })()}
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
              <Button variant="outlined" color="secondary" onClick={handleCloseDetail}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
