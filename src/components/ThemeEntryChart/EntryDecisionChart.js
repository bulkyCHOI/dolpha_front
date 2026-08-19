import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  HistogramSeries,
  LineStyle,
} from "lightweight-charts";

import ZonePrimitive from "./ZonePrimitive";
import { CHART_COLORS, ZONE_STYLE, decisionStatus, timeLabel, won } from "./constants";

const MINUTE = 60;
const LEAD_MINUTES = 4; // 탐색 구간 시작 앞쪽 여백
const TRAIL_MINUTES = 12; // 판정 시점 뒤쪽 여백
const FALLBACK_BARS = 90; // 판정 좌표가 없을 때 보여줄 최근 봉 수

const UP_VOLUME = "rgba(239, 68, 68, 0.45)";
const DOWN_VOLUME = "rgba(59, 130, 246, 0.45)";
const DECISION_VOLUME = "rgba(97, 97, 97, 0.75)";

/** 차트에 실제로 존재하는 봉 시각으로 스냅한다 (마커는 데이터 시각에만 붙는다). */
function snapToBar(bars, time) {
  if (!time || bars.length === 0) return null;
  let matched = null;
  for (let i = 0; i < bars.length; i += 1) {
    if (bars[i].time > time) break;
    matched = bars[i].time;
  }
  return matched ?? bars[0].time;
}

/** 선택된 판정의 마커 목록. */
function buildMarkers(bars, decision) {
  const geometry = decision?.geometry;
  const markers = [];

  if (geometry?.swing_high) {
    markers.push({
      time: snapToBar(bars, geometry.swing_high.time),
      position: "aboveBar",
      shape: "arrowDown",
      color: CHART_COLORS.PREV_HIGH,
      // 가격은 우측 축 라벨과 요약 카드에 있으므로 마커는 짧게 — 인접 마커와 겹치지 않는다
      text: "전고점",
    });
  }

  if (geometry?.pullback_low) {
    markers.push({
      time: snapToBar(bars, geometry.pullback_low.time),
      position: "belowBar",
      shape: "arrowUp",
      color: CHART_COLORS.PULLBACK,
      text: "눌림목",
    });
  }

  if (decision) {
    const status = decisionStatus(decision);
    markers.push({
      time: snapToBar(bars, geometry?.decision_bar ?? decision.chart_time),
      position: "aboveBar",
      shape: "circle",
      color: decision.executed
        ? CHART_COLORS.EXECUTED
        : decision.passed
        ? CHART_COLORS.PASSED
        : CHART_COLORS.DECISION,
      text: `${decision.time} ${status.label}`,
    });
  }

  // 같은 봉에 마커가 겹치면 lightweight-charts가 세로로 쌓아 준다
  return markers.filter((m) => m.time != null).sort((a, b) => a.time - b.time);
}

/** 선택된 판정의 음영 구간과 세로선. */
function buildShapes(decision) {
  const geometry = decision?.geometry;
  if (!geometry) return { zones: [], verticals: [] };

  const zones = [];
  if (geometry.rise_zone) {
    zones.push({ ...geometry.rise_zone, ...ZONE_STYLE.RISE });
  }
  if (geometry.pullback_zone) {
    zones.push({ ...geometry.pullback_zone, ...ZONE_STYLE.PULLBACK });
  }

  const verticals = geometry.decision_bar
    ? [
        {
          time: geometry.decision_bar,
          color: CHART_COLORS.DECISION,
          label: `${decision.time} 판정`,
        },
      ]
    : [];

  return { zones, verticals };
}

/** 선택된 판정의 기준 가격선. */
function buildPriceLines(decision) {
  const geometry = decision?.geometry;
  const prevHigh = geometry?.swing_high?.price ?? decision?.prev_high;
  const lines = [];

  if (prevHigh) {
    lines.push({
      price: prevHigh,
      color: CHART_COLORS.PREV_HIGH,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      title: "전고점",
    });
  }
  if (geometry?.breakout_threshold) {
    lines.push({
      price: geometry.breakout_threshold,
      color: CHART_COLORS.BREAKOUT,
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      title: "돌파선",
      // 전고점 +0.1% 라 축 라벨이 전고점과 겹친다. 값은 아래 요약 카드에서 읽는다
      axisLabelVisible: false,
    });
  }
  const pullbackLow = geometry?.pullback_low?.price ?? decision?.pullback_low;
  if (pullbackLow) {
    lines.push({
      price: pullbackLow,
      color: CHART_COLORS.PULLBACK,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: "눌림 저점",
    });
  }
  if (decision?.price) {
    lines.push({
      price: decision.price,
      color: CHART_COLORS.DECISION,
      lineWidth: 1,
      lineStyle: LineStyle.LargeDashed,
      title: "판정가",
    });
  }

  return lines;
}

/** 판정 구간이 한눈에 들어오도록 보이는 시간 범위를 정한다. */
function focusRange(bars, decision) {
  if (bars.length === 0) return null;
  const geometry = decision?.geometry;
  const last = bars[bars.length - 1].time;

  if (!geometry) {
    const head = bars[Math.max(0, bars.length - FALLBACK_BARS)].time;
    return { from: head, to: last + TRAIL_MINUTES * MINUTE };
  }

  return {
    from: geometry.window_from - LEAD_MINUTES * MINUTE,
    to: (geometry.decision_bar ?? last) + TRAIL_MINUTES * MINUTE,
  };
}

