import { useCallback, useMemo, useState } from "react";

/**
 * 크로스헤어가 가리키는 시점의 캔들과 각 지표 값을 읽는다.
 *
 * Chart.js의 툴팁(날짜 · 시고저종 · 등락율 · 지표별 값)을 대체한다.
 * lightweight-charts는 툴팁을 직접 그려주지 않으므로, 크로스헤어 위치의
 * 값을 뽑아 화면 상단 판독바에 표시하는 방식을 쓴다.
 *
 * @param {Array} ohlcvData 원본 OHLCV (date · change 등 부가 정보용)
 * @param {string} candleSeriesId 캔들 시리즈 id
 */
export default function useSeriesHover(ohlcvData, candleSeriesId = "candle") {
  const [hover, setHover] = useState(null);

  const onCrosshairMove = useCallback(
    (param, chart, seriesMap) => {
      if (!param.time || !param.seriesData || !seriesMap) {
        setHover(null);
        return;
      }

      const values = {};
      seriesMap.forEach((seriesApi, id) => {
        const point = param.seriesData.get(seriesApi);
        if (!point) return;
        // 라인/히스토그램은 value, 캔들은 close를 대표값으로 쓴다
        values[id] = point.value ?? point.close;
      });

      const candlePoint = param.seriesData.get(seriesMap.get(candleSeriesId));
      setHover({ time: param.time, values, candle: candlePoint ?? null });
    },
    [candleSeriesId]
  );

  /** 호버 전 기본값은 마지막 봉 (TradingView와 동일한 동작) */
  const readout = useMemo(() => {
    const bars = ohlcvData ?? [];
    if (bars.length === 0) return null;

    const index = hover ? bars.findIndex((bar) => bar.date === hover.time) : bars.length - 1;
    const resolved = index < 0 ? bars.length - 1 : index;
    const bar = bars[resolved];
    if (!bar) return null;

    return {
      bar: {
        time: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      },
      // 등락율은 API가 내려주는 change(소수)를 백분율로 환산해 쓴다
      change:
        bar.change == null
          ? null
          : { diff: bar.close - (bars[resolved - 1]?.close ?? bar.close), pct: bar.change * 100 },
      values: hover?.values ?? null,
    };
  }, [ohlcvData, hover]);

  return { readout, onCrosshairMove };
}
