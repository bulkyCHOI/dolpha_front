/** 진입 판정 차트 공용 상수 — 색/라벨을 한 곳에서 관리한다. */

import { COLORS, alpha, resolveColor } from "constants/styles";

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
  DOWN: COLORS.DOWN,
  PREV_HIGH: COLORS.UP,
  BREAKOUT: COLORS.WARNING,
  PULLBACK: COLORS.DOWN,
  DECISION: COLORS.TEXT_MUTED,
  PASSED: COLORS.WARNING,
  EXECUTED: COLORS.SUCCESS,
  EXIT: COLORS.INFO_DARK,
  STOP: COLORS.DOWN,
  TARGET: COLORS.SUCCESS,
  TRAILING: COLORS.WARNING,
  MUTED: COLORS.CHARTBOOK.INK,
  GRID: COLORS.CHARTBOOK.GRID,
  BORDER: COLORS.CHARTBOOK.GRID,
});

/**
 * 구간 음영.
 *
 * 캔버스에 들어가므로 실제 색이어야 하고, 테마에 따라 값이 달라지므로
 * 모듈 로드 시점이 아니라 접근 시점(스프레드 시점)에 계산한다.
 */
const zoneStyle = (token, label, fillOpacity, strokeOpacity) => ({
  get fill() {
    return alpha(resolveColor(token), fillOpacity);
  },
  get stroke() {
    return alpha(resolveColor(token), strokeOpacity);
  },
  label,
  labelColor: token,
});

export const ZONE_STYLE = {
  PULLBACK: zoneStyle(COLORS.DOWN, "눌림 구간", 0.1, 0.4),
  // 차트 안 라벨은 구간 폭에 들어가야 그려지므로 짧게 쓴다 (범례에는 전체 이름)
  RISE: zoneStyle(COLORS.UP, "상승 구간", 0.07, 0.3),
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
  { label: "청산 체결", color: CHART_COLORS.EXIT, kind: "line" },
  { label: "손절선", color: CHART_COLORS.STOP, kind: "dashed" },
  { label: "익절선 (차수·T배수·비율)", color: CHART_COLORS.TARGET, kind: "line" },
  { label: "트레일링 시작", color: CHART_COLORS.TRAILING, kind: "dotted" },
];

/** 판정 결과 → 표시 텍스트/색 */
export const decisionStatus = (decision) => {
  if (!decision) return { label: "—", color: COLORS.CHARTBOOK.INK, bg: "transparent", border: `1px solid ${COLORS.CHARTBOOK.GRID}` };
  if (decision.executed) return { label: "진입", color: COLORS.SUCCESS, bg: "transparent", border: `1px solid ${COLORS.SUCCESS}` };
  if (decision.passed)
    return { label: "충족", color: COLORS.WARNING, bg: "transparent", border: `1px solid ${COLORS.WARNING}` };
  return { label: "대기", color: COLORS.CHARTBOOK.INK, bg: "transparent", border: `1px solid ${COLORS.CHARTBOOK.GRID}` };
};

/** 청산 유형 → 표시 텍스트/색. 부분청산과 전량청산을 구분해 보여준다. */
export const exitStatus = (exit) => {
  if (!exit) return { label: "—", color: COLORS.CHARTBOOK.INK, bg: "transparent", border: `1px solid ${COLORS.CHARTBOOK.GRID}` };
  return {
    label: exit.is_partial ? "분할청산" : "청산",
    color: COLORS.INFO_DARK,
    bg: "transparent",
    border: `1px solid ${COLORS.INFO_DARK}`,
  };
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
