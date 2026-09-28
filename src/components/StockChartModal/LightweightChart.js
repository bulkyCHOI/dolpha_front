import React, { useMemo, useRef } from "react";
import PropTypes from "prop-types";

import TradingViewChart, {
  DOWN_COLOR,
  fadedDownColor,
  OhlcLegend,
  UP_COLOR,
  fadedUpColor,
  useOhlcHover,
} from "components/TradingViewChart";
import BandFillPrimitive from "./BandFillPrimitive";

const MA60_PERIOD = 60;

/**
 * 일봉 데이터에서 MA60 × 1.5 / × 1.75 밴드를 계산한다. (슬라이딩 윈도우 O(n))
 * @param {Array<{time, close}>} data
 */
function computeMA60Band(data) {
  if (!data || data.length < MA60_PERIOD) return { lower: [], upper: [] };

  const lower = [];
  const upper = [];

  let windowSum = 0;
  for (let i = 0; i < MA60_PERIOD; i += 1) windowSum += data[i].close;

  const firstMa = windowSum / MA60_PERIOD;
  lower.push({ time: data[MA60_PERIOD - 1].time, price: firstMa * 1.5 });
  upper.push({ time: data[MA60_PERIOD - 1].time, price: firstMa * 1.75 });

  for (let i = MA60_PERIOD; i < data.length; i += 1) {
    windowSum += data[i].close - data[i - MA60_PERIOD].close;
    const ma = windowSum / MA60_PERIOD;
    lower.push({ time: data[i].time, price: ma * 1.5 });
    upper.push({ time: data[i].time, price: ma * 1.75 });
  }

  return { lower, upper };
}

/**
 * 캔들 + 거래량 차트. 일봉일 때 MA60 매도추천 밴드를 함께 그린다.
 * 공용 TradingViewChart 컴포넌트를 사용하여 렌더링을 처리한다.
 */
function LightweightChart({ data, mode, loading, initialVisibleBars }) {
  const intraday = mode === "intraday";

  // primitive는 차트 수명 동안 동일 인스턴스를 유지해야 한다.
  const bandPrimitiveRef = useRef(null);
  if (!bandPrimitiveRef.current) bandPrimitiveRef.current = new BandFillPrimitive();

  const { bar, change, onCrosshairMove } = useOhlcHover(data);

  const series = useMemo(() => {
    const candleData = (data ?? []).map((item) => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData = (data ?? []).map((item) => ({
      time: item.time,
      value: item.volume,
      color: item.close >= item.open ? fadedUpColor() : fadedDownColor(),
    }));

    // 밴드는 일봉 전용
    const { lower, upper } = intraday ? { lower: [], upper: [] } : computeMA60Band(data ?? []);
    bandPrimitiveRef.current.updateBand(lower, upper);

    return [
      {
        id: "candle",
        type: "candle",
        pane: 0,
        data: candleData,
        options: {
          upColor: UP_COLOR,
          downColor: DOWN_COLOR,
          borderUpColor: UP_COLOR,
          borderDownColor: DOWN_COLOR,
          wickUpColor: UP_COLOR,
          wickDownColor: DOWN_COLOR,
        },
        primitives: [bandPrimitiveRef.current],
      },
      {
        id: "volume",
        type: "histogram",
        pane: 1,
        data: volumeData,
        options: {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        },
      },
    ];
  }, [data, intraday]);

  const panes = useMemo(() => [{ stretch: 4 }, { stretch: 1 }], []);

  return (
    <TradingViewChart
      series={series}
      panes={panes}
      height="100%"
      intraday={intraday}
      loading={loading}
      initialVisibleBars={initialVisibleBars}
      onCrosshairMove={onCrosshairMove}
      overlay={<OhlcLegend bar={bar} change={change} intraday={intraday} />}
    />
  );
}

LightweightChart.propTypes = {
  data: PropTypes.array,
  mode: PropTypes.oneOf(["daily", "intraday"]),
  loading: PropTypes.bool,
  initialVisibleBars: PropTypes.number,
};

LightweightChart.defaultProps = {
  data: [],
  mode: "daily",
  loading: false,
  initialVisibleBars: null,
};

export default LightweightChart;
