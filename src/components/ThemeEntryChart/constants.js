/** 진입 판정 차트 공용 상수 — 색/라벨을 한 곳에서 관리한다. */

import { COLORS } from "constants/styles";

export const CHART_COLORS = {
  UP: "#ef4444",
  DOWN: "#3b82f6",
  PREV_HIGH: COLORS.UP,
  BREAKOUT: COLORS.WARNING,
  PULLBACK: COLORS.DOWN,
  DECISION: "#616161",
  PASSED: "#f59e0b",
  EXECUTED: "#16a34a",
  MUTED: COLORS.TEXT_SECONDARY,
  GRID: COLORS.DIVIDER,
  BORDER: "#d9dee5",
};

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
    labelColor: "#c62828",
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
  if (!decision) return { label: "—", color: CHART_COLORS.MUTED, bg: "#eceff1" };
  if (decision.executed) return { label: "진입", color: COLORS.SUCCESS, bg: "#e8f5e9" };
  if (decision.passed) return { label: "충족", color: COLORS.WARNING, bg: `#fff8e1` };
  return { label: "대기", color: CHART_COLORS.MUTED, bg: "#eceff1" };
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
