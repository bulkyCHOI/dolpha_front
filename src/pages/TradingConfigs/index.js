/**
 * 자동매매 설정 목록 페이지
 * - 사용자별 자동매매 설정 조회 및 표시
 * - 인증된 사용자만 접근 가능
 */

import { useState, useEffect, useRef } from "react";

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";

// @mui icons
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import FlashOnIcon from "@mui/icons-material/FlashOn";

// Enhanced components
import FullWidthContainer from "components/FullWidthContainer";
import EnhancedDataTable from "components/EnhancedDataTable";
import ResponsiveTableWrapper from "components/ResponsiveTableWrapper";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import AppHeader from "components/AppHeader";
import AppFooter from "components/AppFooter";
import ChartbookHeader from "components/ChartbookHeader/ChartbookHeader";

// Routes and context
import routes from "routes";
import { useAuth } from "contexts/AuthContext";

// Notification system
import { useNotification } from "components/NotificationSystem/NotificationSystem";

// Trading Config Modal
import TradingConfigModal from "components/TradingConfigModal/TradingConfigModal";

// TradingView 차트 위젯
import StockChartModal from "components/StockChartModal";

// 매매동향 모달
import InvestorFlowModal from "components/InvestorFlowModal";
import { COLORS, onColor } from "constants/styles";

// Remove the old styled component - now using EnhancedDataTable

// Utility functions
const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
};

const formatTradingValue = (value, tradingMode, field) => {
  if (!value) return "-";

  // Turtle 모드에서 손절가, 익절가는 ATR 단위 (최대손실은 항상 %)
  if (
    (tradingMode === "atr" || tradingMode === "turtle") &&
    ["stop_loss", "take_profit"].includes(field)
  ) {
    return `${value} ATR`;
  }

  // 그 외에는 % 단위
  return `${value}%`;
};

const THEME_SURGE_STRATEGY = "theme_surge";

// 등록 시각(ISO) → KST 기준 YYYY-MM-DD. 급등테마주 후보는 등록일 단위로 묶어 본다.
const toKstDateKey = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
};

