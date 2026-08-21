import PropTypes from "prop-types";

import { DOWN_COLOR, UP_COLOR } from "./chartTheme";
import { COLORS } from "constants/styles";

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return "-";
  return Math.round(value).toLocaleString("ko-KR");
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatVolume(value) {
  if (value == null || Number.isNaN(value)) return "-";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}만`;
  return value.toLocaleString("ko-KR");
}

/** lightweight-charts의 time 값을 사람이 읽는 문자열로 변환 */
export function formatChartTime(time, intraday) {
  if (time == null) return "";
  if (typeof time === "string") return time;

  if (typeof time === "number") {
    // 분봉: unix-second (KST를 UTC로 담아둔 값) → UTC getter로 되돌린다.
    const date = new Date(time * 1000);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    if (!intraday) return `${yyyy}-${mm}-${dd}`;
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mi = String(date.getUTCMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  if (typeof time === "object" && time.year != null) {
    return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(
      2,
      "0"
    )}`;
  }
  return "";
}

const labelStyle = { marginRight: 12, whiteSpace: "nowrap" };

/**
 * 차트 좌상단 시/고/저/종 정보 바 (TradingView 스타일).
 * 크로스헤어 위치의 캔들, 없으면 마지막 캔들을 표시한다.
 */
function OhlcLegend({ bar, change, intraday }) {
  if (!bar) return null;

  const isUp = bar.close >= bar.open;
  const valueColor = isUp ? UP_COLOR : DOWN_COLOR;
  const changeColor = change ? (change.diff >= 0 ? UP_COLOR : DOWN_COLOR) : "#64748b";

  const renderItem = (label, value) => (
    <span style={labelStyle}>
      <span style={{ color: COLORS.TEXT_MUTED, marginRight: 4 }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 600 }}>{value}</span>
    </span>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 6,
        left: 8,
        zIndex: 2,
        fontSize: "12px",
        background: "rgba(255, 255, 255, 0.85)",
        padding: "2px 6px",
        borderRadius: 4,
        pointerEvents: "none",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ ...labelStyle, color: "#334155", fontWeight: 600 }}>
        {formatChartTime(bar.time, intraday)}
      </span>
      {renderItem("시", formatNumber(bar.open))}
      {renderItem("고", formatNumber(bar.high))}
      {renderItem("저", formatNumber(bar.low))}
      {renderItem("종", formatNumber(bar.close))}
      {change && (
        <span style={{ color: changeColor, fontWeight: 600, whiteSpace: "nowrap" }}>
          {(change.diff >= 0 ? "+" : "-") + formatNumber(Math.abs(change.diff))} (
          {formatPercent(change.pct)})
        </span>
      )}
      {bar.volume != null && (
        <span style={{ marginLeft: 12, color: COLORS.TEXT_MUTED, whiteSpace: "nowrap" }}>
          거래량 <span style={{ color: "#334155" }}>{formatVolume(bar.volume)}</span>
        </span>
      )}
    </div>
  );
}

OhlcLegend.propTypes = {
  bar: PropTypes.shape({
    time: PropTypes.any,
    open: PropTypes.number,
    high: PropTypes.number,
    low: PropTypes.number,
    close: PropTypes.number,
    volume: PropTypes.number,
  }),
  change: PropTypes.shape({ diff: PropTypes.number, pct: PropTypes.number }),
  intraday: PropTypes.bool,
};

OhlcLegend.defaultProps = { bar: null, change: null, intraday: false };

export default OhlcLegend;
