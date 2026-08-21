/**
 * TradingView(lightweight-charts) 차트 공용 테마.
 *
 * 프로젝트 전역의 차트 색상은 모두 이 파일을 통해서만 정의한다.
 * Phase 1(디자인 토큰)에서 이 파일의 값만 테마 토큰으로 교체하면
 * 전체 차트의 색이 한 번에 바뀐다.
 */

// 상승/하락 (국내 관례: 상승 적색 / 하락 청색)
export const UP_COLOR = "#ef4444";
export const DOWN_COLOR = "#3b82f6";
export const FLAT_COLOR = "#9ca3af";

// 거래량 막대 (캔들 색의 반투명)
export const UP_COLOR_FADED = "rgba(239, 68, 68, 0.5)";
export const DOWN_COLOR_FADED = "rgba(59, 130, 246, 0.5)";

// 이동평균선
export const MA_COLORS = {
  ma50: "#ff6b35",
  ma150: "#f7931e",
  ma200: "#9c27b0",
};

// 보조지표
export const INDICATOR_COLORS = {
  rsRank: "#ef4444",
  rsRank1m: "#22c55e",
  rsRank3m: "#3b82f6",
  rsRank6m: "#a855f7",
  rsRank12m: "#334155",
  rsBaseline: "#f59e0b",
  atr: "rgba(255, 87, 34, 0.6)",
  atrBorder: "#ff5722",
  atrRatio: "#795548",
  mtt: "#22c55e",
  mttOff: "#ff5722",
};

// 마커 / 진입선
export const MARKER_COLORS = {
  htfStart: "#22c55e",
  htfPeak: "#ef4444",
  inflectionUp: "#ef4444",
  inflectionDown: "#3b82f6",
};

export const PRICE_LINE_COLORS = ["#667eea", "#f59e0b", "#22c55e", "#a855f7", "#ec4899"];

// 차트 레이아웃 (라이트 테마 기준 — Phase 2에서 다크 대응 추가)
export const CHART_SURFACE = {
  background: "#ffffff",
  textColor: "#4b5563",
  gridColor: "#f1f5f9",
  borderColor: "#e2e8f0",
};

/**
 * createChart()에 넘길 기본 옵션을 만든다.
 * @param {{ intraday?: boolean }} opts
 */
export function baseChartOptions({ intraday = false } = {}) {
  return {
    // autoSize는 0폭 마운트 시 복구되지 않으므로 사용하지 않는다.
    // 크기는 ResizeObserver로 직접 관리한다.
    autoSize: false,
    layout: {
      background: { color: CHART_SURFACE.background },
      textColor: CHART_SURFACE.textColor,
      attributionLogo: false,
      panes: {
        separatorColor: CHART_SURFACE.borderColor,
        separatorHoverColor: "rgba(102, 126, 234, 0.2)",
        enableResize: true,
      },
    },
    grid: {
      vertLines: { color: CHART_SURFACE.gridColor },
      horzLines: { color: CHART_SURFACE.gridColor },
    },
    crosshair: { mode: 1 },
    rightPriceScale: { borderColor: CHART_SURFACE.borderColor },
    timeScale: {
      borderColor: CHART_SURFACE.borderColor,
      timeVisible: intraday,
      secondsVisible: false,
      rightOffset: intraday ? 0 : 5,
      shiftVisibleRangeOnNewBar: false,
    },
    localization: { locale: "ko-KR" },
  };
}
