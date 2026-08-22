import React from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatNumber } from "utils/formatters";
import { COLORS, GRADIENT_COLORS, alpha, onColor } from "constants/styles";

function HTFStockList({
  stocks,
  loading,
  error,
  selectedStock,
  onStockClick,
  getGainColor,
  getPullbackColor,
  getStatusChip,
}) {
  // 로딩 상태
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          HTF 패턴 종목을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
          textAlign: "center",
        }}
      >
        <Box>
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            HTF 데이터 로드 중 오류가 발생했습니다
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  // 데이터가 없는 상태
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
          textAlign: "center",
        }}
      >
        <Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            HTF 패턴 종목이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            조건에 맞는 HTF 패턴을 가진 종목이 없습니다.
            <br />
            필터 조건을 조정해 보세요.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* 테이블 헤더 */}
      <Box
        sx={{
          background: GRADIENT_COLORS.PRIMARY,
          p: 1,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <Grid container spacing={0}>
          <Grid item xs={3}>
            <Typography
              variant="subtitle2"
              color="white.main"
              fontWeight="bold"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              종목명
            </Typography>
          </Grid>
          <Grid item xs={2.5}>
            <Typography
              variant="subtitle2"
              color="white.main"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              상승률
            </Typography>
          </Grid>
          <Grid item xs={2.5}>
            <Typography
              variant="subtitle2"
              color="white.main"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              조정폭
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="subtitle2"
              color="white.main"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.65rem", md: "0.8rem" } }}
            >
              시작일
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="subtitle2"
              color="white.main"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              상태
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* 스크롤 가능한 테이블 바디 */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          backgroundColor: COLORS.SURFACE,
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
        {stocks.map((stock, rowIndex) => {
          const statusChip = getStatusChip(stock.htf_current_status);

          return (
            <Box
              key={stock.code || rowIndex}
              onClick={() => onStockClick(stock)}
              sx={{
                p: 0.5,
                borderBottom:
                  rowIndex === stocks.length - 1 ? "none" : `1px solid ${COLORS.DIVIDER}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor:
                  selectedStock?.code === stock.code
                    ? `linear-gradient(135deg, ${alpha(COLORS.PRIMARY, 0.1)} 0%, ${alpha(
                        COLORS.PRIMARY_DARK,
                        0.1
                      )} 100%)`
                    : rowIndex % 2 === 0
                    ? COLORS.SURFACE_ALT
                    : COLORS.ON_ACCENT,
                "&:hover": {
                  backgroundColor: alpha(COLORS.PRIMARY, 0.08),
                  transform: "translateX(4px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `3px solid ${COLORS.PRIMARY}`,
                },
                ...(selectedStock?.code === stock.code && {
                  borderLeft: `3px solid ${COLORS.PRIMARY}`,
                  boxShadow: `0 2px 12px ${alpha(COLORS.PRIMARY, 0.2)}`,
                }),
              }}
            >
              <Grid container spacing={0} alignItems="center">
                {/* 종목명 */}
                <Grid item xs={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={selectedStock?.code === stock.code ? "bold" : "medium"}
                      color={selectedStock?.code === stock.code ? "info" : "text"}
                      sx={{
                        fontSize: { xs: "0.7rem", md: "0.8rem" },
                        lineHeight: 1.1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {stock.name || "-"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {stock.code || ""}
                    </Typography>
                  </Box>
                </Grid>

                {/* 8주 상승률 */}
                <Grid item xs={2.5}>
                  <Box display="flex" justifyContent="center">
                    <Chip
                      label={`${Math.round(stock.htf_8week_gain || 0)}%`}
                      size="small"
                      sx={{
                        backgroundColor: getGainColor(stock.htf_8week_gain || 0),
                        color: onColor(getGainColor(stock.htf_8week_gain || 0)),
                        fontWeight: "bold",
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        minWidth: { xs: "35px", md: "40px" },
                        height: { xs: "28px", md: "20px" },
                        cursor: "pointer",
                        "&:hover": {
                          opacity: 0.8,
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* 최대 조정폭 */}
                <Grid item xs={2.5}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Chip
                      label={`${Math.round(stock.htf_max_pullback || 0)}%`}
                      size="small"
                      sx={{
                        backgroundColor: getPullbackColor(stock.htf_max_pullback || 0),
                        color: onColor(getPullbackColor(stock.htf_max_pullback || 0)),
                        fontWeight: "bold",
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        minWidth: { xs: "35px", md: "40px" },
                        height: { xs: "28px", md: "20px" },
                      }}
                    />
                  </Box>
                </Grid>

                {/* 패턴 시작일 */}
                <Grid item xs={2}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography
                      variant="body2"
                      textAlign="center"
                      sx={{
                        fontSize: { xs: "0.65rem", md: "0.75rem" },
                        fontWeight: "medium",
                      }}
                    >
                      {stock.htf_pattern_start_date
                        ? new Date(stock.htf_pattern_start_date).toLocaleDateString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "-"}
                    </Typography>
                  </Box>
                </Grid>

                {/* 현재 상태 */}
                <Grid item xs={2}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Chip
                      label={statusChip.text}
                      size="small"
                      sx={{
                        backgroundColor: statusChip.color,
                        color: onColor(statusChip.color),
                        fontWeight: "bold",
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        minWidth: { xs: "30px", md: "35px" },
                        height: { xs: "28px", md: "20px" },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

export default HTFStockList;
