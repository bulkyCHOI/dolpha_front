import React from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import { formatNumber } from "utils/formatters";

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
          HTF 패턴 종목을 불러오는 중...
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
            HTF 데이터 로드 중 오류가 발생했습니다
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
          textAlign: "center",
        }}
      >
        <MKBox>
          <MKTypography variant="h6" color="text" sx={{ mb: 1 }}>
            HTF 패턴 종목이 없습니다
          </MKTypography>
          <MKTypography variant="body2" color="text.secondary">
            조건에 맞는 HTF 패턴을 가진 종목이 없습니다.
            <br />
            필터 조건을 조정해 보세요.
          </MKTypography>
        </MKBox>
      </MKBox>
    );
  }

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
          <Grid item xs={3}>
            <MKTypography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              종목명
            </MKTypography>
          </Grid>
          <Grid item xs={2.5}>
            <MKTypography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              상승률
            </MKTypography>
          </Grid>
          <Grid item xs={2.5}>
            <MKTypography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              조정폭
            </MKTypography>
          </Grid>
          <Grid item xs={2}>
            <MKTypography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.65rem", md: "0.8rem" } }}
            >
              시작일
            </MKTypography>
          </Grid>
          <Grid item xs={2}>
            <MKTypography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
            >
              상태
            </MKTypography>
          </Grid>
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
        {stocks.map((stock, rowIndex) => {
          const statusChip = getStatusChip(stock.htf_current_status);
          
          return (
            <MKBox
              key={stock.code || rowIndex}
              onClick={() => onStockClick(stock)}
              sx={{
                p: 0.5,
                borderBottom: rowIndex === stocks.length - 1 ? "none" : "1px solid #f0f0f0",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor:
                  selectedStock?.code === stock.code
                    ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                    : rowIndex % 2 === 0
                    ? "#fafafa"
                    : "white",
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                  transform: "translateX(4px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: "3px solid #667eea",
                },
                ...(selectedStock?.code === stock.code && {
                  borderLeft: "3px solid #667eea",
                  boxShadow: "0 2px 12px rgba(102, 126, 234, 0.2)",
                }),
              }}
            >
              <Grid container spacing={0} alignItems="center">
                {/* 종목명 */}
                <Grid item xs={3}>
                  <MKBox>
                    <MKTypography
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
                    </MKTypography>
                    <MKTypography
                      variant="caption"
                      color="text"
                      sx={{
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {stock.code || ""}
                    </MKTypography>
                  </MKBox>
                </Grid>

                {/* 8주 상승률 */}
                <Grid item xs={2.5}>
                  <MKBox display="flex" justifyContent="center">
                    <Chip
                      label={`${Math.round(stock.htf_8week_gain || 0)}%`}
                      size="small"
                      sx={{
                        backgroundColor: getGainColor(stock.htf_8week_gain || 0),
                        color: "white",
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
                  </MKBox>
                </Grid>

                {/* 최대 조정폭 */}
                <Grid item xs={2.5}>
                  <MKBox display="flex" justifyContent="center" alignItems="center">
                    <Chip
                      label={`${Math.round(stock.htf_max_pullback || 0)}%`}
                      size="small"
                      sx={{
                        backgroundColor: getPullbackColor(stock.htf_max_pullback || 0),
                        color: stock.htf_max_pullback <= 20 ? "white" : "black",
                        fontWeight: "bold",
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        minWidth: { xs: "35px", md: "40px" },
                        height: { xs: "28px", md: "20px" },
                      }}
                    />
                  </MKBox>
                </Grid>

                {/* 패턴 시작일 */}
                <Grid item xs={2}>
                  <MKBox display="flex" justifyContent="center" alignItems="center">
                    <MKTypography
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
                    </MKTypography>
                  </MKBox>
                </Grid>

                {/* 현재 상태 */}
                <Grid item xs={2}>
                  <MKBox display="flex" justifyContent="center" alignItems="center">
                    <Chip
                      label={statusChip.text}
                      size="small"
                      sx={{
                        backgroundColor: statusChip.color,
                        color: "white",
                        fontWeight: "bold",
                        fontSize: { xs: "0.6rem", md: "0.7rem" },
                        minWidth: { xs: "30px", md: "35px" },
                        height: { xs: "28px", md: "20px" },
                      }}
                    />
                  </MKBox>
                </Grid>
              </Grid>
            </MKBox>
          );
        })}
      </MKBox>
    </>
  );
}

export default HTFStockList;