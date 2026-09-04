import React from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatNumber } from "utils/formatters";
import { COLORS, alpha } from "constants/styles";

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const ARCHIVO_STACK = "'Archivo', 'Helvetica', 'Arial', sans-serif";

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
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          p: 1,
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}`,
          flexShrink: 0,
        }}
      >
        <Grid container spacing={0}>
          <Grid item xs={3}>
            <Typography
              variant="subtitle2"
              color={COLORS.CHARTBOOK.INK}
              fontWeight={700}
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
                fontFamily: ARCHIVO_STACK,
              }}
            >
              종목명
            </Typography>
          </Grid>
          <Grid item xs={2.5}>
            <Typography
              variant="subtitle2"
              color={COLORS.CHARTBOOK.INK}
              fontWeight={700}
              textAlign="center"
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
                fontFamily: ARCHIVO_STACK,
              }}
            >
              상승률
            </Typography>
          </Grid>
          <Grid item xs={2.5}>
            <Typography
              variant="subtitle2"
              color={COLORS.CHARTBOOK.INK}
              fontWeight={700}
              textAlign="center"
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
                fontFamily: ARCHIVO_STACK,
              }}
            >
              조정폭
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="subtitle2"
              color={COLORS.CHARTBOOK.INK}
              fontWeight={700}
              textAlign="center"
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
                fontFamily: ARCHIVO_STACK,
              }}
            >
              시작일
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="subtitle2"
              color={COLORS.CHARTBOOK.INK}
              fontWeight={700}
              textAlign="center"
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
                fontFamily: ARCHIVO_STACK,
              }}
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
          backgroundColor: COLORS.CHARTBOOK.GROUND,
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
                  rowIndex === stocks.length - 1 ? "none" : `1px solid ${COLORS.CHARTBOOK.GRID}`,
                cursor: "pointer",
                transition: "background-color 0.12s ease",
                color: selectedStock?.code === stock.code ? COLORS.CHARTBOOK.SELECTED_INK : "inherit",
                backgroundColor:
                  selectedStock?.code === stock.code
                    ? COLORS.CHARTBOOK.SELECTED_BG
                    : COLORS.CHARTBOOK.GROUND,
                "&:hover": {
                  backgroundColor:
                    selectedStock?.code === stock.code
                      ? COLORS.CHARTBOOK.SELECTED_BG
                      : alpha(COLORS.CHARTBOOK.INK, 0.06),
                },
              }}
            >
              <Grid container spacing={0} alignItems="center">
                {/* 종목명 */}
                <Grid item xs={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={selectedStock?.code === stock.code ? "bold" : "medium"}
                      sx={{
                        color:
                          selectedStock?.code === stock.code
                            ? COLORS.CHARTBOOK.SELECTED_INK
                            : COLORS.CHARTBOOK.INK,
                        fontSize: "0.8rem",
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
                      sx={{
                        fontSize: "0.7rem",
                        fontFamily: MONO_STACK,
                        color:
                          selectedStock?.code === stock.code
                            ? COLORS.CHARTBOOK.SELECTED_INK
                            : COLORS.TEXT_SECONDARY,
                        opacity: selectedStock?.code === stock.code ? 0.8 : 1,
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
                        backgroundColor: "transparent",
                        color: getGainColor(stock.htf_8week_gain || 0),
                        border: `1px solid ${getGainColor(stock.htf_8week_gain || 0)}`,
                        borderRadius: "2px",
                        fontFamily: MONO_STACK,
                        fontWeight: 500,
                        fontSize: "0.7rem",
                        minWidth: "40px",
                        height: "20px",
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
                        backgroundColor: "transparent",
                        color: getPullbackColor(stock.htf_max_pullback || 0),
                        border: `1px solid ${getPullbackColor(stock.htf_max_pullback || 0)}`,
                        borderRadius: "2px",
                        fontFamily: MONO_STACK,
                        fontWeight: 500,
                        fontSize: "0.7rem",
                        minWidth: "40px",
                        height: "20px",
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
                        fontSize: "0.75rem",
                        fontFamily: MONO_STACK,
                        fontWeight: 500,
                        color: COLORS.CHARTBOOK.INK,
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
                        backgroundColor: "transparent",
                        color: statusChip.color,
                        border: `1px solid ${statusChip.color}`,
                        borderRadius: "2px",
                        fontFamily: MONO_STACK,
                        fontWeight: 500,
                        fontSize: "0.7rem",
                        minWidth: "40px",
                        height: "20px",
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
