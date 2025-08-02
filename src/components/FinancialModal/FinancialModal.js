import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import { formatFinancialAmount } from "utils/formatters";

/**
 * 재무제표 모달 컴포넌트
 */
const FinancialModal = ({
  open,
  onClose,
  selectedStock,
  financialData,
  loading,
  error,
  onOpen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? "xl" : "md"}
      fullWidth
      fullScreen={isSmallMobile}
      PaperProps={{
        sx: {
          borderRadius: isSmallMobile ? 0 : 2,
          bgcolor: "background.paper",
          m: isSmallMobile ? 0 : 2,
          maxHeight: isSmallMobile ? "100vh" : "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <MKTypography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
          재무제표 {selectedStock && `- ${selectedStock.name} (${selectedStock.code})`}
        </MKTypography>
        <IconButton
          onClick={onClose}
          color="default"
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {loading ? (
          <MKBox
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              flexDirection: "column",
            }}
          >
            <CircularProgress size={40} />
            <MKTypography variant="body2" mt={2} color="text">
              재무제표 데이터를 로드하는 중...
            </MKTypography>
          </MKBox>
        ) : error ? (
          <MKBox
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              flexDirection: "column",
            }}
          >
            <MKTypography variant="h6" color="error" mb={2}>
              오류가 발생했습니다
            </MKTypography>
            <MKTypography variant="body2" color="text" textAlign="center">
              {error}
            </MKTypography>
          </MKBox>
        ) : financialData && financialData.length > 0 ? (
          <>
            {/* 손익계산서 */}
            <MKBox sx={{ mb: 3 }}>
              <MKTypography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight="bold"
                sx={{ mb: 2, color: "info" }}
              >
                손익계산서
              </MKTypography>
              <TableContainer component={Paper} sx={{ boxShadow: 1, mb: 2, overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: isMobile ? 500 : 700 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50", display: "flex", width: "100%" }}>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          flex: isMobile ? 1.5 : 2,
                          fontSize: isMobile ? "0.75rem" : "inherit",
                          p: isMobile ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        항목
                      </TableCell>
                      {/* 최신 5개 분기 (백엔드에서 이미 과거~현재 순으로 정렬됨) */}
                      {[
                        ...new Set(
                          (financialData || []).map((item) => `${item.year} ${item.quarter}`)
                        ),
                      ]
                        .slice(-5)
                        .map((period) => (
                          <TableCell
                            key={period}
                            sx={{
                              fontWeight: "bold",
                              flex: 1,
                              textAlign: "right",
                              fontSize: isMobile ? "0.7rem" : "inherit",
                              p: isMobile ? 0.5 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            {period}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* 손익계산서 항목들 */}
                    {[
                      ...new Set(
                        financialData
                          .filter((item) => item.statement_type === "손익계산서")
                          .map((item) => item.account_name)
                      ),
                    ].map((accountName) => (
                      <TableRow
                        key={accountName}
                        sx={{
                          "&:nth-of-type(odd)": { bgcolor: "grey.25" },
                          display: "flex",
                          width: "100%",
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: "medium",
                            flex: isMobile ? 1.5 : 2,
                            fontSize: isMobile ? "0.7rem" : "inherit",
                            p: isMobile ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {accountName}
                        </TableCell>
                        {[
                          ...new Set(
                            (financialData || []).map((item) => `${item.year} ${item.quarter}`)
                          ),
                        ]
                          .sort((a, b) => {
                            const [yearA, quarterA] = a.split(" ");
                            const [yearB, quarterB] = b.split(" ");
                            if (yearA !== yearB) return yearA - yearB;
                            // 분기 오름차순 (1Q > 2Q > 3Q > 4Q)
                            const quarterOrder = { "1Q": 1, "2Q": 2, "3Q": 3, "4Q": 4 };
                            return (quarterOrder[quarterA] || 0) - (quarterOrder[quarterB] || 0);
                          })
                          .slice(-5)
                          .map((period) => {
                            const [year, quarter] = period.split(" ");
                            const item = (financialData || []).find(
                              (d) =>
                                d.year === year &&
                                d.quarter === quarter &&
                                d.account_name === accountName &&
                                d.statement_type === "손익계산서"
                            );
                            return (
                              <TableCell
                                key={period}
                                sx={{
                                  flex: 1,
                                  textAlign: "right",
                                  fontSize: isMobile ? "0.65rem" : "inherit",
                                  p: isMobile ? 0.5 : 1,
                                  color: item && item.amount < 0 ? "#1976d2" : "inherit",
                                  fontWeight: item && item.amount < 0 ? "bold" : "normal",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                }}
                              >
                                {item ? formatFinancialAmount(item.amount) : "-"}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MKBox>

            {/* 재무상태표 */}
            <MKBox sx={{ mb: 2 }}>
              <MKTypography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight="bold"
                sx={{ mb: 2, color: "info" }}
              >
                재무상태표
              </MKTypography>
              <TableContainer component={Paper} sx={{ boxShadow: 1, overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: isMobile ? 500 : 700 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50", display: "flex", width: "100%" }}>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          flex: isMobile ? 1.5 : 2,
                          fontSize: isMobile ? "0.75rem" : "inherit",
                          p: isMobile ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        항목
                      </TableCell>
                      {/* 최신 5개 분기 (백엔드에서 이미 과거~현재 순으로 정렬됨) */}
                      {[
                        ...new Set(
                          (financialData || []).map((item) => `${item.year} ${item.quarter}`)
                        ),
                      ]
                        .slice(-5)
                        .map((period) => (
                          <TableCell
                            key={period}
                            sx={{
                              fontWeight: "bold",
                              flex: 1,
                              textAlign: "right",
                              fontSize: isMobile ? "0.7rem" : "inherit",
                              p: isMobile ? 0.5 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            {period}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      ...new Set(
                        financialData
                          .filter((item) => item.statement_type === "재무상태표")
                          .map((item) => item.account_name)
                      ),
                    ].map((accountName) => (
                      <TableRow
                        key={accountName}
                        sx={{
                          "&:nth-of-type(odd)": { bgcolor: "grey.25" },
                          display: "flex",
                          width: "100%",
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: "medium",
                            flex: isMobile ? 1.5 : 2,
                            fontSize: isMobile ? "0.7rem" : "inherit",
                            p: isMobile ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {accountName}
                        </TableCell>
                        {[
                          ...new Set(
                            (financialData || []).map((item) => `${item.year} ${item.quarter}`)
                          ),
                        ]
                          .sort((a, b) => {
                            const [yearA, quarterA] = a.split(" ");
                            const [yearB, quarterB] = b.split(" ");
                            if (yearA !== yearB) return yearA - yearB;
                            // 분기 오름차순 (1Q > 2Q > 3Q > 4Q)
                            const quarterOrder = { "1Q": 1, "2Q": 2, "3Q": 3, "4Q": 4 };
                            return (quarterOrder[quarterA] || 0) - (quarterOrder[quarterB] || 0);
                          })
                          .slice(-5)
                          .map((period) => {
                            const [year, quarter] = period.split(" ");
                            const item = (financialData || []).find(
                              (d) =>
                                d.year === year &&
                                d.quarter === quarter &&
                                d.account_name === accountName &&
                                d.statement_type === "재무상태표"
                            );
                            return (
                              <TableCell
                                key={period}
                                sx={{
                                  flex: 1,
                                  textAlign: "right",
                                  fontSize: isMobile ? "0.65rem" : "inherit",
                                  p: isMobile ? 0.5 : 1,
                                  color: item && item.amount < 0 ? "#1976d2" : "inherit",
                                  fontWeight: item && item.amount < 0 ? "bold" : "normal",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                }}
                              >
                                {item ? formatFinancialAmount(item.amount) : "-"}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MKBox>
          </>
        ) : (
          <MKBox
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              flexDirection: "column",
            }}
          >
            <MKTypography variant="h6" color="text">
              재무제표 데이터가 없습니다
            </MKTypography>
            <MKTypography variant="body2" color="text" mt={1}>
              선택된 종목의 재무제표 정보를 찾을 수 없습니다
            </MKTypography>
          </MKBox>
        )}

        <MKBox sx={{ mt: 2, p: 1, bgcolor: "info.main", borderRadius: 1 }}>
          <MKTypography
            variant="caption"
            color="white"
            sx={{ fontSize: isMobile ? "0.65rem" : "inherit" }}
          >
            * 금액 단위: 원 (조/억/만 단위로 표시)
          </MKTypography>
        </MKBox>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialModal;
