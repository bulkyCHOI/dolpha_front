import { useCallback, useMemo, useState } from "react";

/**
 * 크로스헤어가 가리키는 캔들과 전일 대비 등락을 계산한다.
 * 크로스헤어가 차트 밖이면 마지막 캔들을 보여준다 (TradingView 동작과 동일).
 *
 * @param {Array} data  { time, open, high, low, close, volume } 배열
 * @param {string} candleSeriesId  캔들 시리즈의 id
 */
export default function useOhlcHover(data, candleSeriesId = "candle") {
  const [hoverTime, setHoverTime] = useState(null);

  const onCrosshairMove = useCallback(
    (param, chart, seriesMap) => {
      const candleSeries = seriesMap?.get(candleSeriesId);
      if (!param.time || !candleSeries || !param.seriesData?.get(candleSeries)) {
        setHoverTime(null);
        return;
      }
      setHoverTime(param.time);
    },
    [candleSeriesId]
  );

  const { bar, change } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return { bar: null, change: null };

    const index = hoverTime == null ? data.length - 1 : data.findIndex((d) => d.time === hoverTime);
    const resolvedIndex = index < 0 ? data.length - 1 : index;
    const current = data[resolvedIndex];
    if (!current) return { bar: null, change: null };

    const previousClose = data[resolvedIndex - 1]?.close;
    const diff = previousClose == null ? null : current.close - previousClose;

    return {
      bar: current,
      change: diff == null ? null : { diff, pct: previousClose ? (diff / previousClose) * 100 : 0 },
    };
  }, [data, hoverTime]);

  return { bar, change, onCrosshairMove };
}
