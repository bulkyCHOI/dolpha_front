/** 진입 판정 차트 공용 상수 — 색/라벨을 한 곳에서 관리한다. */

import { COLORS, resolveColor } from "constants/styles";

/**
 * 캔버스용 색 묶음. CSS 변수는 앱 마운트 후에야 존재하므로
 * 모듈 로드 시점이 아니라 접근 시점에 해석한다.
 */
const canvasColors = (map) =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(map).map(([key, value]) => [
        key,
        { get: () => resolveColor(value), enumerable: true },
      ])
    )
  );

export const CHART_COLORS = canvasColors({
  UP: COLORS.UP,
  DOWN: "#3b82f6",
  PREV_HIGH: COLORS.UP,
  BREAKOUT: COLORS.WARNING,
  PULLBACK: COLORS.DOWN,
  DECISION: "#616161",
  PASSED: COLORS.WARNING,
  EXECUTED: COLORS.SUCCESS,
  MUTED: COLORS.TEXT_SECONDARY,
  GRID: COLORS.DIVIDER,
  BORDER: "#d9dee5",
});

export const ZONE_STYLE = {
  PULLBACK: {
    fill: "rgba(21, 101, 192, 0.10)",
    stroke: "rgba(21, 101, 192, 0.40)",
    label: "눌림 구간",
    labelColor: COLORS.DOWN,
  },
  RISE: {
    fill: "rgba(239, 68, 68, 0.07)",
    stroke: "rgba(239, 68, 68, 0.30)",
    // 차트 안 라벨은 구간 폭에 들어가야 그려지므로 짧게 쓴다 (범례에는 전체 이름)
    label: "상승 구간",
    labelColor: COLORS.UP,
  },
};

/** 3단 진입 조건 정의 — 리스트·요약·범례가 모두 이 순서를 따른다. */
export const CONDITIONS = [
  { key: "has_pullback", label: "눌림목", color: CHART_COLORS.PULLBACK },
  { key: "has_breakout", label: "돌파", color: CHART_COLORS.BREAKOUT },
  { key: "has_foreign_buying", label: "외국인", color: CHART_COLORS.EXECUTED },
];

export const LEGEND_ITEMS = [
  { label: "전고점", color: CHART_COLORS.PREV_HIGH, kind: "line" },
  { label: "돌파 기준선", color: CHART_COLORS.BREAKOUT, kind: "dotted" },
  { label: "눌림 저점", color: CHART_COLORS.PULLBACK, kind: "dashed" },
  { label: "눌림 구간", color: ZONE_STYLE.PULLBACK.stroke, kind: "zone" },
  { label: "직전 상승 구간", color: ZONE_STYLE.RISE.stroke, kind: "zone" },
  { label: "판정 시점", color: CHART_COLORS.DECISION, kind: "vertical" },
];

/** 판정 결과 → 표시 텍스트/색 */
export const decisionStatus = (decision) => {
  if (!decision) return { label: "—", color: CHART_COLORS.MUTED, bg: COLORS.SURFACE_ALT };
  if (decision.executed) return { label: "진입", color: COLORS.SUCCESS, bg: COLORS.TINT_SUCCESS };
  if (decision.passed) return { label: "충족", color: COLORS.WARNING, bg: `${COLORS.TINT_WARNING}` };
  return { label: "대기", color: CHART_COLORS.MUTED, bg: COLORS.SURFACE_ALT };
};

export const won = (value) =>
  value == null || Number.isNaN(value) ? "—" : Math.round(value).toLocaleString("ko-KR");

export const pct = (value, digits = 2) =>
  value == null || Number.isNaN(value) ? "—" : `${value.toFixed(digits)}%`;

export const ratio = (value, digits = 2) =>
  value == null || Number.isNaN(value) ? "—" : `${value.toFixed(digits)}배`;

/** 차트 time(초) → "HH:MM" (KST 벽시계를 UTC로 실어 보낸 값이라 UTC getter로 읽는다) */
export const timeLabel = (seconds) => {
  if (seconds == null) return "";
  const d = new Date(seconds * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(
    2,
    "0"
  )}`;
};
