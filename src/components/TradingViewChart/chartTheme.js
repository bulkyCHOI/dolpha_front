/**
 * TradingView(lightweight-charts) 차트 공용 테마.
 *
 * 색은 디자인 토큰(assets/theme/base/colors)에서 가져온다.
 * 차트와 UI가 같은 팔레트를 쓰도록 하는 것이 이 파일의 목적이며,
 * 차트 전용으로 새 색을 만들지 않는다.
 */
import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";
import { COLORS } from "constants/styles";

const { bearish, bullish, flat, grey, info, success, warning } = colors;

// 상승/하락 (국내 관례: 상승 적색 / 하락 청색)
export const UP_COLOR = bullish.main;
export const DOWN_COLOR = bearish.main;
export const FLAT_COLOR = flat.main;

// 거래량 막대 (캔들 색의 반투명)
export const UP_COLOR_FADED = "rgba(239, 68, 68, 0.5)";
export const DOWN_COLOR_FADED = "rgba(59, 130, 246, 0.5)";

// 이동평균선 (기간이 짧을수록 밝고 얇게)
export const MA_COLORS = {
  ma5: COLORS.WARNING,
  ma20: COLORS.UP,
  ma60: COLORS.SUCCESS,
  ma120: "#a855f7",
};

// 보조지표
export const INDICATOR_COLORS = {
  rsRank: bullish.main,
  rsRank1m: success.main,
  rsRank3m: info.main,
  rsRank6m: "#a855f7",
  rsRank12m: grey[800],
  rsBaseline: warning.main,
  atr: "rgba(255, 87, 34, 0.6)",
  atrBorder: COLORS.WARNING,
  atrRatio: "#795548",
  mtt: success.main,
  mttOff: COLORS.WARNING,
};

// 마커 / 진입선
export const MARKER_COLORS = {
  htfStart: success.main,
  htfPeak: bullish.main,
  inflectionUp: bullish.main,
  inflectionDown: bearish.main,
};

export const PRICE_LINE_COLORS = [
  colors.primary.main,
  warning.main,
  success.main,
  "#a855f7",
  "#ec4899",
];

// 차트 레이아웃 (라이트 테마 기준 — Phase 2에서 다크 대응 추가)
export const CHART_SURFACE = {
  background: colors.background.surface,
  textColor: colors.text.main,
  gridColor: grey[200],
  borderColor: grey[300],
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
      // 축 라벨도 UI와 같은 폰트를 쓴다
      fontFamily: typography.fontFamily,
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
    // 마우스 휠로 시간축이 확대/축소되면 페이지 스크롤 중 의도치 않게
    // 차트 배율이 바뀐다. 축소/확대는 시간축 드래그와 핀치로만 한다.
    handleScale: {
      mouseWheel: false,
      pinch: true,
      axisPressedMouseMove: true,
      axisDoubleClickReset: true,
    },
    rightPriceScale: {
      borderColor: CHART_SURFACE.borderColor,
      // 기본값(위 0.2 / 아래 0.1)은 여백이 커서 시세가 pane 가운데 좁게 몰린다.
      scaleMargins: { top: 0.1, bottom: 0.08 },
    },
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
