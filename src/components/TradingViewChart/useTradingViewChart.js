import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createChart, createSeriesMarkers } from "lightweight-charts";

import { useThemeMode } from "contexts/ThemeModeContext";

import { baseChartOptions } from "./chartTheme";
import { resolveSeriesDefinition } from "./seriesDefinitions";

const DEFAULT_STRETCH = 1;

/**
 * series spec 배열에서 "구조" 서명을 만든다.
 * 구조(=시리즈 구성)가 바뀔 때만 시리즈를 재생성하고,
 * 데이터만 바뀐 경우에는 setData로 갱신해 깜빡임과 뷰 리셋을 막는다.
 */
function buildStructureSignature(series) {
  return series.map((s) => `${s.id}:${s.type}:${s.pane ?? 0}`).join("|");
}

/** 필요한 pane 개수만큼 pane을 확보한다. */
function ensurePanes(chart, paneCount) {
  while (chart.panes().length < paneCount) {
    chart.addPane();
  }
}

/**
 * 선언적 spec으로 lightweight-charts 인스턴스를 관리하는 훅.
 *
 * autoSize 대신 ResizeObserver로 크기를 직접 관리한다.
 * (autoSize는 폭 0으로 마운트되면 이후 복구되지 않는 문제가 있다.)
 *
 * @param {object} params
 * @param {Array} params.series      시리즈 spec 배열
 * @param {Array} params.panes       pane별 옵션 (stretch 등). index = paneIndex
 * @param {boolean} params.intraday  분봉 여부 (시간축 표기)
 * @param {Function} params.onClick  차트 클릭 핸들러 (lightweight-charts param)
 * @param {Function} params.onCrosshairMove 크로스헤어 이동 핸들러
 * @param {object} params.chartOptions createChart 추가 옵션
 * @returns {{ containerRef, chartRef, seriesMapRef }}
 */
