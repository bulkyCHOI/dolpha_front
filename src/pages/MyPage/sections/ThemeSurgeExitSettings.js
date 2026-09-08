/**
 * 급등테마주 청산 설정 — 데이 트레이딩 전용.
 *
 * 진입 신호가 만든 좌표를 그대로 청산 기준으로 쓴다.
 *   T(1T) = 눌림 저점 → 전고점 돌파가 상승폭
 *   손절가 = 눌림 저점 (진입 근거가 깨지는 지점)
 *   목표가 = 평단 + n × T  ← 차수·비율을 유저가 자유롭게 설정
 * 마지막 잔량은 트레일링 스탑(직전 N봉 최저점 이탈)이 담당한다.
 */

import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import Typography from "@mui/material/Typography";
import { COLORS, alpha } from "constants/styles";

const ACCENT = COLORS.WARNING;
const MUTED = COLORS.TEXT_SECONDARY;

const BAR_UNITS = [
  { value: "1m", label: "1분봉" },
  { value: "5m", label: "5분봉" },
  { value: "1d", label: "일봉" },
];

const DEFAULT_STAGES = [{ t: 2.0, sell_pct: 50.0 }];
const MAX_STAGES = 5;

const OVERNIGHT_CONDITIONS = [
  { key: "foreign", label: "외국인 순매수", help: "외국계 회원사 합계 순매수가 플러스" },
  {
    key: "institution",
    label: "기관 순매수",
    help: "당일 기관 순매수가 플러스 (장중엔 잠정 집계라 0으로 나올 수 있음)",
  },
  { key: "program", label: "프로그램 순매수", help: "당일 프로그램 누적 순매수가 플러스" },
  {
    key: "shinhan_top5",
    label: "신한증권 매수 상위 5위",
    help: "신한투자증권이 매수 상위 5개 증권사 안에 있음",
  },
];
const ALL_OVERNIGHT_KEYS = OVERNIGHT_CONDITIONS.map((c) => c.key);

function Label({ text, help }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
        {text}
      </Typography>
      <Tooltip title={help} arrow placement="top">
        <HelpOutlineIcon sx={{ fontSize: 14, color: COLORS.TEXT_MUTED, cursor: "help" }} />
      </Tooltip>
    </Box>
  );
}

Label.propTypes = {
  text: PropTypes.string.isRequired,
  help: PropTypes.string.isRequired,
};

