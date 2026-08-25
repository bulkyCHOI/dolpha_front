import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { LineStyle } from "lightweight-charts";

import TradingViewChart from "components/TradingViewChart";

import ZonePrimitive from "components/TradingViewChart/ZonePrimitive";
import { CHART_COLORS, ZONE_STYLE, decisionStatus, timeLabel, won } from "./constants";
import { COLORS, alpha, resolveColor } from "constants/styles";

const MINUTE = 60;
const LEAD_MINUTES = 4; // 탐색 구간 시작 앞쪽 여백
const TRAIL_MINUTES = 12; // 판정 시점 뒤쪽 여백
const EXIT_LEAD_MINUTES = 40; // 청산 시점 앞쪽 여백 (어떤 흐름 끝에 청산됐는지 보이게)
const FALLBACK_BARS = 90; // 판정 좌표가 없을 때 보여줄 최근 봉 수

const upVolume = () => alpha(resolveColor(COLORS.UP), 0.45);
const downVolume = () => alpha(resolveColor(COLORS.DOWN), 0.45);
const decisionVolume = () => "rgba(97, 97, 97, 0.75)";

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

/** 선택된 판정 + 당일 청산 체결의 마커 목록. */
function buildMarkers(bars, decision, exits) {
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

  // 청산은 선택과 무관하게 항상 보여준다 — 하루의 결말이라 늘 궁금한 정보다
  exits.forEach((exit) => {
    markers.push({
      time: snapToBar(bars, exit.chart_time),
      position: "aboveBar",
      shape: "arrowDown",
      color: CHART_COLORS.EXIT,
      text: `${exit.exited_at} ${exit.is_partial ? "분할청산" : "청산"}`,
    });
  });

  // 같은 봉에 마커가 겹치면 lightweight-charts가 세로로 쌓아 준다
  return markers.filter((m) => m.time != null).sort((a, b) => a.time - b.time);
}

/** 선택된 판정의 음영 구간과 세로선 + 청산 시점 세로선. */
function buildShapes(bars, decision, exits) {
  const zones = [];
  const verticals = [];
  const geometry = decision?.geometry;

  if (geometry) {
    if (geometry.rise_zone) {
      zones.push({ ...geometry.rise_zone, ...ZONE_STYLE.RISE });
    }
    if (geometry.pullback_zone) {
      zones.push({ ...geometry.pullback_zone, ...ZONE_STYLE.PULLBACK });
    }
    if (geometry.decision_bar) {
      verticals.push({
        time: geometry.decision_bar,
        color: CHART_COLORS.DECISION,
        label: `${decision.time} 판정`,
      });
    }
  }

  exits.forEach((exit) => {
    // 거래가 없던 분은 봉 자체가 없다. 그대로 넘기면 timeToCoordinate 가 null 을
    // 돌려줘 선이 조용히 사라지므로, 실재하는 봉으로 스냅해서 그린다.
    const time = snapToBar(bars, exit.chart_time);
    if (time == null) return;
    verticals.push({
      time,
      color: CHART_COLORS.EXIT,
      label: `${exit.exited_at} ${exit.is_partial ? "분할청산" : "청산"}`,
    });
  });

  return { zones, verticals };
}

