/**
 * 종목 분석 차트(캔들 · 거래량 · RS · ATR · MTT)의 시리즈 spec 빌더.
 *
 * OHLCV / 분석 데이터를 TradingViewChart가 이해하는 선언적 spec으로 변환한다.
 * 모든 시리즈는 날짜(time)를 키로 정렬되므로, 지표별 결측치가 있어도
 * 캔들과 x축이 어긋나지 않는다.
 */
import {
  DOWN_COLOR,
  DOWN_COLOR_FADED,
  INDICATOR_COLORS,
  MARKER_COLORS,
  MA_COLORS,
  UP_COLOR,
  UP_COLOR_FADED,
} from "components/TradingViewChart/chartTheme";
import { COLORS } from "constants/styles";

/** pane 인덱스 정의 — 위에서 아래 순서 */
export const PANE = {
  PRICE: 0,
  VOLUME: 1,
  RS: 2,
  MTT: 3,
  ATR: 4,
};

/**
 * 이동평균선 정의 — 차트 시리즈와 범례가 함께 사용한다.
 *
 * 분석 API는 ma50 · ma150 · ma200만 내려주므로, 여기서 쓰는 기간은
 * 종가에서 직접 계산한다 (buildMovingAverage).
 */
export const MA_FIELDS = [
  { field: "ma5", period: 5, label: "5일선" },
  { field: "ma20", period: 20, label: "20일선" },
  { field: "ma60", period: 60, label: "60일선" },
  { field: "ma120", period: 120, label: "120일선" },
].map((item) => ({
  ...item,
  // 색은 접근할 때 읽는다 (CSS 변수는 앱 마운트 후에야 존재한다)
  get color() {
    return MA_COLORS[item.field];
  },
}));

/** RS Rank 계열 정의 — 차트 시리즈와 범례가 함께 사용한다. */
export const RS_FIELDS = [
  { field: "rsRank", label: "RS", key: "rsRank" },
  { field: "rsRank1m", label: "1M", key: "rsRank1m" },
  { field: "rsRank3m", label: "3M", key: "rsRank3m" },
  { field: "rsRank6m", label: "6M", key: "rsRank6m" },
  { field: "rsRank12m", label: "12M", key: "rsRank12m" },
].map((item) => ({
  ...item,
  get color() {
    return INDICATOR_COLORS[item.key];
  },
}));

const LINE_BASE_OPTIONS = {
  lineWidth: 2,
  priceLineVisible: false,
  lastValueVisible: false,
  crosshairMarkerVisible: true,
};

/** 거래정지일 보정: O/H/L이 0이고 종가만 있는 날은 종가로 채운다. */
function normalizeCandle(item) {
  const isHalted = (item.open === 0 || item.high === 0 || item.low === 0) && item.close > 0;
  return {
    time: item.date,
    open: isHalted ? item.close : item.open,
    high: isHalted ? item.close : item.high,
    low: isHalted ? item.close : item.low,
    close: item.close,
  };
}

function isValidNumber(value) {
  return value !== null && value !== undefined && !Number.isNaN(Number(value));
}

/**
 * 종가 단순이동평균. 슬라이딩 윈도우로 O(n).
 *
 * 거래정지일은 종가만 있고 O/H/L이 0이지만 종가 자체는 유효하므로
 * 그대로 평균에 포함한다.
 *
 * @param {Array} ohlcvData
 * @param {number} period
 */
export function buildMovingAverage(ohlcvData, period) {
  const bars = (ohlcvData ?? []).filter((item) => item?.date);
  if (bars.length < period) return [];

  const result = [];
  let windowSum = 0;

  for (let i = 0; i < bars.length; i += 1) {
    windowSum += bars[i].close;
    if (i >= period) windowSum -= bars[i - period].close;
    if (i >= period - 1) {
      result.push({ time: bars[i].date, value: windowSum / period });
    }
  }

  return result;
}

/** analysisData에서 지정 필드를 라인 데이터로 뽑는다. */
function toLineData(analysisData, field, transform) {
  return (analysisData ?? [])
    .filter((item) => item.date && isValidNumber(item[field]))
    .map((item) => ({
      time: item.date,
      value: transform ? transform(item[field]) : Number(item[field]),
    }));
}

export function buildCandleSeries(ohlcvData) {
  return (ohlcvData ?? []).filter((item) => item?.date).map(normalizeCandle);
}

export function buildVolumeSeries(ohlcvData) {
  return (ohlcvData ?? [])
    .filter((item) => item?.date)
    .map((item) => ({
      time: item.date,
      value: item.volume ?? 0,
      color: item.close >= item.open ? UP_COLOR_FADED : DOWN_COLOR_FADED,
    }));
}

