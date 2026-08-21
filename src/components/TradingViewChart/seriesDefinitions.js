import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";

/** 선언적 series spec의 `type` 문자열 → lightweight-charts 시리즈 정의 매핑 */
const SERIES_DEFINITIONS = {
  candle: CandlestickSeries,
  bar: BarSeries,
  line: LineSeries,
  area: AreaSeries,
  baseline: BaselineSeries,
  histogram: HistogramSeries,
};

export function resolveSeriesDefinition(type) {
  const definition = SERIES_DEFINITIONS[type];
  if (!definition) {
    throw new Error(`지원하지 않는 차트 시리즈 타입입니다: ${type}`);
  }
  return definition;
}

export default SERIES_DEFINITIONS;
