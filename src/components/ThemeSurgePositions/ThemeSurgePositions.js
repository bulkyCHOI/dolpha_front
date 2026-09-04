import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Link as RouterLink } from "react-router-dom";

import Typography from "@mui/material/Typography";
import { COLORS, alpha } from "constants/styles";

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const RISE = COLORS.UP;
const FALL = COLORS.DOWN;
const MUTED = COLORS.CHARTBOOK.INK;
const OK = COLORS.SUCCESS;

const cardSx = {
  p: 2,
  borderRadius: 0,
  height: "100%",
  boxShadow: "none",
  backgroundColor: COLORS.CHARTBOOK.GROUND,
  border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
};

const won = (v) => (v ?? 0).toLocaleString("ko-KR");
const signedPct = (v) => `${v >= 0 ? "+" : ""}${(v ?? 0).toFixed(2)}%`;
const plColor = (v) => (v >= 0 ? RISE : FALL);

/** 진입 3조건 충족 표시 — 눌림목 / 돌파 / 외국인 */
function ConditionDots({ pullback, breakout, foreign }) {
  const items = [
    { label: "눌림목", ok: pullback },
    { label: "돌파", ok: breakout },
    { label: "외국인", ok: foreign },
  ];
  return (
    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
      {items.map(({ label, ok }) => (
        <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: ok ? OK : COLORS.CHARTBOOK.GRID,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: ok ? OK : MUTED, fontWeight: ok ? 700 : 400, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

ConditionDots.propTypes = {
  pullback: PropTypes.bool,
  breakout: PropTypes.bool,
  foreign: PropTypes.bool,
};
ConditionDots.defaultProps = { pullback: false, breakout: false, foreign: false };

function ThemeBadge({ name }) {
  if (!name) return null;
  return (
    <Chip
      size="small"
      label={name}
      sx={{
        height: 19,
        fontSize: 11,
        backgroundColor: "transparent",
        border: `1px solid ${COLORS.CHARTBOOK.PANEL_BLUE}`,
        color: COLORS.CHARTBOOK.PANEL_BLUE,
        fontWeight: 600,
        borderRadius: "2px",
        fontFamily: MONO_STACK,
      }}
    />
  );
}

ThemeBadge.propTypes = { name: PropTypes.string };
ThemeBadge.defaultProps = { name: "" };

/** 보유 포지션 카드 — 손익이 주인공 */
function PositionCard({ position: p }) {
  return (
    <Card sx={cardSx}>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: 15 }}>
              {p.stock_name}
            </Typography>
            <ThemeBadge name={p.theme_name} />
          </Box>
          <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 11, fontFamily: MONO_STACK }}>
            {p.stock_code} · {p.entry_count}/{p.max_entries}차 진입
            {p.entered_at ? ` · ${p.entered_at}` : ""}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: plColor(p.profit_loss_rate), lineHeight: 1.1, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}
          >
            {signedPct(p.profit_loss_rate)}
          </Typography>
          <Typography variant="caption" sx={{ color: plColor(p.profit_loss_rate), fontSize: 11, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {p.profit_loss_amount >= 0 ? "+" : ""}
            {won(p.profit_loss_amount)}원
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1.25, borderColor: COLORS.CHARTBOOK.GRID }} />

      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: MUTED, fontSize: 11, display: "block", fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            평단 → 현재가
          </Typography>
          <Typography variant="button" sx={{ fontSize: 13, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {won(p.avg_price)} → <strong>{won(p.current_price)}</strong>
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: MUTED, fontSize: 11, display: "block", fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            수량
          </Typography>
          <Typography variant="button" sx={{ fontSize: 13, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {won(p.quantity)}주
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: MUTED, fontSize: 11, display: "block", fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            손절가
          </Typography>
          <Typography variant="button" sx={{ fontSize: 13, color: FALL, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {p.stop_price ? won(p.stop_price) : "—"}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: MUTED, fontSize: 11, display: "block", fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            목표가
          </Typography>
          <Typography variant="button" sx={{ fontSize: 13, color: RISE, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {p.target_price ? won(p.target_price) : "—"}
          </Typography>
        </Grid>
      </Grid>

      {p.entry_reason && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.25, color: MUTED, fontSize: 11, lineHeight: 1.5 }}
        >
          진입 근거 · {p.entry_reason}
        </Typography>
      )}

      <Box
        component={RouterLink}
        to="/trading-configs"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          mt: 1,
          fontSize: 11,
          color: COLORS.CHARTBOOK.PANEL_BLUE,
          textDecoration: "none",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        설정·상세 보기 <OpenInNewIcon sx={{ fontSize: 12 }} />
      </Box>
    </Card>
  );
}

PositionCard.propTypes = { position: PropTypes.object.isRequired };

/** 대기 후보 카드 — "왜 아직 안 샀는가"가 주인공 */
function WatchingCard({ item: w }) {
  return (
    <Card
      sx={{
        ...cardSx,
        borderLeft: "none",
        borderTop: `2px solid ${w.conditions_met >= 2 ? COLORS.WARNING : COLORS.CHARTBOOK.GRID}`,
      }}
    >
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: 14 }}>
              {w.stock_name}
            </Typography>
            <ThemeBadge name={w.theme_name} />
          </Box>
          <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 11, fontFamily: MONO_STACK }}>
            {w.stock_code}
            {w.checked_at ? ` · ${w.checked_at} 판정` : ""}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${w.conditions_met}/3`}
          sx={{
            height: 20,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: "transparent",
            border: `1px solid ${w.conditions_met >= 2 ? COLORS.WARNING : COLORS.CHARTBOOK.GRID}`,
            color: w.conditions_met >= 2 ? COLORS.WARNING : MUTED,
            borderRadius: "2px",
            fontFamily: MONO_STACK,
          }}
        />
      </Box>

      <Box sx={{ mt: 1.25 }}>
        <ConditionDots
          pullback={w.has_pullback}
          breakout={w.has_breakout}
          foreign={w.has_foreign_buying}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, color: COLORS.CHARTBOOK.INK, fontSize: 11, lineHeight: 1.5 }}
      >
        {w.last_reason}
      </Typography>
    </Card>
  );
}

WatchingCard.propTypes = { item: PropTypes.object.isRequired };

/**
 * 급등테마주 자동매매 현황.
 * 보유 포지션(손익 중심)과 대기 후보(미진입 사유 중심)를 나란히 보여준다.
 */
function ThemeSurgePositions({ positions, watching, summary, loading, error, isAuthenticated }) {
  if (!isAuthenticated) {
    return (
      <Alert severity="info" sx={{ mb: 2, backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
        로그인하면 내 급등테마주 보유 포지션과 진입 대기 종목이 여기에 표시됩니다.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[0, 1, 2].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Skeleton variant="rounded" height={150} sx={{ backgroundColor: COLORS.CHARTBOOK.GRID }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
        {error}
      </Alert>
    );
  }

  const isEmpty = positions.length === 0 && watching.length === 0;

  if (isEmpty) {
    return (
      <Card sx={{ ...cardSx, mb: 2, py: 3, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: MUTED }}>
          현재 급등테마주 전략으로 추적 중인 종목이 없습니다.
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 12 }}>
          마이페이지에서 급등테마주 자동매매를 켜면 장중 급등 테마의 주도주가 자동으로 등록됩니다.
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {positions.length > 0 && (
        <>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 15, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
              보유 포지션
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED, fontFamily: MONO_STACK }}>
              {summary.position_count}종목
            </Typography>
            <Typography
              variant="button"
              sx={{ fontSize: 13, fontWeight: 700, color: plColor(summary.total_profit_rate), fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}
            >
              {signedPct(summary.total_profit_rate)} ({summary.total_profit_loss >= 0 ? "+" : ""}
              {won(summary.total_profit_loss)}원)
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mb: watching.length > 0 ? 2.5 : 0 }}>
            {positions.map((p) => (
              <Grid item xs={12} md={6} lg={4} key={p.stock_code}>
                <PositionCard position={p} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {watching.length > 0 && (
        <>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 15, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
              진입 대기
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED, fontSize: 12 }}>
              {summary.watching_count}종목 · 눌림목 → 전고점 돌파 → 외국인 매수세 3조건이 모두
              갖춰지면 매수합니다
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {watching.map((w) => (
              <Grid item xs={12} md={6} lg={4} key={w.stock_code}>
                <WatchingCard item={w} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}

ThemeSurgePositions.propTypes = {
  positions: PropTypes.array,
  watching: PropTypes.array,
  summary: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  isAuthenticated: PropTypes.bool,
};

ThemeSurgePositions.defaultProps = {
  positions: [],
  watching: [],
  summary: { position_count: 0, watching_count: 0, total_profit_loss: 0, total_profit_rate: 0 },
  loading: false,
  error: null,
  isAuthenticated: false,
};

export default ThemeSurgePositions;