/**
 * HTF 패턴의 상승 구간 음영.
 * 시작일 ~ 고점일 사이를 밴드로 칠한다 (원본 Chart.js의 "HTF 상승구간" 대체).
 */
export function buildHtfZones(chartType, selectedStock) {
  if (chartType !== "htf") return [];
  const from = selectedStock?.htf_pattern_start_date;
  const to = selectedStock?.htf_pattern_peak_date;
  if (!from || !to) return [];

  return [
    {
      from,
      to,
      fill: "rgba(34, 197, 94, 0.10)",
      stroke: "rgba(34, 197, 94, 0.45)",
      label: "HTF 상승구간",
      labelColor: MARKER_COLORS.htfStart,
    },
  ];
}

/** HTF 패턴 시작점/고점 마커 */
export function buildHtfMarkers(chartType, selectedStock) {
  // API 응답에는 htf_pattern_detected 필드가 없다.
  // 패턴 날짜가 내려오는지로 판단한다.
  if (chartType !== "htf") return [];
  if (!selectedStock?.htf_pattern_start_date && !selectedStock?.htf_pattern_peak_date) return [];

  const markers = [];
  if (selectedStock.htf_pattern_start_date) {
    markers.push({
      time: selectedStock.htf_pattern_start_date,
      position: "belowBar",
      color: MARKER_COLORS.htfStart,
      shape: "arrowUp",
      text: "HTF 시작",
    });
  }
  if (selectedStock.htf_pattern_peak_date) {
    markers.push({
      time: selectedStock.htf_pattern_peak_date,
      position: "aboveBar",
      color: MARKER_COLORS.htfPeak,
      shape: "arrowDown",
      text: "HTF 고점",
    });
  }
  return markers;
}

/** VCP 변곡점 마커 */
export function buildInflectionMarkers(inflectionAnalysisResult, ohlcvData) {
  const points = inflectionAnalysisResult?.inflectionPoints;
  if (!points || points.length === 0) return [];

  return points
    .map((point) => {
      const bar = ohlcvData?.[point.index];
      if (!bar?.date) return null;
      const isPeak = point.type === "peak";
      return {
        time: bar.date,
        position: isPeak ? "aboveBar" : "belowBar",
        color: isPeak ? MARKER_COLORS.inflectionUp : MARKER_COLORS.inflectionDown,
        shape: isPeak ? "arrowDown" : "arrowUp",
        size: 1,
      };
    })
    .filter(Boolean);
}

/** 사용자가 그린 수평선 + 진입가를 가격선으로 변환 */
export function buildPriceLines(horizontalLines, entryPoint) {
  const lines = (horizontalLines ?? []).map((line) => ({
    price: line.value,
    color: line.color,
    lineWidth: 2,
    lineStyle: 2, // Dashed
    axisLabelVisible: true,
    title: line.label ?? "",
  }));

  const entryPrice = Number(entryPoint);
  if (entryPoint !== "" && entryPoint !== null && !Number.isNaN(entryPrice) && entryPrice > 0) {
    lines.push({
      price: entryPrice,
      color: COLORS.PRIMARY,
      lineWidth: 2,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: "진입가",
    });
  }
  return lines;
}

/**
 * 종목 분석 차트 전체의 시리즈 spec을 만든다.
 *
 * 가격선(수평선·진입가)은 여기서 만들지 않는다. 드래그 중에는 가격선만
 * 매 프레임 바뀌는데, 같은 useMemo에 묶으면 시세 데이터 배열까지 매번
 * 새로 생성되어 차트 전체가 재업로드된다.
 */