/** 선택된 판정의 기준 가격선 + 선택된 청산의 체결가선. */
function buildPriceLines(decision, selectedExit) {
  if (selectedExit) {
    return [
      {
        price: selectedExit.exit_price,
        color: CHART_COLORS.EXIT,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: selectedExit.is_partial ? "분할청산가" : "청산가",
      },
    ];
  }

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

/** 선택된 시점이 한눈에 들어오도록 보이는 시간 범위를 정한다. */
function focusRange(bars, decision, selectedExit) {
  if (bars.length === 0) return null;
  const last = bars[bars.length - 1].time;

  // 청산을 골랐으면 체결 시점 앞뒤를 균형 있게 — 청산은 시작 구간이 따로 없다
  if (selectedExit?.chart_time != null) {
    return {
      from: selectedExit.chart_time - EXIT_LEAD_MINUTES * MINUTE,
      to: selectedExit.chart_time + TRAIL_MINUTES * MINUTE,
    };
  }

  const geometry = decision?.geometry;
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
function EntryDecisionChart({ bars, decision, exits, selectedExit, height }) {
  // primitive는 차트 수명 동안 같은 인스턴스를 유지해야 한다.
  const zonesRef = useRef(null);
  if (!zonesRef.current) zonesRef.current = new ZonePrimitive();

  const [hoverBar, setHoverBar] = useState(null);

  const series = useMemo(() => {
    const decisionBar = decision?.geometry?.decision_bar;

    const { zones, verticals } = buildShapes(bars, decision, exits);
    zonesRef.current.setShapes(zones, verticals);

    return [
      {
        id: "candle",
        type: "candle",
        pane: 0,
        data: bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })),
        options: {
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
        },
        primitives: [zonesRef.current],
        markers: buildMarkers(bars, decision, exits),
        priceLines: buildPriceLines(decision, selectedExit).map((options) => ({
          axisLabelVisible: true,
          ...options,
        })),
      },
      {
        id: "volume",
        type: "histogram",
        pane: 0,
        data: bars.map((bar) => ({
          time: bar.time,
          value: bar.volume,
          color:
            bar.time === decisionBar
              ? decisionVolume()
              : bar.close >= bar.open
              ? upVolume()
              : downVolume(),
        })),
        options: {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
          priceLineVisible: false,
          lastValueVisible: false,
        },
        priceScaleOptions: { scaleMargins: { top: 0.82, bottom: 0 } },
      },
    ];
  }, [bars, decision, exits, selectedExit]);

  const handleCrosshairMove = (param, chart, seriesMap) => {
    const candleSeries = seriesMap?.get("candle");
    const candleData = param.time && candleSeries ? param.seriesData?.get(candleSeries) : null;
    if (!candleData) {
      setHoverBar(null);
      return;
    }
    setHoverBar({
      time: param.time,
      ...candleData,
      volume: param.seriesData?.get(seriesMap.get("volume"))?.value,
    });
  };

  // 호버 전 기본값은 '지금 보고 있는 시점'의 봉 — 화면 밖 마지막 봉을 띄우면 혼란스럽다
  const focusBar = selectedExit?.chart_time ?? decision?.geometry?.decision_bar;
  const readout =
    hoverBar ??
    bars.find((bar) => bar.time === focusBar) ??
    (bars.length ? bars[bars.length - 1] : null);
  const readoutColor =
    readout && readout.close >= readout.open ? CHART_COLORS.UP : CHART_COLORS.DOWN;

  const readoutOverlay = readout ? (
    <div
      style={{
        position: "absolute",
        top: 6,
        left: 8,
        zIndex: 2,
        fontSize: 11.5,
        background: alpha(COLORS.SURFACE, 0.88),
        color: COLORS.TEXT,
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
  ) : null;

  return (
    <TradingViewChart
      series={series}
      panes={[{ stretch: 1 }]}
      height={height}
      intraday
      // 선택이 바뀔 때마다 해당 구간으로 화면을 다시 맞춘다
      fitContentKey={`${selectedExit ? `exit-${selectedExit.id}` : decision?.time ?? "none"}-${
        bars.length
      }`}
      initialVisibleRange={focusRange(bars, decision, selectedExit)}
      onCrosshairMove={handleCrosshairMove}
      overlay={readoutOverlay}
      chartOptions={{
        // 배경·글자색은 공용 테마(baseChartOptions)가 테마별 실제 색으로 준다.
        // 여기서 CSS 변수를 그대로 넘기면 캔버스가 해석하지 못해 흰 배경이 된다.
        layout: { fontSize: 11 },
        grid: {
          vertLines: { color: CHART_COLORS.GRID },
          horzLines: { color: CHART_COLORS.GRID },
        },
        rightPriceScale: {
          borderColor: CHART_COLORS.BORDER,
          scaleMargins: { top: 0.12, bottom: 0.28 },
        },
      }}
    />
  );
}

EntryDecisionChart.propTypes = {
  bars: PropTypes.array,
  decision: PropTypes.object,
  exits: PropTypes.array,
  selectedExit: PropTypes.object,
  height: PropTypes.number,
};

EntryDecisionChart.defaultProps = {
  bars: [],
  decision: null,
  exits: [],
  selectedExit: null,
  height: 380,
};

export default EntryDecisionChart;