export default function useTradingViewChart({
  series = [],
  panes = [],
  intraday = false,
  onClick,
  onCrosshairMove,
  chartOptions,
}) {
  // 캔버스는 생성 시점의 색을 그대로 굳히므로, 테마가 바뀌면 다시 만든다.
  const { mode } = useThemeMode();

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  /**
   * 차트 인스턴스 세대.
   *
   * 차트를 다시 만들면 시리즈도 전부 사라진다. 시리즈 생성 effect 는
   * 구성이 바뀔 때만 도는데, 테마 전환은 구성을 바꾸지 않으므로
   * 이 값을 의존성에 넣어 다시 채워 넣도록 한다.
   */
  const [generation, setGeneration] = useState(0);
  const seriesMapRef = useRef(new Map());
  const markersMapRef = useRef(new Map());
  const priceLinesMapRef = useRef(new Map());
  const primitivesMapRef = useRef(new Map());
  // 마지막으로 setData에 넘긴 배열의 참조. 같은 참조면 다시 올리지 않는다.
  const lastDataMapRef = useRef(new Map());

  // 최신 콜백을 ref로 들고 있어 구독을 매번 해제/재등록하지 않는다.
  const onClickRef = useRef(onClick);
  const onCrosshairMoveRef = useRef(onCrosshairMove);
  onClickRef.current = onClick;
  onCrosshairMoveRef.current = onCrosshairMove;

  // ── 차트 생성 / 파기 ────────────────────────────────────────────
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // layout·grid 는 통째로 덮으면 테마 배경/글자색까지 날아가므로 한 겹 병합한다.
    const base = baseChartOptions({ intraday });
    const chart = createChart(container, {
      ...base,
      ...chartOptions,
      layout: { ...base.layout, ...chartOptions?.layout },
      grid: { ...base.grid, ...chartOptions?.grid },
      width: container.clientWidth || 1,
      height: container.clientHeight || 1,
    });
    chartRef.current = chart;
    setGeneration((value) => value + 1);

    const handleClick = (param) => onClickRef.current?.(param, chart, seriesMapRef.current);
    const handleMove = (param) => onCrosshairMoveRef.current?.(param, chart, seriesMapRef.current);
    chart.subscribeClick(handleClick);
    chart.subscribeCrosshairMove(handleMove);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.resize(width, height);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeClick(handleClick);
      chart.unsubscribeCrosshairMove(handleMove);
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
      markersMapRef.current.clear();
      priceLinesMapRef.current.clear();
      primitivesMapRef.current.clear();
      lastDataMapRef.current.clear();
    };
    // intraday 는 시간축 성격이, mode 는 색이 달라지므로 차트를 새로 만든다.
  }, [intraday, mode]);

  // ── 시리즈 구조 동기화 ──────────────────────────────────────────
  const structureSignature = buildStructureSignature(series);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const seriesMap = seriesMapRef.current;
    const nextIds = new Set(series.map((s) => s.id));

    // 사라진 시리즈 제거
    seriesMap.forEach((seriesApi, id) => {
      if (nextIds.has(id)) return;
      markersMapRef.current.get(id)?.detach();
      markersMapRef.current.delete(id);
      priceLinesMapRef.current.delete(id);
      (primitivesMapRef.current.get(id) ?? []).forEach((primitive) =>
        seriesApi.detachPrimitive(primitive)
      );
      primitivesMapRef.current.delete(id);
      lastDataMapRef.current.delete(id);
      chart.removeSeries(seriesApi);
      seriesMap.delete(id);
    });

    // 필요한 pane 확보
    const paneCount = series.reduce((max, s) => Math.max(max, (s.pane ?? 0) + 1), 1);
    ensurePanes(chart, Math.max(paneCount, panes.length));

    // 새 시리즈 생성
    series.forEach((spec) => {
      if (seriesMap.has(spec.id)) return;
      const definition = resolveSeriesDefinition(spec.type);
      const seriesApi = chart.addSeries(definition, spec.options ?? {}, spec.pane ?? 0);
      (spec.primitives ?? []).forEach((primitive) => seriesApi.attachPrimitive(primitive));
      if (spec.priceScaleOptions) seriesApi.priceScale().applyOptions(spec.priceScaleOptions);
      primitivesMapRef.current.set(spec.id, spec.primitives ?? []);
      seriesMap.set(spec.id, seriesApi);
    });

    // pane 비율 적용
    const chartPanes = chart.panes();
    panes.forEach((paneSpec, index) => {
      const pane = chartPanes[index];
      if (!pane) return;
      pane.setStretchFactor(paneSpec?.stretch ?? DEFAULT_STRETCH);
    });
  }, [structureSignature, panes.length, generation]);

  // ── 옵션 / 데이터 / 마커 / 가격선 동기화 ────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const seriesMap = seriesMapRef.current;

    series.forEach((spec) => {
      const seriesApi = seriesMap.get(spec.id);
      if (!seriesApi) return;

      if (spec.options) seriesApi.applyOptions(spec.options);

      // 수평선 드래그처럼 데이터는 그대로고 가격선만 바뀌는 경우가 잦다.
      // 같은 배열을 다시 올리면 매 프레임 전체 시리즈가 재업로드된다.
      const data = spec.data ?? [];
      if (lastDataMapRef.current.get(spec.id) !== data) {
        seriesApi.setData(data);
        lastDataMapRef.current.set(spec.id, data);
      }

      // 마커
      if (spec.markers && spec.markers.length > 0) {
        const existing = markersMapRef.current.get(spec.id);
        if (existing) {
          existing.setMarkers(spec.markers);
        } else {
          markersMapRef.current.set(spec.id, createSeriesMarkers(seriesApi, spec.markers));
        }
      } else {
        const existing = markersMapRef.current.get(spec.id);
        if (existing) {
          existing.setMarkers([]);
        }
      }

      // 가격선(수평선)
      const previousLines = priceLinesMapRef.current.get(spec.id) ?? [];
      previousLines.forEach((priceLine) => seriesApi.removePriceLine(priceLine));
      const nextLines = (spec.priceLines ?? []).map((lineOptions) =>
        seriesApi.createPriceLine(lineOptions)
      );
      priceLinesMapRef.current.set(spec.id, nextLines);
    });
  }, [series, generation]);

  // ── 가격 스케일 옵션 (pane별) ───────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    panes.forEach((paneSpec, index) => {
      if (!paneSpec?.priceScale) return;
      try {
        chart.priceScale("right", index).applyOptions(paneSpec.priceScale);
      } catch (error) {
        // pane이 아직 없으면 무시 (다음 렌더에서 적용됨)
      }
    });
  }, [panes]);

  return { containerRef, chartRef, seriesMapRef };
}
