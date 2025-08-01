/**
 * 자동매매 설정 목록 페이지
 * - 사용자별 자동매매 설정 조회 및 표시
 * - 인증된 사용자만 접근 가능
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
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";

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

// Routes and context
import routes from "routes";
import footerRoutes from "footer.routes";
import { useAuth } from "contexts/AuthContext";

// Notification system
import { useNotification } from "components/NotificationSystem/NotificationSystem";

// Trading Config Modal
import TradingConfigModal from "components/TradingConfigModal/TradingConfigModal";

// Remove the old styled component - now using EnhancedDataTable

// Utility functions
const formatCurrency = (value) => {
  if (!value) return "-";
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

const getStrategyTypeLabel = (strategyType) => {
  const labels = {
    mtt: "MTT",
    weekly_high: "52주 신고가",
    fifty_day_high: "50일 신고가",
    daily_top50: "일일 Top50",
  };
  return labels[strategyType] || strategyType;
};

const getStrategyTypeColor = (strategyType) => {
  // 붉은색 계열로 전략 종류별 구분 - 차이를 극대화
  const colors = {
    mtt: "#d32f2f", // 진한 다크 레드 - 주력 전략 (Minervini)
    weekly_high: "#ff5722", // 딥 오렌지 - 장기 전략 (52주 신고가)
    fifty_day_high: "#ff9800", // 밝은 오렌지 - 중기 전략 (50일 신고가)
    daily_top50: "#ffc107", // 엠버(황금색) - 단기 전략 (일일 Top50)
  };
  return colors[strategyType] || "#9e9e9e";
};

const getTradingModeLabel = (tradingMode) => {
  const labels = {
    manual: "Manual",
    atr: "Turtle(ATR)",
  };
  return labels[tradingMode] || tradingMode;
};

const getTradingModeColor = (tradingMode) => {
  // 푸른색 계열로 매매모드 구분 - 차이를 극대화
  const colors = {
    manual: "#2196f3", // 밝은 파란색 - 수동 매매
    turtle: "#0d47a1", // 진한 네이비 블루 - 터틀 매매
    atr: "#0d47a1", // 진한 네이비 블루 - 자동 매매 (Turtle)
  };
  return colors[tradingMode] || "#9e9e9e";
};

// 배경색에 따른 텍스트 색상 결정 함수
const getTextColor = (backgroundColor) => {
  // MTT(다크레드)와 Turtle(네이비)만 흰색, 나머지는 검은색
  const darkColors = ["#d32f2f", "#0d47a1"]; // MTT, Turtle/ATR
  return darkColors.includes(backgroundColor) ? "white" : "black";
};

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
  const [currentPrices, setCurrentPrices] = useState({}); // 종목별 현재가 저장
  const [tradingStatus, setTradingStatus] = useState({}); // 거래 상태 정보 저장

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  // DataTable 컬럼 정의 - widths removed for auto-optimization
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
      name: "전략",
      selector: (row) => row.strategy_type,
      sortable: true,
      cell: (row) => {
        const bgColor = getStrategyTypeColor(row.strategy_type);
        return (
          <Chip
            label={getStrategyTypeLabel(row.strategy_type)}
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
      name: "매매모드",
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
      name: "상태",
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => (
        <Chip
          label={row.is_active ? "활성" : "비활성"}
          color={row.is_active ? "success" : "default"}
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
      name: "손절",
      selector: (row) => row.stop_loss,
      sortable: true,
      center: true,
      cell: (row) => (
        <MKTypography
          variant="body2"
          color={row.stop_loss ? "error" : "text"}
          sx={{ fontSize: "0.85rem", fontWeight: row.stop_loss ? "bold" : "regular" }}
        >
          {formatTradingValue(row.stop_loss, row.trading_mode, "stop_loss")}
        </MKTypography>
      ),
    },
    {
      name: "익절",
      selector: (row) => row.take_profit,
      sortable: true,
      center: true,
      cell: (row) => (
        <MKTypography
          variant="body2"
          color={row.take_profit ? "success" : "text"}
          sx={{ fontSize: "0.85rem", fontWeight: row.take_profit ? "bold" : "regular" }}
        >
          {formatTradingValue(row.take_profit, row.trading_mode, "take_profit")}
        </MKTypography>
      ),
    },
    {
      name: "최대손실",
      selector: (row) => row.max_loss,
      sortable: true,
      center: true,
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
          {formatTradingValue(row.max_loss, row.trading_mode, "max_loss")}
        </MKTypography>
      ),
    },
    {
      name: "진입횟수",
      selector: (row) => tradingStatus[row.stock_code]?.actual_entries || 0,
      sortable: true,
      center: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const totalPossible = status?.total_possible_entries || 1;
        const actualEntries = status?.actual_entries || 0;

        return (
          <MKTypography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
            {actualEntries}/{totalPossible}회
          </MKTypography>
        );
      },
    },
    {
      name: "포지션",
      selector: (row) => tradingStatus[row.stock_code]?.position_sum || 0,
      sortable: true,
      center: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const positionSum = status?.position_sum || 0;
        const actualEntries = status?.actual_entries || 0;

        // 포지션 퍼센트에 따른 색상 결정
        let chipColor = "default";
        let chipStyle = {};

        if (actualEntries === 0) {
          chipColor = "default";
        } else if (positionSum >= 80) {
          chipColor = "success"; // 80% 이상: 초록색
        } else if (positionSum >= 50) {
          chipColor = "warning"; // 50-79%: 주황색
        } else if (positionSum >= 25) {
          chipColor = "info"; // 25-49%: 파란색
        } else {
          chipColor = "error"; // 25% 미만: 빨간색
        }

        return (
          <Chip
            label={`${positionSum.toFixed(0)}%`}
            size="small"
            color={chipColor}
            sx={{
              fontSize: "0.7rem",
              height: "22px",
              minWidth: "50px",
              fontWeight: "bold",
              "& .MuiChip-label": { padding: "0 8px" },
            }}
          />
        );
      },
    },
    {
      name: "진입가",
      selector: (row) => row.entry_point,
      sortable: true,
      center: true,
      cell: (row) => (
        <MKTypography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {row.entry_point ? `${formatCurrency(row.entry_point)}원` : "-"}
        </MKTypography>
      ),
    },
    {
      name: "보유정보",
      selector: (row) => tradingStatus[row.stock_code]?.total_quantity || 0,
      sortable: true,
      center: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const avgPrice = status?.avg_price || 0;
        const quantity = status?.total_quantity || 0;
        const holdingAmount = status?.holding_amount || 0;

        return (
          <Box>
            {/* 첫 번째 줄: 보유금액 */}
            <MKTypography
              variant="body2"
              fontWeight="bold"
              sx={{
                fontSize: "0.8rem",
                color: "primary.main",
                lineHeight: 1.2,
              }}
            >
              {holdingAmount > 0 ? `${formatCurrency(Math.round(holdingAmount))}원` : "-"}
            </MKTypography>

            {/* 두 번째 줄: 수량 정보 */}
            <MKTypography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: "text.secondary",
                lineHeight: 1.2,
              }}
            >
              {quantity > 0 ? `${formatCurrency(quantity)}주` : "-"}
              {avgPrice > 0 && ` @ ${formatCurrency(Math.round(avgPrice))}원`}
            </MKTypography>
          </Box>
        );
      },
    },
    {
      name: "현재가",
      selector: (row) => currentPrices[row.stock_code]?.price || 0,
      sortable: true,
      center: true,
      cell: (row) => {
        const currentPrice = currentPrices[row.stock_code];

        return (
          <Tooltip
            title={
              currentPrice ? `데이터 소스: ${currentPrice.source || "unknown"}` : "주가 조회 중..."
            }
            arrow
          >
            <MKTypography
              variant="body2"
              sx={{
                fontSize: "0.8rem",
                fontWeight: "bold",
                color: currentPrice ? "dark" : "text",
              }}
            >
              {currentPrice ? `${formatCurrency(currentPrice.price)}원` : "조회중..."}
            </MKTypography>
          </Tooltip>
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
      center: true,
      cell: (row) => {
        const status = tradingStatus[row.stock_code];
        const currentPrice = currentPrices[row.stock_code];
        const avgPrice = status?.avg_price || 0;
        const quantity = status?.total_quantity || 0;

        if (!avgPrice || !currentPrice || !quantity) {
          return (
            <Box>
              <MKTypography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                -
              </MKTypography>
            </Box>
          );
        }

        const profitLoss = (currentPrice.price - avgPrice) * quantity;
        const profitRate = ((currentPrice.price - avgPrice) / avgPrice) * 100;
        const isProfit = profitLoss >= 0;

        return (
          <Box>
            {/* 첫 번째 줄: 손익금액 */}
            <MKTypography
              variant="body2"
              fontWeight="bold"
              sx={{
                fontSize: "0.8rem",
                color: isProfit ? "success.main" : "error.main",
                lineHeight: 1.2,
              }}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(Math.round(profitLoss))}원
            </MKTypography>

            {/* 두 번째 줄: 손익률 */}
            <MKTypography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: isProfit ? "success.main" : "error.main",
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {isProfit ? "+" : ""}
              {profitRate.toFixed(2)}%
            </MKTypography>
          </Box>
        );
      },
    },
    {
      name: "생성일",
      selector: (row) => row.created_at,
      sortable: true,
      center: true,
      cell: (row) => (
        <MKTypography variant="caption" color="text" sx={{ fontSize: "0.75rem" }}>
          {new Date(row.created_at).toLocaleDateString("ko-KR", {
            year: "2-digit",
            month: "short",
            day: "numeric",
          })}
        </MKTypography>
      ),
    },
    {
      name: "액션",
      center: true,
      cell: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
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
          <Tooltip title="삭제">
            <IconButton
              size="small"
              color="error"
              sx={{ padding: "4px" }}
              onClick={() => handleDeleteConfig(row.stock_code, row.stock_name, row.strategy_type)}
            >
              <DeleteIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
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

  // 현재가 조회 함수 (Yahoo Finance API 사용)
  const fetchCurrentPrice = async (stockCode) => {
    try {
      // 한국 주식의 경우 .KS (KOSPI) 또는 .KQ (KOSDAQ) 접미사 추가
      const symbol = `${stockCode}.KS`; // 기본적으로 KOSPI로 시도

      // CORS 문제를 해결하기 위해 백엔드를 통해 주가 조회
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiBaseUrl}/api/stock-price/${stockCode}`);

      if (response.ok) {
        const data = await response.json();
        return {
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          source: data.source,
          marketState: data.market_state,
        };
      } else {
        // 백엔드 API가 없는 경우 fallback (개발용)
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  // 모든 종목의 현재가 조회
  const loadCurrentPrices = async (configs) => {
    if (!configs || configs.length === 0) return;

    const pricePromises = configs.map(async (config) => {
      try {
        const price = await fetchCurrentPrice(config.stock_code);
        return { stockCode: config.stock_code, price, success: !!price };
      } catch (error) {
        return { stockCode: config.stock_code, price: null, success: false, error: error.message };
      }
    });

    const priceResults = await Promise.all(pricePromises);
    const pricesMap = {};
    let successCount = 0;
    let errorCount = 0;

    priceResults.forEach(({ stockCode, price, success, error }) => {
      if (success && price) {
        pricesMap[stockCode] = price;
        successCount++;
      } else {
        errorCount++;
      }
    });

    setCurrentPrices(pricesMap);

    // 결과 알림
    if (successCount > 0) {
      showSnackbar(`${successCount}개 종목의 현재가를 업데이트했습니다.`, "success");
    }
    if (errorCount > 0) {
      showSnackbar(`${errorCount}개 종목의 현재가 조회에 실패했습니다.`, "warning");
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

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadAllTradingConfigs();
    }
  }, [user]);

  // 현재가 실시간 업데이트 (5분마다)
  useEffect(() => {
    if (allTradingConfigs.length > 0) {
      const interval = setInterval(() => {
        loadCurrentPrices(allTradingConfigs);
      }, 5 * 60 * 1000); // 5분마다 업데이트

      return () => clearInterval(interval);
    }
  }, [allTradingConfigs]);

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <MKBox component="section" py={6}>
        <FullWidthContainer>
          <Alert severity="warning" sx={{ mb: 3 }}>
            로그인이 필요한 페이지입니다. 로그인 후 이용해주세요.
          </Alert>
        </FullWidthContainer>
      </MKBox>
    );
  }

  return (
    <>
      <DefaultNavbar routes={routes} sticky />

      <MKBox component="section" sx={{ minHeight: "80vh", pt: 12, pb: 4 }}>
        <FullWidthContainer>
          {/* 페이지 헤더 */}
          <MKBox mb={4}>
            <MKTypography variant="h3" color="dark" fontWeight="bold" gutterBottom>
              자동매매 설정 목록
            </MKTypography>
            <MKTypography variant="body1" color="text" opacity={0.8}>
              현재 설정된 자동매매 전략을 확인하고 관리할 수 있습니다.
            </MKTypography>
          </MKBox>

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

          {/* 자동매매 설정 DataTable */}
          {!loading && !error && (
            <MKBox>
              {allTradingConfigs.length === 0 ? (
                <Card>
                  <CardContent>
                    <MKBox textAlign="center" py={6}>
                      <SettingsIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                      <MKTypography variant="h5" color="text" mb={2}>
                        설정된 자동매매가 없습니다
                      </MKTypography>
                      <MKTypography variant="body1" color="text" opacity={0.7} mb={3}>
                        아직 설정된 자동매매 전략이 없습니다.
                      </MKTypography>
                      <MKButton variant="gradient" color="info">
                        자동매매 설정하기
                      </MKButton>
                    </MKBox>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveTableWrapper>
                  <EnhancedDataTable
                    columns={columns}
                    data={allTradingConfigs}
                    autoOptimizeColumns={true}
                  />
                </ResponsiveTableWrapper>
              )}
            </MKBox>
          )}

          {/* 새로고침 버튼 */}
          {!loading && (
            <MKBox textAlign="center" mt={4} display="flex" justifyContent="center" gap={2}>
              <MKButton variant="outlined" color="info" onClick={loadAllTradingConfigs}>
                전체 새로고침
              </MKButton>
              {allTradingConfigs.length > 0 && (
                <>
                  <MKButton
                    variant="outlined"
                    color="success"
                    onClick={() => loadCurrentPrices(allTradingConfigs)}
                  >
                    현재가 업데이트
                  </MKButton>
                  <MKButton variant="outlined" color="warning" onClick={loadTradingStatus}>
                    거래상태 업데이트
                  </MKButton>
                </>
              )}
            </MKBox>
          )}
        </FullWidthContainer>
      </MKBox>

      <DefaultFooter content={footerRoutes} />
      <NotificationComponent />

      {/* 자동매매 설정 상세보기/수정 모달 */}
      <TradingConfigModal
        open={modalOpen}
        onClose={handleCloseModal}
        config={selectedConfig}
        onSave={handleModalSave}
        loading={modalLoading}
      />
    </>
  );
}
