import React from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatNumber } from "utils/formatters";
import { COLORS, alpha } from "constants/styles";

/**
 * 값 구간을 색으로 나타낸다 (높을수록 빨강 → 낮을수록 회색).
 * 배경과 글자색이 같은 기준을 쓰도록 한 곳에 모아 둔다.
 */
const bandColor = (value, thresholds) => {
  const [high, upper, mid, low, base] = thresholds;
  if (value >= high) return COLORS.CHARTBOOK.BAND_STRONG;
  if (value >= upper) return COLORS.CHARTBOOK.BAND_MID;
  if (value >= mid) return COLORS.CHARTBOOK.BAND_MID;
  if (value >= low) return COLORS.CHARTBOOK.BAND_WEAK;
  if (value >= base) return COLORS.CHARTBOOK.PANEL_BLUE;
  return COLORS.TEXT_MUTED;
};

const RANK_BANDS = [90, 80, 70, 60, 50];
const RISE_BANDS = [25, 20, 15, 10, 5];

function StockList({
  stocks,
  loading,
  error,
  selectedStock,
  onStockClick,
  getColumnHeaders,
  getRowData,
  disableStripes = false,
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
          종목 데이터를 불러오는 중...
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
            데이터 로드 중 오류가 발생했습니다
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
        }}
      >
        <Typography variant="body2" color="text.secondary">
          표시할 종목이 없습니다
        </Typography>
      </Box>
    );
  }

  // 컬럼 헤더 정의 (기본값 또는 전달받은 값 사용)
  const columnHeaders = getColumnHeaders
    ? getColumnHeaders()
    : [
        { label: "종목명", field: "name", width: 3.5 },
        { label: "RS순위", field: "rsRank", width: 2.5 },
        { label: "당기매출", field: "당기매출", width: 3 },
        { label: "영업이익", field: "당기영업이익", width: 3 },
      ];

  // 행 데이터 변환 함수
  const getRowDataForDisplay = (stock) => {
    if (getRowData) {
      return getRowData(stock);
    }
    // 기본 데이터 구조
    return {
      name: stock.name,
      rsRank: stock.rsRank,
      당기매출: stock["당기매출"],
      당기영업이익: stock["당기영업이익"],
    };
  };

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
          {columnHeaders.map((header, index) => (
            <Grid key={header.field} item xs={header.width || 12 / columnHeaders.length}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: COLORS.CHARTBOOK.INK,
                  fontWeight: 700,
                  fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.02em",
                }}
                textAlign={index === 0 ? "left" : "center"}
              >
                {header.label}
              </Typography>
            </Grid>
          ))}
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
        {stocks.map((row, rowIndex) => {
          const rowData = getRowDataForDisplay(row);
          return (
            <Box
              key={row.code || rowIndex}
              onClick={() => onStockClick(row)}
              sx={{
                p: 0.5,
                borderBottom:
                  rowIndex === stocks.length - 1 ? "none" : `1px solid ${COLORS.CHARTBOOK.GRID}`,
                cursor: "pointer",
                transition: "background-color 0.12s ease",
                color: selectedStock?.code === row.code ? COLORS.CHARTBOOK.SELECTED_INK : "inherit",
                backgroundColor:
                  selectedStock?.code === row.code
                    ? COLORS.CHARTBOOK.SELECTED_BG
                    : COLORS.CHARTBOOK.GROUND,
                "&:hover": {
                  backgroundColor:
                    selectedStock?.code === row.code
                      ? COLORS.CHARTBOOK.SELECTED_BG
                      : alpha(COLORS.CHARTBOOK.INK, 0.06),
                },
              }}
            >
              <Grid container spacing={0} alignItems="center">
                {columnHeaders.map((header, colIndex) => (
                  <Grid key={header.field} item xs={header.width || 12 / columnHeaders.length}>
                    {colIndex === 0 ? (
                      // 첫 번째 컬럼 (종목명)
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={selectedStock?.code === row.code ? "bold" : "medium"}
                          sx={{
                            color:
                              selectedStock?.code === row.code
                                ? COLORS.CHARTBOOK.SELECTED_INK
                                : COLORS.CHARTBOOK.INK,
                            fontSize: "0.8rem",
                            lineHeight: 1.1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rowData[header.field] || row.name || "-"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            fontFamily: "'Fragment Mono', 'Monaco', monospace",
                            color:
                              selectedStock?.code === row.code
                                ? COLORS.CHARTBOOK.SELECTED_INK
                                : COLORS.TEXT_SECONDARY,
                            opacity: selectedStock?.code === row.code ? 0.8 : 1,
                          }}
                        >
                          {row.code || ""}
                        </Typography>
                      </Box>
                    ) : header.field === "rsRank" ? (
                      // RS 점수 컬럼
                      <Box display="flex" justifyContent="center">
                        <Chip
                          label={Math.floor(rowData[header.field]) || "-"}
                          size="small"
                          sx={{
                            backgroundColor: "transparent",
                            color: bandColor(rowData[header.field], RANK_BANDS),
                            border: `1px solid ${bandColor(rowData[header.field], RANK_BANDS)}`,
                            borderRadius: "2px",
                            fontFamily: "'Fragment Mono', 'Monaco', monospace",
                            fontWeight: 500,
                            fontSize: "0.7rem",
                            minWidth: "35px",
                            height: "20px",
                          }}
                        />
                      </Box>
                    ) : header.field === "min_52w_gain_percent" ? (
                      // 52주상승률 컬럼
                      <Box display="flex" justifyContent="center">
                        <Chip
                          label={`${rowData[header.field] || 0}%`}
                          size="small"
                          sx={{
                            backgroundColor: "transparent",
                            color: bandColor(rowData[header.field], [300, 200, 100, 75, 50]),
                            border: `1px solid ${bandColor(rowData[header.field], [300, 200, 100, 75, 50])}`,
                            borderRadius: "2px",
                            fontFamily: "'Fragment Mono', 'Monaco', monospace",
                            fontWeight: 500,
                            fontSize: "0.7rem",
                            minWidth: "40px",
                            height: "20px",
                          }}
                        />
                      </Box>
                    ) : header.field === "change" ? (
                      // 상승률 컬럼 (TopRising 페이지용)
                      <Box display="flex" justifyContent="center">
                        <Chip
                          label={`+${(rowData[header.field] || 0).toFixed(1)}%`}
                          size="small"
                          sx={{
                            backgroundColor: "transparent",
                            color: bandColor(rowData[header.field], RISE_BANDS),
                            border: `1px solid ${bandColor(rowData[header.field], RISE_BANDS)}`,
                            borderRadius: "2px",
                            fontFamily: "'Fragment Mono', 'Monaco', monospace",
                            fontWeight: 500,
                            fontSize: "0.7rem",
                            minWidth: "40px",
                            height: "20px",
                          }}
                        />
                      </Box>
                    ) : (
                      // 일반 데이터 컬럼
                      <Box display="flex" justifyContent="center" alignItems="center">
                        <Typography
                          variant="body2"
                          textAlign="center"
                          fontWeight="bold"
                          sx={{
                            fontSize: "0.75rem",
                            color:
                              typeof rowData[header.field] === "number" && rowData[header.field] < 0
                                ? COLORS.DOWN
                                : "inherit",
                          }}
                        >
                          {typeof rowData[header.field] === "number"
                            ? formatNumber(rowData[header.field])
                            : rowData[header.field] || "-"}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

export default StockList;
