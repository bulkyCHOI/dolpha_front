import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";

import { COLORS } from "constants/styles";

/**
 * 로그인 화면 장식용 차트 도판 — VCP(변동성 수축 패턴) 돌파 포착.
 *
 * 실제 시세가 아니라 고정 시드로 만든 가상 캔들이다.
 * 선행 상승 → 조정 폭이 점점 줄어드는 4번의 수축(4T) + 거래량 고갈 → 피벗을 거래량 동반 돌파.
 * 수축 폭(%)·피벗·거래량 배수는 그려진 캔들에서 직접 계산해 그림과 숫자가 어긋나지 않는다.
 */

const WIDTH = 600;
const HEIGHT = 380;
// 오른쪽에 피벗 라벨이 들어갈 여백
const PLOT_WIDTH = WIDTH - 56;
const PRICE_TOP = 44;
const PRICE_BOTTOM = 272;
const VOLUME_BOTTOM = 352;
const VOLUME_HEIGHT = 56;
const SEED = 20260916;
const GRID_ROWS = 5;
const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const VOLUME_AVG_WINDOW = 20;

// 종가가 지나가는 경유점 [캔들 인덱스, 가격]
const WAYPOINTS = [
  [0, 62],
  [12, 97],
  [15, 100],
  [22, 76],
  [30, 96],
  [35, 84.5],
  [41, 94],
  [45, 88.5],
  [49, 93.5],
  [51, 91.6],
  [53, 94.2],
  [54, 102],
  [59, 109],
];
const CANDLE_COUNT = WAYPOINTS[WAYPOINTS.length - 1][0] + 1;
const BREAKOUT_INDEX = 54;
const BASE_START = 15;

// 수축 구간: 고점 인덱스 → 저점 인덱스 (갈수록 얕아진다)
const CONTRACTIONS = [
  { high: 15, low: 22 },
  { high: 30, low: 35 },
  { high: 41, low: 45 },
  { high: 49, low: 51 },
];

/** 구간별 흔들림 폭: 수축이 진행될수록 캔들이 조용해진다 */
const noiseAt = (i) => {
  if (i < BASE_START) return 2.0;
  if (i < 30) return 2.2;
  if (i < 41) return 1.5;
  if (i < 49) return 0.9;
  if (i < BREAKOUT_INDEX) return 0.45;
  return 1.4;
};

/** 거래량: 베이스 동안 말라가다가 돌파일에 급증 */
const volumeAt = (i, r) => {
  if (i < BASE_START) return 0.5 + r * 0.2;
  if (i < BREAKOUT_INDEX) {
    const progress = (i - BASE_START) / (BREAKOUT_INDEX - BASE_START);
    return 0.7 - progress * 0.55 + r * 0.18 * (1 - progress);
  }
  if (i === BREAKOUT_INDEX) return 1.0;
  return 0.55 + r * 0.2;
};

/** 결정적 의사난수 (렌더마다 같은 그림) */
const createRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const closeAt = (i) => {
  const nextIdx = WAYPOINTS.findIndex(([idx]) => idx >= i);
  const [x1, y1] = WAYPOINTS[nextIdx];
  if (nextIdx === 0 || x1 === i) return y1;
  const [x0, y0] = WAYPOINTS[nextIdx - 1];
  return y0 + ((y1 - y0) * (i - x0)) / (x1 - x0);
};

const buildCandles = () => {
  const random = createRandom(SEED);
  return Array.from({ length: CANDLE_COUNT }).reduce((candles, _, i) => {
    const noise = noiseAt(i);
    const prevClose = candles.length ? candles[candles.length - 1].close : closeAt(0) - 1;
    const isAnchor = WAYPOINTS.some(([idx]) => idx === i);
    const close = closeAt(i) + (isAnchor ? 0 : (random() - 0.5) * noise);
    const open =
      i === BREAKOUT_INDEX ? prevClose + 0.4 : prevClose + (random() - 0.5) * noise * 0.6;
    const high = Math.max(open, close) + random() * noise * 0.7;
    const low = Math.min(open, close) - random() * noise * 0.7;
    return [...candles, { open, close, high, low, volume: volumeAt(i, random()) }];
  }, []);
};

const sliceExtreme = (candles, center, key, pick) =>
  pick(...candles.slice(Math.max(0, center - 1), center + 2).map((c) => c[key]));

