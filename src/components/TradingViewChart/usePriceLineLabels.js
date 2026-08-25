import { useEffect, useRef, useState } from "react";

/** 좌표가 이만큼도 안 움직였으면 다시 그리지 않는다(px). */
const COORDINATE_EPSILON = 0.5;

function isSamePositions(previous, next) {
  if (previous.length !== next.length) return false;
  return previous.every((position, index) => {
    const candidate = next[index];
    return position.id === candidate.id && Math.abs(position.y - candidate.y) < COORDINATE_EPSILON;
  });
}

/**
 * 수평선 y 좌표 추적기.
 *
 * lightweight-charts는 가격 좌표가 바뀌는 시점(줌·스크롤·자동 스케일·리사이즈)에
 * primitive의 updateAllViews를 부른다. 캔버스에 그리지는 않고 좌표만 받아
 * DOM 라벨을 선 위에 얹는 데 쓴다.
 */
class PriceLineLabelTracker {
  constructor(onPositions) {
    this._onPositions = onPositions;
    this._series = null;
    this._lines = [];
    this._positions = [];
  }

  // ── ISeriesPrimitive ──────────────────────────────────────────
  attached({ series }) {
    this._series = series;
    this._recompute();
  }

  detached() {
    this._series = null;
    this._recompute();
  }

  updateAllViews() {
    this._recompute();
  }

  paneViews() {
    return [];
  }

  // ── 좌표 계산 ─────────────────────────────────────────────────
  setLines(lines) {
    this._lines = lines ?? [];
    this._recompute();
  }

  _recompute() {
    const series = this._series;
    // 화면 밖 가격도 좌표는 계산되므로, pane 높이로 잘라야 라벨이 차트 밖으로 새지 않는다.
    const paneHeight = series?.getPane?.()?.getHeight?.() ?? 0;
    const next = series
      ? this._lines
          .map((line) => ({ id: line.id, y: series.priceToCoordinate(line.value) }))
          .filter(({ y }) => y !== null && !Number.isNaN(y) && y >= 0 && y <= paneHeight)
      : [];

    if (isSamePositions(this._positions, next)) return;
    this._positions = next;
    this._onPositions(next);
  }
}

/**
 * 수평선 라벨을 차트 위(선 왼쪽 끝)에 DOM으로 띄우기 위한 좌표를 준다.
 *
 * 반환한 primitive를 가격 시리즈에 붙여야 좌표가 갱신된다. primitive는
 * 시리즈 생성 시 1회만 부착되므로 인스턴스를 계속 유지한다.
 *
 * @param {Array<{id:*, value:number}>} lines
 * @returns {{ primitive: object, positions: Array<{id:*, y:number}> }}
 */
export default function usePriceLineLabels(lines) {
  const [positions, setPositions] = useState([]);
  const trackerRef = useRef(null);
  if (!trackerRef.current) trackerRef.current = new PriceLineLabelTracker(setPositions);

  useEffect(() => {
    trackerRef.current.setLines(lines);
  }, [lines]);

  return { primitive: trackerRef.current, positions };
}
