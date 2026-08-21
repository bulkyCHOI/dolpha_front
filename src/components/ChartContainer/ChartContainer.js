import React, { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Delete from "@mui/icons-material/Delete";
import Timeline from "@mui/icons-material/Timeline";

// 차트
import TradingViewChart, {
  ChartLegend,
  OhlcLegend,
  VcpPrimitive,
  ZonePrimitive,
  usePriceLineDrag,
  useSeriesHover,
} from "components/TradingViewChart";
import InflectionPointToggle from "components/InflectionPointToggle";
import useInflectionPoints from "hooks/useInflectionPoints";

// Utils
import { adjustToKRXTickSize } from "utils/formatters";
import { CHART_INITIAL_VISIBLE_BARS } from "constants/chart";

import {
  MA_FIELDS,
  PANE_STRETCH,
  RS_FIELDS,
  buildHtfZones,
  buildIndexSeries,
  buildPriceLines,
  buildStockChartSeries,
  compactPanes,
} from "./buildStockSeries";

const DRAW_LINE_COLOR = "#667eea";
const PYRAMIDING_LINE_COLOR = "#ff9800";

const CHART_HEIGHT = { xs: 480, md: 640 };
const INDEX_CHART_HEIGHT = { xs: 240, md: 300 };

const chartSurfaceSx = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 1,
  p: 0.5,
  mb: 1,
};

/**
 * 종목 분석 차트 컨테이너.
 *
 * 캔들 · 거래량 · RS Rank · ATR · MTT를 하나의 TradingView 차트에
 * pane으로 쌓아 시간축과 크로스헤어를 공유한다.
 */
