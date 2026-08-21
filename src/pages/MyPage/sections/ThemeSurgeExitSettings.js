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
import { COLORS } from "constants/styles";

const ACCENT = COLORS.WARNING;
const MUTED = COLORS.TEXT_SECONDARY;

const BAR_UNITS = [
  { value: "1m", label: "1분봉" },
  { value: "5m", label: "5분봉" },
  { value: "1d", label: "일봉" },
];

const DEFAULT_STAGES = [{ t: 2.0, sell_pct: 50.0 }];
const MAX_STAGES = 5;

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
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
            테마는 다음 날 소멸할 수 있으므로 <strong>당일 청산</strong>을 전제로 합니다. 손절은
            진입 신호의 <strong>눌림 저점</strong>이고, 배팅 사이즈는 그 손절가에 닿았을 때 계좌에서
            잃을 금액이 아래 비율이 되도록 자동 계산됩니다.
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
                    onChange={(e) =>
                      onChange("theme_surge_force_exit_enabled", e.target.checked)
                    }
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
                help="동시호가 직전(15:20 전후)을 권장합니다. 너무 늦으면 유동성이 얇아 체결가가 불리해집니다."
              />
              <TextField
                fullWidth
                size="small"
                type="time"
                disabled={!forceExit}
                value={defaults.theme_surge_force_exit_time ?? "15:20"}
                onChange={(e) => onChange("theme_surge_force_exit_time", e.target.value)}
                inputProps={{ step: 300 }}
              />
            </Grid>
          </Grid>

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
            <Typography variant="caption" sx={{ color: MUTED, ml: "auto" }}>
              누적 {totalSellPct.toFixed(0)}% · 트레일링 몫 {remainPct.toFixed(0)}%
            </Typography>
          </Box>

          {stages.map((stage, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Grid container spacing={1} alignItems="center" key={index} sx={{ mb: 1 }}>
              <Grid item xs={2} sm={1}>
                <Typography variant="caption" fontWeight="bold" sx={{ color: ACCENT }}>
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
                />
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={stage.sell_pct ?? 50}
                  onChange={(e) =>
                    updateStage(index, "sell_pct", parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ min: 1, max: 100, step: 5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">% 청산</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={2} sm={1}>
                <IconButton size="small" onClick={() => removeStage(index)} disabled={stages.length <= 1}>
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
              sx={{ color: ACCENT }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ color: MUTED }}>
              차수 추가 (최대 {MAX_STAGES}차)
            </Typography>
          </Box>

          {totalSellPct > 100 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
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
                  InputProps={{ endAdornment: <InputAdornment position="end">T 초과</InputAdornment> }}
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
            <br />· 전용 청산을 끄면 위 Manual 설정(손절 · 익절 · 트레일링 · 분할익절)을 그대로
            따릅니다. Manual 기본값은 주 단위 스윙에 맞춰져 있으므로 당일 매매에는 권장하지
            않습니다.
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
