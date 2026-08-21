import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  Chip,
} from "@mui/material";
import { Close, Refresh } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { adjustToKRXTickSize, getKRXTickSize } from "utils/formatters";
import { useTradingForm } from "hooks/useTradingForm";
import { useAuth } from "contexts/AuthContext";
import { COLORS } from "constants/styles";

/**
 * 자동매매 설정 상세보기/수정 모달 컴포넌트
 * useTradingForm 훅을 사용하여 매매모드 변경 시 기본값 자동 로드 기능 제공
 */
const TradingConfigModal = ({ open, onClose, config, onSave, loading = false }) => {
  const { authenticatedFetch } = useAuth();
  const [message, setMessage] = useState(null);
  const [isActive, setIsActive] = useState(true);

  // 가상의 selectedStock 객체 생성 (config 기반)
  const selectedStock = config
    ? {
        code: config.stock_code,
        name: config.stock_name,
      }
    : null;

  // useTradingForm 훅 사용 (모달 모드로 설정하여 자동 기본값 로드 비활성화)
  const tradingForm = useTradingForm(
    selectedStock,
    authenticatedFetch,
    (msg, type) => setMessage({ type, text: msg }),
    config?.strategy_type || "mtt",
    true // isModal = true로 설정
  );

  // 모달이 열릴 때 기존 설정 데이터로 폼 초기화
  useEffect(() => {
    if (open && config) {
      tradingForm.loadExistingConfig(config);
      setIsActive(config.is_active ?? true);
      setMessage(null);
    }
  }, [open, config]);

  // 매매모드에 따른 단위 표시
  const getUnit = () => {
    return tradingForm.tradingMode === "manual" ? "%" : "ATR";
  };

  // 초기화 핸들러
  const handleReset = () => {
    tradingForm.resetTradingForm();
    setMessage({ type: "info", text: "설정이 초기화되었습니다." });
  };

  // 저장 핸들러
  const handleSave = async () => {
    try {
      setMessage(null);
      const result = await onSave({
        ...config,
        trading_mode: tradingForm.tradingMode,
        entry_point: tradingForm.entryPoint,
        max_loss: tradingForm.maxLoss,
        stop_loss: tradingForm.stopLoss,
        take_profit: tradingForm.takeProfit,
        pyramiding_count: tradingForm.pyramidingCount,
        pyramiding_entries: tradingForm.pyramidingEntries,
        positions: tradingForm.positions,
        is_active: isActive,
      });
      if (result) {
        setMessage({ type: "success", text: "설정이 성공적으로 저장되었습니다." });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: "error", text: `저장 실패: ${error.message}` });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          pb: 1,
          background:
            "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
          border: "1px solid rgba(102, 126, 234, 0.1)",
          borderBottom: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            자동매매 설정 상세보기
          </Typography>
          {config && (
            <Typography variant="body2" color="text.secondary" opacity={0.8} sx={{ mt: 0.5 }}>
              {config.stock_name} ({config.stock_code})
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={isActive ? "클릭하면 비활성화됩니다" : "클릭하면 활성화됩니다"}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip
                label={isActive ? "활성" : "비활성"}
                color={isActive ? "success" : "default"}
                size="small"
                sx={{ fontWeight: "bold", fontSize: "0.75rem" }}
              />
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="success"
                size="small"
              />
            </Box>
          </Tooltip>
          <IconButton
            onClick={onClose}
            sx={{
              color: "rgba(0, 0, 0, 0.54)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        {/* 메시지 표시 */}
        {message && (
          <Alert
            severity={message.type}
            sx={{
              borderRadius: 2,
              mb: 3,
              whiteSpace: "pre-line",
            }}
          >
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 좌측 컬럼 */}
          <Grid item xs={12} md={6}>
            {/* 매매모드 선택 */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                매매모드 선택
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={tradingForm.tradingMode}
                  onChange={tradingForm.handleTradingModeChange}
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
                >
                  <FormControlLabel
                    value="manual"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: "0.875rem" }}>Manual</Typography>}
                  />
                  <FormControlLabel
                    value="turtle"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: "0.875rem" }}>Turtle(ATR)</Typography>}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* 리스크 관리 설정 */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  리스크 관리 설정
                </Typography>
                <Tooltip title="설정 초기화">
                  <IconButton
                    size="small"
                    onClick={handleReset}
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

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="진입시점 (원)"
                    type="number"
                    value={tradingForm.entryPoint}
                    onChange={(e) => {
                      const adjustedValue = adjustToKRXTickSize(e.target.value);
                      tradingForm.setEntryPoint(adjustedValue.toString());
                    }}
                    inputProps={{ step: getKRXTickSize(tradingForm.entryPoint) }}
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
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="최대손실 (%)"
                    type="number"
                    value={tradingForm.maxLoss}
                    onChange={(e) => tradingForm.setMaxLoss(e.target.value)}
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
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`손절가 (${getUnit()})`}
                    type="number"
                    value={tradingForm.stopLoss}
                    onChange={(e) => tradingForm.setStopLoss(e.target.value)}
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`익절가 (${getUnit()})`}
                    type="number"
                    value={tradingForm.takeProfit}
                    onChange={(e) => tradingForm.setTakeProfit(e.target.value)}
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
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* 우측 컬럼 */}
          <Grid item xs={12} md={6}>
            {/* 포지션 분할 설정 */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                포지션 분할 설정
              </Typography>

              {/* 첫 번째 행: 피라미딩 횟수, 균등분할 */}
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="피라미딩 횟수"
                    type="number"
                    value={tradingForm.pyramidingCount}
                    onChange={tradingForm.handlePyramidingCountChange}
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
                </Grid>
                <Grid item xs={5}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={tradingForm.handleEqualDivision}
                    fullWidth
                    sx={{
                      borderColor: COLORS.PRIMARY,
                      color: COLORS.PRIMARY,
                      fontSize: "0.75rem",
                      "&:hover": {
                        borderColor: COLORS.PRIMARY_HOVER,
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                  >
                    균등분할
                  </Button>
                </Grid>
              </Grid>

              {/* 진입시점과 포지션 설정 */}
              <Box mb={2}>
                {/* 1차 진입시점과 포지션 */}
                <Grid container spacing={2} alignItems="center" mb={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="1차 진입시점 (원)"
                      value={tradingForm.entryPoint}
                      onChange={(e) => {
                        const adjustedValue = adjustToKRXTickSize(e.target.value);
                        tradingForm.setEntryPoint(adjustedValue.toString());
                      }}
                      type="number"
                      inputProps={{ step: getKRXTickSize(tradingForm.entryPoint) }}
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
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="1차 포지션 (%)"
                      type="number"
                      value={tradingForm.positions[0] || ""}
                      onChange={(e) => tradingForm.handlePositionChange(0, e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
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
                  </Grid>
                </Grid>

                {/* 2차 이상 진입시점과 포지션 */}
                {tradingForm.pyramidingEntries?.map((entry, index) => (
                  <Grid container spacing={2} alignItems="center" mb={1} key={index}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${index + 2}차 진입시점 (${getUnit()})`}
                        type="number"
                        value={entry}
                        onChange={(e) =>
                          tradingForm.handlePyramidingEntryChange(index, e.target.value)
                        }
                        placeholder={tradingForm.tradingMode === "manual" ? "예: 4" : "예: 1"}
                        inputProps={{ step: 1 }}
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
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${index + 2}차 포지션 (%)`}
                        type="number"
                        value={tradingForm.positions[index + 1] || ""}
                        onChange={(e) =>
                          tradingForm.handlePositionChange(index + 1, e.target.value)
                        }
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
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
                    </Grid>
                  </Grid>
                ))}
              </Box>

              {/* 포지션 합계 표시 */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    color: Math.abs(tradingForm.positionSum - 100) >= 0.01 ? "#f44336" : "#4caf50",
                    fontWeight: "bold",
                  }}
                >
                  포지션 합계: {tradingForm.positionSum.toFixed(1)}%
                </Typography>
                {Math.abs(tradingForm.positionSum - 100) >= 0.01 && (
                  <Typography variant="caption" color="error.main">
                    ⚠️ 포지션 합계가 100%가 되어야 합니다
                  </Typography>
                )}
              </Box>

              {/* 포지션 합계 경고 */}
              {Math.abs(tradingForm.positionSum - 100) >= 0.01 && (
                <Box
                  sx={{
                    p: 1,
                    bgcolor: `#fff3cd`,
                    border: "1px solid #ffeaa7",
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#856404", fontWeight: "bold" }}>
                    ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재:{" "}
                    {tradingForm.positionSum.toFixed(1)}%)
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderColor: COLORS.BORDER_STRONG,
            color: COLORS.TEXT_SECONDARY,
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            "&:hover": {
              borderColor: "#999",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!tradingForm.isFormValid() || loading}
          sx={{
            background: tradingForm.isFormValid()
              ? `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`
              : COLORS.BORDER_STRONG,
            color: "white",
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            "&:hover": {
              background: tradingForm.isFormValid()
                ? `linear-gradient(135deg, ${COLORS.PRIMARY_HOVER} 0%, #6a4190 100%)`
                : COLORS.BORDER_STRONG,
              transform: tradingForm.isFormValid() ? "translateY(-1px)" : "none",
              boxShadow: tradingForm.isFormValid() ? "0 6px 20px rgba(102, 126, 234, 0.3)" : "none",
            },
            "&:disabled": {
              background: `${COLORS.BORDER_STRONG} !important`,
              color: "white !important",
            },
            transition: "all 0.3s ease",
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: "white" }} />
              저장 중...
            </>
          ) : (
            "설정 저장"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradingConfigModal;
