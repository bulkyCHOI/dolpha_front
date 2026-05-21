import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";

const UP_COLOR = "#ef4444";
const DOWN_COLOR = "#3b82f6";

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR");
}

function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatVolume(n) {
  if (n == null || Number.isNaN(n)) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
}

function formatTime(time, mode) {
  if (time == null) return "";
  // 일봉: "YYYY-MM-DD" 문자열
  if (typeof time === "string") return time;
  // 분봉: unix-second (UTC로 다룬 KST 값) → UTC getter로 다시 추출
  if (typeof time === "number") {
    const d = new Date(time * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return mode === "intraday"
      ? `${yyyy}-${mm}-${dd} ${hh}:${mi}`
      : `${yyyy}-${mm}-${dd}`;
  }
  // BusinessDay 객체 {year, month, day}
  if (typeof time === "object" && time.year != null) {
    const y = time.year;
    const m = String(time.month).padStart(2, "0");
    const d = String(time.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

/**
 * lightweight-charts 캔들+거래량 차트.
 *
 * @param {Array<{time, open, high, low, close, volume}>} data
 * @param {"intraday"|"daily"} mode
 * @param {boolean} loading
 */
function LightweightChart({ data, mode = "daily", loading = false, initialVisibleBars = null }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const didInitialFitRef = useRef(false);

  // 호버 캔들 (없으면 마지막 캔들 표시 — TradingView와 동일)
  const [hoverBar, setHoverBar] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#d0d0d0" },
      timeScale: {
        borderColor: "#d0d0d0",
        timeVisible: mode === "intraday",
        secondsVisible: false,
        rightOffset: mode === "intraday" ? 0 : 10,
        // 새 봉 추가 시 자동 스크롤 방지 → setVisibleRange 고정 유지
        shiftVisibleRangeOnNewBar: false,
      },
      localization: { locale: "ko-KR" },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // 십자선 이동 시 호버 캔들 정보 추출
    const handleCrosshairMove = (param) => {
      if (!param.time || !param.seriesData) {
        setHoverBar(null);
        return;
      }
      const candle = param.seriesData.get(candleSeries);
      const volBar = param.seriesData.get(volumeSeries);
      if (!candle) {
        setHoverBar(null);
        return;
      }
      setHoverBar({
        time: param.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: volBar?.value,
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    didInitialFitRef.current = false;

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (!Array.isArray(data) || data.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      didInitialFitRef.current = false;
      return;
    }

    const isIntraday = mode === "intraday";

    const candleData = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d) => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? "rgba(239, 68, 68, 0.5)" : "rgba(59, 130, 246, 0.5)",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // 최초 1회만 초기 뷰 범위 설정. 폴링/현재가 갱신 시 사용자 줌/팬 상태 유지.
    if (!didInitialFitRef.current && chartRef.current) {
      const total = candleData.length;
      if (isIntraday) {
        const firstTime = candleData[0]?.time;
        if (typeof firstTime === "number") {
          const d = new Date(firstTime * 1000);
          const y = d.getUTCFullYear();
          const mo = d.getUTCMonth();
          const day = d.getUTCDate();
          const from = Math.floor(Date.UTC(y, mo, day, 9, 0, 0) / 1000);
          const to = Math.floor(Date.UTC(y, mo, day, 15, 30, 0) / 1000);
          // rAF: setData 렌더링 완료 후 범위 적용 (setData 직후 auto-scroll 덮어쓰기 방지)
          requestAnimationFrame(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().setVisibleRange({ from, to });
            }
          });
          didInitialFitRef.current = true;
        }
      } else if (initialVisibleBars && total > initialVisibleBars) {
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: total - initialVisibleBars,
          to: total - 1,
        });
        didInitialFitRef.current = true;
      } else {
        chartRef.current.timeScale().fitContent();
        didInitialFitRef.current = true;
      }
    }
  }, [data, initialVisibleBars]);

  // 표시할 캔들: 호버 우선, 없으면 마지막 캔들
  const displayBar = (() => {
    if (hoverBar) return hoverBar;
    if (!Array.isArray(data) || data.length === 0) return null;
    const last = data[data.length - 1];
    return {
      time: last.time,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
    };
  })();

  // 변동: 이전 캔들 종가 대비
  const changeInfo = (() => {
    if (!displayBar || !Array.isArray(data) || data.length < 2) return null;
    const idx = data.findIndex((d) => d.time === displayBar.time);
    if (idx <= 0) return null;
    const prevClose = data[idx - 1].close;
    const diff = displayBar.close - prevClose;
    const pct = prevClose ? (diff / prevClose) * 100 : 0;
    return { diff, pct };
  })();

  const isUp = displayBar ? displayBar.close >= displayBar.open : true;
  const valueColor = isUp ? UP_COLOR : DOWN_COLOR;
  const changeColor = changeInfo ? (changeInfo.diff >= 0 ? UP_COLOR : DOWN_COLOR) : "#666";

  const renderLabel = (label, value, color) => (
    <span style={{ marginRight: 12, whiteSpace: "nowrap" }}>
      <span style={{ color: "#888", marginRight: 4 }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </span>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {displayBar && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            zIndex: 2,
            fontSize: "12px",
            background: "rgba(255,255,255,0.85)",
            padding: "2px 6px",
            borderRadius: 4,
            pointerEvents: "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ marginRight: 12, color: "#333", fontWeight: 600, whiteSpace: "nowrap" }}>
            {formatTime(displayBar.time, mode)}
          </span>
          {renderLabel("시", formatNumber(displayBar.open), valueColor)}
          {renderLabel("고", formatNumber(displayBar.high), valueColor)}
          {renderLabel("저", formatNumber(displayBar.low), valueColor)}
          {renderLabel("종", formatNumber(displayBar.close), valueColor)}
          {changeInfo && (
            <span style={{ color: changeColor, fontWeight: 600, whiteSpace: "nowrap" }}>
              {(changeInfo.diff >= 0 ? "+" : "-") + formatNumber(Math.abs(changeInfo.diff))}
              {" "}({formatPercent(changeInfo.pct)})
            </span>
          )}
          {displayBar.volume != null && (
            <span style={{ marginLeft: 12, color: "#888", whiteSpace: "nowrap" }}>
              거래량 <span style={{ color: "#333" }}>{formatVolume(displayBar.volume)}</span>
            </span>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.6)",
            fontSize: "14px",
            color: "#666",
          }}
        >
          로딩 중...
        </div>
      )}
    </div>
  );
}

export default LightweightChart;