function ThemeSurgeExitSettings({ defaults, onChange }) {
  const useOwnExit = defaults.theme_surge_use_own_exit !== false;
  const useTrailing = defaults.theme_surge_use_trailing !== false;
  const forceExit = defaults.theme_surge_force_exit_enabled !== false;
  const overnightEnabled = defaults.theme_surge_overnight_enabled === true;
  const overnightConditions = Array.isArray(defaults.theme_surge_overnight_conditions)
    ? defaults.theme_surge_overnight_conditions
    : ALL_OVERNIGHT_KEYS;
  const overnightMinCount = Number(defaults.theme_surge_overnight_min_count) || 2;
  const overnightMaxDays = Number(defaults.theme_surge_overnight_max_days) || 3;

  /** 조건 체크박스 토글 — 항상 새 배열로 교체하고 필요 개수를 범위 안으로 맞춘다 */
  const toggleOvernightCondition = (key) => {
    const next = overnightConditions.includes(key)
      ? overnightConditions.filter((k) => k !== key)
      : [...overnightConditions, key];
    onChange("theme_surge_overnight_conditions", next);
    if (next.length > 0 && overnightMinCount > next.length) {
      onChange("theme_surge_overnight_min_count", next.length);
    }
  };
  const stages = Array.isArray(defaults.theme_surge_exit_stages)
    ? defaults.theme_surge_exit_stages
    : DEFAULT_STAGES;

  const totalSellPct = stages.reduce((sum, stage) => sum + (Number(stage.sell_pct) || 0), 0);
  const remainPct = Math.max(0, 100 - totalSellPct);

  /** 차수 배열은 항상 새 배열로 교체한다 (원본 불변) */
  const updateStage = (index, field, value) =>
    onChange(
      "theme_surge_exit_stages",
      stages.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage))
    );

  const addStage = () => {
    const lastT = stages.length ? Number(stages[stages.length - 1].t) || 0 : 0;
    onChange("theme_surge_exit_stages", [
      ...stages,
      { t: lastT + 2, sell_pct: Math.min(remainPct || 25, 100) },
    ]);
  };

  const removeStage = (index) =>
    onChange(
      "theme_surge_exit_stages",
      stages.filter((_, i) => i !== index)
    );

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
            청산 설정 (데이 트레이딩)
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: MUTED }}>
            진입 신호의 눌림 저점을 손절가로, 눌림 저점 → 돌파가 상승폭을 1T로 씁니다
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={useOwnExit}
              onChange={(e) => onChange("theme_surge_use_own_exit", e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: ACCENT,
                },
              }}
            />
          }
          label={
            <Typography variant="button" sx={{ color: useOwnExit ? ACCENT : MUTED }}>
              {useOwnExit ? "전용 청산" : "Manual 설정 사용"}
            </Typography>
          }
          labelPlacement="start"
          sx={{ mr: 0 }}
        />
      </Box>

      <Collapse in={useOwnExit}>
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: "2px", fontSize: 13 }}>
            테마는 다음 날 소멸할 수 있으므로 <strong>당일 청산</strong>을 전제로 합니다. 손절은
            진입 신호의 <strong>눌림 저점</strong>이고, 배팅 사이즈는 그 손절가에 닿았을 때 계좌에서
            잃을 금액이 아래 비율이 되도록 자동 계산됩니다. 다만 눌림이 얕으면 매수 금액이
            과도해지므로 <strong>1종목 최대 비중</strong>으로 한 번 더 잘라냅니다.
          </Alert>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Label
                text="손절 시 계좌 손실"
                help="손절가(눌림 저점)에 닿았을 때 계좌 전체에서 잃을 비율입니다. 이 값과 종목별 손절폭으로 매수 금액이 정해집니다. 예: 계좌 1억, 손실 1%, 손절폭 2% → 5,000만원 매수."
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                value={defaults.theme_surge_max_loss ?? 1.0}
                onChange={(e) =>
                  onChange("theme_surge_max_loss", parseFloat(e.target.value) || 0.1)
                }
                inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontFamily: "'Fragment Mono', 'Monaco', monospace",
                    fontVariantNumeric: "tabular-nums",
                  },
                  "& .MuiInputBase-root": {
                    "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Label
                text="1종목 최대 비중"
                help="한 종목에 넣을 수 있는 매수 금액의 상한(계좌 대비)입니다. 눌림이 얕아 손절폭이 작으면 위 공식이 계좌의 절반 이상을 한 종목에 배정하므로, 갭·거래정지로 손절이 밀리는 경우에 대비해 비중 자체를 제한합니다. 예: 계좌 1억, 상한 20% → 최대 2,000만원."
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                value={defaults.theme_surge_max_position_pct ?? 20.0}
                onChange={(e) =>
                  onChange("theme_surge_max_position_pct", parseFloat(e.target.value) || 1.0)
                }
                inputProps={{ min: 1, max: 100, step: 1 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontFamily: "'Fragment Mono', 'Monaco', monospace",
                    fontVariantNumeric: "tabular-nums",
                  },
                  "& .MuiInputBase-root": {
                    "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Label
                text="당일 강제 청산"
                help="오버나이트 갭 리스크를 막는 마지막 안전장치입니다. 이 시각이 되면 조건과 무관하게 잔량을 전량 시장가 청산합니다."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={forceExit}
                    onChange={(e) => onChange("theme_surge_force_exit_enabled", e.target.checked)}
                  />
                }
                label={
                  <Typography variant="button" sx={{ color: MUTED }}>
                    {forceExit ? "사용" : "미사용"}
                  </Typography>
                }
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Label
                text="강제 청산 시각"
                help="동시호가 직전(15:20 전후)을 권장합니다. KIS 매매동향 조회가 가능한 시간(~15:30) 안이어야 오버나이트 판정이 되므로 최대 15:25까지만 허용됩니다."
              />
              <TextField
                fullWidth
                size="small"
                type="time"
                disabled={!forceExit}
                value={defaults.theme_surge_force_exit_time ?? "15:20"}
                onChange={(e) => onChange("theme_surge_force_exit_time", e.target.value)}
                inputProps={{ step: 300, max: "15:25" }}
              />
            </Grid>
          </Grid>

          {/* ── 오버나이트 보유 ─────────────────────────── */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
                오버나이트 보유
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: MUTED }}>
                강제 청산 시각에 아래 수급 조건이 지정 개수 이상 충족되면 잔량을 전량 익일로
                이월합니다
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={overnightEnabled}
                  disabled={!forceExit}
                  onChange={(e) => onChange("theme_surge_overnight_enabled", e.target.checked)}
                />
              }
              label={
                <Typography variant="button" sx={{ color: overnightEnabled ? ACCENT : MUTED }}>
                  {overnightEnabled ? "사용" : "미사용"}
                </Typography>
              }
              labelPlacement="start"
              sx={{ mr: 0 }}
            />
          </Box>

          <Collapse in={overnightEnabled && forceExit}>
            <Alert severity="info" sx={{ my: 1.5, borderRadius: "2px", fontSize: 13 }}>
              이월된 포지션은 다음 날에도 전용 청산 규칙(손절·트레일링·분할익절)을 그대로 따르고,
              강제 청산 시각이 되면 같은 조건을 <strong>다시 평가</strong>합니다. 보유 거래일이{" "}
              <strong>최대 보유일</strong>에 도달하면 조건과 무관하게 전량 청산합니다. 수급 데이터를
              하나라도 조회하지 못하면 안전하게 당일 청산합니다.
            </Alert>

            <Label
              text="이월 조건"
              help="강제 청산 시각에 실시간으로 확인할 수급 조건입니다. 매매동향 버튼으로 보던 값과 같은 소스를 씁니다."
            />
            <FormGroup sx={{ mb: 1 }}>
              {OVERNIGHT_CONDITIONS.map((cond) => (
                <FormControlLabel
                  key={cond.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={overnightConditions.includes(cond.key)}
                      onChange={() => toggleOvernightCondition(cond.key)}
                      sx={{ "&.Mui-checked": { color: ACCENT } }}
                    />
                  }
                  label={
                    <Tooltip title={cond.help} arrow placement="top">
                      <Typography variant="caption" sx={{ color: COLORS.TEXT }}>
                        {cond.label}
                      </Typography>
                    </Tooltip>
                  }
                />
              ))}
            </FormGroup>

            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={6} sm={4}>
                <Label
                  text="필요 충족 개수"
                  help="체크한 조건 중 몇 개 이상 충족돼야 익일 이월할지 정합니다. 체크한 조건 수를 넘을 수 없습니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={overnightMinCount}
                  onChange={(e) =>
                    onChange(
                      "theme_surge_overnight_min_count",
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  }
                  inputProps={{
                    min: 1,
                    max: Math.max(1, overnightConditions.length),
                    step: 1,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        / {Math.max(1, overnightConditions.length)}개
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Label
                  text="최대 보유일"
                  help="이 보유 거래일차에 도달하면 조건과 무관하게 전량 강제 청산합니다. 진입일이 1일차입니다. 예: 3 → 최대 2회 오버나이트."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={overnightMaxDays}
                  onChange={(e) =>
                    onChange(
                      "theme_surge_overnight_max_days",
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  }
                  inputProps={{ min: 1, max: 10, step: 1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">일차 청산</InputAdornment>,
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                  }}
                />
              </Grid>
            </Grid>

            {overnightConditions.length === 0 && (
              <Alert severity="warning" sx={{ mb: 1, borderRadius: "2px", fontSize: 13 }}>
                조건을 하나도 선택하지 않으면 오버나이트 이월이 일어나지 않습니다.
              </Alert>
            )}
          </Collapse>

          {/* ── 분할 익절 차수 ───────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
              분할 익절 차수
            </Typography>
            <Tooltip
              title="목표가 = 평단 + n × T. T는 진입 신호의 눌림 저점에서 돌파가까지의 상승폭입니다. 손절폭이 곧 1T 근처이므로 2T는 손익비 2:1을 뜻합니다."
              arrow
              placement="top"
            >
              <HelpOutlineIcon sx={{ fontSize: 14, color: COLORS.TEXT_MUTED, cursor: "help" }} />
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                color: MUTED,
                ml: "auto",
                fontFamily: "'Fragment Mono', 'Monaco', monospace",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              누적 {totalSellPct.toFixed(0)}% · 트레일링 몫 {remainPct.toFixed(0)}%
            </Typography>
          </Box>

          {stages.map((stage, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Grid container spacing={1} alignItems="center" key={index} sx={{ mb: 1 }}>
              <Grid item xs={2} sm={1}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  sx={{ color: COLORS.STRATEGY_THEME_SURGE }}
                >
                  {index + 1}차
                </Typography>
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={stage.t ?? 2}
                  onChange={(e) => updateStage(index, "t", parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0.1, max: 50, step: 0.5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">T</InputAdornment> }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                    "& .MuiInputBase-root": {
                      "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={stage.sell_pct ?? 50}
                  onChange={(e) => updateStage(index, "sell_pct", parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 1, max: 100, step: 5 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">% 청산</InputAdornment>,
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                    "& .MuiInputBase-root": {
                      "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={2} sm={1}>
                <IconButton
                  size="small"
                  onClick={() => removeStage(index)}
                  disabled={stages.length <= 1}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconButton
              size="small"
              onClick={addStage}
              disabled={stages.length >= MAX_STAGES || remainPct <= 0}
              sx={{ color: COLORS.STRATEGY_THEME_SURGE }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ color: MUTED }}>
              차수 추가 (최대 {MAX_STAGES}차)
            </Typography>
          </Box>

          {totalSellPct > 100 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "2px", fontSize: 13 }}>
              누적 청산 비율이 100%를 넘습니다. 초과하는 차수는 저장 시 버려집니다.
            </Alert>
          )}

          {/* ── 트레일링 스탑 ────────────────────────────── */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
                잔여 물량 트레일링 스탑
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: MUTED }}>
                설정한 배수(T)를 초과하면 추적을 시작하고, 직전 N봉 최저점을 깨면 잔량을 전량 청산
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={useTrailing}
                  onChange={(e) => onChange("theme_surge_use_trailing", e.target.checked)}
                />
              }
              label={
                <Typography variant="button" sx={{ color: MUTED }}>
                  {useTrailing ? "사용" : "미사용"}
                </Typography>
              }
              labelPlacement="start"
              sx={{ mr: 0 }}
            />
          </Box>

          <Collapse in={useTrailing}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <Label
                  text="추적 시작 배수"
                  help="평단 + 이 배수 × T 를 넘어선 뒤부터 최저점 추적을 시작합니다. 마지막 익절 차수와 같거나 그보다 높게 잡는 것이 자연스럽습니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={defaults.theme_surge_trailing_start_t ?? 2.0}
                  onChange={(e) =>
                    onChange("theme_surge_trailing_start_t", parseFloat(e.target.value) || 0.1)
                  }
                  inputProps={{ min: 0.1, max: 50, step: 0.5 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">T 초과</InputAdornment>,
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                    "& .MuiInputBase-root": {
                      "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <Label
                  text="최저점 판정 봉"
                  help="최저점을 어떤 봉으로 볼지 정합니다. 당일 청산 전략이면 5분봉을, 며칠 들고 갈 생각이면 일봉을 고르세요."
                />
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={defaults.theme_surge_trailing_bar_unit ?? "5m"}
                  onChange={(e) => onChange("theme_surge_trailing_bar_unit", e.target.value)}
                >
                  {BAR_UNITS.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} sm={4}>
                <Label
                  text="최저점 구간"
                  help="직전 몇 개 봉의 최저가를 스탑 라인으로 쓸지 정합니다. 진행 중인 봉은 저가가 확정되지 않아 제외합니다. 짧을수록 민감하게 털립니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={defaults.theme_surge_trailing_bar_count ?? 3}
                  onChange={(e) =>
                    onChange("theme_surge_trailing_bar_count", parseInt(e.target.value, 10) || 1)
                  }
                  inputProps={{ min: 1, max: 60, step: 1 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">봉</InputAdornment> }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "'Fragment Mono', 'Monaco', monospace",
                      fontVariantNumeric: "tabular-nums",
                    },
                    "& .MuiInputBase-root": {
                      "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Collapse>

          <Typography
            variant="caption"
            sx={{ display: "block", mt: 2, color: MUTED, lineHeight: 1.6 }}
          >
            · 청산 우선순위: <strong>강제청산 → 손절 → 트레일링 → 분할익절</strong> 순으로
            판정합니다.
            <br />· 전용 청산을 끄면 위 Manual 설정(손절·익절·트레일링·분할익절)을 그대로 따릅니다.
            Manual 기본값은 주 단위 스윙에 맞춰져 있으므로 당일 매매에는 권장하지 않습니다.
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

ThemeSurgeExitSettings.propTypes = {
  defaults: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThemeSurgeExitSettings;
