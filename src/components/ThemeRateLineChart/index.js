import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const MIN_PLOT_HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 46 };
const OPEN_MINUTE = 9 * 60; // 09:00
const CLOSE_MINUTE = 15 * 60 + 30; // 15:30
const TICK_MINUTES = 60;
const TARGET_RATE_TICKS = 6; // 세로축 라벨 목표 개수
const TICK_STEP_CANDIDATES = [1, 2, 5, 10, 20, 50, 100];
const MUTED = "#7b8794";

/** 시리즈 색상 — 명도/색상이 충분히 구분되는 순서로 배치 */
const SERIES_COLORS = [
  "#e53935",
  "#1565c0",
  "#2e7d32",
  "#ef6c00",
  "#6a1b9a",
  "#00838f",
  "#c2185b",
  "#5d4037",
  "#455a64",
  "#9e9d24",
];

const minuteOf = (slot) => Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3));

const formatMinute = (minute) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const signed = (rate) => `${rate >= 0 ? "+" : ""}${Number(rate).toFixed(2)}%`;

/** 라벨이 정수로 떨어지는 눈금 간격을 고른다. */
const pickTickStep = (range) =>
  TICK_STEP_CANDIDATES.find((step) => range / step <= TARGET_RATE_TICKS) ||
  TICK_STEP_CANDIDATES[TICK_STEP_CANDIDATES.length - 1];

/** min~max 구간의 정수 눈금 목록 */
const buildTicks = (min, max) => {
  const step = pickTickStep(max - min);
  const ticks = [];
  for (let rate = Math.ceil(min / step) * step; rate <= max + 1e-9; rate += step) {
    ticks.push(Math.round(rate));
  }
  return ticks;
};

/** 컨테이너 실제 크기를 추적한다. 0폭 마운트(탭/Collapse) 이후에도 복구된다. */
const useContainerSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};