/**
 * 진입 판정 1분봉 차트.
 * 전고점·눌림 구간·돌파 기준선을 선택된 판정 기준으로 그린다.
 */
function EntryDecisionChart({ bars, decision, height }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);
  const markersRef = useRef(null);
  const zonesRef = useRef(null);
  const priceLinesRef = useRef([]);

  const [hoverBar, setHoverBar] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: { background: { color: "#ffffff" }, textColor: "#37474f", fontSize: 11 },
      grid: {
        vertLines: { color: CHART_COLORS.GRID },
        horzLines: { color: CHART_COLORS.GRID },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: CHART_COLORS.BORDER,
        scaleMargins: { top: 0.12, bottom: 0.28 },
      },
      timeScale: {
        borderColor: CHART_COLORS.BORDER,
        timeVisible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: false,
      },
      localization: { locale: "ko-KR" },
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.UP,
      downColor: CHART_COLORS.DOWN,
      borderUpColor: CHART_COLORS.UP,
      borderDownColor: CHART_COLORS.DOWN,
      wickUpColor: CHART_COLORS.UP,
      wickDownColor: CHART_COLORS.DOWN,
      priceLineVisible: false,
      lastValueVisible: false,
      // 원화는 소수점이 없다
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const zones = new ZonePrimitive();
    candle.attachPrimitive(zones);

    const handleCrosshairMove = (param) => {
      const candleData = param.time ? param.seriesData?.get(candle) : null;
      if (!candleData) {
        setHoverBar(null);
        return;
      }
      setHoverBar({
        time: param.time,
        ...candleData,
        volume: param.seriesData?.get(volume)?.value,
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;
    zonesRef.current = zones;
    markersRef.current = createSeriesMarkers(candle, []);

    // autoSize 는 컨테이너가 0폭일 때 마운트되면 이후 복구되지 않는다
    // (탭 전환·접힌 영역에서 실제로 발생). 직접 관측해 크기를 넣어 준다.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) chart.resize(width, height);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      zonesRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
    };
  }, []);

  // 분봉 갱신
  useEffect(() => {
    const candle = candleRef.current;
    const volume = volumeRef.current;
    if (!candle || !volume) return;

    const decisionBar = decision?.geometry?.decision_bar;

    candle.setData(
      bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
    );
    volume.setData(
      bars.map((bar) => ({
        time: bar.time,
        value: bar.volume,
        color:
          bar.time === decisionBar
            ? DECISION_VOLUME
            : bar.close >= bar.open
            ? UP_VOLUME
            : DOWN_VOLUME,
      }))
    );
  }, [bars, decision]);

  // 선택된 판정의 마커·음영·가격선 갱신
  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    if (!chart || !candle) return;

    priceLinesRef.current.forEach((line) => candle.removePriceLine(line));
    priceLinesRef.current = buildPriceLines(decision).map((options) =>
      candle.createPriceLine({ axisLabelVisible: true, ...options })
    );

    markersRef.current?.setMarkers(buildMarkers(bars, decision));

    const { zones, verticals } = buildShapes(decision);
    zonesRef.current?.setShapes(zones, verticals);

    const range = focusRange(bars, decision);
    if (range) {
      // setData 렌더가 끝난 뒤에 적용해야 자동 스크롤에 덮이지 않는다
      requestAnimationFrame(() => chartRef.current?.timeScale().setVisibleRange(range));
    }
  }, [bars, decision]);

  // 호버 전 기본값은 '지금 보고 있는 판정'의 봉 — 화면 밖 마지막 봉을 띄우면 혼란스럽다
  const decisionBar = decision?.geometry?.decision_bar;
  const readout =
    hoverBar ??
    bars.find((bar) => bar.time === decisionBar) ??
    (bars.length ? bars[bars.length - 1] : null);
  const readoutColor =
    readout && readout.close >= readout.open ? CHART_COLORS.UP : CHART_COLORS.DOWN;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      {readout && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            zIndex: 2,
            fontSize: 11.5,
            background: "rgba(255,255,255,0.88)",
            padding: "2px 6px",
            borderRadius: 4,
            pointerEvents: "none",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ marginRight: 10 }}>{timeLabel(readout.time)}</strong>
          <span style={{ color: CHART_COLORS.MUTED, marginRight: 3 }}>고</span>
          <span style={{ color: readoutColor, marginRight: 8 }}>{won(readout.high)}</span>
          <span style={{ color: CHART_COLORS.MUTED, marginRight: 3 }}>저</span>
          <span style={{ color: readoutColor, marginRight: 8 }}>{won(readout.low)}</span>
          <span style={{ color: CHART_COLORS.MUTED, marginRight: 3 }}>종</span>
          <span style={{ color: readoutColor, marginRight: 8 }}>{won(readout.close)}</span>
          <span style={{ color: CHART_COLORS.MUTED, marginRight: 3 }}>거래량</span>
          <span>{won(readout.volume)}</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

EntryDecisionChart.propTypes = {
  bars: PropTypes.array,
  decision: PropTypes.object,
  height: PropTypes.number,
};

EntryDecisionChart.defaultProps = { bars: [], decision: null, height: 380 };

export default EntryDecisionChart;
