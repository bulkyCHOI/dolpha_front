import React from "react";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Assessment from "@mui/icons-material/Assessment";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

function StockInfoHeader({ selectedStock, ohlcvData, analysisData, onOpenFinancialModal }) {
  const getChangeRate = () => {
    if (!ohlcvData || ohlcvData.length < 2) return null;
    const current = ohlcvData[ohlcvData.length - 1]?.close;
    const previous = ohlcvData[ohlcvData.length - 2]?.close;
    return ((current - previous) / previous) * 100;
  };

  const changeRate = getChangeRate();

  return (
    <MKBox
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: { xs: 2, md: 1 },
        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.1)",
        position: "relative",
        p: { xs: 1.5, md: 1.5 },
        mb: 2,
      }}
    >
      {/* 모바일: 간단한 카드 형태 */}
      <MKBox sx={{ display: { xs: "block", md: "none" } }}>
        <MKBox
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
        >
          <MKBox>
            <MKTypography variant="h6" color="white" fontWeight="bold">
              {selectedStock.name || "-"}
            </MKTypography>
            <MKTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
              {selectedStock.code || "-"} • KOSPI
            </MKTypography>
          </MKBox>
          <IconButton
            onClick={() => onOpenFinancialModal(selectedStock)}
            sx={{
              color: "white",
              padding: "8px",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
            title="재무제표 보기"
          >
            <Assessment sx={{ fontSize: "20px" }} />
          </IconButton>
        </MKBox>

        <MKBox sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <MKBox>
            <MKTypography variant="h5" color="white" fontWeight="bold">
              {ohlcvData && ohlcvData.length > 0
                ? new Intl.NumberFormat("ko-KR").format(ohlcvData[ohlcvData.length - 1]?.close)
                : "-"}
            </MKTypography>
            <MKTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
              종가
            </MKTypography>
          </MKBox>

          <MKBox sx={{ textAlign: "right" }}>
            <MKBox
              sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}
            >
              {changeRate !== null &&
                (changeRate >= 0 ? (
                  <ArrowUpward sx={{ fontSize: "16px", color: "white" }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: "16px", color: "white" }} />
                ))}
              <MKTypography variant="body1" color="white" fontWeight="bold">
                {changeRate !== null
                  ? `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`
                  : "-"}
              </MKTypography>
            </MKBox>
            <MKTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
              ATR:{" "}
              {analysisData && analysisData.length > 0 &&
              analysisData[analysisData.length - 1]?.atr &&
              ohlcvData && ohlcvData.length > 0
                ? (() => {
                    const atr = analysisData[analysisData.length - 1].atr;
                    const currentPrice = ohlcvData[ohlcvData.length - 1]?.close;
                    const atrPercent = currentPrice
                      ? ((atr / currentPrice) * 100).toFixed(1)
                      : null;
                    return `${atr.toFixed(1)}${atrPercent ? ` (${atrPercent}%)` : ""}`;
                  })()
                : "-"}
            </MKTypography>
          </MKBox>
        </MKBox>
      </MKBox>

      {/* 데스크탑: 기존 Grid 레이아웃 */}
      <MKBox sx={{ display: { xs: "none", md: "block" } }}>
        <Grid container spacing={1} alignItems="center">
          {/* 종목명 & 코드 */}
          <Grid item xs={12} sm={2.28}>
            <MKBox>
              <MKTypography variant="caption" color="white" sx={{ fontSize: "0.7rem" }}>
                종목명
              </MKTypography>
              <MKBox sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <MKTypography
                  variant="body2"
                  fontWeight="bold"
                  color="white"
                  sx={{ fontSize: "0.85rem", lineHeight: 1.2 }}
                >
                  {selectedStock.name || "-"}
                </MKTypography>
                <MKTypography variant="caption" color="white" sx={{ fontSize: "0.65rem" }}>
                  ({selectedStock.code || "-"})
                </MKTypography>
              </MKBox>
            </MKBox>
          </Grid>

          {/* 마켓 정보 */}
          <Grid item xs={12} sm={2.28}>
            <MKBox>
              <MKTypography variant="caption" color="white" sx={{ fontSize: "0.7rem" }}>
                마켓
              </MKTypography>
              <MKTypography
                variant="body2"
                fontWeight="bold"
                color="white"
                sx={{ fontSize: "0.85rem" }}
              >
                KOSPI
              </MKTypography>
            </MKBox>
          </Grid>

          {/* 종가 */}
          <Grid item xs={12} sm={2.28}>
            <MKBox>
              <MKTypography variant="caption" color="white" sx={{ fontSize: "0.7rem" }}>
                종가
              </MKTypography>
              <MKTypography
                variant="body2"
                fontWeight="bold"
                color="white"
                sx={{ fontSize: "0.85rem" }}
              >
                {ohlcvData && ohlcvData.length > 0
                  ? new Intl.NumberFormat("ko-KR").format(ohlcvData[ohlcvData.length - 1]?.close)
                  : "-"}
              </MKTypography>
            </MKBox>
          </Grid>

          {/* 등락율 */}
          <Grid item xs={12} sm={2.28}>
            <MKBox>
              <MKTypography variant="caption" color="white" sx={{ fontSize: "0.7rem" }}>
                등락율
              </MKTypography>
              <MKBox sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {changeRate !== null &&
                  (changeRate >= 0 ? (
                    <ArrowUpward sx={{ fontSize: "14px", color: "white" }} />
                  ) : (
                    <ArrowDownward sx={{ fontSize: "14px", color: "white" }} />
                  ))}
                <MKTypography
                  variant="body2"
                  fontWeight="bold"
                  color="white"
                  sx={{ fontSize: "0.85rem" }}
                >
                  {changeRate !== null
                    ? `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`
                    : "-"}
                </MKTypography>
              </MKBox>
            </MKBox>
          </Grid>

          {/* ATR */}
          <Grid item xs={12} sm={2.28}>
            <MKBox>
              <MKTypography variant="caption" color="white" sx={{ fontSize: "0.7rem" }}>
                ATR
              </MKTypography>
              <MKTypography
                variant="body2"
                fontWeight="bold"
                color="white"
                sx={{ fontSize: "0.85rem" }}
              >
                {analysisData && analysisData.length > 0 &&
                analysisData[analysisData.length - 1]?.atr &&
                ohlcvData && ohlcvData.length > 0
                  ? (() => {
                      const atr = analysisData[analysisData.length - 1].atr;
                      const currentPrice = ohlcvData[ohlcvData.length - 1]?.close;
                      const atrPercent = currentPrice
                        ? ((atr / currentPrice) * 100).toFixed(1)
                        : null;
                      return `${atr.toFixed(1)}${atrPercent ? ` (${atrPercent}%)` : ""}`;
                    })()
                  : "-"}
              </MKTypography>
            </MKBox>
          </Grid>

          {/* 재무제표 버튼 */}
          <Grid item xs={12} sm={0.6}>
            <MKBox
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
                  color: "white",
                  padding: "2px",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
                title="재무제표 보기"
              >
                <Assessment sx={{ fontSize: "18px" }} />
              </IconButton>
            </MKBox>
          </Grid>
        </Grid>
      </MKBox>
    </MKBox>
  );
}

export default StockInfoHeader;
