import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";

import Typography from "@mui/material/Typography";
import { CHART_COLORS, LEGEND_ITEMS, decisionStatus, pct, ratio, won } from "./constants";
import { COLORS } from "constants/styles";

const OK_ICON = "✓";
const NG_ICON = "✕";

/** 조건 카드 1장 — 충족 여부와 '어떤 수치가 기준을 넘었/못 넘었는지'를 함께 보여준다. */
function ConditionCard({ label, ok, color, metrics }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        height: "100%",
        border: "1px solid",
        borderColor: ok ? `${color}55` : "#e6eaef",
        bgcolor: ok ? `${color}0f` : "#fafbfc",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.75 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.SURFACE,
            bgcolor: ok ? color : COLORS.BORDER_STRONG,
          }}
        >
          {ok ? OK_ICON : NG_ICON}
        </Box>
        <Typography
          variant="button"
          sx={{ fontSize: 12.5, fontWeight: 700, color: ok ? color : CHART_COLORS.MUTED }}
        >
          {label}
        </Typography>
      </Box>
      {metrics.map(({ name, value, criterion }) => (
        <Box key={name} sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.25 }}>
          <Typography variant="caption" sx={{ fontSize: 11, color: CHART_COLORS.MUTED }}>
            {name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {value}
            {criterion && (
              <Box component="span" sx={{ color: "#aab4bf", fontWeight: 400, ml: 0.5 }}>
                / {criterion}
              </Box>
            )}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

ConditionCard.propTypes = {
  label: PropTypes.string.isRequired,
  ok: PropTypes.bool,
  color: PropTypes.string.isRequired,
  metrics: PropTypes.array.isRequired,
};

ConditionCard.defaultProps = { ok: false };

/** 차트 색·기호 범례 */
export function ChartLegend() {
  const swatch = (kind, color) => {
    if (kind === "zone") {
      return { width: 14, height: 9, bgcolor: `${color}`, opacity: 0.45, borderRadius: 0.5 };
    }
    if (kind === "vertical") {
      return { width: 2, height: 11, bgcolor: color };
    }
    return {
      width: 14,
      height: 0,
      borderTop: `2px ${
        kind === "dotted" ? "dotted" : kind === "dashed" ? "dashed" : "solid"
      } ${color}`,
    };
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center" }}>
      {LEGEND_ITEMS.map(({ label, color, kind }) => (
        <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={swatch(kind, color)} />
          <Typography variant="caption" sx={{ fontSize: 10.5, color: CHART_COLORS.MUTED }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * 선택된 판정의 수치 요약.
 * 차트가 '어디'를 보여준다면 여기는 '왜 통과/탈락인지'를 숫자로 보여준다.
 */
function DecisionSummary({ decision, params }) {
  if (!decision) return null;

  const status = decisionStatus(decision);
  const geometry = decision.geometry;
  const recomputed = geometry?.recomputed;
  const prevHigh = geometry?.swing_high?.price ?? decision.prev_high;

  const pullbackMetrics = [
    {
      name: "깊이",
      value: pct(decision.pullback_pct ?? recomputed?.pullback_pct),
      criterion: `${params.pullback_min_pct}~${params.pullback_max_pct}%`,
    },
    {
      name: "구간",
      value: recomputed ? `${recomputed.pullback_bar_count}봉` : "—",
      criterion: `${params.pullback_min_bars}봉↑`,
    },
    {
      name: "거래량비",
      value: ratio(recomputed?.pullback_volume_ratio),
      criterion: `${params.pullback_volume_ratio_max}↓`,
    },
  ];

  const breakoutMetrics = [
    { name: "전고점", value: won(prevHigh) },
    { name: "돌파선", value: won(geometry?.breakout_threshold) },
    { name: "판정가", value: won(decision.price) },
    {
      name: "거래량비",
      value: ratio(decision.volume_ratio ?? recomputed?.breakout_volume_ratio),
      criterion: `${params.breakout_volume_ratio_min}↑`,
    },
  ];

  const foreignMetrics = [
    {
      name: "순매수",
      value:
        decision.foreign_net_buy == null
          ? "조회 실패"
          : `${decision.foreign_net_buy >= 0 ? "+" : ""}${won(decision.foreign_net_buy)}주`,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography variant="button" sx={{ fontSize: 13, fontWeight: 700 }}>
          {decision.time} 판정
        </Typography>
        <Chip
          size="small"
          label={status.label}
          sx={{
            height: 19,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: status.bg,
            color: status.color,
          }}
        />
        {geometry && !geometry.verified && (
          <Tooltip title="저장된 전고점과 분봉 재계산 결과가 달라, 차트 위 좌표는 참고용입니다.">
            <Chip
              size="small"
              label="좌표 추정"
              sx={{ height: 19, fontSize: 10.5, bgcolor: `#fff3e0`, color: COLORS.WARNING }}
            />
          </Tooltip>
        )}
        {!geometry && (
          <Chip
            size="small"
            label="분봉 부족 — 좌표 복원 불가"
            sx={{ height: 19, fontSize: 10.5, bgcolor: COLORS.SURFACE_ALT, color: CHART_COLORS.MUTED }}
          />
        )}
        <Typography variant="caption" sx={{ fontSize: 11.5, color: CHART_COLORS.MUTED }}>
          {decision.reason}
        </Typography>
      </Box>

      <Grid container spacing={1}>
        <Grid item xs={12} sm={4}>
          <ConditionCard
            label="1. 눌림목"
            ok={decision.has_pullback}
            color={CHART_COLORS.PULLBACK}
            metrics={pullbackMetrics}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ConditionCard
            label="2. 전고점 돌파"
            ok={decision.has_breakout}
            color={CHART_COLORS.BREAKOUT}
            metrics={breakoutMetrics}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ConditionCard
            label="3. 외국인 매수세"
            ok={decision.has_foreign_buying}
            color={CHART_COLORS.EXECUTED}
            metrics={foreignMetrics}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

DecisionSummary.propTypes = {
  decision: PropTypes.object,
  params: PropTypes.object,
};

DecisionSummary.defaultProps = { decision: null, params: {} };

export default DecisionSummary;
