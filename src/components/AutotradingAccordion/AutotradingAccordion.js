import React, { useState, useEffect } from "react";
import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  IconButton,
  Chip,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Tooltip,
  Button,
} from "@mui/material";
import { ExpandMore, Refresh, Delete, Save } from "@mui/icons-material";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import { adjustToKRXTickSize, getKRXTickSize } from "utils/formatters";

/**
 * 자동매매 아코디언 컴포넌트
 */
const AutotradingAccordion = ({
  autotradingList,
  expandedAccordion,
  onAccordionChange,
  onToggle,
  onDelete,
  onRefresh,
  onStockSelect,
  selectedStock,
  showSnackbar,
  authenticatedFetch,
  tradingForm,
  strategyType = 'mtt', // 'mtt' 또는 'weekly_high'
}) => {
  // tradingForm에서 상태와 핸들러 가져오기
  const {
    tradingMode,
    maxLoss,
    stopLoss,
    takeProfit,
    pyramidingCount,
    entryPoint,
    pyramidingEntries,
    positions,
    positionSum,
    setTradingMode,
    setMaxLoss,
    setStopLoss,
    setTakeProfit,
    setPyramidingCount,
    setEntryPoint,
    handleTradingModeChange,
    handlePyramidingCountChange,
    handlePyramidingEntryChange,
    handlePositionChange,
    handleEqualDivision,
    loadAutobotConfig,
    getMissingFields,
    isFormValid,
    saveAutotradingConfig,
    resetTradingForm,
  } = tradingForm;

  // 아코디언 변경 핸들러
  const handleAccordionChange = (stockCode) => (event, isExpanded) => {
    onAccordionChange(isExpanded ? stockCode : null);
    if (isExpanded) {
      // 아코디언이 확장될 때 해당 주식 선택 및 설정 로드
      const stock = autotradingList.find((config) => config.stock_code === stockCode);
      if (stock) {
        onStockSelect({
          code: stock.stock_code,
          name: stock.stock_name,
        });
        // tradingForm의 loadAutobotConfig 함수 사용
        loadAutobotConfig(stockCode);
      } else if (selectedStock && selectedStock.code === stockCode) {
        // 신규 종목인 경우 이미 선택된 종목 사용
        onStockSelect(selectedStock);
        // 신규이므로 설정 로드 시도 불필요
      }
    }
  };

  // 자동매매 설정 저장 핸들러
  const handleSaveConfig = async () => {
    const result = await saveAutotradingConfig(autotradingList);
    if (result) {
      onRefresh(); // 자동매매 목록 새로고침
    }
  };

  return (
    <MKBox>
      {/* 자동매매 설정이 없는 경우 */}
      {autotradingList.length === 0 ? (
        selectedStock ? (
          /* 선택된 종목이 있으면 신규 아코디언 표시 - 기존 UI와 동일 */
          <Accordion
            key={`new-${selectedStock.code}`}
            expanded={expandedAccordion === selectedStock.code}
            onChange={handleAccordionChange(selectedStock.code)}
            sx={{ mb: 1 }}
            data-accordion-id={selectedStock.code}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: "rgba(33, 150, 243, 0.1)", // 파란색 배경
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.2)",
                },
                borderRadius: expandedAccordion === selectedStock.code ? "4px 4px 0 0" : "4px",
              }}
            >
              <MKBox sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Chip
                  label="신규"
                  size="small"
                  color="info"
                  sx={{ fontSize: "0.7rem", height: "20px" }}
                />
                <MKBox sx={{ flex: 1 }}>
                  <MKTypography variant="h6" fontWeight="bold">
                    {selectedStock.name || "알 수 없음"} ({selectedStock.code || "000000"})
                  </MKTypography>
                </MKBox>
              </MKBox>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: "#ffffff", position: "relative" }}>
              {/* 우측 상단 컨트롤 영역 - 신규이므로 초기화 버튼만 */}
              <MKBox
                sx={{
                  position: { xs: "relative", md: "absolute" },
                  top: { xs: 0, md: 16 },
                  right: { xs: 0, md: 16 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-end", md: "flex-start" },
                  gap: { xs: 2, md: 1 },
                  zIndex: 1,
                  mb: { xs: 2, md: 0 },
                }}
              >
                <Tooltip title="설정 초기화">
                  <IconButton
                    size="small"
                    onClick={() => {
                      resetTradingForm();
                      showSnackbar("설정이 초기화되었습니다.", "info");
                    }}
                    sx={{
                      color: "#667eea",
                      minWidth: { xs: "48px", md: "32px" },
                      minHeight: { xs: "48px", md: "32px" },
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.1)",
                      },
                    }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              </MKBox>

              {/* 매매 방식 선택 */}
              <MKBox sx={{ mb: 3 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={tradingMode}
                    onChange={handleTradingModeChange}
                    sx={{
                      "& .MuiFormControlLabel-root": {
                        margin: "0 16px 0 0",
                      },
                      "& .MuiRadio-root": {
                        color: "#667eea",
                        "&.Mui-checked": {
                          color: "#667eea",
                        },
                      },
                    }}
                    row
                  >
                    <FormControlLabel
                      value="manual"
                      control={<Radio size="small" />}
                      label={
                        <MKTypography sx={{ fontSize: { xs: "1rem", md: "0.875rem" } }}>
                          Manual
                        </MKTypography>
                      }
                    />
                    <FormControlLabel
                      value="turtle"
                      control={<Radio size="small" />}
                      label={
                        <MKTypography sx={{ fontSize: { xs: "1rem", md: "0.875rem" } }}>
                          Turtle(ATR)
                        </MKTypography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </MKBox>

              {/* 설정 폼 */}
              <MKBox sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* 진입시점 */}
                <MKBox sx={{ position: "relative" }}>
                  <TextField
                    label="진입시점 (원)"
                    value={entryPoint}
                    onChange={(e) => {
                      const adjustedValue = adjustToKRXTickSize(e.target.value);
                      setEntryPoint(adjustedValue.toString());
                    }}
                    size="small"
                    type="number"
                    inputProps={{ step: getKRXTickSize(entryPoint) }}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
                      },
                    }}
                  />
                </MKBox>

                {/* 최대손실 */}
                <TextField
                  label="최대손실 (%)"
                  value={maxLoss}
                  onChange={(e) => setMaxLoss(e.target.value)}
                  size="small"
                  type="number"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />

                {/* 손절 */}
                <TextField
                  label={`손절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  size="small"
                  type="number"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />

                {/* 익절 */}
                <TextField
                  label={`익절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  size="small"
                  type="number"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />

                {/* 피라미딩 횟수 */}
                <TextField
                  label="피라미딩횟수 (회)"
                  value={pyramidingCount}
                  onChange={handlePyramidingCountChange}
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: 6 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />

                {/* 피라미딩 설정 */}
                <MKBox>
                  <MKBox
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <MKTypography variant="subtitle2" fontWeight="bold">
                      피라미딩 설정
                    </MKTypography>
                    <MKBox sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MKTypography
                        variant="caption"
                        sx={{
                          color: Math.abs(positionSum - 100) >= 0.01 ? "#f44336" : "#4caf50",
                          fontWeight: "bold",
                        }}
                      >
                        포지션 합계: {positionSum.toFixed(1)}%
                      </MKTypography>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={handleEqualDivision}
                        sx={{
                          minWidth: "auto",
                          fontSize: "0.75rem",
                          padding: "4px 8px",
                          borderColor: "#667eea",
                          color: "#667eea",
                          "&:hover": {
                            borderColor: "#5a6fd8",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                          },
                        }}
                      >
                        균등분할
                      </Button>
                    </MKBox>
                  </MKBox>

                  {/* 포지션 합계 경고 */}
                  {Math.abs(positionSum - 100) >= 0.01 && (
                    <MKBox
                      sx={{
                        p: 1,
                        bgcolor: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <MKTypography variant="caption" sx={{ color: "#856404", fontWeight: "bold" }}>
                        ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                      </MKTypography>
                    </MKBox>
                  )}

                  {/* 1차 진입시점과 포지션 */}
                  <Grid container spacing={{ xs: 2, sm: 1 }} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="1차 진입시점 (원)"
                        value={entryPoint}
                        onChange={(e) => {
                          const adjustedValue = adjustToKRXTickSize(e.target.value);
                          setEntryPoint(adjustedValue.toString());
                        }}
                        size="small"
                        type="number"
                        inputProps={{ step: getKRXTickSize(entryPoint) }}
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "#667eea",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#667eea",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="1차 포지션 (%)"
                        value={positions[0] || ""}
                        onChange={(e) => handlePositionChange(0, e.target.value)}
                        size="small"
                        type="number"
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "#667eea",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#667eea",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {Math.max(pyramidingCount, pyramidingEntries.length) > 0 &&
                    pyramidingEntries.map((entry, index) => (
                      <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={`${index + 2}차 진입시점 (%)`}
                            value={entry}
                            onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                            size="small"
                            type="number"
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": {
                                  borderColor: "#667eea",
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={`${index + 2}차 포지션 (%)`}
                            value={positions[index + 1] || ""}
                            onChange={(e) => handlePositionChange(index + 1, e.target.value)}
                            size="small"
                            type="number"
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": {
                                  borderColor: "#667eea",
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    ))}
                </MKBox>

                {/* 실행 버튼 */}
                <MKBox sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveConfig}
                    disabled={!isFormValid()}
                    sx={{
                      flex: 1,
                      background: isFormValid()
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#ccc",
                      color: "white !important",
                      "&:hover": {
                        background: isFormValid()
                          ? "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                          : "#ccc",
                        color: "white !important",
                      },
                      "&:disabled": {
                        background: "#ccc !important",
                        color: "white !important",
                      },
                      "&.Mui-disabled": {
                        background: "#ccc !important",
                        color: "white !important",
                      },
                    }}
                  >
                    설정 저장
                  </Button>
                </MKBox>
              </MKBox>
            </AccordionDetails>
          </Accordion>
        ) : (
          /* 선택된 종목이 없으면 기존 메시지 표시 */
          <MKBox
            sx={{
              textAlign: "center",
              py: 4,
              bgcolor: "grey.50",
              borderRadius: 2,
            }}
          >
            <MKTypography variant="body1" color="text.secondary">
              설정된 자동매매가 없습니다.
            </MKTypography>
            <MKTypography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              종목을 선택하고 설정을 저장해보세요.
            </MKTypography>
          </MKBox>
        )
      ) : (
        /* 자동매매 설정 아코디언 목록 */
        <MKBox>
          {/* 현재 선택된 종목이 목록에 없는 경우 신규 아코디언 추가 */}
          {selectedStock &&
            !autotradingList.find((config) => config.stock_code === selectedStock.code) && (
              <Accordion
                key={`new-${selectedStock.code}`}
                expanded={expandedAccordion === selectedStock.code}
                onChange={handleAccordionChange(selectedStock.code)}
                sx={{ mb: 1 }}
                data-accordion-id={selectedStock.code}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    backgroundColor: "rgba(33, 150, 243, 0.1)", // 파란색 배경
                    "&:hover": {
                      backgroundColor: "rgba(33, 150, 243, 0.2)",
                    },
                    borderRadius: expandedAccordion === selectedStock.code ? "4px 4px 0 0" : "4px",
                  }}
                  onClick={() => {
                    onStockSelect(selectedStock);
                  }}
                >
                  <MKBox sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Chip
                      label="신규"
                      size="small"
                      color="info"
                      sx={{ fontSize: "0.7rem", height: "20px" }}
                    />
                    <MKBox sx={{ flex: 1 }}>
                      <MKTypography variant="h6" fontWeight="bold">
                        {selectedStock.name || "알 수 없음"} ({selectedStock.code || "000000"})
                      </MKTypography>
                    </MKBox>
                  </MKBox>
                </AccordionSummary>

                <AccordionDetails sx={{ backgroundColor: "#ffffff", position: "relative" }}>
                  {/* 우측 상단 컨트롤 영역 - 신규이므로 초기화 버튼만 */}
                  <MKBox
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      zIndex: 1,
                    }}
                  >
                    {/* 초기화 버튼 */}
                    <Tooltip title="설정 초기화">
                      <IconButton
                        size="small"
                        onClick={() => {
                          resetTradingForm();
                          showSnackbar("설정이 초기화되었습니다.", "info");
                        }}
                        sx={{
                          color: "#667eea",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                          },
                        }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </MKBox>

                  {/* 매매 방식 선택 */}
                  <MKBox sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={tradingMode}
                        onChange={handleTradingModeChange}
                        sx={{
                          "& .MuiFormControlLabel-root": {
                            margin: "0 16px 0 0",
                          },
                          "& .MuiRadio-root": {
                            color: "#667eea",
                            "&.Mui-checked": {
                              color: "#667eea",
                            },
                          },
                        }}
                        row
                      >
                        <FormControlLabel
                          value="manual"
                          control={<Radio size="small" />}
                          label="Manual"
                        />
                        <FormControlLabel
                          value="turtle"
                          control={<Radio size="small" />}
                          label="Turtle(ATR)"
                        />
                      </RadioGroup>
                    </FormControl>
                  </MKBox>

                  {/* 설정 폼 */}
                  <MKBox sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* 진입시점 */}
                    <MKBox sx={{ position: "relative" }}>
                      <TextField
                        label="진입시점 (원)"
                        value={entryPoint}
                        onChange={(e) => {
                          const adjustedValue = adjustToKRXTickSize(e.target.value);
                          setEntryPoint(adjustedValue.toString());
                        }}
                        size="small"
                        type="number"
                        inputProps={{ step: getKRXTickSize(entryPoint) }}
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "#667eea",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#667eea",
                          },
                        }}
                      />
                    </MKBox>

                    {/* 최대손실 */}
                    <TextField
                      label="최대손실 (%)"
                      value={maxLoss}
                      onChange={(e) => setMaxLoss(e.target.value)}
                      size="small"
                      type="number"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#667eea",
                        },
                      }}
                    />

                    {/* 손절 */}
                    <TextField
                      label={`손절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      size="small"
                      type="number"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#667eea",
                        },
                      }}
                    />

                    {/* 익절 */}
                    <TextField
                      label={`익절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      size="small"
                      type="number"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#667eea",
                        },
                      }}
                    />

                    {/* 피라미딩 횟수 */}
                    <TextField
                      label="피라미딩횟수 (회)"
                      value={pyramidingCount}
                      onChange={handlePyramidingCountChange}
                      size="small"
                      type="number"
                      inputProps={{ min: 0, max: 6 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#667eea",
                        },
                      }}
                    />

                    {/* 피라미딩 설정 */}
                    <MKBox>
                      <MKBox
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <MKTypography variant="subtitle2" fontWeight="bold">
                          피라미딩 설정
                        </MKTypography>
                        <MKBox sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <MKTypography
                            variant="caption"
                            sx={{
                              color: Math.abs(positionSum - 100) >= 0.01 ? "#f44336" : "#4caf50",
                              fontWeight: "bold",
                            }}
                          >
                            포지션 합계: {positionSum.toFixed(1)}%
                          </MKTypography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={handleEqualDivision}
                            sx={{
                              minWidth: "auto",
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              borderColor: "#667eea",
                              color: "#667eea",
                              "&:hover": {
                                borderColor: "#5a6fd8",
                                backgroundColor: "rgba(102, 126, 234, 0.04)",
                              },
                            }}
                          >
                            균등분할
                          </Button>
                        </MKBox>
                      </MKBox>

                      {/* 포지션 합계 경고 */}
                      {Math.abs(positionSum - 100) >= 0.01 && (
                        <MKBox
                          sx={{
                            p: 1,
                            bgcolor: "#fff3cd",
                            border: "1px solid #ffeaa7",
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <MKTypography
                            variant="caption"
                            sx={{ color: "#856404", fontWeight: "bold" }}
                          >
                            ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                          </MKTypography>
                        </MKBox>
                      )}

                      {/* 1차 진입시점과 포지션 */}
                      <Grid container spacing={{ xs: 2, sm: 1 }} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <TextField
                            label="1차 진입시점 (원)"
                            value={entryPoint}
                            onChange={(e) => {
                              const adjustedValue = adjustToKRXTickSize(e.target.value);
                              setEntryPoint(adjustedValue.toString());
                            }}
                            size="small"
                            type="number"
                            inputProps={{ step: getKRXTickSize(entryPoint) }}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": {
                                  borderColor: "#667eea",
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="1차 포지션 (%)"
                            value={positions[0] || ""}
                            onChange={(e) => handlePositionChange(0, e.target.value)}
                            size="small"
                            type="number"
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": {
                                  borderColor: "#667eea",
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* 피라미딩 진입시점과 포지션 */}
                      {pyramidingCount > 0 &&
                        pyramidingEntries.map((entry, index) => (
                          <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <TextField
                                label={`${index + 2}차 진입시점 (%)`}
                                value={entry}
                                onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                                size="small"
                                type="number"
                                sx={{
                                  width: "100%",
                                  "& .MuiOutlinedInput-root": {
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#667eea",
                                    },
                                  },
                                  "& .MuiInputLabel-root.Mui-focused": {
                                    color: "#667eea",
                                  },
                                }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label={`${index + 2}차 포지션 (%)`}
                                value={positions[index + 1] || ""}
                                onChange={(e) => handlePositionChange(index + 1, e.target.value)}
                                size="small"
                                type="number"
                                sx={{
                                  width: "100%",
                                  "& .MuiOutlinedInput-root": {
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#667eea",
                                    },
                                  },
                                  "& .MuiInputLabel-root.Mui-focused": {
                                    color: "#667eea",
                                  },
                                }}
                              />
                            </Grid>
                          </Grid>
                        ))}
                    </MKBox>

                    {/* 실행 버튼 */}
                    <MKBox sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveConfig} // 신규이므로 null 전달
                        disabled={!isFormValid()}
                        sx={{
                          flex: 1,
                          background: isFormValid()
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "#ccc",
                          color: "white !important",
                          "&:hover": {
                            background: isFormValid()
                              ? "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                              : "#ccc",
                            color: "white !important",
                          },
                          "&:disabled": {
                            background: "#ccc !important",
                            color: "white !important",
                          },
                          "&.Mui-disabled": {
                            background: "#ccc !important",
                            color: "white !important",
                          },
                        }}
                      >
                        설정 저장
                      </Button>
                    </MKBox>
                  </MKBox>
                </AccordionDetails>
              </Accordion>
            )}

          {/* 기존 자동매매 설정 목록 */}
          {autotradingList.map((stockConfig) => (
            <Accordion
              key={stockConfig.stock_code}
              expanded={expandedAccordion === stockConfig.stock_code}
              onChange={handleAccordionChange(stockConfig.stock_code)}
              sx={{ mb: 1 }}
              data-accordion-id={stockConfig.stock_code}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  backgroundColor: (() => {
                    if (!stockConfig.hasConfig) return "#f8f9fa";
                    if (stockConfig.is_active) return "rgba(76, 175, 80, 0.1)";
                    return "rgba(158, 158, 158, 0.1)";
                  })(),
                  "&:hover": {
                    backgroundColor: (() => {
                      if (!stockConfig.hasConfig) return "#e9ecef";
                      if (stockConfig.is_active) return "rgba(76, 175, 80, 0.2)";
                      return "rgba(158, 158, 158, 0.2)";
                    })(),
                  },
                  borderRadius:
                    expandedAccordion === stockConfig.stock_code ? "4px 4px 0 0" : "4px",
                }}
                onClick={() => {
                  if (selectedStock?.code !== stockConfig.stock_code) {
                    onStockSelect({
                      code: stockConfig.stock_code,
                      name: stockConfig.stock_name,
                    });
                  }
                }}
              >
                <MKBox sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  {stockConfig.trading_mode || stockConfig.stop_loss || stockConfig.take_profit ? (
                    <Chip
                      label={stockConfig.is_active ? "활성" : "비활성"}
                      size="small"
                      color={stockConfig.is_active ? "success" : "default"}
                      sx={{
                        fontSize: "0.7rem",
                        height: "20px",
                        backgroundColor: !stockConfig.is_active ? "#9e9e9e" : undefined,
                        color: !stockConfig.is_active ? "white" : undefined,
                      }}
                    />
                  ) : (
                    <Chip
                      label="신규"
                      size="small"
                      color="info"
                      sx={{ fontSize: "0.7rem", height: "20px" }}
                    />
                  )}
                  <MKBox sx={{ flex: 1 }}>
                    <MKTypography variant="h6" fontWeight="bold">
                      {stockConfig.stock_name || "알 수 없음"} ({stockConfig.stock_code || "000000"}
                      )
                    </MKTypography>
                    {(stockConfig.trading_mode ||
                      stockConfig.stop_loss ||
                      stockConfig.take_profit) && (
                      <MKBox sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                        <MKTypography variant="caption" color="text">
                          진입:{" "}
                          {stockConfig.entry_point
                            ? `${Number(stockConfig.entry_point).toLocaleString()}원`
                            : "-"}
                        </MKTypography>
                        <MKTypography variant="caption" color="text">
                          손절:{" "}
                          {stockConfig.stop_loss
                            ? `${stockConfig.stop_loss}${
                                stockConfig.trading_mode === "manual" ? "%" : "ATR"
                              }`
                            : "-"}
                        </MKTypography>
                        <MKTypography variant="caption" color="text">
                          익절:{" "}
                          {stockConfig.take_profit
                            ? `${stockConfig.take_profit}${
                                stockConfig.trading_mode === "manual" ? "%" : "ATR"
                              }`
                            : "-"}
                        </MKTypography>
                        <MKTypography variant="caption" color="text">
                          피라미딩: {stockConfig.pyramiding_count || 0}회
                        </MKTypography>
                      </MKBox>
                    )}
                  </MKBox>
                </MKBox>
              </AccordionSummary>

              <AccordionDetails sx={{ backgroundColor: "#ffffff", position: "relative" }}>
                {/* 우측 상단 컨트롤 영역 */}
                {(stockConfig.trading_mode || stockConfig.stop_loss || stockConfig.take_profit) && (
                  <MKBox
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      zIndex: 1,
                    }}
                  >
                    {/* 활성화/비활성화 토글 */}
                    <MKBox sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <MKTypography variant="caption" sx={{ fontSize: "0.75rem" }}>
                        {stockConfig.is_active ? "ON" : "OFF"}
                      </MKTypography>
                      <Switch
                        checked={stockConfig.is_active}
                        onChange={() =>
                          onToggle(
                            stockConfig.stock_code,
                            stockConfig.stock_name,
                            stockConfig.is_active
                          )
                        }
                        size="small"
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#4caf50",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#4caf50",
                          },
                        }}
                      />
                    </MKBox>

                    {/* 초기화 버튼 */}
                    <Tooltip title="설정 초기화">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (selectedStock?.code === stockConfig.stock_code) {
                            resetTradingForm();
                            showSnackbar("설정이 초기화되었습니다.", "info");
                          }
                        }}
                        sx={{
                          color: "#667eea",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                          },
                        }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </MKBox>
                )}

                {/* 매매 방식 선택 */}
                <MKBox sx={{ mb: 3 }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={tradingMode}
                      onChange={handleTradingModeChange}
                      sx={{
                        "& .MuiFormControlLabel-root": {
                          margin: "0 16px 0 0",
                        },
                        "& .MuiRadio-root": {
                          color: "#667eea",
                          "&.Mui-checked": {
                            color: "#667eea",
                          },
                        },
                      }}
                      row
                    >
                      <FormControlLabel
                        value="manual"
                        control={<Radio size="small" />}
                        label="Manual"
                      />
                      <FormControlLabel
                        value="turtle"
                        control={<Radio size="small" />}
                        label="Turtle(ATR)"
                      />
                    </RadioGroup>
                  </FormControl>
                </MKBox>

                {/* 설정 폼 */}
                <MKBox sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* 진입시점 */}
                  <MKBox sx={{ position: "relative" }}>
                    <TextField
                      label="진입시점 (원)"
                      value={entryPoint}
                      onChange={(e) => {
                        const adjustedValue = adjustToKRXTickSize(e.target.value);
                        setEntryPoint(adjustedValue.toString());
                      }}
                      size="small"
                      type="number"
                      inputProps={{ step: getKRXTickSize(entryPoint) }}
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#667eea",
                        },
                      }}
                    />
                  </MKBox>

                  {/* 최대손실 */}
                  <TextField
                    label="최대손실 (%)"
                    value={maxLoss}
                    onChange={(e) => setMaxLoss(e.target.value)}
                    size="small"
                    type="number"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
                      },
                    }}
                  />

                  {/* 손절 */}
                  <TextField
                    label={`손절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    size="small"
                    type="number"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
                      },
                    }}
                  />

                  {/* 익절 */}
                  <TextField
                    label={`익절 (${tradingMode === "manual" ? "%" : "ATR"})`}
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    size="small"
                    type="number"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
                      },
                    }}
                  />

                  {/* 피라미딩 횟수 */}
                  <TextField
                    label="피라미딩횟수 (회)"
                    value={pyramidingCount}
                    onChange={handlePyramidingCountChange}
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: 6 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
                      },
                    }}
                  />

                  {/* 피라미딩 설정 */}
                  <MKBox>
                    <MKBox
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <MKTypography variant="subtitle2" fontWeight="bold">
                        피라미딩 설정
                      </MKTypography>
                      <MKBox sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <MKTypography
                          variant="caption"
                          sx={{
                            color: Math.abs(positionSum - 100) >= 0.01 ? "#f44336" : "#4caf50",
                            fontWeight: "bold",
                          }}
                        >
                          포지션 합계: {positionSum.toFixed(1)}%
                        </MKTypography>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={handleEqualDivision}
                          sx={{
                            minWidth: "auto",
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            borderColor: "#667eea",
                            color: "#667eea",
                            "&:hover": {
                              borderColor: "#5a6fd8",
                              backgroundColor: "rgba(102, 126, 234, 0.04)",
                            },
                          }}
                        >
                          균등분할
                        </Button>
                      </MKBox>
                    </MKBox>

                    {/* 포지션 합계 경고 */}
                    {Math.abs(positionSum - 100) >= 0.01 && (
                      <MKBox
                        sx={{
                          p: 1,
                          bgcolor: "#fff3cd",
                          border: "1px solid #ffeaa7",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <MKTypography
                          variant="caption"
                          sx={{ color: "#856404", fontWeight: "bold" }}
                        >
                          ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                        </MKTypography>
                      </MKBox>
                    )}

                    {/* 1차 진입시점과 포지션 */}
                    <Grid container spacing={{ xs: 2, sm: 1 }} sx={{ mb: 1 }}>
                      <Grid item xs={6}>
                        <TextField
                          label="1차 진입시점 (원)"
                          value={entryPoint}
                          onChange={(e) => {
                            const adjustedValue = adjustToKRXTickSize(e.target.value);
                            setEntryPoint(adjustedValue.toString());
                          }}
                          size="small"
                          type="number"
                          inputProps={{ step: getKRXTickSize(entryPoint) }}
                          sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              "&.Mui-focused fieldset": {
                                borderColor: "#667eea",
                              },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#667eea",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="1차 포지션 (%)"
                          value={positions[0] || ""}
                          onChange={(e) => handlePositionChange(0, e.target.value)}
                          size="small"
                          type="number"
                          sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              "&.Mui-focused fieldset": {
                                borderColor: "#667eea",
                              },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "#667eea",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* 피라미딩 진입시점과 포지션 */}
                    {pyramidingCount > 0 &&
                      pyramidingEntries.map((entry, index) => (
                        <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                          <Grid item xs={6}>
                            <TextField
                              label={`${index + 2}차 진입시점 (%)`}
                              value={entry}
                              onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                              size="small"
                              type="number"
                              sx={{
                                width: "100%",
                                "& .MuiOutlinedInput-root": {
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#667eea",
                                  },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#667eea",
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label={`${index + 2}차 포지션 (%)`}
                              value={positions[index + 1] || ""}
                              onChange={(e) => handlePositionChange(index + 1, e.target.value)}
                              size="small"
                              type="number"
                              sx={{
                                width: "100%",
                                "& .MuiOutlinedInput-root": {
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#667eea",
                                  },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#667eea",
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                      ))}
                  </MKBox>

                  {/* 실행 버튼 */}
                  <MKBox sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveConfig}
                      disabled={!isFormValid()}
                      sx={{
                        flex: 1,
                        background: isFormValid()
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "#ccc",
                        color: "white !important",
                        "&:hover": {
                          background: isFormValid()
                            ? "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                            : "#ccc",
                          color: "white !important",
                        },
                        "&:disabled": {
                          background: "#ccc !important",
                          color: "white !important",
                        },
                        "&.Mui-disabled": {
                          background: "#ccc !important",
                          color: "white !important",
                        },
                      }}
                    >
                      설정 저장
                    </Button>
                    {(stockConfig.trading_mode ||
                      stockConfig.stop_loss ||
                      stockConfig.take_profit) && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => onDelete(stockConfig.stock_code, stockConfig.stock_name)}
                        sx={{
                          flex: 1,
                          borderColor: "#f44336",
                          color: "#f44336",
                          "&:hover": {
                            borderColor: "#d32f2f",
                            backgroundColor: "rgba(244, 67, 54, 0.04)",
                          },
                        }}
                      >
                        설정 삭제
                      </Button>
                    )}
                  </MKBox>
                </MKBox>
              </AccordionDetails>
            </Accordion>
          ))}
        </MKBox>
      )}
    </MKBox>
  );
};

export default AutotradingAccordion;
