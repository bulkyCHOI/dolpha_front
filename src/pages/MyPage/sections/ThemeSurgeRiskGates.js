/**
 * 급등테마주 신규 진입 리스크 게이트 (docs/13 Phase 1).
 *
 * 패턴 신호가 떠도 아래 한도에 걸리면 새로 매수하지 않는다. 이미 보유한 포지션의
 * 손절·익절·강제청산은 그대로 동작한다.
 *   - 신규 진입 마감 시각
 *   - 당일 손실 횟수 한도 (서킷브레이커)
 *   - 당일 실현손실 한도 (계좌 대비 %)
 */

import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Typography from "@mui/material/Typography";

import { COLORS } from "constants/styles";

const MONO_INPUT = {
  "& .MuiInputBase-input": {
    fontFamily: "'Fragment Mono', 'Monaco', monospace",
    fontVariantNumeric: "tabular-nums",
  },
};

function GateLabel({ text, help }) {
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

GateLabel.propTypes = {
  text: PropTypes.string.isRequired,
  help: PropTypes.string.isRequired,
};

const numberOr = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function ThemeSurgeRiskGates({ defaults, onChange }) {
  const maxLosses = numberOr(defaults.theme_surge_daily_max_losses, 1);
  const maxLossPct = numberOr(defaults.theme_surge_daily_max_loss_pct, 1.5);

  return (
    <Box sx={{ mt: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
        <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
          신규 진입 리스크 게이트
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY }}>
          신호가 떠도 한도에 걸리면 새로 사지 않습니다 · 보유 포지션 청산은 그대로
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <GateLabel
            text="신규 진입 마감"
            help="이 시각 이후에는 새 종목을 매수하지 않습니다. 실측상 14시 이후 진입은 승률 25%였습니다. 끄려면 15:30으로 두세요."
          />
          <TextField
            fullWidth
            size="small"
            type="time"
            value={defaults.theme_surge_entry_cutoff ?? "14:00"}
            onChange={(e) => onChange("theme_surge_entry_cutoff", e.target.value)}
            inputProps={{ step: 60 }}
            sx={MONO_INPUT}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <GateLabel
            text="당일 손실 횟수 한도"
            help="오늘 손실로 끝난 거래가 이 횟수에 도달하면 그날은 새로 매수하지 않습니다(서킷브레이커). 실측상 직전 거래가 손실이면 다음 거래 6건 중 1건만 이겼습니다. 0이면 사용하지 않습니다."
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            value={maxLosses}
            onChange={(e) =>
              onChange(
                "theme_surge_daily_max_losses",
                Math.min(20, Math.max(0, parseInt(e.target.value, 10) || 0))
              )
            }
            inputProps={{ min: 0, max: 20, step: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{maxLosses === 0 ? "미사용" : "회"}</InputAdornment>
              ),
            }}
            sx={MONO_INPUT}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <GateLabel
            text="당일 실현손실 한도"
            help="오늘 급등테마주 실현손익 합계가 계좌 확정원금의 이 비율만큼 손실이면 그날은 새로 매수하지 않습니다. 0이면 사용하지 않습니다."
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            value={maxLossPct}
            onChange={(e) =>
              onChange(
                "theme_surge_daily_max_loss_pct",
                Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
              )
            }
            inputProps={{ min: 0, max: 100, step: 0.5 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{maxLossPct === 0 ? "미사용" : "%"}</InputAdornment>
              ),
            }}
            sx={MONO_INPUT}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

ThemeSurgeRiskGates.propTypes = {
  defaults: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThemeSurgeRiskGates;
