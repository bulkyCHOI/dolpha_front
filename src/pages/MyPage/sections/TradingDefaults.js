// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Chip from "@mui/material/Chip";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useState, useEffect } from "react";

import ThemeSurgeSettings from "./ThemeSurgeSettings";
import AccountSettings from "./AccountSettings";
import { useAuth } from "contexts/AuthContext";
import { COLORS, alpha } from "constants/styles";

function TradingDefaults() {
  const [defaults, setDefaults] = useState({
    trading_mode: "turtle", // 현재 선택된 매매모드
    // Manual 모드 설정
    manual_max_loss: 2.0,
    manual_stop_loss: 8.0,
    manual_take_profit: null,
    manual_pyramiding_count: 0,
    manual_position_size: 100.0,
    manual_positions: [100],
    manual_pyramiding_entries: [],
    manual_use_trailing_stop: true,
    manual_trailing_stop_trigger: 8.0,
    manual_trailing_stop_percent: 8.0,
    // Turtle 모드 설정
    turtle_max_loss: 2.0,
    turtle_stop_loss: 2.0,
    turtle_take_profit: null,
    turtle_pyramiding_count: 3,
    turtle_position_size: 25.0,
    turtle_positions: [25, 25, 25, 25],
    turtle_pyramiding_entries: ["", "", ""],
    turtle_use_trailing_stop: true,
    turtle_trailing_stop_trigger: 2.0,
    turtle_trailing_stop_percent: 3.0,
    // 공통 설정
    default_entry_trigger: 1.0,
    default_exit_trigger: 2.0,
    // 분할 익절 설정
    staged_exit_type: "none",
    ma_stage1_period: 5,
    ma_stage1_sell_pct: 30.0,
    ma_stage2_period: 20,
    ma_stage2_sell_pct: 50.0,
    ma_stage3_period: 60,
    ma_stage3_sell_pct: 100.0,
    dc_stage1_short: 5,
    dc_stage1_long: 10,
    dc_stage1_sell_pct: 30.0,
    dc_stage2_short: 10,
    dc_stage2_long: 30,
    dc_stage2_sell_pct: 50.0,
    dc_stage3_short: 30,
    dc_stage3_long: 60,
    dc_stage3_sell_pct: 100.0,
    nl_stage1_days: 5,
    nl_stage1_sell_pct: 30.0,
    nl_stage2_days: 10,
    nl_stage2_sell_pct: 50.0,
    nl_stage3_days: 20,
    nl_stage3_sell_pct: 100.0,
    // 급등테마주 전략 설정 — 진입 기준
    theme_surge_enabled: false,
    theme_surge_max_candidates: 3,
    theme_surge_min_fluctuation: 3.0,
    theme_surge_min_trading_value: 50000000000,
    theme_surge_use_foreign_filter: true,
    // 급등테마주 청산 설정 (데이 트레이딩 전용)
    theme_surge_use_own_exit: true,
    theme_surge_max_loss: 1.0,
    theme_surge_max_position_pct: 20.0,
    theme_surge_entry_stages: [{ t: 0, weight_pct: 100 }],
    theme_surge_exit_stages: [{ t: 2.0, sell_pct: 50.0 }],
    theme_surge_use_trailing: true,
    theme_surge_trailing_start_t: 2.0,
    theme_surge_trailing_bar_unit: "5m",
    theme_surge_trailing_bar_count: 3,
    theme_surge_force_exit_enabled: true,
    theme_surge_force_exit_time: "15:20",
    theme_surge_overnight_enabled: false,
    theme_surge_overnight_conditions: ["foreign", "institution", "program", "shinhan_top5"],
    theme_surge_overnight_min_count: 2,
    theme_surge_overnight_max_days: 3,
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    strategy: true,
    risk: true,
    position: true,
    timing: true,
  });

  const { authenticatedFetch } = useAuth();

  // 매매모드에 따른 단위 표시
  const getUnit = () => {
    return defaults.trading_mode === "manual" ? "%" : "ATR";
  };

  // 현재 매매모드에 따른 설정값 가져오기
  const getCurrentModeDefaults = () => {
    const mode = defaults.trading_mode;
    if (mode === "manual") {
      return {
        max_loss: defaults.manual_max_loss,
        stop_loss: defaults.manual_stop_loss,
        take_profit: defaults.manual_take_profit,
        pyramiding_count: defaults.manual_pyramiding_count,
        position_size: defaults.manual_position_size,
        positions: defaults.manual_positions,
        pyramiding_entries: defaults.manual_pyramiding_entries,
        use_trailing_stop: defaults.manual_use_trailing_stop,
        trailing_stop_trigger: defaults.manual_trailing_stop_trigger,
        trailing_stop_percent: defaults.manual_trailing_stop_percent,
      };
    } else {
      return {
        max_loss: defaults.turtle_max_loss,
        stop_loss: defaults.turtle_stop_loss,
        take_profit: defaults.turtle_take_profit,
        pyramiding_count: defaults.turtle_pyramiding_count,
        position_size: defaults.turtle_position_size,
        positions: defaults.turtle_positions,
        pyramiding_entries: defaults.turtle_pyramiding_entries,
        use_trailing_stop: defaults.turtle_use_trailing_stop,
        trailing_stop_trigger: defaults.turtle_trailing_stop_trigger,
        trailing_stop_percent: defaults.turtle_trailing_stop_percent,
      };
    }
  };

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    setLoading(true);
    try {
      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${baseUrl}/api/mypage/trading-defaults`);

      if (response.ok) {
        const data = await response.json();
        setDefaults(data);
      }
    } catch (error) {
      setMessage({ type: "error", text: `설정 로드 실패: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setMessage(null);

    try {
      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${baseUrl}/api/mypage/trading-defaults`, {
        method: "POST",
        body: JSON.stringify(defaults),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: `저장 실패: ${error.message}` });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDefaults((prev) => {
      const newDefaults = { ...prev };
      const mode = prev.trading_mode;

      // 매매모드에 따라 해당 모드의 필드 업데이트
      if (field === "trading_mode") {
        newDefaults[field] = value;
      } else {
        const modePrefix = mode === "manual" ? "manual_" : "turtle_";
        newDefaults[modePrefix + field] = value;

        // 피라미딩 횟수가 변경될 때 포지션 배열 자동 업데이트
        if (field === "pyramiding_count") {
          const pyramidingCount = parseInt(value) || 0;
          const totalEntries = pyramidingCount + 1;
          const basePosition = Math.floor(100 / totalEntries); // 정수로 내림
          const remainder = 100 - basePosition * totalEntries; // 나머지 계산

          // 새로운 포지션 배열 생성 (정수 균등분할 + 나머지를 1차에 할당)
          const newPositions = Array(totalEntries).fill(basePosition);
          newPositions[0] = basePosition + remainder; // 나머지를 1차에 추가
          newDefaults[modePrefix + "positions"] = newPositions;

          // 피라미딩 진입시점 배열도 업데이트 (2차부터)
          const newPyramidingEntries = Array(pyramidingCount).fill("");
          newDefaults[modePrefix + "pyramiding_entries"] = newPyramidingEntries;
        }
      }

      return newDefaults;
    });
  };

  // 개별 포지션 변경 핸들러
  const handlePositionChange = (index, value) => {
    setDefaults((prev) => {
      const mode = prev.trading_mode;
      const modePrefix = mode === "manual" ? "manual_" : "turtle_";
      const positionsField = modePrefix + "positions";

      const newPositions = [...(prev[positionsField] || [])];
      newPositions[index] = parseFloat(value) || 0;
      return { ...prev, [positionsField]: newPositions };
    });
  };

  // 피라미딩 진입시점 변경 핸들러
  const handlePyramidingEntryChange = (index, value) => {
    setDefaults((prev) => {
      const mode = prev.trading_mode;
      const modePrefix = mode === "manual" ? "manual_" : "turtle_";
      const entriesField = modePrefix + "pyramiding_entries";

      const newPyramidingEntries = [...(prev[entriesField] || [])];
      newPyramidingEntries[index] = value;
      return { ...prev, [entriesField]: newPyramidingEntries };
    });
  };

  // 균등분할 버튼 핸들러 (정수 처리 + 나머지를 1차에 할당)
  const handleEqualDivision = () => {
    const currentModeDefaults = getCurrentModeDefaults();
    const totalEntries = (currentModeDefaults.pyramiding_count || 0) + 1;
    const basePosition = Math.floor(100 / totalEntries); // 정수로 내림
    const remainder = 100 - basePosition * totalEntries; // 나머지 계산

    const newPositions = Array(totalEntries).fill(basePosition);
    // 나머지를 1차 포지션(인덱스 0)에 추가
    newPositions[0] = basePosition + remainder;

    setDefaults((prev) => {
      const mode = prev.trading_mode;
      const modePrefix = mode === "manual" ? "manual_" : "turtle_";
      return { ...prev, [modePrefix + "positions"]: newPositions };
    });
  };

  // 초기화 버튼 핸들러 (피라미딩 0회 기준)
  const handleReset = () => {
    const pyramidingCount = 0; // 피라미딩 0회 기준으로 초기화
    const totalEntries = pyramidingCount + 1; // 1차만
    const newPositions = [100]; // 1차에 100% 할당
    const newPyramidingEntries = Array(pyramidingCount).fill("");

    setDefaults((prev) => {
      const mode = prev.trading_mode;
      const modePrefix = mode === "manual" ? "manual_" : "turtle_";
      return {
        ...prev,
        [modePrefix + "pyramiding_count"]: pyramidingCount, // 피라미딩 횟수도 0으로 재설정
        [modePrefix + "positions"]: newPositions,
        [modePrefix + "pyramiding_entries"]: newPyramidingEntries,
      };
    });
  };

  // 모드 prefix 없는 공통 필드 핸들러 (분할 익절 · 급등테마주 등)
  const handleFieldChange = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  // 포지션 합계 계산
  const positionSum =
    getCurrentModeDefaults().positions?.reduce((sum, pos) => sum + (parseFloat(pos) || 0), 0) || 0;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderCompactSection = (title, children) => (
    <Box sx={{ mb: 2, borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        {title}
      </Typography>
      {children}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="section">
      <Container>
        <Grid container spacing={2}>
          {/* 헤더 */}
          <Grid item xs={12}>
            <Box mb={1}>
              <Typography variant="h5" mb={0.5} fontWeight="bold">
                자동매매 기본설정
              </Typography>
              <Typography variant="body2" color="text.secondary" opacity={0.8}>
                새로운 자동매매 설정 시 사용될 기본값을 관리하세요. 설정된 기본값은 자동매매 설정
                생성 시 자동으로 적용됩니다.
              </Typography>
            </Box>
          </Grid>

          {/* ── Row 1: 계좌 설정 (사용자 KIS 계좌 등록 + 전략별 계좌 지정) ── */}
          <Grid item xs={12}>
            <Box sx={{ borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
              <AccountSettings />
            </Box>
          </Grid>

          {/* ── Row 1-b: 매매모드 ── */}
          <Grid item xs={12}>
            <Box sx={{ borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
              <Typography variant="h6" fontWeight="bold" mb={1.5}>
                매매모드
              </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={defaults.trading_mode}
                    onChange={(e) => handleInputChange("trading_mode", e.target.value)}
                  >
                    <FormControlLabel
                      value="manual"
                      control={<Radio size="small" />}
                      label="Manual"
                    />
                    <FormControlLabel
                      value="turtle"
                      control={<Radio size="small" />}
                      label="Turtle (ATR)"
                    />
                  </RadioGroup>
                </FormControl>
            </Box>
          </Grid>

          {/* ── Row 2: 3-column 설정 카드 ── */}

          {/* 리스크 관리 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  리스크 관리
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="최대손실 (%)"
                      type="number"
                      value={getCurrentModeDefaults().max_loss}
                      onChange={(e) => handleInputChange("max_loss", parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`손절가 (${getUnit()})`}
                      type="number"
                      value={getCurrentModeDefaults().stop_loss}
                      onChange={(e) => handleInputChange("stop_loss", parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`익절가 (${getUnit()})`}
                      type="number"
                      value={getCurrentModeDefaults().take_profit || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "take_profit",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      disabled={defaults.staged_exit_type !== "none"}
                      placeholder={defaults.staged_exit_type !== "none" ? "분할 익절 사용 중" : ""}
                      sx={
                        defaults.staged_exit_type !== "none"
                          ? {
                              "& .MuiInputBase-root.Mui-disabled": {
                                backgroundColor: COLORS.DIVIDER,
                              },
                              "& .MuiInputBase-input.Mui-disabled": {
                                color: COLORS.TEXT_MUTED,
                                WebkitTextFillColor: COLORS.TEXT_MUTED,
                              },
                              "& .MuiInputLabel-root.Mui-disabled": { color: COLORS.TEXT_MUTED },
                            }
                          : {}
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 0.5 }} />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={getCurrentModeDefaults().use_trailing_stop}
                          onChange={(e) => handleInputChange("use_trailing_stop", e.target.checked)}
                        />
                      }
                      label="트레일링 스탑 사용"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`시작 조건 (${getUnit()})`}
                      type="number"
                      value={getCurrentModeDefaults().trailing_stop_trigger}
                      onChange={(e) =>
                        handleInputChange("trailing_stop_trigger", parseFloat(e.target.value))
                      }
                      disabled={!getCurrentModeDefaults().use_trailing_stop}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`트레일링 스탑 (${getUnit()})`}
                      type="number"
                      value={getCurrentModeDefaults().trailing_stop_percent}
                      onChange={(e) =>
                        handleInputChange("trailing_stop_percent", parseFloat(e.target.value))
                      }
                      disabled={!getCurrentModeDefaults().use_trailing_stop}
                    />
                  </Grid>
                </Grid>
            </Box>
          </Grid>

          {/* 포지션 분할 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  포지션 분할
                </Typography>

                <Grid container spacing={2} alignItems="center" mb={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="피라미딩 횟수"
                      type="number"
                      value={getCurrentModeDefaults().pyramiding_count}
                      onChange={(e) =>
                        handleInputChange("pyramiding_count", parseInt(e.target.value))
                      }
                      inputProps={{ min: 0, max: 10 }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      fullWidth
                      sx={{
                        borderColor: COLORS.UP,
                        color: COLORS.UP,
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: COLORS.UP,
                          backgroundColor: alpha(COLORS.UP, 0.08),
                        },
                      }}
                    >
                      초기화
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleEqualDivision}
                      fullWidth
                      sx={{
                        borderColor: COLORS.CHARTBOOK.INK,
                        color: COLORS.CHARTBOOK.INK,
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: COLORS.CHARTBOOK.INK,
                          backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06),
                        },
                      }}
                    >
                      균등
                    </Button>
                  </Grid>
                </Grid>

                <Box mb={2}>
                  <Grid container spacing={2} alignItems="center" mb={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="1차 진입시점 (원)"
                        value="자동매매에서 설정"
                        disabled
                        sx={{
                          "& .MuiInputBase-root.Mui-disabled": { backgroundColor: COLORS.DIVIDER },
                          "& .MuiInputBase-input.Mui-disabled": {
                            color: COLORS.TEXT_MUTED,
                            WebkitTextFillColor: COLORS.TEXT_MUTED,
                          },
                          "& .MuiInputLabel-root.Mui-disabled": { color: COLORS.TEXT_MUTED },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="1차 포지션 (%)"
                        type="number"
                        value={getCurrentModeDefaults().positions?.[0] || 0}
                        onChange={(e) => handlePositionChange(0, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                      />
                    </Grid>
                  </Grid>
                  {getCurrentModeDefaults().pyramiding_entries?.map((entry, index) => (
                    <Grid container spacing={2} alignItems="center" mb={1} key={index}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`${index + 2}차 진입시점 (${getUnit()})`}
                          type="number"
                          value={entry}
                          onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                          placeholder={defaults.trading_mode === "manual" ? "예: 4" : "예: 1.5"}
                          inputProps={{ step: defaults.trading_mode === "manual" ? 1 : 0.1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`${index + 2}차 포지션 (%)`}
                          type="number"
                          value={getCurrentModeDefaults().positions?.[index + 1] || 0}
                          onChange={(e) => handlePositionChange(index + 1, e.target.value)}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    합계: {positionSum.toFixed(2)}%
                  </Typography>
                  {Math.abs(positionSum - 100) > 0.01 && (
                    <Typography variant="body2" color="error.main">
                      ⚠️ 합계가 100%여야 합니다
                    </Typography>
                  )}
                </Box>
            </Box>
          </Grid>

          {/* 분할 익절 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  분할 익절
                </Typography>

                <Box mb={2}>
                  <ToggleButtonGroup
                    value={defaults.staged_exit_type}
                    exclusive
                    onChange={(_, val) => {
                      if (val) handleFieldChange("staged_exit_type", val);
                    }}
                    size="small"
                    sx={{ flexWrap: "wrap", gap: 0.5 }}
                  >
                    {[
                      { value: "none", label: "미사용" },
                      { value: "ma", label: "이동평균선" },
                      { value: "dead_cross", label: "데드크로스" },
                      { value: "new_low", label: "N일 신저가" },
                    ].map(({ value, label }) => (
                      <ToggleButton
                        key={value}
                        value={value}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        {label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {defaults.staged_exit_type !== "none" &&
                  (() => {
                    const useTS = getCurrentModeDefaults().use_trailing_stop;
                    const stages = [
                      { num: 1, label: "1단계" },
                      { num: 2, label: "2단계" },
                      { num: 3, label: "3단계" },
                    ];
                    return (
                      <>
                        {useTS && (
                          <Alert
                            severity="info"
                            sx={{ mb: 1.5, borderRadius: 1.5, fontSize: "0.78rem", py: 0.5 }}
                          >
                            트레일링 스탑 ON → <strong>3단계는 트레일링 스탑이 대체</strong>합니다.
                          </Alert>
                        )}

                        {/* 헤더 */}
                        <Grid container spacing={1} mb={0.5} sx={{ px: 0.5 }}>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                              단계
                            </Typography>
                          </Grid>
                          {defaults.staged_exit_type === "ma" && (
                            <>
                              <Grid item xs={5}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  MA 기간 (일)
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  매도 %
                                </Typography>
                              </Grid>
                            </>
                          )}
                          {defaults.staged_exit_type === "dead_cross" && (
                            <>
                              <Grid item xs={3}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  단기
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  장기
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  매도 %
                                </Typography>
                              </Grid>
                            </>
                          )}
                          {defaults.staged_exit_type === "new_low" && (
                            <>
                              <Grid item xs={5}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  N일
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="bold"
                                >
                                  매도 %
                                </Typography>
                              </Grid>
                            </>
                          )}
                        </Grid>

                        {stages.map(({ num, label }) => {
                          const isStage3 = num === 3;
                          const isDisabled = isStage3 && useTS;

                          if (isDisabled) {
                            return (
                              <Box
                                key={num}
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                                sx={{
                                  px: 1.5,
                                  py: 1,
                                  bgcolor: alpha(COLORS.WARNING, 0.07),
                                  border: `1px dashed ${alpha(COLORS.WARNING, 0.45)}`,
                                  borderRadius: 1.5,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  sx={{ minWidth: 40, color: COLORS.WARNING }}
                                >
                                  {label}
                                </Typography>
                                <Chip
                                  label="트레일링 스탑 대체"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(COLORS.WARNING, 0.15),
                                    color: COLORS.WARNING,
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    border: `1px solid ${alpha(COLORS.WARNING, 0.35)}`,
                                  }}
                                />
                              </Box>
                            );
                          }

                          return (
                            <Box
                              key={num}
                              sx={{
                                mb: 1,
                                px: 0.5,
                                py: 0.5,
                                bgcolor: alpha(COLORS.CHARTBOOK.INK, 0.03),
                                border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                                borderRadius: "2px",
                              }}
                            >
                              <Grid container spacing={1} alignItems="center">
                                <Grid item xs={3}>
                                  <Typography variant="body2" fontWeight="medium" sx={{ pl: 0.5 }}>
                                    {label}
                                  </Typography>
                                </Grid>

                                {defaults.staged_exit_type === "ma" && (
                                  <>
                                    <Grid item xs={5}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`ma_stage${num}_period`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `ma_stage${num}_period`,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1 }}
                                      />
                                    </Grid>
                                    <Grid item xs={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`ma_stage${num}_sell_pct`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `ma_stage${num}_sell_pct`,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1, max: 100, step: 1 }}
                                      />
                                    </Grid>
                                  </>
                                )}

                                {defaults.staged_exit_type === "dead_cross" && (
                                  <>
                                    <Grid item xs={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`dc_stage${num}_short`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `dc_stage${num}_short`,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1 }}
                                      />
                                    </Grid>
                                    <Grid item xs={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`dc_stage${num}_long`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `dc_stage${num}_long`,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1 }}
                                      />
                                    </Grid>
                                    <Grid item xs={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`dc_stage${num}_sell_pct`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `dc_stage${num}_sell_pct`,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1, max: 100, step: 1 }}
                                      />
                                    </Grid>
                                  </>
                                )}

                                {defaults.staged_exit_type === "new_low" && (
                                  <>
                                    <Grid item xs={5}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`nl_stage${num}_days`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `nl_stage${num}_days`,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1 }}
                                      />
                                    </Grid>
                                    <Grid item xs={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={defaults[`nl_stage${num}_sell_pct`]}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            `nl_stage${num}_sell_pct`,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        inputProps={{ min: 1, max: 100, step: 1 }}
                                      />
                                    </Grid>
                                  </>
                                )}
                              </Grid>
                            </Box>
                          );
                        })}
                      </>
                    );
                  })()}
            </Box>
          </Grid>

          {/* ── 급등테마주 자동매매 ── */}
          <Grid item xs={12}>
            <ThemeSurgeSettings defaults={defaults} onChange={handleFieldChange} />
          </Grid>

          {/* ── Row 3: 메시지 + 저장 버튼 ── */}
          <Grid item xs={12}>
            {message && (
              <Alert
                severity={message.type}
                sx={{ mb: 1.5, borderRadius: "2px", whiteSpace: "pre-line" }}
              >
                {message.text}
              </Alert>
            )}
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saveLoading}
                size="medium"
                sx={{
                  backgroundColor: COLORS.CHARTBOOK.INK,
                  color: COLORS.CHARTBOOK.GROUND,
                  px: 3,
                  py: 1,
                  borderRadius: "2px",
                  textTransform: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: COLORS.CHARTBOOK.INK,
                    opacity: 0.8,
                  },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {saveLoading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1, color: COLORS.CHARTBOOK.GROUND }} />
                    저장 중...
                  </>
                ) : (
                  "설정 저장"
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default TradingDefaults;
