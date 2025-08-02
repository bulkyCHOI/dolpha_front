import React from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import { formatNumber } from "utils/formatters";

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
      <MKBox
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
        }}
      >
        <MKTypography variant="body2" color="text">
          종목 데이터를 불러오는 중...
        </MKTypography>
      </MKBox>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <MKBox
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
          textAlign: "center",
        }}
      >
        <MKBox>
          <MKTypography variant="body2" color="error" sx={{ mb: 1 }}>
            데이터 로드 중 오류가 발생했습니다
          </MKTypography>
          <MKTypography variant="caption" color="text">
            {error}
          </MKTypography>
        </MKBox>
      </MKBox>
    );
  }

  // 데이터가 없는 상태
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return (
      <MKBox
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
        }}
      >
        <MKTypography variant="body2" color="text">
          표시할 종목이 없습니다
        </MKTypography>
      </MKBox>
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
      <MKBox
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: 1,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <Grid container spacing={0}>
          {columnHeaders.map((header, index) => (
            <Grid key={header.field} item xs={header.width || 12 / columnHeaders.length}>
              <MKTypography
                variant="subtitle2"
                color="white"
                fontWeight="bold"
                textAlign={index === 0 ? "left" : "center"}
              >
                {header.label}
              </MKTypography>
            </Grid>
          ))}
        </Grid>
      </MKBox>

      {/* 스크롤 가능한 테이블 바디 */}
      <MKBox
        sx={{
          flex: 1,
          overflow: "auto",
          backgroundColor: "white",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "4px",
            "&:hover": {
              background: "#a1a1a1",
            },
          },
        }}
      >
        {stocks.map((row, rowIndex) => {
          const rowData = getRowDataForDisplay(row);
          return (
            <MKBox
              key={row.code || rowIndex}
              onClick={() => onStockClick(row)}
              sx={{
                p: 0.5,
                borderBottom: rowIndex === stocks.length - 1 ? "none" : "1px solid #f0f0f0",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor:
                  selectedStock?.code === row.code
                    ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                    : disableStripes
                    ? "white"
                    : rowIndex % 2 === 0
                    ? "#fafafa"
                    : "white",
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                  transform: "translateX(4px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: "3px solid #667eea",
                },
                ...(selectedStock?.code === row.code && {
                  borderLeft: "3px solid #667eea",
                  boxShadow: "0 2px 12px rgba(102, 126, 234, 0.2)",
                }),
              }}
            >
              <Grid container spacing={0} alignItems="center">
                {columnHeaders.map((header, colIndex) => (
                  <Grid key={header.field} item xs={header.width || 12 / columnHeaders.length}>
                    {colIndex === 0 ? (
                      // 첫 번째 컬럼 (종목명)
                      <MKBox>
                        <MKTypography
                          variant="body2"
                          fontWeight={selectedStock?.code === row.code ? "bold" : "medium"}
                          color={selectedStock?.code === row.code ? "info" : "text"}
                          sx={{
                            fontSize: "0.8rem",
                            lineHeight: 1.1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rowData[header.field] || row.name || "-"}
                        </MKTypography>
                        <MKTypography variant="caption" color="text" sx={{ fontSize: "0.7rem" }}>
                          {row.code || ""}
                        </MKTypography>
                      </MKBox>
                    ) : header.field === "rsRank" ? (
                      // RS 점수 컬럼
                      <MKBox display="flex" justifyContent="center">
                        <Chip
                          label={Math.floor(rowData[header.field]) || "-"}
                          size="small"
                          sx={{
                            backgroundColor:
                              rowData[header.field] >= 90
                                ? "#f44336" // 90 이상: 빨강
                                : rowData[header.field] >= 80
                                ? "#ff5722" // 80 이상: 주황
                                : rowData[header.field] >= 70
                                ? "#ffc107" // 70 이상: 노랑
                                : rowData[header.field] >= 60
                                ? "#4caf50" // 60 이상: 초록
                                : rowData[header.field] >= 50
                                ? "#2196f3" // 50 이상: 파랑
                                : "#9e9e9e", // 50 이하: 회색
                            color:
                              rowData[header.field] >= 70 && rowData[header.field] < 80
                                ? "black" // 노란색일 때는 검은색 텍스트
                                : "white",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            minWidth: "35px",
                            height: "20px",
                          }}
                        />
                      </MKBox>
                    ) : header.field === "min_52w_gain_percent" ? (
                      // 52주상승률 컬럼
                      <MKBox display="flex" justifyContent="center">
                        <Chip
                          label={`${rowData[header.field] || 0}%`}
                          size="small"
                          sx={{
                            backgroundColor:
                              rowData[header.field] >= 300
                                ? "#f44336" // 300%이상 빨강
                                : rowData[header.field] >= 200
                                ? "#ff9800" // 200%이상 주황
                                : rowData[header.field] >= 100
                                ? "#ffeb3b" // 100%이상 노랑
                                : rowData[header.field] >= 75
                                ? "#4caf50" // 75%이상 녹색
                                : rowData[header.field] >= 50
                                ? "#2196f3" // 50%이상 파랑
                                : "#9e9e9e", // 50%미만 회색
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            minWidth: "40px",
                            height: "20px",
                          }}
                        />
                      </MKBox>
                    ) : header.field === "change" ? (
                      // 상승률 컬럼 (TopRising 페이지용)
                      <MKBox display="flex" justifyContent="center">
                        <Chip
                          label={`+${(rowData[header.field] || 0).toFixed(1)}%`}
                          size="small"
                          sx={{
                            backgroundColor:
                              rowData[header.field] >= 25
                                ? "#f44336" // 25% 이상: 빨강
                                : rowData[header.field] >= 20
                                ? "#ff5722" // 20% 이상: 주황
                                : rowData[header.field] >= 15
                                ? "#ffc107" // 15% 이상: 노랑
                                : rowData[header.field] >= 10
                                ? "#4caf50" // 10% 이상: 초록
                                : rowData[header.field] >= 5
                                ? "#2196f3" // 5% 이상: 파랑
                                : "#9e9e9e", // 5% 미만: 회색
                            color:
                              rowData[header.field] >= 15 && rowData[header.field] < 20
                                ? "black" // 노란색일 때는 검은색 텍스트
                                : "white",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            minWidth: "40px",
                            height: "20px",
                          }}
                        />
                      </MKBox>
                    ) : (
                      // 일반 데이터 컬럼
                      <MKBox display="flex" justifyContent="center" alignItems="center">
                        <MKTypography
                          variant="body2"
                          textAlign="center"
                          fontWeight="bold"
                          sx={{
                            fontSize: "0.75rem",
                            color:
                              typeof rowData[header.field] === "number" && rowData[header.field] < 0
                                ? "#1976d2"
                                : "inherit",
                          }}
                        >
                          {typeof rowData[header.field] === "number"
                            ? formatNumber(rowData[header.field])
                            : rowData[header.field] || "-"}
                        </MKTypography>
                      </MKBox>
                    )}
                  </Grid>
                ))}
              </Grid>
            </MKBox>
          );
        })}
      </MKBox>
    </>
  );
}

export default StockList;