export function buildStockChartSeries({
  ohlcvData = [],
  analysisData = [],
  chartType = "default",
  selectedStock = {},
  inflectionAnalysisResult = null,
  showInflectionPoints = false,
}) {
  const series = [];

  // ── 가격 pane ──────────────────────────────────────────────
  const markers = [
    ...buildHtfMarkers(chartType, selectedStock),
    ...(showInflectionPoints ? buildInflectionMarkers(inflectionAnalysisResult, ohlcvData) : []),
  ].sort((a, b) => (a.time < b.time ? -1 : 1));

  series.push({
    id: "candle",
    type: "candle",
    pane: PANE.PRICE,
    data: buildCandleSeries(ohlcvData),
    options: {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    },
    markers,
  });

  MA_FIELDS.forEach(({ field, period, color }) => {
    const data = buildMovingAverage(ohlcvData, period);
    if (data.length === 0) return;
    series.push({
      id: field,
      type: "line",
      pane: PANE.PRICE,
      data,
      options: { ...LINE_BASE_OPTIONS, color, lineWidth: 1.5 },
    });
  });

  // ── 거래량 pane ────────────────────────────────────────────
  series.push({
    id: "volume",
    type: "histogram",
    pane: PANE.VOLUME,
    data: buildVolumeSeries(ohlcvData),
    options: { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false },
  });

  // ── RS Rank pane ───────────────────────────────────────────
  let isFirstRsSeries = true;
  RS_FIELDS.forEach(({ field, color }) => {
    const data = toLineData(analysisData, field);
    if (data.length === 0) return;
    series.push({
      id: field,
      type: "line",
      pane: PANE.RS,
      data,
      options: { ...LINE_BASE_OPTIONS, color },
      // RS 80 기준선은 첫 RS 시리즈에만 붙인다.
      priceLines: isFirstRsSeries
        ? [
            {
              price: 80,
              color: INDICATOR_COLORS.rsBaseline,
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: "80",
            },
          ]
        : [],
    });
    isFirstRsSeries = false;
  });

  // ── ATR pane (ATR 막대 + ATR 비율 라인) ────────────────────
  const atrData = toLineData(analysisData, "atr");
  if (atrData.length > 0) {
    series.push({
      id: "atr",
      type: "histogram",
      pane: PANE.ATR,
      data: atrData.map((point) => ({ ...point, color: INDICATOR_COLORS.atr })),
      options: { priceLineVisible: false, lastValueVisible: false },
    });
  }

  const atrRatioData = toLineData(analysisData, "atrRatio", (value) => Number(value) * 100);
  if (atrRatioData.length > 0) {
    series.push({
      id: "atrRatio",
      type: "line",
      pane: PANE.ATR,
      data: atrRatioData,
      options: {
        ...LINE_BASE_OPTIONS,
        color: INDICATOR_COLORS.atrRatio,
        priceScaleId: "left",
      },
    });
  }

  // ── MTT pane (조건 충족 여부 0/1 계단선) ───────────────────
  const mttData = (analysisData ?? [])
    .filter(
      (item) =>
        item?.date && item.is_minervini_trend !== null && item.is_minervini_trend !== undefined
    )
    .map((item) => ({ time: item.date, value: item.is_minervini_trend ? 1 : 0 }));

  if (mttData.length > 0) {
    series.push({
      id: "mtt",
      type: "line",
      pane: PANE.MTT,
      data: mttData,
      options: {
        ...LINE_BASE_OPTIONS,
        color: INDICATOR_COLORS.mtt,
        lineType: 2, // WithSteps — 불리언 전환을 계단식으로 표시
        lineWidth: 2,
      },
    });
  }

  return series;
}

/** 인덱스(지수) 차트용 캔들 시리즈 */
export function buildIndexSeries(indexOhlcvData) {
  return [
    {
      id: "index-candle",
      type: "candle",
      pane: 0,
      data: buildCandleSeries(indexOhlcvData),
      options: {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderUpColor: UP_COLOR,
        borderDownColor: DOWN_COLOR,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      },
    },
  ];
}

/**
 * 실제 데이터가 있는 pane만 남겨 pane 인덱스를 다시 매긴다.
 * (RS/ATR/MTT 데이터가 없을 때 빈 pane이 남지 않도록)
 */
export function compactPanes(series, paneStretch) {
  const usedPanes = [...new Set(series.map((s) => s.pane))].sort((a, b) => a - b);
  const remap = new Map(usedPanes.map((pane, index) => [pane, index]));

  return {
    series: series.map((s) => ({ ...s, pane: remap.get(s.pane) })),
    panes: usedPanes.map((pane) => ({ stretch: paneStretch[pane] ?? 1 })),
  };
}

/**
 * pane 높이 비율.
 *
 * 보조지표(RS · MTT · ATR)는 가격 흐름을 보는 데 방해되지 않도록
 * 세 개를 같은 높이로 낮게 유지한다.
 *
 * 전체 높이를 줄일 때는 이 비율과 CHART_HEIGHT를 함께 조정해,
 * 거래량과 보조지표의 실제 픽셀 높이는 유지하고 가격 pane만 줄인다.
 */
export const PANE_STRETCH = {
  [PANE.PRICE]: 3.8,
  [PANE.VOLUME]: 1.1,
  [PANE.RS]: 0.53,
  [PANE.MTT]: 0.53,
  [PANE.ATR]: 0.53,
};
