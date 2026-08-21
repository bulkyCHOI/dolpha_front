import { useEffect, useLayoutEffect, useRef } from "react";
import { createChart, createSeriesMarkers } from "lightweight-charts";

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
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesMapRef = useRef(new Map());
  const markersMapRef = useRef(new Map());
  const priceLinesMapRef = useRef(new Map());

  // 최신 콜백을 ref로 들고 있어 구독을 매번 해제/재등록하지 않는다.
  const onClickRef = useRef(onClick);
  const onCrosshairMoveRef = useRef(onCrosshairMove);
  onClickRef.current = onClick;
  onCrosshairMoveRef.current = onCrosshairMove;

  // ── 차트 생성 / 파기 ────────────────────────────────────────────
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      ...baseChartOptions({ intraday }),
      ...chartOptions,
      width: container.clientWidth || 1,
      height: container.clientHeight || 1,
    });
    chartRef.current = chart;

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
    };
    // intraday가 바뀌면 시간축 성격이 달라지므로 차트를 새로 만든다.
  }, [intraday]);

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
      seriesMap.set(spec.id, seriesApi);
    });

    // pane 비율 적용
    const chartPanes = chart.panes();
    panes.forEach((paneSpec, index) => {
      const pane = chartPanes[index];
      if (!pane) return;
      pane.setStretchFactor(paneSpec?.stretch ?? DEFAULT_STRETCH);
    });
  }, [structureSignature, panes.length]);

  // ── 옵션 / 데이터 / 마커 / 가격선 동기화 ────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const seriesMap = seriesMapRef.current;

    series.forEach((spec) => {
      const seriesApi = seriesMap.get(spec.id);
      if (!seriesApi) return;

      if (spec.options) seriesApi.applyOptions(spec.options);
      seriesApi.setData(spec.data ?? []);

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
  }, [series]);

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