const ChartContainer = ({
  ohlcvData,
  analysisData,
  indexOhlcvData,
  indexData,
  selectedIndexCode,
  selectedStock,
  entryPoint,
  pyramidingEntries,
  onIndexChange,
  onEntryPointChange,
  onPyramidingEntryChange,
  onShowSnackbar,
  chartType,
  tradingMode,
}) => {
  const [horizontalLines, setHorizontalLines] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  // 이동 모드: 선을 고른 뒤 차트를 클릭하면 그 가격으로 옮긴다.
  const [movingLineId, setMovingLineId] = useState(null);
  const [menuState, setMenuState] = useState({ anchorEl: null, lineId: null });
  // 범례에서 끈 계열 (Chart.js 범례의 표시/숨김을 대체)
  const [hiddenSeriesIds, setHiddenSeriesIds] = useState([]);

  const { readout, onCrosshairMove: onHoverMove } = useSeriesHover(ohlcvData);

  /**
   * 초기 구간을 다시 맞출 기준.
   *
   * selectedStock은 클릭 즉시 바뀌지만 ohlcvData는 응답이 온 뒤에 바뀐다.
   * selectedStock을 기준으로 삼으면 옛 데이터에 대고 구간을 잡은 뒤
   * "적용 완료"로 표시되어, 정작 새 데이터에는 반영되지 않는다.
   * 그래서 실제로 로드된 데이터가 어느 종목인지를 기준으로 쓴다.
   */
  const loadedStockCode = ohlcvData?.[0]?.code ?? null;

  const updateLineValue = useCallback((id, price) => {
    setHorizontalLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, value: price } : line))
    );
  }, []);

  // 놓는 순간에만 호가단위로 맞춘다. 드래그 중에 맞추면 선이 계단처럼 튄다.
  const commitLineValue = useCallback((id, price) => {
    setHorizontalLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, value: adjustToKRXTickSize(price) } : line))
    );
  }, []);

  const {
    onCrosshairMove: onDragMove,
    handleMouseDown,
    draggingId,
    cursor: dragCursor,
  } = usePriceLineDrag({
    lines: horizontalLines,
    onChange: updateLineValue,
    onCommit: commitLineValue,
    disabled: isDrawingMode || movingLineId != null,
  });

  const handleCrosshairMove = useCallback(
    (param, chart, seriesMap) => {
      onHoverMove(param, chart, seriesMap);
      onDragMove(param, chart, seriesMap);
    },
    [onHoverMove, onDragMove]
  );

  // HTF 상승 구간 음영. primitive는 차트 수명 동안 같은 인스턴스를 유지해야 한다.
  const htfZonesRef = useRef(null);
  if (!htfZonesRef.current) htfZonesRef.current = new ZonePrimitive();

  // VCP 수축 구간 · 스윙 연결선 · 피벗선
  const vcpRef = useRef(null);
  if (!vcpRef.current) vcpRef.current = new VcpPrimitive();

  const {
    showInflectionPoints,
    inflectionAnalysisResult,
    inflectionSettings,
    isInflectionPointsAvailable,
    toggleInflectionPoints,
  } = useInflectionPoints(ohlcvData, chartType);

  // ── 시리즈 구성 ────────────────────────────────────────────────
  // 시세·지표 데이터. 가격선과 분리해두어야 드래그 중 재업로드되지 않는다.
  const { series: baseSeries, panes } = useMemo(() => {
    const built = buildStockChartSeries({
      ohlcvData,
      analysisData,
      chartType,
      selectedStock,
      inflectionAnalysisResult,
      showInflectionPoints,
    });
    htfZonesRef.current.setShapes(buildHtfZones(chartType, selectedStock), []);
    vcpRef.current.setAnalysis(
      showInflectionPoints ? inflectionAnalysisResult : null,
      ohlcvData,
      inflectionSettings
    );

    const withVisibility = built.map((spec) =>
      hiddenSeriesIds.includes(spec.id)
        ? { ...spec, options: { ...spec.options, visible: false } }
        : spec
    );
    const candleIndex = withVisibility.findIndex((spec) => spec.id === "candle");
    if (candleIndex >= 0) {
      withVisibility[candleIndex] = {
        ...withVisibility[candleIndex],
        primitives: [htfZonesRef.current, vcpRef.current],
      };
    }
    return compactPanes(withVisibility, PANE_STRETCH);
  }, [
    hiddenSeriesIds,
    ohlcvData,
    analysisData,
    chartType,
    selectedStock,
    inflectionAnalysisResult,
    inflectionSettings,
    showInflectionPoints,
  ]);

  // 가격선만 갈아끼운다. 데이터 배열의 참조는 그대로라 setData가 다시 불리지 않는다.
  const series = useMemo(() => {
    const priceLines = buildPriceLines(horizontalLines, entryPoint);
    return baseSeries.map((spec) => (spec.id === "candle" ? { ...spec, priceLines } : spec));
  }, [baseSeries, horizontalLines, entryPoint]);

  const indexSeries = useMemo(() => buildIndexSeries(indexOhlcvData), [indexOhlcvData]);

  // ── 수평선 조작 ────────────────────────────────────────────────
  const handleChartClick = useCallback(
    (param, chart, seriesMap) => {
      if (!isDrawingMode && !movingLineId) return;
      const candleSeries = seriesMap?.get("candle");
      if (!candleSeries || !param.point) return;

      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price === null || Number.isNaN(price)) return;
      const adjusted = adjustToKRXTickSize(price);

      if (movingLineId) {
        setHorizontalLines((prev) =>
          prev.map((line) => (line.id === movingLineId ? { ...line, value: adjusted } : line))
        );
        setMovingLineId(null);
        return;
      }

      setHorizontalLines((prev) => [
        ...prev,
        { id: Date.now(), value: adjusted, color: DRAW_LINE_COLOR, type: "entry" },
      ]);
    },
    [isDrawingMode, movingLineId]
  );

  const closeMenu = () => setMenuState({ anchorEl: null, lineId: null });

  const handleDeleteLine = (lineId) => {
    setHorizontalLines((prev) => prev.filter((line) => line.id !== lineId));
    if (movingLineId === lineId) setMovingLineId(null);
    closeMenu();
  };

  const connectLineToEntry = (lineId) => {
    const line = horizontalLines.find((item) => item.id === lineId);
    if (!line) return;

    const adjustedPrice = adjustToKRXTickSize(line.value);
    onEntryPointChange(adjustedPrice.toString());
    setHorizontalLines((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? { ...item, type: "entry", color: DRAW_LINE_COLOR, label: "1차 진입" }
          : item
      )
    );
    closeMenu();
  };

  const connectLineToPyramiding = (lineId, index) => {
    const line = horizontalLines.find((item) => item.id === lineId);
    if (!line) return;

    const baseEntryPrice = parseFloat(entryPoint);
    if (!baseEntryPrice || baseEntryPrice <= 0) {
      onShowSnackbar("1차 진입시점을 먼저 설정해주세요.", "warning");
      closeMenu();
      return;
    }

    const adjustedPrice = adjustToKRXTickSize(line.value);
    const percentage = (((adjustedPrice - baseEntryPrice) / baseEntryPrice) * 100).toFixed(2);
    onPyramidingEntryChange(index, percentage.toString(), true);

    setHorizontalLines((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              type: "pyramiding",
              color: PYRAMIDING_LINE_COLOR,
              pyramidingIndex: index,
              label: `${index + 2}차 진입`,
            }
          : item
      )
    );
    closeMenu();
  };

  const hasData = Array.isArray(ohlcvData) && ohlcvData.length > 0;
  const activeLine = horizontalLines.find((line) => line.id === menuState.lineId);

  // ── 차트 위 컨트롤 ─────────────────────────────────────────────
  // 차트 위에 띄우면 좌상단 판독바와 겹친다 (특히 모바일). 범례 줄에 인라인으로 둔다.
  const toolbar = (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
      <Tooltip title={isDrawingMode ? "수평선 그리기 종료" : "수평선 그리기 시작"}>
        <ToggleButton
          value="drawing"
          selected={isDrawingMode}
          onChange={() => {
            setIsDrawingMode((prev) => !prev);
            setMovingLineId(null);
          }}
          size="small"
          sx={{
            border: `1px solid ${DRAW_LINE_COLOR}`,
            color: isDrawingMode ? "#ffffff" : DRAW_LINE_COLOR,
            backgroundColor: isDrawingMode ? DRAW_LINE_COLOR : "rgba(255, 255, 255, 0.9)",
            "&.Mui-selected": {
              backgroundColor: DRAW_LINE_COLOR,
              color: "#ffffff",
              "&:hover": { backgroundColor: "#5a6fd8" },
            },
          }}
        >
          <Timeline sx={{ fontSize: "16px" }} />
        </ToggleButton>
      </Tooltip>

      {horizontalLines.length > 0 && (
        <Tooltip title="모든 수평선 삭제">
          <IconButton
            onClick={() => {
              setHorizontalLines([]);
              setMovingLineId(null);
            }}
            size="small"
            sx={{
              border: "1px solid #f44336",
              color: "#f44336",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
            }}
          >
            <Delete sx={{ fontSize: "16px" }} />
          </IconButton>
        </Tooltip>
      )}

      {isInflectionPointsAvailable && (
        <InflectionPointToggle
          showInflectionPoints={showInflectionPoints}
          onToggle={toggleInflectionPoints}
          size="small"
        />
      )}
    </Box>
  );

  const drawingHint = (isDrawingMode || movingLineId) && (
    <Box
      sx={{
        position: "absolute",
        bottom: 28,
        left: 8,
        zIndex: 10,
        backgroundColor: movingLineId ? "rgba(255, 152, 0, 0.92)" : "rgba(102, 126, 234, 0.92)",
        color: "#ffffff",
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      <Typography variant="caption" fontWeight="bold">
        {movingLineId ? "옮길 위치를 클릭하세요" : "차트 클릭으로 수평선 추가"}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {hasData ? (
        <>
          {/* 범례 + 수평선 목록 — 항상 존재하는 한 줄이라 차트가 밀리지 않는다 */}
          <Box
            sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, minHeight: 32 }}
          >
            {toolbar}
            <ChartLegend
              groups={[
                { title: "이동평균", items: MA_FIELDS },
                { title: "RS Rank", items: RS_FIELDS },
              ]}
              values={readout?.values}
              hiddenIds={hiddenSeriesIds}
              onToggle={(field) =>
                setHiddenSeriesIds((prev) =>
                  prev.includes(field) ? prev.filter((id) => id !== field) : [...prev, field]
                )
              }
            />

            {horizontalLines.map((line) => (
              <Chip
                key={line.id}
                size="small"
                label={`${line.label ? `${line.label} · ` : ""}${new Intl.NumberFormat(
                  "ko-KR"
                ).format(line.value)}`}
                onClick={(event) =>
                  setMenuState({ anchorEl: event.currentTarget, lineId: line.id })
                }
                onDelete={() => handleDeleteLine(line.id)}
                sx={{
                  height: 22,
                  borderLeft: `4px solid ${line.color}`,
                  fontWeight: 600,
                  backgroundColor: movingLineId === line.id ? "rgba(255, 152, 0, 0.15)" : undefined,
                }}
              />
            ))}
          </Box>

          {/* 캔들 · 거래량 · RS · ATR · MTT (pane 통합) */}
          <Box sx={{ ...chartSurfaceSx, position: "relative", height: CHART_HEIGHT }}>
            <TradingViewChart
              series={series}
              panes={panes}
              height="100%"
              initialVisibleBars={CHART_INITIAL_VISIBLE_BARS}
              fitContentKey={loadedStockCode}
              onClick={handleChartClick}
              onCrosshairMove={handleCrosshairMove}
              onMouseDown={handleMouseDown}
              chartOptions={{
                leftPriceScale: { visible: true, borderColor: "#e2e8f0" },
                // 자석 모드(1)는 커서를 OHLC 값에 붙여서, 선을 끌 때 값이 튄다.
                crosshair: { mode: isDrawingMode || movingLineId || draggingId != null ? 0 : 1 },
              }}
              sx={{
                cursor: dragCursor ?? (isDrawingMode || movingLineId ? "crosshair" : "default"),
              }}
              overlay={
                <>
                  <OhlcLegend bar={readout?.bar} change={readout?.change} />
                  {drawingHint}
                </>
              }
            />
          </Box>

          {/* 인덱스(지수) 차트 */}
          {indexData && indexData.length > 0 && (
            <Box sx={chartSurfaceSx}>
              <Box
                sx={{
                  p: 0.5,
                  borderBottom: "1px solid #f1f5f9",
                  mb: 0.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {selectedIndexCode
                    ? `${
                        indexData.find((index) => index.code === selectedIndexCode)?.market ?? ""
                      } • ${selectedIndexCode}`
                    : "인덱스를 선택하세요"}
                </Typography>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="index-select-label">인덱스 선택</InputLabel>
                  <Select
                    labelId="index-select-label"
                    value={selectedIndexCode}
                    label="인덱스 선택"
                    onChange={onIndexChange}
                  >
                    {indexData.map((index) => (
                      <MenuItem key={index.code} value={index.code}>
                        {index.name} ({index.market})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ height: INDEX_CHART_HEIGHT }}>
                <TradingViewChart
                  series={indexSeries}
                  panes={[{ stretch: 1 }]}
                  height="100%"
                  initialVisibleBars={CHART_INITIAL_VISIBLE_BARS}
                  fitContentKey={selectedIndexCode || null}
                  emptyMessage={
                    selectedIndexCode ? "인덱스 데이터를 로드하는 중..." : "인덱스를 선택하세요"
                  }
                />
              </Box>
            </Box>
          )}

          {/* 수평선 컨텍스트 메뉴 */}
          <Menu
            anchorEl={menuState.anchorEl}
            open={Boolean(menuState.anchorEl)}
            onClose={closeMenu}
          >
            <MenuItem onClick={() => connectLineToEntry(menuState.lineId)}>
              1차 진입시점으로 설정
            </MenuItem>
            {tradingMode === "manual" &&
              pyramidingEntries.map((_, index) => (
                <MenuItem
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onClick={() => connectLineToPyramiding(menuState.lineId, index)}
                >
                  {index + 2}차 진입시점으로 설정
                </MenuItem>
              ))}
            <Divider />
            <MenuItem
              onClick={() => {
                setMovingLineId(activeLine?.id ?? null);
                setIsDrawingMode(false);
                closeMenu();
              }}
            >
              위치 이동
            </MenuItem>
            <MenuItem onClick={() => handleDeleteLine(menuState.lineId)} sx={{ color: "#f44336" }}>
              삭제
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
            color: "text.secondary",
          }}
        >
          <Typography variant="h6" mb={1}>
            {selectedStock?.name}
          </Typography>
          <Typography variant="body2">차트 데이터를 사용할 수 없습니다</Typography>
        </Box>
      )}
    </Box>
  );
};