function ThemeRateLineChart({ slots, themes, loading }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);
  const chartHeight = height > 0 ? height : MIN_PLOT_HEIGHT;
  const [hiddenThemes, setHiddenThemes] = useState({});
  const [hoverMinute, setHoverMinute] = useState(null);

  const toggleTheme = useCallback((name) => {
    setHiddenThemes((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  /** 테마별 (분, 등락률) 포인트 목록 — 수집 안 된 슬롯은 건너뛴다 */
  const series = useMemo(
    () =>
      themes
        .map((theme, index) => ({
          name: theme.theme_name,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          points: slots
            .map((slot, slotIndex) => {
              const cell = theme.cells[slotIndex];
              if (!cell || cell.rate === null || cell.rate === undefined) return null;
              return { minute: minuteOf(slot), slot, rate: cell.rate };
            })
            .filter(Boolean),
        }))
        .filter((s) => s.points.length > 0),
    [slots, themes]
  );

  const visibleSeries = useMemo(
    () => series.filter((s) => !hiddenThemes[s.name]),
    [series, hiddenThemes]
  );

  const [minRate, maxRate] = useMemo(() => {
    const rates = visibleSeries.flatMap((s) => s.points.map((p) => p.rate));
    if (rates.length === 0) return [0, 1];

    // 음수가 없으면 0%에서 시작한다. 라벨이 정수로 떨어지도록 바깥쪽 정수로 스냅.
    const low = Math.floor(Math.min(...rates, 0));
    const high = Math.ceil(Math.max(...rates, 0));
    return low === high ? [low, high + 1] : [low, high];
  }, [visibleSeries]);

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const plotHeight = chartHeight - PADDING.top - PADDING.bottom;

  const xOf = useCallback(
    (minute) => PADDING.left + ((minute - OPEN_MINUTE) / (CLOSE_MINUTE - OPEN_MINUTE)) * plotWidth,
    [plotWidth]
  );
  const yOf = useCallback(
    (rate) => PADDING.top + (1 - (rate - minRate) / (maxRate - minRate)) * plotHeight,
    [minRate, maxRate, plotHeight]
  );

  const timeTicks = useMemo(() => {
    const ticks = [];
    for (let m = OPEN_MINUTE; m <= CLOSE_MINUTE; m += TICK_MINUTES) ticks.push(m);
    if (ticks[ticks.length - 1] !== CLOSE_MINUTE) ticks.push(CLOSE_MINUTE);
    return ticks;
  }, []);

  const rateTicks = useMemo(() => buildTicks(minRate, maxRate), [minRate, maxRate]);

  /** 마우스 x → 가장 가까운 수집 슬롯의 분 */
  const handleMove = (event) => {
    if (plotWidth <= 0 || series.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - PADDING.left) / plotWidth;
    const raw = OPEN_MINUTE + ratio * (CLOSE_MINUTE - OPEN_MINUTE);

    const candidates = slots.map(minuteOf);
    const nearest = candidates.reduce(
      (best, m) => (Math.abs(m - raw) < Math.abs(best - raw) ? m : best),
      candidates[0]
    );
    setHoverMinute(nearest);
  };

  const hoverRows = useMemo(() => {
    if (hoverMinute === null) return [];
    return visibleSeries
      .map((s) => {
        const point = s.points.find((p) => p.minute === hoverMinute);
        return point ? { name: s.name, color: s.color, rate: point.rate } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.rate - a.rate);
  }, [hoverMinute, visibleSeries]);

  const isEmpty = !loading && series.length === 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Box
        ref={containerRef}
        sx={{ position: "relative", width: "100%", flex: 1, minHeight: MIN_PLOT_HEIGHT }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverMinute(null)}
      >
        {(loading || isEmpty) && (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <Typography variant="body2" sx={{ color: MUTED, fontSize: 13 }}>
              {loading ? "불러오는 중…" : "표시할 등락률 데이터가 없습니다."}
            </Typography>
          </Box>
        )}

        {width > 0 && !isEmpty && (
          <svg
            width={width}
            height={chartHeight}
            role="img"
            aria-label="산업군별 등락률 추이"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            {/* 가로 그리드 + 등락률 눈금 */}
            {rateTicks.map((rate) => (
              <g key={rate}>
                <line
                  x1={PADDING.left}
                  x2={PADDING.left + plotWidth}
                  y1={yOf(rate)}
                  y2={yOf(rate)}
                  stroke="rgba(120,134,150,0.28)"
                  strokeDasharray="3 4"
                />
                <text
                  x={PADDING.left - 8}
                  y={yOf(rate) + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill={MUTED}
                >
                  {`${rate > 0 ? "+" : ""}${rate}%`}
                </text>
              </g>
            ))}

            {/* 0% 기준선 */}
            {minRate < 0 && maxRate > 0 && (
              <line
                x1={PADDING.left}
                x2={PADDING.left + plotWidth}
                y1={yOf(0)}
                y2={yOf(0)}
                stroke="rgba(120,134,150,0.55)"
                strokeDasharray="4 3"
              />
            )}

            {/* 세로 그리드 + 시각 눈금 */}
            {timeTicks.map((minute) => (
              <g key={minute}>
                <line
                  x1={xOf(minute)}
                  x2={xOf(minute)}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke="rgba(120,134,150,0.24)"
                  strokeDasharray="3 4"
                />
                <text
                  x={xOf(minute)}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={MUTED}
                >
                  {formatMinute(minute)}
                </text>
              </g>
            ))}

            {/* 테마별 라인 */}
            {visibleSeries.map((s) => (
              <polyline
                key={s.name}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={s.points.map((p) => `${xOf(p.minute)},${yOf(p.rate)}`).join(" ")}
              />
            ))}

            {/* 호버 크로스헤어 */}
            {hoverMinute !== null && (
              <>
                <line
                  x1={xOf(hoverMinute)}
                  x2={xOf(hoverMinute)}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke="rgba(76,81,191,0.5)"
                />
                {hoverRows.map((row) => (
                  <circle
                    key={row.name}
                    cx={xOf(hoverMinute)}
                    cy={yOf(row.rate)}
                    r="3"
                    fill={row.color}
                    stroke="#fff"
                    strokeWidth="1.2"
                  />
                ))}
              </>
            )}
          </svg>
        )}

        {/* 호버 툴팁 — 차트 좌/우 중 여백이 넓은 쪽에 붙인다 */}
        {hoverMinute !== null && hoverRows.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: PADDING.top,
              left: xOf(hoverMinute) > PADDING.left + plotWidth / 2 ? 12 : "auto",
              right: xOf(hoverMinute) > PADDING.left + plotWidth / 2 ? "auto" : 12,
              bgcolor: "rgba(33,37,41,0.92)",
              color: "#fff",
              borderRadius: 1,
              px: 1.25,
              py: 1,
              pointerEvents: "none",
              maxWidth: 260,
              zIndex: 2,
            }}
          >
            <Box sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.5 }}>{formatMinute(hoverMinute)}</Box>
            {hoverRows.slice(0, 10).map((row) => (
              <Box
                key={row.name}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 11 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: row.color,
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}
                </Box>
                <Box sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {signed(row.rate)}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* 범례 — 클릭으로 개별 시리즈 표시/숨김 */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
        {series.map((s) => {
          const hidden = Boolean(hiddenThemes[s.name]);
          return (
            <Box
              key={s.name}
              onClick={() => toggleTheme(s.name)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                px: 0.9,
                py: 0.35,
                borderRadius: 1,
                border: "1px solid #e9ecef",
                cursor: "pointer",
                opacity: hidden ? 0.4 : 1,
                userSelect: "none",
                "&:hover": { bgcolor: "#f5f7ff" },
              }}
            >
              <Box sx={{ width: 10, height: 2.5, borderRadius: 1, bgcolor: s.color }} />
              <Typography variant="caption" sx={{ fontSize: 11.5, color: "#37474f" }}>
                {s.name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

ThemeRateLineChart.propTypes = {
  slots: PropTypes.array.isRequired,
  themes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

ThemeRateLineChart.defaultProps = { loading: false };

export default ThemeRateLineChart;