const formatKstDateLabel = (dateKey) => {
  if (!dateKey) return "-";
  const [year, month, day] = dateKey.split("-");
  const weekday = new Date(`${dateKey}T00:00:00+09:00`).toLocaleDateString("ko-KR", {
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
  return `${year}년 ${Number(month)}월 ${Number(day)}일 (${weekday})`;
};

const getStrategyTypeLabel = (strategyType) => {
  const labels = {
    mtt: "MTT",
    weekly_high: "52주 신고가",
    fifty_day_high: "50일 신고가",
    daily_top50: "일일 Top50",
    theme_surge: "급등테마주",
  };
  return labels[strategyType] || strategyType;
};

const getStrategyTypeColor = (strategyType) => {
  // 붉은색 계열로 전략 종류별 구분 - 차이를 극대화
  const colors = {
    mtt: COLORS.UP, // 진한 다크 레드 - 주력 전략 (Minervini)
    weekly_high: COLORS.CHARTBOOK.BAND_MID, // 딥 오렌지 - 장기 전략 (52주 신고가)
    fifty_day_high: COLORS.CHARTBOOK.BAND_MID, // 밝은 오렌지 - 중기 전략 (50일 신고가)
    daily_top50: COLORS.CHARTBOOK.BAND_MID, // 엠버(황금색) - 단기 전략 (일일 Top50)
    theme_surge: COLORS.STRATEGY_THEME_SURGE, // 급등테마주 전략
  };
  return colors[strategyType] || COLORS.TEXT_MUTED;
};

const getTradingModeLabel = (tradingMode) => {
  const labels = {
    manual: "Manual",
    turtle: "Turtle",
    atr: "Turtle(ATR)",
  };
  return labels[tradingMode] || tradingMode;
};

const getTradingModeColor = (tradingMode) => {
  // 푸른색 계열로 매매모드 구분 - 차이를 극대화
  const colors = {
    manual: COLORS.DOWN, // 밝은 파란색 - 수동 매매
    turtle: COLORS.DOWN, // 진한 네이비 블루 - 터틀 매매
    atr: COLORS.DOWN, // 진한 네이비 블루 - 자동 매매 (Turtle)
  };
  return colors[tradingMode] || COLORS.TEXT_MUTED;
};

// Chartbook: 숫자·티커·칩 라벨용 모노 스택
const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";

// 수익률 계산 함수
const calculateProfitRate = (entryPrice, currentPrice) => {
  if (!entryPrice || !currentPrice) return null;
  const rate = ((currentPrice - entryPrice) / entryPrice) * 100;
  return rate;
};

// 거래 상태 정보 로드 함수는 컴포넌트 내부로 이동

export default function TradingConfigs() {
  const { user, authenticatedFetch } = useAuth();
  const { showSnackbar, NotificationComponent } = useNotification();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTradingConfigs, setAllTradingConfigs] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: 일반 전략, 1: 급등테마주
  const [selectedThemeDate, setSelectedThemeDate] = useState(""); // 급등테마주 탭에서 보고 있는 등록일
  const allTradingConfigsRef = useRef([]);
  const [currentPrices, setCurrentPrices] = useState({}); // 종목별 현재가 저장
  const [tradingStatus, setTradingStatus] = useState({}); // 거래 상태 정보 저장
  const [favoriteCodes, setFavoriteCodes] = useState(new Set()); // 즐겨찾기 종목코드 집합

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // TradingView 차트 모달 state
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalStock, setChartModalStock] = useState(null);

  // 매매동향 모달 state
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [flowModalStock, setFlowModalStock] = useState(null);

  // 강제청산 모달 state
  const [forceExitModalOpen, setForceExitModalOpen] = useState(false);
  const [selectedRowForForceExit, setSelectedRowForForceExit] = useState(null);
  const [forceExitLoading, setForceExitLoading] = useState(false);

  // 거래 상태 정보 로드 함수
  const loadTradingStatus = async () => {
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/trading-status`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTradingStatus(result.data);
          showSnackbar("거래 상태 정보를 업데이트했습니다.", "success");
        } else {
          console.warn("거래 상태 조회 실패:", result.message);
          setTradingStatus({});
        }
      } else {
        console.warn("거래 상태 API 응답 오류:", response.status);
        setTradingStatus({});
      }
    } catch (error) {
      console.warn("거래 상태 조회 오류:", error.message);
      setTradingStatus({});
    }
  };

  // KIS 실계좌 기준 잘못 비활성화된 종목 복구
  const handleRecoverPositions = async () => {
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/reconcile-positions`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        const count = result.recovered?.length ?? 0;
        const peakCount = result.peak_fixed?.length ?? 0;
        const total = count + peakCount;
        let msg;
        if (count > 0 && peakCount > 0) {
          msg = `${count}개 종목 복구, ${peakCount}개 고점 보정 완료 — 새로고침합니다.`;
        } else if (count > 0) {
          msg = `${count}개 종목 복구 완료 — 새로고침합니다.`;
        } else if (peakCount > 0) {
          msg = `${peakCount}개 종목 고점 보정 완료 — 새로고침합니다.`;
        } else {
          msg = "복구할 항목 없음 (KIS 보유 종목과 DB가 일치합니다)";
        }
        showSnackbar(msg, total > 0 ? "success" : "info");
        if (total > 0) loadAllTradingConfigs();
      } else {
        showSnackbar(`복구 실패: ${result.error}`, "error");
      }
    } catch (err) {
      showSnackbar(`복구 요청 오류: ${err.message}`, "error");
    }
  };

  // 즐겨찾기 목록 로드
  const loadFavorites = async () => {
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/favorites`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFavoriteCodes(new Set((data.favorites || []).map((f) => f.stock_code)));
        }
      }
    } catch (err) {
      console.warn("즐겨찾기 로드 실패:", err.message);
    }
  };

  // 즐겨찾기 토글
  const handleToggleFavorite = async (row) => {
    const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
    const isFav = favoriteCodes.has(row.stock_code);

    try {
      if (isFav) {
        const response = await authenticatedFetch(
          `${apiBaseUrl}/api/mypage/favorites/${row.stock_code}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          setFavoriteCodes((prev) => {
            const next = new Set(prev);
            next.delete(row.stock_code);
            return next;
          });
          showSnackbar(`"${row.stock_name}" 즐겨찾기에서 제거했습니다.`, "info");
        }
      } else {
        const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/favorites`, {
          method: "POST",
          body: JSON.stringify({
            stock_code: row.stock_code,
            stock_name: row.stock_name,
            memo: "",
          }),
        });
        if (response.ok) {
          setFavoriteCodes((prev) => new Set([...prev, row.stock_code]));
          showSnackbar(`"${row.stock_name}" 즐겨찾기에 추가했습니다.`, "success");
        }
      }
    } catch (err) {
      showSnackbar(`즐겨찾기 설정 실패: ${err.message}`, "error");
    }
  };

  // DataTable 컬럼 정의 - widths removed for auto-optimization
  const columns = [
    {
      name: "종목",
      selector: (row) => row.stock_name,
      sortable: true,
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
      name: "전략",
      selector: (row) => row.strategy_type,
      sortable: true,
      cell: (row) => {
        const bgColor = getStrategyTypeColor(row.strategy_type);
        return (
          <Chip
            label={getStrategyTypeLabel(row.strategy_type)}
            variant="outlined"
            size="small"
            sx={{
              fontSize: "0.7rem",
              height: "24px",
              fontWeight: 500,
              fontFamily: MONO_STACK,
              backgroundColor: "transparent",
              border: `1px solid ${bgColor}`,
              borderRadius: "2px",
              "& .MuiChip-label": {
                padding: "0 8px",
                color: `${bgColor} !important`,
              },
            }}
          />
        );
      },
    },
    {
      name: "매매모드",
      selector: (row) => row.trading_mode,
      sortable: true,
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
              fontFamily: MONO_STACK,
              backgroundColor: "transparent",
              border: `1px solid ${bgColor}`,
              borderRadius: "2px",
              "& .MuiChip-label": {
                padding: "0 8px",
                color: `${bgColor} !important`,
              },
            }}
          />
        );
      },
    },
    {
      name: "상태",
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => (
        <Chip
          label={row.is_active ? "활성" : "비활성"}
          variant="outlined"
          size="small"
          sx={{
            fontSize: "0.7rem",
            height: "24px",
            fontFamily: MONO_STACK,
            backgroundColor: "transparent",
            border: `1px solid ${row.is_active ? COLORS.CHARTBOOK.BAND_WEAK : COLORS.CHARTBOOK.SECONDARY}`,
            borderRadius: "2px",
            "& .MuiChip-label": {
              padding: "0 8px",
              color: `${row.is_active ? COLORS.CHARTBOOK.BAND_WEAK : COLORS.CHARTBOOK.SECONDARY} !important`,
            },
          }}
        />
      ),
    },
    {
      name: "손절",
      selector: (row) => row.stop_loss,
      sortable: true,
      cell: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.85rem",
            fontWeight: row.stop_loss ? "bold" : "regular",
            color: row.stop_loss ? COLORS.CHARTBOOK.INK : "text.secondary",
          }}
        >
          {formatTradingValue(row.stop_loss, row.trading_mode, "stop_loss")}
        </Typography>
      ),
    },
    {
      name: "익절",
      selector: (row) => row.take_profit,
      sortable: true,
      cell: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.85rem",
            fontWeight: row.take_profit ? "bold" : "regular",
            color: row.take_profit ? COLORS.CHARTBOOK.INK : "text.secondary",
          }}
        >
          {formatTradingValue(row.take_profit, row.trading_mode, "take_profit")}
        </Typography>
      ),
    },
    {
      name: "최대손실",
      selector: (row) => row.max_loss,
      sortable: true,
      cell: (row) => (
        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
          {formatTradingValue(row.max_loss, row.trading_mode, "max_loss")}
        </Typography>
      ),
    },
    {
      name: "진입횟수",
      selector: (row) => tradingStatus[row.stock_code]?.actual_entries ?? 0,
      sortable: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const totalPossible = (row.pyramiding_count ?? 0) + 1;
        const actualEntries = status?.actual_entries || 0;
        const positionSum = status?.position_sum || 0;

        let chipColor = COLORS.CHARTBOOK.SECONDARY;
        if (actualEntries > 0) {
          if (positionSum >= 80) chipColor = COLORS.UP;
          else if (positionSum >= 50) chipColor = COLORS.CHARTBOOK.BAND_MID;
          else if (positionSum >= 25) chipColor = COLORS.CHARTBOOK.PANEL_BLUE;
        }

        return (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.8rem", fontWeight: "bold", lineHeight: 1.3 }}
            >
              {actualEntries}/{totalPossible}회
            </Typography>
            {actualEntries > 0 && (
              <Chip
                label={`${positionSum.toFixed(0)}%`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.65rem",
                  height: "18px",
                  minWidth: "44px",
                  fontWeight: 500,
                  fontFamily: MONO_STACK,
                  backgroundColor: "transparent",
                  border: `1px solid ${chipColor}`,
                  borderRadius: "2px",
                  "& .MuiChip-label": { padding: "0 6px", color: `${chipColor} !important` },
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      name: "진입가",
      selector: (row) => row.entry_point,
      sortable: true,
      cell: (row) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.entry_point ? `${formatCurrency(row.entry_point)}원` : "-"}
        </Typography>
      ),
    },
    {
      name: "보유정보",
      selector: (row) => tradingStatus[row.stock_code]?.total_quantity ?? 0,
      sortable: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const avgPrice = status?.avg_price || 0;
        const quantity = status?.total_quantity || 0;
        const holdingAmount = status?.holding_amount || 0;

        return (
          <Box>
            {/* 첫 번째 줄: 보유금액 */}
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{
                fontSize: "0.8rem",
                color: COLORS.CHARTBOOK.INK,
                lineHeight: 1.2,
              }}
            >
              {holdingAmount > 0 ? `${formatCurrency(Math.round(holdingAmount))}원` : "-"}
            </Typography>

            {/* 두 번째 줄: 수량 정보 */}
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: "text.secondary",
                lineHeight: 1.2,
              }}
            >
              {quantity > 0 ? `${formatCurrency(quantity)}주` : "-"}
              {avgPrice > 0 && ` @ ${formatCurrency(Math.round(avgPrice))}원`}
            </Typography>
          </Box>
        );
      },
    },
    {
      name: "현재가",
      selector: (row) => currentPrices[row.stock_code]?.price ?? 0,
      sortable: true,
      cell: (row) => {
        const currentPrice = currentPrices[row.stock_code];
        const change = currentPrice?.change || 0;
        const changePercent = currentPrice?.changePercent || 0;
        const isUp = change > 0;
        const isDown = change < 0;

        return (
          <Tooltip
            title={
              currentPrice
                ? `데이터 소스: ${currentPrice.source || "unknown"}`
                : currentPrice === null
                ? "현재가 조회 실패"
                : "주가 조회 중..."
            }
            arrow
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: isUp ? COLORS.UP : isDown ? COLORS.DOWN : "text.primary",
                  lineHeight: 1.3,
                }}
              >
                {currentPrice
                  ? `${formatCurrency(currentPrice.price)}원`
                  : currentPrice === null
                  ? "-"
                  : "조회중..."}
              </Typography>
              {currentPrice && (isUp || isDown) && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.68rem",
                    color: isUp ? COLORS.UP : COLORS.DOWN,
                    lineHeight: 1.2,
                  }}
                >
                  {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
                  {formatCurrency(Math.round(change))} ({isUp ? "+" : ""}
                  {changePercent.toFixed(2)}%)
                </Typography>
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      name: "고점/낙폭",
      selector: (row) => row.trailing_stop_peak_price ?? 0,
      sortable: true,
      cell: (row) => {
        const peak = row.trailing_stop_peak_price;
        const currentPrice = currentPrices[row.stock_code]?.price;

        if (!peak) {
          return (
            <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              -
            </Typography>
          );
        }

        const dropPct = currentPrice ? ((currentPrice - peak) / peak) * 100 : null;
        const isTurtleMode = row.trading_mode === "turtle" || row.trading_mode === "atr";
        const atr = tradingStatus[row.stock_code]?.atr;
        const dropAtr =
          isTurtleMode && atr && atr > 0 && currentPrice ? (currentPrice - peak) / atr : null;

        return (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.8rem", fontWeight: "bold", lineHeight: 1.3 }}
            >
              {formatCurrency(Math.round(peak))}원
            </Typography>
            {dropPct !== null && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.68rem",
                  color: dropPct < 0 ? COLORS.DOWN : COLORS.UP,
                  lineHeight: 1.2,
                }}
              >
                {dropPct >= 0 ? "▲" : "▼"} {dropPct >= 0 ? "+" : ""}
                {dropPct.toFixed(1)}%
              </Typography>
            )}
            {dropAtr !== null && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: dropAtr < 0 ? COLORS.DOWN : COLORS.UP,
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                {dropAtr >= 0 ? "▲" : "▼"} {dropAtr >= 0 ? "+" : ""}
                {dropAtr.toFixed(2)} ATR
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      name: "평가손익",
      selector: (row) => {
        const status = tradingStatus[row.stock_code];
        const currentPrice = currentPrices[row.stock_code];
        const avgPrice = status?.avg_price || 0;
        const quantity = status?.total_quantity || 0;

        if (!avgPrice || !currentPrice || !quantity) return 0;
        return (currentPrice.price - avgPrice) * quantity;
      },
      sortable: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const currentPrice = currentPrices[row.stock_code];
        const avgPrice = status?.avg_price || 0;
        const quantity = status?.total_quantity || 0;

        if (!avgPrice || !currentPrice || !quantity) {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                -
              </Typography>
            </Box>
          );
        }

        const profitLoss = (currentPrice.price - avgPrice) * quantity;
        const profitRate = ((currentPrice.price - avgPrice) / avgPrice) * 100;
        const isProfit = profitLoss >= 0;

        return (
          <Box>
            {/* 첫 번째 줄: 손익금액 */}
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{
                fontSize: "0.8rem",
                color: isProfit ? COLORS.UP : COLORS.DOWN,
                lineHeight: 1.2,
              }}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(Math.round(profitLoss))}원
            </Typography>

            {/* 두 번째 줄: 손익률 */}
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: isProfit ? COLORS.UP : COLORS.DOWN,
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {isProfit ? "+" : ""}
              {profitRate.toFixed(2)}%
            </Typography>
          </Box>
        );
      },
    },
    {
      name: "생성일",
      selector: (row) => row.created_at,
      sortable: true,
      cell: (row) => (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
          {new Date(row.created_at).toLocaleDateString("ko-KR", {
            year: "2-digit",
            month: "short",
            day: "numeric",
          })}
        </Typography>
      ),
    },
    {
      name: "액션",
      width: "190px",
      cell: (row) => {
        const isFav = favoriteCodes.has(row.stock_code);
        return (
          <Box display="flex" justifyContent="center" gap={0.5}>
            <Tooltip title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}>
              <IconButton
                size="small"
                sx={{ padding: "4px", color: isFav ? "#f5a623" : "action.disabled" }}
                onClick={() => handleToggleFavorite(row)}
              >
                {isFav ? (
                  <StarIcon sx={{ fontSize: "16px" }} />
                ) : (
                  <StarBorderIcon sx={{ fontSize: "16px" }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="강제청산 (시장가 즉시 매도)">
              <IconButton
                size="small"
                color="error"
                sx={{
                  padding: "4px",
                  "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                }}
                onClick={() => handleOpenForceExitModal(row)}
              >
                <FlashOnIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="상세 보기">
              <IconButton
                size="small"
                color="info"
                sx={{ padding: "4px" }}
                onClick={() => handleOpenModal(row)}
              >
                <VisibilityIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="TradingView 차트">
              <IconButton
                size="small"
                color="success"
                sx={{ padding: "4px" }}
                onClick={() => {
                  setChartModalStock(row);
                  setChartModalOpen(true);
                }}
              >
                <ShowChartIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="매매동향">
              <IconButton
                size="small"
                color="secondary"
                sx={{ padding: "4px" }}
                onClick={() => {
                  setFlowModalStock(row);
                  setFlowModalOpen(true);
                }}
              >
                <TrendingUpIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="삭제">
              <IconButton
                size="small"
                color="error"
                sx={{ padding: "4px" }}
                onClick={() =>
                  handleDeleteConfig(row.stock_code, row.stock_name, row.strategy_type)
                }
              >
                <DeleteIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // 모든 전략 타입의 설정을 가져오는 함수
  const loadAllTradingConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      // 모든 전략 타입의 설정을 가져오기 (strategy_type 파라미터 없이)
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/trading-configs`);

      if (response.ok) {
        const configs = await response.json();
        setAllTradingConfigs(configs);
        showSnackbar(`${configs.length}개의 자동매매 설정을 불러왔습니다.`, "success");

        // 현재가 및 거래 상태 조회 (비동기적으로 실행)
        if (configs.length > 0) {
          loadCurrentPrices(configs);
          loadTradingStatus(); // 거래 상태 정보 로드
        }
      } else {
        setAllTradingConfigs([]);
        showSnackbar("자동매매 목록 조회에 실패했습니다.", "error");
      }
    } catch (err) {
      setError(err.message);
      setAllTradingConfigs([]);
      showSnackbar("자동매매 설정을 불러오는데 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 모든 종목의 현재가를 일괄 조회 (서버에서 순차 처리하여 KIS Rate Limit 대응)
  const loadCurrentPrices = async (configs) => {
    if (!configs || configs.length === 0) return;

    const uniqueStockCodes = [...new Set(configs.map((c) => c.stock_code))];
    const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

    try {
      const response = await authenticatedFetch(`${apiBaseUrl}/api/stock-prices/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_codes: uniqueStockCodes }),
      });

      if (!response.ok) {
        showSnackbar("현재가 조회에 실패했습니다.", "error");
        return;
      }

      const data = await response.json();
      const pricesMap = {};
      let successCount = 0;
      let errorCount = 0;

      Object.entries(data.prices).forEach(([stockCode, result]) => {
        if (result.success) {
          pricesMap[stockCode] = {
            price: result.price,
            change: result.change,
            changePercent: result.changePercent,
            source: result.source,
            marketState: result.market_state,
          };
          successCount++;
        } else {
          pricesMap[stockCode] = null;
          errorCount++;
        }
      });

      setCurrentPrices(pricesMap);

      if (successCount > 0) {
        showSnackbar(`${successCount}개 종목의 현재가를 업데이트했습니다.`, "success");
      }
      if (errorCount > 0) {
        showSnackbar(`${errorCount}개 종목의 현재가 조회에 실패했습니다.`, "warning");
      }
    } catch (error) {
      showSnackbar(`현재가 조회 오류: ${error.message}`, "error");
    }
  };

  // 모달 열기 핸들러
  const handleOpenModal = (config) => {
    setSelectedConfig(config);
    setModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedConfig(null);
  };

  // 모달에서 설정 저장 핸들러
  const handleModalSave = async (updatedConfig) => {
    setModalLoading(true);
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      // API 요청을 위한 데이터 구성
      const requestData = {
        stock_code: updatedConfig.stock_code,
        stock_name: updatedConfig.stock_name, // 누락되었던 필수 필드 추가
        strategy_type: updatedConfig.strategy_type,
        trading_mode: updatedConfig.trading_mode,
        entry_point: parseFloat(updatedConfig.entry_point) || null,
        max_loss: parseFloat(updatedConfig.max_loss) || null,
        stop_loss: parseFloat(updatedConfig.stop_loss) || null,
        take_profit: parseFloat(updatedConfig.take_profit) || null,
        pyramiding_count: parseInt(updatedConfig.pyramiding_count) || 0,
        pyramiding_entries: updatedConfig.pyramiding_entries || [],
        positions: updatedConfig.positions || [100],
        is_active: updatedConfig.is_active,
      };

      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/trading-configs`, {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();

        // 로컬 상태 업데이트
        setAllTradingConfigs((prev) =>
          prev.map((config) =>
            config.stock_code === updatedConfig.stock_code &&
            config.strategy_type === updatedConfig.strategy_type
              ? { ...config, ...updatedConfig }
              : config
          )
        );

        showSnackbar("설정이 성공적으로 저장되었습니다.", "success");
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      showSnackbar(`저장 실패: ${error.message}`, "error");
      return false;
    } finally {
      setModalLoading(false);
    }
  };

  // 설정 삭제 함수
  const handleDeleteConfig = async (stockCode, stockName, strategyType) => {
    const isConfirmed = window.confirm(
      `${stockName}(${stockCode}) - ${getStrategyTypeLabel(strategyType)} 설정을 삭제하시겠습니까?`
    );

    if (!isConfirmed) return;

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const deleteUrl = `${apiBaseUrl}/api/mypage/trading-configs/stock/${stockCode}?strategy_type=${strategyType}`;

      const response = await authenticatedFetch(deleteUrl, {
        method: "DELETE",
      });

      if (response.ok) {
        // 로컬 상태에서 삭제
        setAllTradingConfigs((prev) =>
          prev.filter(
            (config) => !(config.stock_code === stockCode && config.strategy_type === strategyType)
          )
        );
        showSnackbar(`${stockName}(${stockCode}) 자동매매 설정이 삭제되었습니다.`, "success");
      } else {
        throw new Error("삭제 요청에 실패했습니다.");
      }
    } catch (error) {
      showSnackbar(`삭제 실패: ${error.message}`, "error");
    }
  };

  // 강제청산 모달 열기 핸들러
  const handleOpenForceExitModal = (row) => {
    setSelectedRowForForceExit(row);
    setForceExitModalOpen(true);
  };

  // 강제청산 모달 닫기 핸들러
  const handleCloseForceExitModal = () => {
    if (forceExitLoading) return;
    setForceExitModalOpen(false);
    setSelectedRowForForceExit(null);
  };

  // 강제청산 실행 핸들러
  const handleConfirmForceExit = async () => {
    if (!selectedRowForForceExit) return;
    setForceExitLoading(true);
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/mypage/trading-configs/force-exit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stock_code: selectedRowForForceExit.stock_code,
            strategy_type: selectedRowForForceExit.strategy_type,
          }),
        }
      );
      const result = await response.json();
      if (response.ok && (result.status === "OK" || result.success)) {
        showSnackbar(result.message || "강제청산 주문이 완료되었습니다.", "success");
        loadAllTradingConfigs();
        loadTradingStatus();
        handleCloseForceExitModal();
      } else {
        showSnackbar(result.message || result.error || "강제청산 처리에 실패했습니다.", "error");
      }
    } catch (err) {
      showSnackbar(`강제청산 오류: ${err.message}`, "error");
    } finally {
      setForceExitLoading(false);
    }
  };

  // 급등테마주 후보의 등록일 목록 (과거 → 최신)
  const themeSurgeDates = [
    ...new Set(
      allTradingConfigs
        .filter((config) => config.strategy_type === THEME_SURGE_STRATEGY)
        .map((config) => toKstDateKey(config.created_at))
        .filter(Boolean)
    ),
  ].sort();

  // 보고 있던 날짜가 사라지면 가장 최근 날짜로 되돌린다
  useEffect(() => {
    if (themeSurgeDates.length === 0) {
      setSelectedThemeDate("");
      return;
    }
    if (!themeSurgeDates.includes(selectedThemeDate)) {
      setSelectedThemeDate(themeSurgeDates[themeSurgeDates.length - 1]);
    }
  }, [themeSurgeDates.join(","), selectedThemeDate]);

  // 선택한 등록일의 후보 설정 + 1분봉 + 진입 판정을 한 번에 삭제
  const handleDeleteThemeDate = async () => {
    if (!selectedThemeDate) return;

    const targetCount = allTradingConfigs.filter(
      (config) =>
        config.strategy_type === THEME_SURGE_STRATEGY &&
        toKstDateKey(config.created_at) === selectedThemeDate
    ).length;

    const isConfirmed = window.confirm(
      `${formatKstDateLabel(
        selectedThemeDate
      )}의 급등테마주 후보 ${targetCount}건을 삭제합니다.\n` +
        "해당 종목의 그날 1분봉과 진입 조건 판정 이력도 함께 삭제되어 차트를 다시 볼 수 없습니다.\n" +
        "(보유 중인 포지션의 설정은 청산 관리를 위해 남습니다)\n\n계속할까요?"
    );
    if (!isConfirmed) return;

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/theme-surge/candidates?date=${selectedThemeDate}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "삭제 요청에 실패했습니다.");
      }

      const { deleted_configs: deleted, kept_positions: kept } = result.data;
      showSnackbar(
        `${formatKstDateLabel(selectedThemeDate)} 후보 ${deleted}건을 삭제했습니다.` +
          (kept > 0 ? ` (보유 중 ${kept}건은 유지)` : ""),
        "success"
      );
      await loadAllTradingConfigs();
    } catch (err) {
      showSnackbar(`삭제 실패: ${err.message}`, "error");
    }
  };

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadAllTradingConfigs();
      loadFavorites();
    }
  }, [user]);

  // allTradingConfigs ref 동기화 (interval 콜백이 항상 최신 값을 참조하도록)
  useEffect(() => {
    allTradingConfigsRef.current = allTradingConfigs;
  }, [allTradingConfigs]);

  // 현재가 + 설정(고점 등) 실시간 업데이트 (5분마다) - 최초 1회만 등록
  useEffect(() => {
    const interval = setInterval(() => {
      if (allTradingConfigsRef.current.length > 0) {
        loadCurrentPrices(allTradingConfigsRef.current);
        loadAllTradingConfigs();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <Box component="section" py={6}>
        <FullWidthContainer>
          <Alert severity="warning" sx={{ mb: 3 }}>
            로그인이 필요한 페이지입니다. 로그인 후 이용해주세요.
          </Alert>
        </FullWidthContainer>
      </Box>
    );
  }

  // 탭별 설정 분리 (급등테마주는 별도 탭으로 구분)
  const themeSurgeConfigs = allTradingConfigs.filter(
    (config) => config.strategy_type === THEME_SURGE_STRATEGY
  );
  const generalConfigs = allTradingConfigs.filter(
    (config) => config.strategy_type !== THEME_SURGE_STRATEGY
  );
  // 급등테마주는 등록일별로 쌓이므로 선택한 날짜의 후보만 표시한다
  const themeSurgeConfigsOfDate = themeSurgeConfigs.filter(
    (config) => toKstDateKey(config.created_at) === selectedThemeDate
  );
  const displayedConfigs = activeTab === 1 ? themeSurgeConfigsOfDate : generalConfigs;

  // 선택 탭을 채우는 강조색 (탭별 전략색)
  const activeTabColor = COLORS.CHARTBOOK.SELECTED_BG;

  const themeDateIndex = themeSurgeDates.indexOf(selectedThemeDate);
  const hasPrevThemeDate = themeDateIndex > 0;
  const hasNextThemeDate = themeDateIndex >= 0 && themeDateIndex < themeSurgeDates.length - 1;
  const moveThemeDate = (step) => {
    const next = themeSurgeDates[themeDateIndex + step];
    if (next) setSelectedThemeDate(next);
  };

  return (
    <>
      <AppHeader routes={routes} sticky />

      <Box sx={{ height: "80px", flexShrink: 0, backgroundColor: COLORS.CHARTBOOK.GROUND }} />
      <ChartbookHeader
        strategyName="자동매매 설정"
        date={new Date().toLocaleDateString("ko-KR")}
        candidateCount={displayedConfigs.length}
      />

      <Box component="section" sx={{ minHeight: "80vh", pt: 4, pb: 4 }}>
        <FullWidthContainer>
          {/* 페이지 헤더와 투자 현황 요약을 같은 줄에 배치 */}
          {!loading && !error && displayedConfigs.length > 0 ? (
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
                  자동매매 설정 목록
                </Typography>
              </Box>

              {/* 투자 현황 요약 */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" flexDirection="row" gap={1.5}>
                  {/* 투자 대상 */}
                  <Card sx={{ flex: 1, minHeight: "80px", bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        투자 대상
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ mt: 0.5 }}
                      >
                        {displayedConfigs.length}개
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 투자 종목 수 */}
                  <Card sx={{ flex: 1, minHeight: "80px", bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        투자 종목
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ mt: 0.5 }}
                      >
                        {(() => {
                          const investedCount = displayedConfigs.filter((config) => {
                            const status = tradingStatus[config.stock_code];
                            const avgPrice = status?.avg_price || 0;
                            const quantity = status?.total_quantity || 0;
                            return avgPrice > 0 && quantity > 0;
                          }).length;
                          return `${investedCount}개`;
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 투자금 합계 */}
                  <Card sx={{ flex: 1, minHeight: "80px", bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        투자금 합계
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ mt: 0.5 }}
                      >
                        {(() => {
                          const totalInvestment = displayedConfigs.reduce((sum, config) => {
                            const status = tradingStatus[config.stock_code];
                            const avgPrice = status?.avg_price || 0;
                            const quantity = status?.total_quantity || 0;
                            return sum + avgPrice * quantity;
                          }, 0);
                          return `${formatCurrency(Math.round(totalInvestment))}원`;
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 평가손익 합계 */}
                  <Card sx={{ flex: 1, minHeight: "80px", bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        평가손익 합계
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mt: 0.5,
                          color: (() => {
                            const totalProfitLoss = displayedConfigs.reduce((sum, config) => {
                              const status = tradingStatus[config.stock_code];
                              const currentPrice = currentPrices[config.stock_code];
                              const avgPrice = status?.avg_price || 0;
                              const quantity = status?.total_quantity || 0;
                              if (!avgPrice || !currentPrice || !quantity) return sum;
                              return sum + (currentPrice.price - avgPrice) * quantity;
                            }, 0);
                            return totalProfitLoss >= 0 ? COLORS.UP : COLORS.DOWN;
                          })(),
                        }}
                      >
                        {(() => {
                          const totalProfitLoss = displayedConfigs.reduce((sum, config) => {
                            const status = tradingStatus[config.stock_code];
                            const currentPrice = currentPrices[config.stock_code];
                            const avgPrice = status?.avg_price || 0;
                            const quantity = status?.total_quantity || 0;
                            if (!avgPrice || !currentPrice || !quantity) return sum;
                            return sum + (currentPrice.price - avgPrice) * quantity;
                          }, 0);
                          return `${totalProfitLoss >= 0 ? "+" : ""}${formatCurrency(
                            Math.round(totalProfitLoss)
                          )}원`;
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* 평균 손익률 */}
                  <Card sx={{ flex: 1, minHeight: "80px", bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center", "&:last-child": { pb: 1.5 } }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        평균 손익률
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mt: 0.5,
                          color: (() => {
                            let totalWeight = 0;
                            let totalWeightedReturn = 0;

                            displayedConfigs.forEach((config) => {
                              const status = tradingStatus[config.stock_code];
                              const currentPrice = currentPrices[config.stock_code];
                              const avgPrice = status?.avg_price || 0;
                              const quantity = status?.total_quantity || 0;

                              if (avgPrice && currentPrice && quantity) {
                                const weight = avgPrice * quantity;
                                const returnRate =
                                  ((currentPrice.price - avgPrice) / avgPrice) * 100;
                                totalWeight += weight;
                                totalWeightedReturn += returnRate * weight;
                              }
                            });

                            const avgReturn =
                              totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
                            return avgReturn >= 0 ? COLORS.UP : COLORS.DOWN;
                          })(),
                        }}
                      >
                        {(() => {
                          let totalWeight = 0;
                          let totalWeightedReturn = 0;

                          displayedConfigs.forEach((config) => {
                            const status = tradingStatus[config.stock_code];
                            const currentPrice = currentPrices[config.stock_code];
                            const avgPrice = status?.avg_price || 0;
                            const quantity = status?.total_quantity || 0;

                            if (avgPrice && currentPrice && quantity) {
                              const weight = avgPrice * quantity; // 투자금액
                              const returnRate = ((currentPrice.price - avgPrice) / avgPrice) * 100;
                              totalWeight += weight;
                              totalWeightedReturn += returnRate * weight;
                            }
                          });

                          const avgReturn = totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
                          return `${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(2)}%`;
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box mb={4}>
              <Typography variant="h3" color="text.primary" fontWeight="bold">
                자동매매 설정 목록
              </Typography>
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

          {/* 전략 구분 탭 */}
          {!loading && !error && (
            <Box mb={2}>
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                textColor="inherit"
                sx={{
                  backgroundColor: COLORS.CHARTBOOK.GROUND,
                  borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                  "& .MuiTab-root": {
                    fontWeight: 600,
                    textTransform: "none",
                    color: COLORS.TEXT_SECONDARY,
                  },
                  // 선택 탭은 잉크 반전 면으로 채운다 (앱 전역 선택 표시와 통일).
                  // 밑줄 인디케이터는 채운 면과 중복이라 감춘다.
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .Mui-selected": {
                    backgroundColor: `${activeTabColor} !important`,
                    color: `${COLORS.CHARTBOOK.SELECTED_INK} !important`,
                  },
                }}
              >
                <Tab label={`일반 전략 (${generalConfigs.length})`} />
                <Tab label={`급등테마주 (${themeSurgeConfigs.length})`} />
              </Tabs>

              {/* 급등테마주 등록일 네비게이터 — 후보는 날짜별로 쌓이므로 하루씩 넘겨 본다 */}
              {activeTab === 1 && themeSurgeDates.length > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                  mt={2}
                  flexWrap="wrap"
                >
                  <IconButton
                    size="small"
                    onClick={() => moveThemeDate(-1)}
                    disabled={!hasPrevThemeDate}
                    aria-label="이전 등록일"
                  >
                    <ChevronLeftIcon />
                  </IconButton>

                  <Box textAlign="center" sx={{ minWidth: 200 }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ color: COLORS.STRATEGY_THEME_SURGE }}
                    >
                      {formatKstDateLabel(selectedThemeDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" opacity={0.7}>
                      후보 {themeSurgeConfigsOfDate.length}건 · 전체 {themeSurgeDates.length}일 중{" "}
                      {themeDateIndex + 1}번째
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => moveThemeDate(1)}
                    disabled={!hasNextThemeDate}
                    aria-label="다음 등록일"
                  >
                    <ChevronRightIcon />
                  </IconButton>

                  <Tooltip title="이 날짜의 후보 설정·1분봉·진입 판정을 모두 삭제합니다">
                    <span>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteSweepIcon />}
                        onClick={handleDeleteThemeDate}
                        disabled={!selectedThemeDate}
                        sx={{ ml: 1 }}
                      >
                        이 날짜 삭제
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}

          {/* 자동매매 설정 DataTable */}
          {!loading && !error && (
            <Box>
              {displayedConfigs.length === 0 ? (
                <Card sx={{ bgcolor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, boxShadow: "none" }}>
                  <CardContent>
                    <Box textAlign="center" py={6}>
                      <SettingsIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" mb={2}>
                        {activeTab === 1
                          ? "설정된 급등테마주 자동매매가 없습니다"
                          : "설정된 자동매매가 없습니다"}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" opacity={0.7} mb={3}>
                        {activeTab === 1
                          ? "아직 설정된 급등테마주 전략이 없습니다."
                          : "아직 설정된 자동매매 전략이 없습니다."}
                      </Typography>
                      <Button variant="outlined" color="info">
                        자동매매 설정하기
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveTableWrapper>
                  <EnhancedDataTable
                    columns={columns}
                    data={displayedConfigs}
                    autoOptimizeColumns={true}
                  />
                </ResponsiveTableWrapper>
              )}
            </Box>
          )}

          {/* 새로고침 버튼 */}
          {!loading && (
            <Box
              textAlign="center"
              mt={4}
              display="flex"
              justifyContent="center"
              gap={2}
              flexWrap="wrap"
            >
              <Button variant="outlined" color="info" onClick={loadAllTradingConfigs}>
                전체 새로고침
              </Button>
              {allTradingConfigs.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => loadCurrentPrices(allTradingConfigs)}
                  >
                    현재가 업데이트
                  </Button>
                  <Button variant="outlined" color="warning" onClick={loadTradingStatus}>
                    거래상태 업데이트
                  </Button>
                </>
              )}
              <Button variant="outlined" color="error" onClick={handleRecoverPositions}>
                포지션 복구 (KIS 대조)
              </Button>
            </Box>
          )}
        </FullWidthContainer>
      </Box>

      <AppFooter />
      <NotificationComponent />

      {/* 주식 차트 모달 (일봉 + 분봉) */}
      <StockChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        stockCode={chartModalStock?.stock_code}
        stockName={chartModalStock?.stock_name}
      />

      {/* 매매동향 모달 */}
      <InvestorFlowModal
        open={flowModalOpen}
        onClose={() => setFlowModalOpen(false)}
        stockCode={flowModalStock?.stock_code}
        stockName={flowModalStock?.stock_name}
      />

      {/* 자동매매 설정 상세보기/수정 모달 */}
      <TradingConfigModal
        open={modalOpen}
        onClose={handleCloseModal}
        config={selectedConfig}
        onSave={handleModalSave}
        loading={modalLoading}
      />

      {/* 강제청산 확인 모달 */}
      <Dialog
        open={forceExitModalOpen}
        onClose={handleCloseForceExitModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: COLORS.CHARTBOOK.GROUND,
            border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
            boxShadow: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <FlashOnIcon color="error" />
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            자동매매 강제청산
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 1 }}>
          {selectedRowForForceExit &&
            (() => {
              const row = selectedRowForForceExit;
              const status = tradingStatus[row.stock_code];
              const currentPriceObj = currentPrices[row.stock_code];
              const avgPrice = status?.avg_price || 0;
              const quantity = status?.total_quantity || 0;
              const currentPrice = currentPriceObj?.price || 0;
              const profitLoss =
                avgPrice > 0 && currentPrice > 0 && quantity > 0
                  ? (currentPrice - avgPrice) * quantity
                  : null;
              const profitRate =
                avgPrice > 0 && currentPrice > 0
                  ? ((currentPrice - avgPrice) / avgPrice) * 100
                  : null;
              const isProfit = profitLoss !== null && profitLoss >= 0;

              return (
                <Box display="flex" flexDirection="column" gap={2}>
                  <Alert severity={quantity > 0 ? "warning" : "info"} sx={{ fontSize: "0.85rem" }}>
                    {quantity > 0
                      ? "확인을 누르면 한국투자증권 계좌에 즉시 전량 시장가 매도 주문이 접수되며, 해당 종목의 자동매매 설정이 비활성화됩니다."
                      : "현재 보유 수량이 없습니다. 확인을 누르면 해당 종목의 자동매매 설정이 비활성화됩니다."}
                  </Alert>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "action.hover",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {row.stock_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({row.stock_code})
                        </Typography>
                      </Box>
                      <Chip
                        label={getStrategyTypeLabel(row.strategy_type)}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          fontFamily: MONO_STACK,
                          backgroundColor: "transparent",
                          border: `1px solid ${getStrategyTypeColor(row.strategy_type)}`,
                          borderRadius: "2px",
                          color: `${getStrategyTypeColor(row.strategy_type)} !important`,
                        }}
                      />
                    </Box>

                    <Divider />

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          보유 수량
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {quantity > 0 ? `${formatCurrency(quantity)}주` : "0주 (보유 없음)"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          평균단가
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {avgPrice > 0 ? `${formatCurrency(Math.round(avgPrice))}원` : "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          현재가
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {currentPrice > 0 ? `${formatCurrency(currentPrice)}원` : "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          평가손익
                        </Typography>
                        {profitLoss !== null ? (
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ color: isProfit ? COLORS.UP : COLORS.DOWN }}
                          >
                            {isProfit ? "+" : ""}
                            {formatCurrency(Math.round(profitLoss))}원 ({isProfit ? "+" : ""}
                            {profitRate.toFixed(2)}%)
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCloseForceExitModal}
            disabled={forceExitLoading}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmForceExit}
            disabled={forceExitLoading}
            startIcon={
              forceExitLoading ? <CircularProgress size={16} color="inherit" /> : <FlashOnIcon />
            }
          >
            {forceExitLoading ? "청산 중..." : "즉시 강제청산"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
