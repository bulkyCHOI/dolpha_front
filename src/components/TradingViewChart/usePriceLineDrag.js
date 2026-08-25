import { useCallback, useEffect, useRef, useState } from "react";

/** 선을 잡았다고 인정하는 세로 거리(px) */
const GRAB_TOLERANCE = 6;

/** 이 속성이 붙은 요소 위에서는 드래그를 시작하지 않는다. */
export const OVERLAY_ATTRIBUTE = "data-chart-overlay";

/**
 * 차트 위의 수평선을 마우스로 끌어 옮길 수 있게 한다.
 *
 * lightweight-charts는 primitive에 마우스 이벤트를 넘겨주지 않으므로
 * DOM 이벤트로 직접 처리한다. 가격 pane이 첫 pane이라 컨테이너 상단
 * 기준 오프셋이 곧 pane 내부 y가 되고, 이를 coordinateToPrice로 바꾼다.
 *
 * 리스너는 mousedown 시점에 곧바로 등록한다. state 변화를 기다렸다가
 * effect에서 등록하면, 빠른 드래그에서 첫 mousemove들을 놓친다.
 *
 * @param {object}   params
 * @param {Array}    params.lines     [{ id, value }]
 * @param {Function} params.onChange  (id, price) => void  드래그 중 계속 호출
 * @param {Function} params.onCommit  (id, price) => void  놓았을 때 1회 호출
 * @param {string}   params.seriesId  가격 좌표 기준이 되는 시리즈 id
 * @param {boolean}  params.disabled  그리기 모드 등에서 드래그를 막을 때
 */
export default function usePriceLineDrag({
  lines,
  onChange,
  onCommit,
  seriesId = "candle",
  disabled = false,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const cleanupRef = useRef(null);

  const linesRef = useRef(lines);
  linesRef.current = lines;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  /** 커서 높이에서 잡을 수 있는 선을 찾는다. */
  const findLineAt = useCallback((y) => {
    const series = seriesRef.current;
    if (!series || y == null) return null;

    let closest = null;
    let closestDistance = Infinity;

    linesRef.current.forEach((line) => {
      const lineY = series.priceToCoordinate(line.value);
      if (lineY === null) return;
      const distance = Math.abs(lineY - y);
      if (distance <= GRAB_TOLERANCE && distance < closestDistance) {
        closest = line;
        closestDistance = distance;
      }
    });

    return closest;
  }, []);

  /** 차트/시리즈 핸들 확보와 hover 커서 판정에만 쓴다. */
  const onCrosshairMove = useCallback(
    (param, chart, seriesMap) => {
      chartRef.current = chart;
      seriesRef.current = seriesMap?.get(seriesId) ?? null;

      if (disabled || cleanupRef.current) {
        setHoveredId(null);
        return;
      }
      setHoveredId(findLineAt(param.point?.y)?.id ?? null);
    },
    [disabled, findLineAt, seriesId]
  );

  const handleMouseDown = useCallback(
    (event) => {
      if (disabled || cleanupRef.current) return;
      // 선 위에 얹은 DOM 오버레이(라벨 칩 등)를 누른 것이면 드래그로 보지 않는다.
      if (event.target?.closest?.(`[${OVERLAY_ATTRIBUTE}]`)) return;

      const container = event.currentTarget;
      const bounds = container?.getBoundingClientRect();
      if (!bounds) return;

      const line = findLineAt(event.clientY - bounds.top);
      if (!line) return;

      event.preventDefault();
      setDraggingId(line.id);
      // 드래그 중 차트가 함께 움직이면 선을 놓기 어렵다.
      chartRef.current?.applyOptions({ handleScroll: false });

      let latestPrice = line.value;

      const onMove = (moveEvent) => {
        const series = seriesRef.current;
        if (!series) return;
        const price = series.coordinateToPrice(moveEvent.clientY - bounds.top);
        if (price === null || Number.isNaN(price)) return;
        latestPrice = price;
        onChangeRef.current(line.id, price);
      };

      const onUp = () => {
        cleanup();
        setDraggingId(null);
        chartRef.current?.applyOptions({ handleScroll: true });
        onCommitRef.current(line.id, latestPrice);
      };

      function cleanup() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        cleanupRef.current = null;
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      cleanupRef.current = cleanup;
    },
    [disabled, findLineAt]
  );

  // 드래그 도중 언마운트되어도 리스너가 남지 않게 한다.
  useEffect(() => () => cleanupRef.current?.(), []);

  const cursor = draggingId != null ? "grabbing" : hoveredId != null ? "grab" : null;

  return { onCrosshairMove, handleMouseDown, draggingId, hoveredId, cursor };
}