ChartContainer.propTypes = {
  ohlcvData: PropTypes.array,
  analysisData: PropTypes.array,
  indexOhlcvData: PropTypes.array,
  indexData: PropTypes.array,
  selectedIndexCode: PropTypes.string,
  selectedStock: PropTypes.object,
  entryPoint: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  pyramidingEntries: PropTypes.array,
  onIndexChange: PropTypes.func,
  onEntryPointChange: PropTypes.func,
  onPyramidingEntryChange: PropTypes.func,
  onShowSnackbar: PropTypes.func,
  chartType: PropTypes.string,
  tradingMode: PropTypes.string,
};

ChartContainer.defaultProps = {
  ohlcvData: [],
  analysisData: [],
  indexOhlcvData: [],
  indexData: [],
  selectedIndexCode: "",
  selectedStock: {},
  entryPoint: "",
  pyramidingEntries: [],
  onIndexChange: () => {},
  onEntryPointChange: () => {},
  onPyramidingEntryChange: () => {},
  onShowSnackbar: () => {},
  chartType: "default",
  tradingMode: "manual",
};

export default React.memo(ChartContainer, (prev, next) => {
  return (
    prev.selectedStock?.code === next.selectedStock?.code &&
    prev.ohlcvData === next.ohlcvData &&
    prev.analysisData === next.analysisData &&
    prev.indexOhlcvData === next.indexOhlcvData &&
    prev.selectedIndexCode === next.selectedIndexCode &&
    prev.entryPoint === next.entryPoint &&
    prev.pyramidingEntries === next.pyramidingEntries &&
    prev.tradingMode === next.tradingMode &&
    prev.chartType === next.chartType
  );
});
