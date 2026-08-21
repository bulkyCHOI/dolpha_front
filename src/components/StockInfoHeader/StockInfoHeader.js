import React from "react";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Assessment from "@mui/icons-material/Assessment";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COLORS, alpha } from "constants/styles";

function StockInfoHeader({ selectedStock, ohlcvData, analysisData, onOpenFinancialModal }) {
  const getChangeRate = () => {
    if (!ohlcvData || ohlcvData.length < 2) return null;
    const current = ohlcvData[ohlcvData.length - 1]?.close;
    const previous = ohlcvData[ohlcvData.length - 2]?.close;
    return ((current - previous) / previous) * 100;
  };

  const formatMarketCap = (value) => {
    if (!value || value === 0) return "-";
    const 조 = 1_000_000_000_000;
    const 억 = 100_000_000;
    if (value >= 조) return `${(value / 조).toFixed(1)}조`;
    if (value >= 억) return `${Math.round(value / 억)}억`;
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  const changeRate = getChangeRate();

  // HTF 정보 렌더링 함수 (삭제됨)

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`,
        borderRadius: { xs: 2, md: 1 },
        boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY, 0.1)}`,
        position: "relative",
        p: { xs: 1.5, md: 1.5 },
        mb: 2,
      }}
    >
      {/* 모바일: 간단한 카드 형태 */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
        >
          <Box>
            <Typography variant="h6" color="white.main" fontWeight="bold">
              {selectedStock.name || "-"}
            </Typography>
            <Typography variant="caption" color="white.main" sx={{ opacity: 0.9 }}>
              {selectedStock.code || "-"} • KOSPI
            </Typography>
          </Box>
          <IconButton
            onClick={() => onOpenFinancialModal(selectedStock)}
            sx={{
              color: COLORS.ON_ACCENT,
              padding: "8px",
              "&:hover": {
                backgroundColor: alpha(COLORS.SURFACE, 0.1),
              },
            }}
            title="재무제표 보기"
          >
            <Assessment sx={{ fontSize: "20px" }} />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" color="white.main" fontWeight="bold">
              {ohlcvData && ohlcvData.length > 0
                ? new Intl.NumberFormat("ko-KR").format(ohlcvData[ohlcvData.length - 1]?.close)
                : "-"}
            </Typography>
            <Typography variant="caption" color="white.main" sx={{ opacity: 0.9 }}>
              종가
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}
            >
              {changeRate !== null &&
                (changeRate >= 0 ? (
                  <ArrowUpward sx={{ fontSize: "16px", color: COLORS.ON_ACCENT }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: "16px", color: COLORS.ON_ACCENT }} />
                ))}
              <Typography variant="body1" color="white.main" fontWeight="bold">
                {changeRate !== null
                  ? `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`
                  : "-"}
              </Typography>
            </Box>
            <Typography variant="caption" color="white.main" sx={{ opacity: 0.9 }}>
              ATR:{" "}
              {analysisData &&
              analysisData.length > 0 &&
              analysisData[analysisData.length - 1]?.atr &&
              ohlcvData &&
              ohlcvData.length > 0
                ? (() => {
                    const atr = analysisData[analysisData.length - 1].atr;
                    const currentPrice = ohlcvData[ohlcvData.length - 1]?.close;
                    const atrPercent = currentPrice
                      ? ((atr / currentPrice) * 100).toFixed(1)
                      : null;
                    return `${atr.toFixed(1)}${atrPercent ? ` (${atrPercent}%)` : ""}`;
                  })()
                : "-"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 데스크탑: 기존 Grid 레이아웃 */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Grid container spacing={1} alignItems="center">
          {/* 종목명 & 코드 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                종목명
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="white.main"
                  sx={{ fontSize: "0.85rem", lineHeight: 1.2 }}
                >
                  {selectedStock.name || "-"}
                </Typography>
                <Typography variant="caption" color="white.main" sx={{ fontSize: "0.65rem" }}>
                  ({selectedStock.code || "-"})
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 마켓 정보 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                마켓
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="white.main"
                sx={{ fontSize: "0.85rem" }}
              >
                KOSPI
              </Typography>
            </Box>
          </Grid>

          {/* 종가 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                종가
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="white.main"
                sx={{ fontSize: "0.85rem" }}
              >
                {ohlcvData && ohlcvData.length > 0
                  ? new Intl.NumberFormat("ko-KR").format(ohlcvData[ohlcvData.length - 1]?.close)
                  : "-"}
              </Typography>
            </Box>
          </Grid>

          {/* 등락율 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                등락율
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {changeRate !== null &&
                  (changeRate >= 0 ? (
                    <ArrowUpward sx={{ fontSize: "14px", color: COLORS.ON_ACCENT }} />
                  ) : (
                    <ArrowDownward sx={{ fontSize: "14px", color: COLORS.ON_ACCENT }} />
                  ))}
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="white.main"
                  sx={{ fontSize: "0.85rem" }}
                >
                  {changeRate !== null
                    ? `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`
                    : "-"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* ATR */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                ATR
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="white.main"
                sx={{ fontSize: "0.85rem" }}
              >
                {analysisData &&
                analysisData.length > 0 &&
                analysisData[analysisData.length - 1]?.atr &&
                ohlcvData &&
                ohlcvData.length > 0
                  ? (() => {
                      const atr = analysisData[analysisData.length - 1].atr;
                      const currentPrice = ohlcvData[ohlcvData.length - 1]?.close;
                      const atrPercent = currentPrice
                        ? ((atr / currentPrice) * 100).toFixed(1)
                        : null;
                      return `${atr.toFixed(1)}${atrPercent ? ` (${atrPercent}%)` : ""}`;
                    })()
                  : "-"}
              </Typography>
            </Box>
          </Grid>

          {/* 시가총액 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                시가총액
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="white.main"
                sx={{ fontSize: "0.85rem" }}
              >
                {formatMarketCap(selectedStock.market_cap)}
              </Typography>
            </Box>
          </Grid>

          {/* 영업이익율 */}
          <Grid item xs={12} sm={1.6}>
            <Box>
              <Typography variant="caption" color="white.main" sx={{ fontSize: "0.7rem" }}>
                영업이익율
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="white.main"
                sx={{ fontSize: "0.85rem" }}
              >
                {selectedStock.영업이익율 != null && selectedStock.영업이익율 !== 0
                  ? `${selectedStock.영업이익율.toFixed(1)}%`
                  : "-"}
              </Typography>
            </Box>
          </Grid>

          {/* 재무제표 버튼 */}
          <Grid item xs={12} sm={0.8}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <IconButton
                onClick={() => onOpenFinancialModal(selectedStock)}
                sx={{
                  color: COLORS.ON_ACCENT,
                  padding: "2px",
                  "&:hover": {
                    backgroundColor: alpha(COLORS.SURFACE, 0.1),
                  },
                }}
                title="재무제표 보기"
              >
                <Assessment sx={{ fontSize: "18px" }} />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default StockInfoHeader;
