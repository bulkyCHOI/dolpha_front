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
} from "@mui/material";
import { Close, Refresh } from "@mui/icons-material";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import { adjustToKRXTickSize, getKRXTickSize } from "utils/formatters";
import { useTradingForm } from "hooks/useTradingForm";
import { useAuth } from "contexts/AuthContext";

/**
 * 자동매매 설정 상세보기/수정 모달 컴포넌트
 * useTradingForm 훅을 사용하여 매매모드 변경 시 기본값 자동 로드 기능 제공
 */
const TradingConfigModal = ({
  open,
  onClose,
  config,
  onSave,
  loading = false,
}) => {
  const { authenticatedFetch } = useAuth();
  const [message, setMessage] = useState(null);

  // 가상의 selectedStock 객체 생성 (config 기반)
  const selectedStock = config ? {
    code: config.stock_code,
    name: config.stock_name
  } : null;

  // useTradingForm 훅 사용 (모달 모드로 설정하여 자동 기본값 로드 비활성화)
  const tradingForm = useTradingForm(
    selectedStock, 
    authenticatedFetch, 
    (msg, type) => setMessage({ type, text: msg }),
    config?.strategy_type || 'mtt',
    true // isModal = true로 설정
  );

  // 모달이 열릴 때 기존 설정 데이터로 폼 초기화
  useEffect(() => {
    if (open && config) {
      // useTradingForm 훅의 loadExistingConfig 함수 사용
      tradingForm.loadExistingConfig(config);
      setMessage(null);
    }
  }, [open, config]);

  // 매매모드에 따른 단위 표시
  const getUnit = () => {
    return tradingForm.tradingMode === 'manual' ? '%' : 'ATR';
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
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        pb: 1,
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.1)",
        borderBottom: "none",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <MKBox>
          <MKTypography variant="h5" fontWeight="bold">
            자동매매 설정 상세보기
          </MKTypography>
          {config && (
            <MKTypography variant="body2" color="text" opacity={0.8} sx={{ mt: 0.5 }}>
              {config.stock_name} ({config.stock_code})
            </MKTypography>
          )}
        </MKBox>
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
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        {/* 메시지 표시 */}
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ 
              borderRadius: 2, 
              mb: 3,
              whiteSpace: 'pre-line' 
            }}
          >
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 좌측 컬럼 */}
          <Grid item xs={12} md={6}>
            {/* 매매모드 선택 */}
            <MKBox 
              sx={{ 
                p: 2, 
                mb: 3, 
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)"
              }}
            >
              <MKTypography variant="h6" fontWeight="bold" mb={2}>
                매매모드 선택
              </MKTypography>
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
                      color: "#667eea",
                      "&.Mui-checked": {
                        color: "#667eea",
                      },
                    },
                  }}
                >
                  <FormControlLabel
                    value="manual"
                    control={<Radio size="small" />}
                    label={
                      <MKTypography sx={{ fontSize: "0.875rem" }}>
                        Manual
                      </MKTypography>
                    }
                  />
                  <FormControlLabel
                    value="turtle"
                    control={<Radio size="small" />}
                    label={
                      <MKTypography sx={{ fontSize: "0.875rem" }}>
                        Turtle(ATR)
                      </MKTypography>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </MKBox>

            {/* 리스크 관리 설정 */}
            <MKBox 
              sx={{ 
                p: 2, 
                mb: 3, 
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)"
              }}
            >
              <MKBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MKTypography variant="h6" fontWeight="bold">
                  리스크 관리 설정
                </MKTypography>
                <Tooltip title="설정 초기화">
                  <IconButton
                    size="small"
                    onClick={handleReset}
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
                    fullWidth
                    size="small"
                    label="최대손실 (%)"
                    type="number"
                    value={tradingForm.maxLoss}
                    onChange={(e) => tradingForm.setMaxLoss(e.target.value)}
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
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
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
            </MKBox>
          </Grid>

          {/* 우측 컬럼 */}
          <Grid item xs={12} md={6}>
            {/* 포지션 분할 설정 */}
            <MKBox 
              sx={{ 
                p: 2, 
                mb: 3, 
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.02)"
              }}
            >
              <MKTypography variant="h6" fontWeight="bold" mb={2}>
                포지션 분할 설정
              </MKTypography>
              
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
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#667eea",
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
                      borderColor: "#667eea",
                      color: "#667eea",
                      fontSize: "0.75rem",
                      "&:hover": {
                        borderColor: "#5a6fd8",
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                  >
                    균등분할
                  </Button>
                </Grid>
              </Grid>

              {/* 진입시점과 포지션 설정 */}
              <MKBox mb={2}>
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
                        onChange={(e) => tradingForm.handlePyramidingEntryChange(index, e.target.value)}
                        placeholder={tradingForm.tradingMode === 'manual' ? '예: 4' : '예: 1.5'}
                        inputProps={{ step: tradingForm.tradingMode === 'manual' ? 1 : 0.1 }}
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
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${index + 2}차 포지션 (%)`}
                        type="number"
                        value={tradingForm.positions[index + 1] || ""}
                        onChange={(e) => tradingForm.handlePositionChange(index + 1, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
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
                    </Grid>
                  </Grid>
                ))}
              </MKBox>
              
              {/* 포지션 합계 표시 */}
              <MKBox display="flex" justifyContent="space-between" alignItems="center">
                <MKTypography 
                  variant="body2" 
                  sx={{
                    color: Math.abs(tradingForm.positionSum - 100) >= 0.01 ? "#f44336" : "#4caf50",
                    fontWeight: "bold",
                  }}
                >
                  포지션 합계: {tradingForm.positionSum.toFixed(1)}%
                </MKTypography>
                {Math.abs(tradingForm.positionSum - 100) >= 0.01 && (
                  <MKTypography variant="caption" color="error">
                    ⚠️ 포지션 합계가 100%가 되어야 합니다
                  </MKTypography>
                )}
              </MKBox>

              {/* 포지션 합계 경고 */}
              {Math.abs(tradingForm.positionSum - 100) >= 0.01 && (
                <MKBox
                  sx={{
                    p: 1,
                    bgcolor: "#fff3cd",
                    border: "1px solid #ffeaa7",
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  <MKTypography variant="caption" sx={{ color: "#856404", fontWeight: "bold" }}>
                    ⚠️ 포지션의 합이 100%가 되어야 합니다. (현재: {tradingForm.positionSum.toFixed(1)}%)
                  </MKTypography>
                </MKBox>
              )}
            </MKBox>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderColor: "#ccc",
            color: "#666",
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
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#ccc",
            color: "white",
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            "&:hover": {
              background: tradingForm.isFormValid()
                ? "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                : "#ccc",
              transform: tradingForm.isFormValid() ? "translateY(-1px)" : "none",
              boxShadow: tradingForm.isFormValid() ? "0 6px 20px rgba(102, 126, 234, 0.3)" : "none",
            },
            "&:disabled": {
              background: "#ccc !important",
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