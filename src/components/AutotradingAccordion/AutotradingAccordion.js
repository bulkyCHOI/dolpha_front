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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { adjustToKRXTickSize, getKRXTickSize } from "utils/formatters";
import { COLORS } from "constants/styles";

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
  strategyType = "mtt", // 'mtt' 또는 'weekly_high'
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
    <Box>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Chip
                  label="신규"
                  size="small"
                  color="info"
                  sx={{ fontSize: "0.7rem", height: "20px" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedStock.name || "알 수 없음"} ({selectedStock.code || "000000"})
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: COLORS.SURFACE, position: "relative" }}>
              {/* 우측 상단 컨트롤 영역 - 신규이므로 초기화 버튼만 */}
              <Box
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
                      color: COLORS.PRIMARY,
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
              </Box>

              {/* 매매 방식 선택 */}
              <Box sx={{ mb: 3 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={tradingMode}
                    onChange={handleTradingModeChange}
                    sx={{
                      "& .MuiFormControlLabel-root": {
                        margin: "0 16px 0 0",
                      },
                      "& .MuiRadio-root": {
                        color: COLORS.PRIMARY,
                        "&.Mui-checked": {
                          color: COLORS.PRIMARY,
                        },
                      },
                    }}
                    row
                  >
                    <FormControlLabel
                      value="manual"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: { xs: "1rem", md: "0.875rem" } }}>
                          Manual
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="turtle"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: { xs: "1rem", md: "0.875rem" } }}>
                          Turtle(ATR)
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* 설정 폼 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* 진입시점 */}
                <Box sx={{ position: "relative" }}>
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
                          borderColor: COLORS.PRIMARY,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: COLORS.PRIMARY,
                      },
                    }}
                  />
                </Box>

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
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.PRIMARY,
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
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.PRIMARY,
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
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.PRIMARY,
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
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.PRIMARY,
                    },
                  }}
                />

                {/* 피라미딩 설정 */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      피라미딩 설정
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: Math.abs(positionSum - 100) >= 0.01 ? COLORS.UP : COLORS.SUCCESS,
                          fontWeight: "bold",
                        }}
                      >
                        포지션 합계: {positionSum.toFixed(1)}%
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={handleEqualDivision}
                        sx={{
                          minWidth: "auto",
                          fontSize: "0.75rem",
                          padding: "4px 8px",
                          borderColor: COLORS.PRIMARY,
                          color: COLORS.PRIMARY,
                          "&:hover": {
                            borderColor: COLORS.PRIMARY_HOVER,
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                          },
                        }}
                      >
                        균등분할
                      </Button>
                    </Box>
                  </Box>

                  {/* 포지션 합계 경고 */}
                  {Math.abs(positionSum - 100) >= 0.01 && (
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: `${COLORS.TINT_WARNING}`,
                        border: `1px solid ${COLORS.TINT_WARNING}`,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: COLORS.WARNING, fontWeight: "bold" }}>
                        ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                      </Typography>
                    </Box>
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
                              borderColor: COLORS.PRIMARY,
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: COLORS.PRIMARY,
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
                              borderColor: COLORS.PRIMARY,
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: COLORS.PRIMARY,
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
                            label={`${index + 2}차 진입시점 (${tradingMode === "manual" ? "%" : "ATR"})`}
                            value={entry}
                            onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                            size="small"
                            type="number"
                            inputProps={{ step: tradingMode === "manual" ? 0.1 : 1 }}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": {
                                  borderColor: COLORS.PRIMARY,
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: COLORS.PRIMARY,
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
                                  borderColor: COLORS.PRIMARY,
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: COLORS.PRIMARY,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    ))}
                </Box>

                {/* 실행 버튼 */}
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveConfig}
                    disabled={!isFormValid()}
                    sx={{
                      flex: 1,
                      background: isFormValid()
                        ? `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`
                        : COLORS.BORDER_STRONG,
                      color: "white !important",
                      "&:hover": {
                        background: isFormValid()
                          ? `linear-gradient(135deg, ${COLORS.PRIMARY_HOVER} 0%, #6a4190 100%)`
                          : COLORS.BORDER_STRONG,
                        color: "white !important",
                      },
                      "&:disabled": {
                        background: `${COLORS.BORDER_STRONG} !important`,
                        color: "white !important",
                      },
                      "&.Mui-disabled": {
                        background: `${COLORS.BORDER_STRONG} !important`,
                        color: "white !important",
                      },
                    }}
                  >
                    설정 저장
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ) : (
          /* 선택된 종목이 없으면 기존 메시지 표시 */
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              bgcolor: "grey.50",
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              설정된 자동매매가 없습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              종목을 선택하고 설정을 저장해보세요.
            </Typography>
          </Box>
        )
      ) : (
        /* 자동매매 설정 아코디언 목록 */
        <Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Chip
                      label="신규"
                      size="small"
                      color="info"
                      sx={{ fontSize: "0.7rem", height: "20px" }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedStock.name || "알 수 없음"} ({selectedStock.code || "000000"})
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ backgroundColor: COLORS.SURFACE, position: "relative" }}>
                  {/* 우측 상단 컨트롤 영역 - 신규이므로 초기화 버튼만 */}
                  <Box
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
                          color: COLORS.PRIMARY,
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                          },
                        }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* 매매 방식 선택 */}
                  <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={tradingMode}
                        onChange={handleTradingModeChange}
                        sx={{
                          "& .MuiFormControlLabel-root": {
                            margin: "0 16px 0 0",
                          },
                          "& .MuiRadio-root": {
                            color: COLORS.PRIMARY,
                            "&.Mui-checked": {
                              color: COLORS.PRIMARY,
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
                  </Box>

                  {/* 설정 폼 */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* 진입시점 */}
                    <Box sx={{ position: "relative" }}>
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
                              borderColor: COLORS.PRIMARY,
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: COLORS.PRIMARY,
                          },
                        }}
                      />
                    </Box>

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
                            borderColor: COLORS.PRIMARY,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: COLORS.PRIMARY,
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
                            borderColor: COLORS.PRIMARY,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: COLORS.PRIMARY,
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
                            borderColor: COLORS.PRIMARY,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: COLORS.PRIMARY,
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
                            borderColor: COLORS.PRIMARY,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: COLORS.PRIMARY,
                        },
                      }}
                    />

                    {/* 피라미딩 설정 */}
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          피라미딩 설정
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: Math.abs(positionSum - 100) >= 0.01 ? COLORS.UP : COLORS.SUCCESS,
                              fontWeight: "bold",
                            }}
                          >
                            포지션 합계: {positionSum.toFixed(1)}%
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={handleEqualDivision}
                            sx={{
                              minWidth: "auto",
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              borderColor: COLORS.PRIMARY,
                              color: COLORS.PRIMARY,
                              "&:hover": {
                                borderColor: COLORS.PRIMARY_HOVER,
                                backgroundColor: "rgba(102, 126, 234, 0.04)",
                              },
                            }}
                          >
                            균등분할
                          </Button>
                        </Box>
                      </Box>

                      {/* 포지션 합계 경고 */}
                      {Math.abs(positionSum - 100) >= 0.01 && (
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: `${COLORS.TINT_WARNING}`,
                            border: `1px solid ${COLORS.TINT_WARNING}`,
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: COLORS.WARNING, fontWeight: "bold" }}
                          >
                            ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                          </Typography>
                        </Box>
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
                                  borderColor: COLORS.PRIMARY,
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: COLORS.PRIMARY,
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
                                  borderColor: COLORS.PRIMARY,
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: COLORS.PRIMARY,
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
                                label={`${index + 2}차 진입시점 (${tradingMode === "manual" ? "%" : "ATR"})`}
                                value={entry}
                                onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                                size="small"
                                type="number"
                                inputProps={{ step: tradingMode === "manual" ? 0.1 : 1 }}
                                sx={{
                                  width: "100%",
                                  "& .MuiOutlinedInput-root": {
                                    "&.Mui-focused fieldset": {
                                      borderColor: COLORS.PRIMARY,
                                    },
                                  },
                                  "& .MuiInputLabel-root.Mui-focused": {
                                    color: COLORS.PRIMARY,
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
                                      borderColor: COLORS.PRIMARY,
                                    },
                                  },
                                  "& .MuiInputLabel-root.Mui-focused": {
                                    color: COLORS.PRIMARY,
                                  },
                                }}
                              />
                            </Grid>
                          </Grid>
                        ))}
                    </Box>

                    {/* 실행 버튼 */}
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveConfig} // 신규이므로 null 전달
                        disabled={!isFormValid()}
                        sx={{
                          flex: 1,
                          background: isFormValid()
                            ? `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`
                            : COLORS.BORDER_STRONG,
                          color: "white !important",
                          "&:hover": {
                            background: isFormValid()
                              ? `linear-gradient(135deg, ${COLORS.PRIMARY_HOVER} 0%, #6a4190 100%)`
                              : COLORS.BORDER_STRONG,
                            color: "white !important",
                          },
                          "&:disabled": {
                            background: `${COLORS.BORDER_STRONG} !important`,
                            color: "white !important",
                          },
                          "&.Mui-disabled": {
                            background: `${COLORS.BORDER_STRONG} !important`,
                            color: "white !important",
                          },
                        }}
                      >
                        설정 저장
                      </Button>
                    </Box>
                  </Box>
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
                    if (!stockConfig.hasConfig) return COLORS.SURFACE_ALT;
                    if (stockConfig.is_active) return "rgba(76, 175, 80, 0.1)";
                    return "rgba(158, 158, 158, 0.1)";
                  })(),
                  "&:hover": {
                    backgroundColor: (() => {
                      if (!stockConfig.hasConfig) return COLORS.BORDER;
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  {stockConfig.trading_mode || stockConfig.stop_loss || stockConfig.take_profit ? (
                    <Chip
                      label={stockConfig.is_active ? "활성" : "비활성"}
                      size="small"
                      color={stockConfig.is_active ? "success" : "default"}
                      sx={{
                        fontSize: "0.7rem",
                        height: "20px",
                        backgroundColor: !stockConfig.is_active ? COLORS.TEXT_MUTED : undefined,
                        color: !stockConfig.is_active ? COLORS.ON_ACCENT : undefined,
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
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {stockConfig.stock_name || "알 수 없음"} ({stockConfig.stock_code || "000000"}
                      )
                    </Typography>
                    {(stockConfig.trading_mode ||
                      stockConfig.stop_loss ||
                      stockConfig.take_profit) && (
                      <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          진입:{" "}
                          {stockConfig.entry_point
                            ? `${Number(stockConfig.entry_point).toLocaleString()}원`
                            : "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          손절:{" "}
                          {stockConfig.stop_loss
                            ? `${stockConfig.stop_loss}${
                                stockConfig.trading_mode === "manual" ? "%" : "ATR"
                              }`
                            : "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          익절:{" "}
                          {stockConfig.take_profit
                            ? `${stockConfig.take_profit}${
                                stockConfig.trading_mode === "manual" ? "%" : "ATR"
                              }`
                            : "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          피라미딩: {stockConfig.pyramiding_count || 0}회
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ backgroundColor: COLORS.SURFACE, position: "relative" }}>
                {/* 우측 상단 컨트롤 영역 */}
                {(stockConfig.trading_mode || stockConfig.stop_loss || stockConfig.take_profit) && (
                  <Box
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                        {stockConfig.is_active ? "ON" : "OFF"}
                      </Typography>
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
                            color: COLORS.SUCCESS,
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: COLORS.SUCCESS,
                          },
                        }}
                      />
                    </Box>

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
                          color: COLORS.PRIMARY,
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                          },
                        }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {/* 매매 방식 선택 */}
                <Box sx={{ mb: 3 }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={tradingMode}
                      onChange={handleTradingModeChange}
                      sx={{
                        "& .MuiFormControlLabel-root": {
                          margin: "0 16px 0 0",
                        },
                        "& .MuiRadio-root": {
                          color: COLORS.PRIMARY,
                          "&.Mui-checked": {
                            color: COLORS.PRIMARY,
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
                </Box>

                {/* 설정 폼 */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* 진입시점 */}
                  <Box sx={{ position: "relative" }}>
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
                            borderColor: COLORS.PRIMARY,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: COLORS.PRIMARY,
                        },
                      }}
                    />
                  </Box>

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
                          borderColor: COLORS.PRIMARY,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: COLORS.PRIMARY,
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
                          borderColor: COLORS.PRIMARY,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: COLORS.PRIMARY,
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
                          borderColor: COLORS.PRIMARY,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: COLORS.PRIMARY,
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
                          borderColor: COLORS.PRIMARY,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: COLORS.PRIMARY,
                      },
                    }}
                  />

                  {/* 피라미딩 설정 */}
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        피라미딩 설정
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: Math.abs(positionSum - 100) >= 0.01 ? COLORS.UP : COLORS.SUCCESS,
                            fontWeight: "bold",
                          }}
                        >
                          포지션 합계: {positionSum.toFixed(1)}%
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={handleEqualDivision}
                          sx={{
                            minWidth: "auto",
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            borderColor: COLORS.PRIMARY,
                            color: COLORS.PRIMARY,
                            "&:hover": {
                              borderColor: COLORS.PRIMARY_HOVER,
                              backgroundColor: "rgba(102, 126, 234, 0.04)",
                            },
                          }}
                        >
                          균등분할
                        </Button>
                      </Box>
                    </Box>

                    {/* 포지션 합계 경고 */}
                    {Math.abs(positionSum - 100) >= 0.01 && (
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: `${COLORS.TINT_WARNING}`,
                          border: `1px solid ${COLORS.TINT_WARNING}`,
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: COLORS.WARNING, fontWeight: "bold" }}
                        >
                          ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {positionSum.toFixed(1)}%)
                        </Typography>
                      </Box>
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
                                borderColor: COLORS.PRIMARY,
                              },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: COLORS.PRIMARY,
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
                                borderColor: COLORS.PRIMARY,
                              },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: COLORS.PRIMARY,
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
                              label={`${index + 2}차 진입시점 (${tradingMode === "manual" ? "%" : "ATR"})`}
                              value={entry}
                              onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                              size="small"
                              type="number"
                              inputProps={{ step: tradingMode === "manual" ? 0.1 : 1 }}
                              sx={{
                                width: "100%",
                                "& .MuiOutlinedInput-root": {
                                  "&.Mui-focused fieldset": {
                                    borderColor: COLORS.PRIMARY,
                                  },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: COLORS.PRIMARY,
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
                                    borderColor: COLORS.PRIMARY,
                                  },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: COLORS.PRIMARY,
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                      ))}
                  </Box>

                  {/* 실행 버튼 */}
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveConfig}
                      disabled={!isFormValid()}
                      sx={{
                        flex: 1,
                        background: isFormValid()
                          ? `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`
                          : COLORS.BORDER_STRONG,
                        color: "white !important",
                        "&:hover": {
                          background: isFormValid()
                            ? `linear-gradient(135deg, ${COLORS.PRIMARY_HOVER} 0%, #6a4190 100%)`
                            : COLORS.BORDER_STRONG,
                          color: "white !important",
                        },
                        "&:disabled": {
                          background: `${COLORS.BORDER_STRONG} !important`,
                          color: "white !important",
                        },
                        "&.Mui-disabled": {
                          background: `${COLORS.BORDER_STRONG} !important`,
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
                          borderColor: COLORS.UP,
                          color: COLORS.UP,
                          "&:hover": {
                            borderColor: COLORS.UP,
                            backgroundColor: "rgba(244, 67, 54, 0.04)",
                          },
                        }}
                      >
                        설정 삭제
                      </Button>
                    )}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AutotradingAccordion;
