import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import useTradingViewChart from "./useTradingViewChart";
import { COLORS } from "constants/styles";

/**
 * 프로젝트 공용 TradingView(lightweight-charts) 차트.
 *
 * 여러 지표를 pane으로 쌓으면 시간축과 크로스헤어가 자동으로 동기화된다.
 *
 * @example
 * <TradingViewChart
 *   height={520}
 *   panes={[{ stretch: 3 }, { stretch: 1 }]}
 *   series={[
 *     { id: "candle", type: "candle", pane: 0, data: candles },
 *     { id: "volume", type: "histogram", pane: 1, data: volumes },
 *   ]}
 * />
 */
function TradingViewChart({
  series,
  panes,
  height,
  intraday,
  loading,
  emptyMessage,
  initialVisibleBars,
  initialVisibleRange,
  fitContentKey,
  onClick,
  onCrosshairMove,
  onMouseDown,
  chartOptions,
  overlay,
  sx,
}) {
  const { containerRef, chartRef } = useTradingViewChart({
    series,
    panes,
    intraday,
    onClick,
    onCrosshairMove,
    chartOptions,
  });

  // 초기 뷰 범위는 대상이 바뀔 때(fitContentKey) 한 번만 맞춘다.
  // 폴링 갱신 때마다 맞추면 사용자의 줌/팬 상태가 초기화된다.
  const appliedFitKeyRef = useRef(null);
  const barCount = series[0]?.data?.length ?? 0;

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || barCount === 0) return;
    if (appliedFitKeyRef.current === fitContentKey) return;

    // 가격축을 드래그하면 autoScale이 꺼진 채로 남는다. 대상이 바뀌면
    // 값 범위도 달라지므로 자동 조정을 다시 켜준다.
    chart.panes().forEach((pane, index) => {
      try {
        chart.priceScale("right", index).applyOptions({ autoScale: true });
      } catch (error) {
        // 해당 pane에 우측 축이 없으면 무시한다
      }
    });

    const timeScale = chart.timeScale();
    if (initialVisibleRange) {
      // setData 렌더링이 끝난 뒤 적용해야 auto-scroll에 덮이지 않는다.
      requestAnimationFrame(() => {
        if (chartRef.current) chartRef.current.timeScale().setVisibleRange(initialVisibleRange);
      });
    } else if (initialVisibleBars && barCount > initialVisibleBars) {
      timeScale.setVisibleLogicalRange({ from: barCount - initialVisibleBars, to: barCount - 1 });
    } else {
      timeScale.fitContent();
    }
    appliedFitKeyRef.current = fitContentKey;
  }, [fitContentKey, barCount, initialVisibleBars, initialVisibleRange, chartRef]);

  const isEmpty = !loading && barCount === 0;

  return (
    <div
      style={{ position: "relative", width: "100%", height, ...sx }}
      onMouseDownCapture={onMouseDown}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {overlay}
      {isEmpty && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.TEXT_MUTED,
            fontSize: "14px",
            pointerEvents: "none",
          }}
        >
          {emptyMessage}
        </div>
      )}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.6)",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          로딩 중...
        </div>
      )}
    </div>
  );
}

TradingViewChart.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["candle", "bar", "line", "area", "baseline", "histogram"]).isRequired,
      pane: PropTypes.number,
      data: PropTypes.array,
      options: PropTypes.object,
      markers: PropTypes.array,
      priceLines: PropTypes.array,
      // primitive는 시리즈 생성 시 1회만 부착되므로 안정된 인스턴스를 넘겨야 한다.
      primitives: PropTypes.array,
      // 이 시리즈가 쓰는 가격 축 옵션 (오버레이 축의 scaleMargins 등)
      priceScaleOptions: PropTypes.object,
    })
  ),
  panes: PropTypes.arrayOf(
    PropTypes.shape({ stretch: PropTypes.number, priceScale: PropTypes.object })
  ),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  intraday: PropTypes.bool,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  initialVisibleBars: PropTypes.number,
  initialVisibleRange: PropTypes.shape({ from: PropTypes.any, to: PropTypes.any }),
  fitContentKey: PropTypes.string,
  onClick: PropTypes.func,
  onCrosshairMove: PropTypes.func,
  /**
   * 차트 영역 mousedown. 수평선 드래그 시작 판정에 쓴다.
   * lightweight-charts가 캔버스에서 전파를 막으므로 캡처 단계에서 받는다.
   */
  onMouseDown: PropTypes.func,
  chartOptions: PropTypes.object,
  overlay: PropTypes.node,
  sx: PropTypes.object,
};

TradingViewChart.defaultProps = {
  series: [],
  panes: [],
  height: 400,
  intraday: false,
  loading: false,
  emptyMessage: "차트 데이터를 사용할 수 없습니다",
  initialVisibleBars: null,
  initialVisibleRange: null,
  fitContentKey: null,
  onClick: undefined,
  onCrosshairMove: undefined,
  onMouseDown: undefined,
  chartOptions: undefined,
  overlay: null,
  sx: undefined,
};

export default TradingViewChart;