const analyze = (candles) => {
  const contractions = CONTRACTIONS.map(({ high, low }) => {
    const top = sliceExtreme(candles, high, "high", Math.max);
    const bottom = sliceExtreme(candles, low, "low", Math.min);
    return { high, low, top, bottom, depth: ((top - bottom) / top) * 100 };
  });
  const lastHigh = CONTRACTIONS[CONTRACTIONS.length - 1].high;
  const pivot = Math.max(...candles.slice(lastHigh, BREAKOUT_INDEX).map((c) => c.high));
  const prior = candles.slice(BREAKOUT_INDEX - VOLUME_AVG_WINDOW, BREAKOUT_INDEX);
  const avgVolume = prior.reduce((sum, c) => sum + c.volume, 0) / prior.length;
  const volumeRatio = candles[BREAKOUT_INDEX].volume / avgVolume;
  return { contractions, pivot, volumeRatio };
};

const Label = ({ x, y, color, size = 10, anchor = "start", children }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    style={{ fill: color, fontFamily: MONO_STACK, fontSize: size }}
  >
    {children}
  </text>
);

Label.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  anchor: PropTypes.string,
  children: PropTypes.node.isRequired,
};

/** 돌파 캔들을 감싸는 스캐너 조준틀 (모서리 괄호) */
const DetectionFrame = ({ x, y, w, h, color }) => {
  const arm = 7;
  const corners = [
    `M ${x} ${y + arm} V ${y} H ${x + arm}`,
    `M ${x + w - arm} ${y} H ${x + w} V ${y + arm}`,
    `M ${x + w} ${y + h - arm} V ${y + h} H ${x + w - arm}`,
    `M ${x + arm} ${y + h} H ${x} V ${y + h - arm}`,
  ];
  return (
    <g fill="none" style={{ stroke: color }} strokeWidth={1.5}>
      {corners.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
};

DetectionFrame.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  w: PropTypes.number.isRequired,
  h: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

function ChartbookPlate() {
  const { candles, toY, step, contractions, pivot, volumeRatio, maxVolume } = useMemo(() => {
    const data = buildCandles();
    const min = Math.min(...data.map((c) => c.low));
    const max = Math.max(...data.map((c) => c.high));
    const scale = (PRICE_BOTTOM - PRICE_TOP) / (max - min);
    return {
      candles: data,
      toY: (price) => PRICE_BOTTOM - (price - min) * scale,
      step: PLOT_WIDTH / CANDLE_COUNT,
      maxVolume: Math.max(...data.map((c) => c.volume)),
      ...analyze(data),
    };
  }, []);

  const xOf = (i) => (i + 0.5) * step;
  const pivotY = toY(pivot);
  const breakout = candles[BREAKOUT_INDEX];
  const frame = {
    x: xOf(BREAKOUT_INDEX) - step * 0.9,
    y: toY(breakout.high) - 6,
    w: step * 1.8,
    h: toY(breakout.low) - toY(breakout.high) + 12,
  };
  const dryUpStart = CONTRACTIONS[2].high;
  const lowsPath = contractions.map((c) => `${xOf(c.low)},${toY(c.bottom)}`).join(" L ");
  const highsPath = contractions.map((c) => `${xOf(c.high)},${toY(c.top)}`).join(" L ");

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`VCP 예시 차트: 조정 폭이 ${contractions
        .map((c) => `${c.depth.toFixed(0)}%`)
        .join(", ")}로 줄어든 뒤 피벗을 거래량 ${volumeRatio.toFixed(1)}배로 돌파`}
      sx={{
        width: "100%",
        height: "auto",
        maxHeight: { md: "46vh" },
        display: "block",
        overflow: "visible",
      }}
    >
      {/* 격자 */}
      {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => {
        const y = PRICE_TOP + ((PRICE_BOTTOM - PRICE_TOP) / GRID_ROWS) * i;
        return (
          <line key={i} x1={0} x2={WIDTH} y1={y} y2={y} style={{ stroke: COLORS.CHARTBOOK.GRID }} />
        );
      })}
      <line
        x1={0}
        x2={WIDTH}
        y1={VOLUME_BOTTOM}
        y2={VOLUME_BOTTOM}
        style={{ stroke: COLORS.CHARTBOOK.GRID }}
      />

      {/* 수렴하는 고점선·저점선: 변동성 수축의 쐐기 */}
      <g
        fill="none"
        style={{ stroke: COLORS.CHARTBOOK.SECONDARY }}
        strokeDasharray="2 4"
        strokeWidth={1}
      >
        <path d={`M ${highsPath}`} />
        <path d={`M ${lowsPath}`} />
      </g>

      {/* 피벗 라인 */}
      <line
        x1={xOf(CONTRACTIONS[3].high) - step}
        x2={WIDTH}
        y1={pivotY}
        y2={pivotY}
        style={{ stroke: COLORS.CHARTBOOK.RS_RED }}
        strokeDasharray="5 3"
      />
      <Label x={frame.x + frame.w + 4} y={pivotY + 13} color={COLORS.CHARTBOOK.RS_RED}>
        PIVOT {pivot.toFixed(1)}
      </Label>

      {/* 거래량 */}
      {candles.map((c, i) => {
        const h = (c.volume / maxVolume) * VOLUME_HEIGHT;
        const isBreakout = i === BREAKOUT_INDEX;
        return (
          <rect
            key={`v${i}`}
            x={i * step + step * 0.2}
            y={VOLUME_BOTTOM - h}
            width={step * 0.6}
            height={h}
            style={{ fill: isBreakout ? COLORS.CHARTBOOK.RS_RED : COLORS.CHARTBOOK.GRID }}
          />
        );
      })}

      {/* 거래량 고갈 구간 표시 */}
      <g style={{ stroke: COLORS.CHARTBOOK.SECONDARY }} fill="none">
        <path
          d={`M ${xOf(dryUpStart)} ${VOLUME_BOTTOM - VOLUME_HEIGHT * 0.55} v -4 H ${xOf(
            BREAKOUT_INDEX - 1
          )} v 4`}
        />
      </g>
      <Label
        x={(xOf(dryUpStart) + xOf(BREAKOUT_INDEX - 1)) / 2}
        y={VOLUME_BOTTOM - VOLUME_HEIGHT * 0.55 - 9}
        anchor="middle"
        color={COLORS.CHARTBOOK.SECONDARY}
        size={9}
      >
        VOL DRY-UP
      </Label>

      {/* 캔들 */}
      {candles.map((c, i) => {
        const x = xOf(i);
        const color = c.close >= c.open ? COLORS.UP : COLORS.DOWN;
        const top = toY(Math.max(c.open, c.close));
        const bodyHeight = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
        return (
          <g key={`c${i}`} style={{ stroke: color, fill: color }}>
            <line x1={x} x2={x} y1={toY(c.high)} y2={toY(c.low)} strokeWidth={1} />
            <rect
              x={x - step * 0.3}
              y={top}
              width={step * 0.6}
              height={bodyHeight}
              strokeWidth={0}
            />
          </g>
        );
      })}

      {/* 수축 폭 치수선 */}
      {contractions.map((c, n) => {
        const x = (xOf(c.high) + xOf(c.low)) / 2;
        const yTop = toY(c.top);
        const yBottom = toY(c.bottom);
        return (
          <g key={`t${n}`}>
            <g style={{ stroke: COLORS.CHARTBOOK.INK }} strokeWidth={1}>
              <line x1={x} x2={x} y1={yTop} y2={yBottom} />
              <line x1={x - 3} x2={x + 3} y1={yTop} y2={yTop} />
              <line x1={x - 3} x2={x + 3} y1={yBottom} y2={yBottom} />
            </g>
            <Label x={x} y={yTop - 7} anchor="middle" color={COLORS.CHARTBOOK.INK}>
              {`T${n + 1} −${c.depth.toFixed(0)}%`}
            </Label>
          </g>
        );
      })}

      {/* 돌파 포착 */}
      <DetectionFrame {...frame} color={COLORS.CHARTBOOK.RS_RED} />
      <g transform={`translate(${frame.x - 6}, ${frame.y - 30})`}>
        <rect
          x={-200}
          y={0}
          width={206}
          height={20}
          fill="none"
          style={{ stroke: COLORS.CHARTBOOK.RS_RED }}
          rx={2}
        />
        <circle cx={-190} cy={10} r={3} style={{ fill: COLORS.CHARTBOOK.RS_RED }} />
        <Label x={-181} y={14} color={COLORS.CHARTBOOK.RS_RED}>
          {`BREAKOUT DETECTED · VOL ×${volumeRatio.toFixed(1)}`}
        </Label>
      </g>

      {/* 도판 머리말 */}
      <Label x={0} y={16} color={COLORS.CHARTBOOK.INK} size={11}>
        {`VCP · ${contractions.length}T`}
      </Label>
      <Label x={0} y={30} color={COLORS.CHARTBOOK.SECONDARY} size={9}>
        {contractions.map((c) => `${c.depth.toFixed(0)}%`).join(" → ")}
      </Label>
    </Box>
  );
}

export default ChartbookPlate;
