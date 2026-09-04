/**
 * 급등테마주 분할 진입 설정 — 회차별 T배수 진입.
 *
 * 진입 신호가 만든 좌표를 기준으로 단계별 진입을 설정한다.
 *   T(1T) = 눌림 저점 → 전고점 돌파가 상승폭
 *   1차 진입 = 돌파 즉시 (t = 0)
 *   2차 이상 = 최초 체결가 + t × T 도달 시 진입  ← 사용자가 회차별로 자유롭게 설정
 * 비중은 총 포지션 대비 비율(%)이며, 저장 시 합계를 100으로 정규화한다.
 */

import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import Typography from "@mui/material/Typography";
import { COLORS, alpha } from "constants/styles";

const ACCENT = COLORS.WARNING;
const MUTED = COLORS.TEXT_SECONDARY;

const MAX_ENTRY_STAGES = 5;
const DEFAULT_STAGES = [{ t: 0, weight_pct: 100 }];

function ThemeSurgeEntryStages({ defaults, onChange }) {
  const stages = Array.isArray(defaults.theme_surge_entry_stages)
    ? defaults.theme_surge_entry_stages
    : DEFAULT_STAGES;

  const totalWeightPct = stages.reduce((sum, stage) => sum + (Number(stage.weight_pct) || 0), 0);
  const isWeightInvalid = Math.abs(totalWeightPct - 100) > 0.01;

  /** 차수 배열은 항상 새 배열로 교체한다 (원본 불변) */
  const updateStage = (index, field, value) =>
    onChange(
      "theme_surge_entry_stages",
      stages.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage))
    );

  const addStage = () => {
    const lastT = stages.length ? Number(stages[stages.length - 1].t) || 0 : 0;
    if (totalWeightPct <= 0) {
      // 비중이 없으면 새 행에 50을 준다
      onChange("theme_surge_entry_stages", [...stages, { t: lastT + 1.0, weight_pct: 50 }]);
    } else {
      // 기존 비중을 재분배하되, 마지막 행을 반으로 쪼개 새 행에 준다
      const newStages = stages.map((s, i) => {
        if (i === stages.length - 1) {
          return { ...s, weight_pct: Math.max(1, Math.floor((s.weight_pct || 0) / 2)) };
        }
        return s;
      });
      const lastWeight = Number(stages[stages.length - 1].weight_pct) || 0;
      const newWeight = Math.max(1, lastWeight - Math.floor(lastWeight / 2));
      newStages.push({ t: lastT + 1.0, weight_pct: newWeight });
      onChange("theme_surge_entry_stages", newStages);
    }
  };

  const removeStage = (index) =>
    onChange(
      "theme_surge_entry_stages",
      stages.filter((_, i) => i !== index)
    );

  return (
    <Box sx={{ mt: 3, borderRadius: "2px", backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, p: 2 }}>
      {/* ── 분할 진입 차수 ───────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="button" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
          분할 진입 차수
        </Typography>
        <Tooltip
          title="1차는 돌파 즉시 진입하며, 2차 이상은 최초 체결가로부터 T 좌표를 더한 가격에 진입합니다. T는 진입 신호의 눌림 저점에서 돌파가까지의 상승폭입니다."
          arrow
          placement="top"
        >
          <HelpOutlineIcon sx={{ fontSize: 14, color: COLORS.TEXT_MUTED, cursor: "help" }} />
        </Tooltip>
        <Typography variant="caption" sx={{ color: MUTED, ml: "auto" }}>
          누적 {totalWeightPct.toFixed(1)}%
        </Typography>
      </Box>

      {/* 헤더 행 */}
      <Grid container spacing={1} alignItems="center" sx={{ mb: 1, px: 1 }}>
        <Grid item xs={2} sm={1} />
        <Grid item xs={4} sm={3}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: MUTED, fontFamily: "'Fragment Mono', 'Monaco', monospace" }}>
            T배수
          </Typography>
        </Grid>
        <Grid item xs={4} sm={3}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: MUTED, fontFamily: "'Fragment Mono', 'Monaco', monospace" }}>
            진입 비중
          </Typography>
        </Grid>
        <Grid item xs={2} sm={1} />
      </Grid>

      {stages.map((stage, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Grid container spacing={1} alignItems="center" key={index} sx={{ mb: 1 }}>
          <Grid item xs={2} sm={1}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.STRATEGY_THEME_SURGE }}>
              {index + 1}차
            </Typography>
          </Grid>
          <Grid item xs={4} sm={3}>
            {index === 0 ? (
              <TextField
                fullWidth
                size="small"
                type="text"
                disabled
                value="0"
                helperText="돌파 즉시"
                InputProps={{
                  endAdornment: <InputAdornment position="end">T</InputAdornment>,
                }}
                sx={{
                  "& .MuiInputBase-input": { fontFamily: "'Fragment Mono', 'Monaco', monospace", fontVariantNumeric: "tabular-nums" },
                  "& .MuiInputBase-root.Mui-disabled": { backgroundColor: COLORS.CHARTBOOK.GRID },
                  "& .MuiInputBase-input.Mui-disabled": { color: COLORS.TEXT_MUTED, WebkitTextFillColor: COLORS.TEXT_MUTED },
                  "& .MuiInputLabel-root.Mui-disabled": { color: COLORS.TEXT_MUTED },
                }}
              />
            ) : (
              <TextField
                fullWidth
                size="small"
                type="number"
                value={stage.t ?? 0}
                onChange={(e) => updateStage(index, "t", parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 50, step: 0.5 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">T</InputAdornment>,
                }}
                sx={{
                  "& .MuiInputBase-input": { fontFamily: "'Fragment Mono', 'Monaco', monospace", fontVariantNumeric: "tabular-nums" },
                  "& .MuiInputBase-root": {
                    "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.04) },
                  },
                }}
              />
            )}
          </Grid>
          <Grid item xs={4} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={stage.weight_pct ?? 0}
              onChange={(e) => updateStage(index, "weight_pct", parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, max: 100, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                "& .MuiInputBase-input": { fontFamily: "'Fragment Mono', 'Monaco', monospace", fontVariantNumeric: "tabular-nums" },
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
          disabled={stages.length >= MAX_ENTRY_STAGES}
          sx={{ color: COLORS.STRATEGY_THEME_SURGE }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ color: MUTED }}>
          차수 추가 (최대 {MAX_ENTRY_STAGES}차)
        </Typography>
      </Box>

      {isWeightInvalid && (
        <Alert severity="warning" sx={{ mb: 0, borderRadius: "2px", fontSize: 13 }}>
          누적 진입 비중이 {totalWeightPct.toFixed(1)}%입니다. 저장 시 100%으로 자동 정규화됩니다.
        </Alert>
      )}
    </Box>
  );
}

ThemeSurgeEntryStages.propTypes = {
  defaults: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThemeSurgeEntryStages;
