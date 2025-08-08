import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { Chart } from "react-chartjs-2";

// @mui material components
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Timeline from "@mui/icons-material/Timeline";
import ToggleButton from "@mui/material/ToggleButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import { keyframes } from "@mui/system";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Utils
import { formatNumber, getKRXTickSize, adjustToKRXTickSize } from "utils/formatters";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  CandlestickController,
  CandlestickElement,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend
);

// Animation for popup
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ChartContainer = ({
  ohlcvData = [],
  analysisData = [],
  indexOhlcvData = [],
  indexData = [],
  selectedIndexCode = "",
  selectedStock = {},
  entryPoint = "",
  pyramidingEntries = [],
  activeTab = 0,
  onIndexChange = () => {},
  onEntryPointChange = () => {},
  onPyramidingEntryChange = () => {},
  onShowSnackbar = () => {},
  chartType = "default", // "default" | "htf"
}) => {
  // Chart state
  const [chartLoading, setChartLoading] = useState(false);
  const [horizontalLines, setHorizontalLines] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLineId, setDragLineId] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [showEntryPopup, setShowEntryPopup] = useState(false);

  // Chart reference
  const chartRef = useRef(null);

  // Drag state reference for immediate access
  const dragStateRef = useRef({
    isDragging: false,
    dragLineId: null,
  });

  // Update drag state refs when state changes
  useEffect(() => {
    dragStateRef.current = {
      isDragging,
      dragLineId,
    };
  }, [isDragging, dragLineId]);

  // Prevent body scroll during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isDragging]);

  // Candlestick color dynamic application
  useEffect(() => {
    if (chartRef.current && ohlcvData && ohlcvData.length > 0) {
      const chart = chartRef.current;

      try {
        // Find candlestick dataset and update colors
        const candlestickDataset = chart.data.datasets.find(
          (dataset) => dataset.type === "candlestick"
        );
        if (candlestickDataset) {
          // Set color properties
          candlestickDataset.backgroundColors = {
            up: "#f44336",
            down: "#2196f3",
            unchanged: "#757575",
          };
          candlestickDataset.borderColors = {
            up: "#f44336",
            down: "#2196f3",
            unchanged: "#757575",
          };
          chart.update("active");
        }
      } catch (error) {
        console.warn("Chart color update failed:", error);
      }
    }
  }, [ohlcvData]);

  // Chart data creation functions
  const createCandlestickData = (ohlcvData, analysisData, chartType = "default", selectedStock = {}) => {
    if (!ohlcvData || ohlcvData.length === 0) return null;

    const datasets = [
      {
        label: "캔들스틱",
        type: "candlestick",
        data: ohlcvData.map((item, index) => {
          // Handle halted trading days: if open, high, low are 0 but close > 0, use close for all
          const isHalted = (item.open === 0 || item.high === 0 || item.low === 0) && item.close > 0;
          return {
            x: index,
            o: isHalted ? item.close : item.open,
            h: isHalted ? item.close : item.high,
            l: isHalted ? item.close : item.low,
            c: item.close,
          };
        }),
        backgroundColors: {
          up: "#f44336",
          down: "#2196f3",
          unchanged: "#757575",
        },
        borderColors: {
          up: "#f44336",
          down: "#2196f3",
          unchanged: "#757575",
        },
      },
    ];

    // Add moving average lines if analysis data is available
    if (analysisData && Array.isArray(analysisData) && analysisData.length > 0) {
      // 50일선
      const ma50Data = analysisData
        .filter((item) => item.ma50 !== null && item.ma50 !== undefined && !isNaN(item.ma50))
        .map((item, index) => ({
          x: index,
          y: item.ma50,
        }));

      if (ma50Data.length > 0) {
        datasets.push({
          label: "50일선",
          type: "line",
          data: ma50Data,
          borderColor: "#ff6b35",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.1,
          order: 2,
        });
      }

      // 150일선
      const ma150Data = analysisData
        .filter((item) => item.ma150 !== null && item.ma150 !== undefined && !isNaN(item.ma150))
        .map((item, index) => ({
          x: index,
          y: item.ma150,
        }));

      if (ma150Data.length > 0) {
        datasets.push({
          label: "150일선",
          type: "line",
          data: ma150Data,
          borderColor: "#f7931e",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.1,
          order: 3,
        });
      }

      // 200일선
      const ma200Data = analysisData
        .filter((item) => item.ma200 !== null && item.ma200 !== undefined && !isNaN(item.ma200))
        .map((item, index) => ({
          x: index,
          y: item.ma200,
        }));

      if (ma200Data.length > 0) {
        datasets.push({
          label: "200일선",
          type: "line",
          data: ma200Data,
          borderColor: "#9c27b0",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.1,
          order: 4,
        });
      }
    }

    // Add horizontal lines to datasets
    horizontalLines.forEach((line, index) => {
      const indexRange = (ohlcvData && ohlcvData.length > 0) ? [0, ohlcvData.length - 1] : [0, 1];

      datasets.push({
        label: `진입선 ${index + 1}`,
        type: "line",
        data: [
          { x: indexRange[0], y: line.value },
          { x: indexRange[1], y: line.value },
        ],
        borderColor: line.color,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        lineId: line.id,
        showLine: true,
        borderDash: [5, 5],
      });
    });

    // Add HTF pattern visualization if chartType is "htf"
    if (chartType === "htf" && selectedStock && selectedStock.htf_pattern_detected) {
      // HTF 패턴 시작점 마커
      if (selectedStock.htf_pattern_start_date && ohlcvData.length > 0) {
        const startDateStr = selectedStock.htf_pattern_start_date;
        const startIndex = ohlcvData.findIndex(item => item.date === startDateStr);
        
        if (startIndex !== -1) {
          datasets.push({
            label: "HTF 시작점",
            type: "scatter",
            data: [{
              x: startIndex,
              y: ohlcvData[startIndex]?.low * 0.98, // 저점보다 약간 아래에 표시
            }],
            backgroundColor: "#4caf50",
            borderColor: "#4caf50",
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: "triangle",
            order: 0,
          });
        }
      }

      // HTF 패턴 고점 마커
      if (selectedStock.htf_pattern_peak_date && ohlcvData.length > 0) {
        const peakDateStr = selectedStock.htf_pattern_peak_date;
        const peakIndex = ohlcvData.findIndex(item => item.date === peakDateStr);
        
        if (peakIndex !== -1) {
          datasets.push({
            label: "HTF 고점",
            type: "scatter",
            data: [{
              x: peakIndex,
              y: ohlcvData[peakIndex]?.high * 1.02, // 고점보다 약간 위에 표시
            }],
            backgroundColor: "#f44336",
            borderColor: "#f44336",
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: "triangle",
            rotation: 180, // 역삼각형으로 표시
            order: 0,
          });
        }
      }

      // HTF 패턴 구간 하이라이트 (배경색)
      if (selectedStock.htf_pattern_start_date && selectedStock.htf_pattern_peak_date && ohlcvData.length > 0) {
        const startDateStr = selectedStock.htf_pattern_start_date;
        const peakDateStr = selectedStock.htf_pattern_peak_date;
        const startIndex = ohlcvData.findIndex(item => item.date === startDateStr);
        const peakIndex = ohlcvData.findIndex(item => item.date === peakDateStr);
        
        if (startIndex !== -1 && peakIndex !== -1 && startIndex < peakIndex) {
          // 상승 구간 하이라이트
          const riseData = [];
          for (let i = startIndex; i <= peakIndex; i++) {
            if (ohlcvData[i]) {
              riseData.push({
                x: i,
                y: ohlcvData[i].high * 1.05, // 고점보다 약간 위에 라인
              });
            }
          }
          
          if (riseData.length > 0) {
            datasets.push({
              label: "HTF 상승구간",
              type: "line",
              data: riseData,
              borderColor: "rgba(76, 175, 80, 0.3)",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderWidth: 3,
              pointRadius: 0,
              pointHoverRadius: 0,
              tension: 0,
              fill: "origin",
              order: 10, // 뒤로 보내기
            });
          }
        }
      }
    }

    return { datasets };
  };

  const createIndexCandlestickData = (indexOhlcvData) => {
    if (!indexOhlcvData || indexOhlcvData.length === 0) return null;

    return {
      datasets: [
        {
          label: "인덱스 캔들스틱",
          type: "candlestick",
          data: indexOhlcvData.map((item, index) => {
            const isHalted =
              (item.open === 0 || item.high === 0 || item.low === 0) && item.close > 0;
            return {
              x: index,
              o: isHalted ? item.close : item.open,
              h: isHalted ? item.close : item.high,
              l: isHalted ? item.close : item.low,
              c: item.close,
            };
          }),
          backgroundColors: {
            up: "#f44336",
            down: "#2196f3",
            unchanged: "#757575",
          },
          borderColors: {
            up: "#f44336",
            down: "#2196f3",
            unchanged: "#757575",
          },
        },
      ],
    };
  };

  const createVolumeData = (ohlcvData) => {
    if (!ohlcvData || ohlcvData.length === 0) return null;

    return {
      datasets: [
        {
          label: "거래량",
          type: "bar",
          data: (ohlcvData || []).map((item, index) => ({
            x: index,
            y: item.volume || 0,
          })),
          backgroundColor: (ohlcvData || []).map((item) =>
            item.close >= item.open ? "rgba(244, 67, 54, 0.6)" : "rgba(33, 150, 243, 0.6)"
          ),
          borderColor: (ohlcvData || []).map((item) => (item.close >= item.open ? "#f44336" : "#2196f3")),
          borderWidth: 1,
        },
      ],
    };
  };

  const createRSRankData = (analysisData) => {
    if (!analysisData || analysisData.length === 0) return null;

    const datasets = [];

    // RS Rank 기본 데이터
    const rsRankData = analysisData
      .filter((item) => item.rsRank !== null && item.rsRank !== undefined && !isNaN(item.rsRank))
      .map((item, index) => ({
        x: index,
        y: item.rsRank,
      }));

    if (rsRankData.length > 0) {
      datasets.push({
        label: "RS Rank",
        type: "line",
        data: rsRankData,
        borderColor: "#f44336",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#f44336",
        tension: 0.1,
      });
    }

    // RS Rank 1M 데이터
    const rsRank1mData = analysisData
      .filter(
        (item) => item.rsRank1m !== null && item.rsRank1m !== undefined && !isNaN(item.rsRank1m)
      )
      .map((item, index) => ({
        x: index,
        y: item.rsRank1m,
      }));

    if (rsRank1mData.length > 0) {
      datasets.push({
        label: "RS Rank 1M",
        type: "line",
        data: rsRank1mData,
        borderColor: "#4caf50",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#4caf50",
        tension: 0.1,
      });
    }

    // RS Rank 3M 데이터
    const rsRank3mData = analysisData
      .filter(
        (item) => item.rsRank3m !== null && item.rsRank3m !== undefined && !isNaN(item.rsRank3m)
      )
      .map((item, index) => ({
        x: index,
        y: item.rsRank3m,
      }));

    if (rsRank3mData.length > 0) {
      datasets.push({
        label: "RS Rank 3M",
        type: "line",
        data: rsRank3mData,
        borderColor: "#2196f3",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#2196f3",
        tension: 0.1,
      });
    }

    // RS Rank 6M 데이터
    const rsRank6mData = analysisData
      .filter(
        (item) => item.rsRank6m !== null && item.rsRank6m !== undefined && !isNaN(item.rsRank6m)
      )
      .map((item, index) => ({
        x: index,
        y: item.rsRank6m,
      }));

    if (rsRank6mData.length > 0) {
      datasets.push({
        label: "RS Rank 6M",
        type: "line",
        data: rsRank6mData,
        borderColor: "#9c27b0",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#9c27b0",
        tension: 0.1,
      });
    }

    // RS Rank 12M 데이터
    const rsRank12mData = analysisData
      .filter(
        (item) => item.rsRank12m !== null && item.rsRank12m !== undefined && !isNaN(item.rsRank12m)
      )
      .map((item, index) => ({
        x: index,
        y: item.rsRank12m,
      }));

    if (rsRank12mData.length > 0) {
      datasets.push({
        label: "RS Rank 12M",
        type: "line",
        data: rsRank12mData,
        borderColor: "#000000",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#000000",
        tension: 0.1,
      });
    }

    // RS Rank 기준선
    datasets.push({
      label: "RS Rank 기준선",
      type: "line",
      data: [
        { x: 0, y: 80 },
        { x: (analysisData && analysisData.length > 0 ? analysisData.length - 1 : 1), y: 80 },
      ],
      borderColor: "#ff9800",
      backgroundColor: "transparent",
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      borderDash: [5, 5],
    });

    return { datasets };
  };

  const createATRData = (analysisData) => {
    if (!analysisData || analysisData.length === 0) return null;

    const datasets = [];

    // ATR 데이터 (막대그래프)
    const atrData = analysisData
      .filter((item) => item.atr !== null && item.atr !== undefined && !isNaN(item.atr))
      .map((item, index) => ({
        x: index,
        y: item.atr,
      }));

    if (atrData.length > 0) {
      datasets.push({
        label: "ATR",
        type: "bar",
        data: atrData,
        borderColor: "#ff5722",
        backgroundColor: "rgba(255, 87, 34, 0.6)",
        borderWidth: 1,
        yAxisID: "y",
        order: 1, // 막대를 뒤쪽에 표시
      });
    }

    // ATR Ratio 데이터 (라인그래프)
    const atrRatioData = analysisData
      .filter(
        (item) => item.atrRatio !== null && item.atrRatio !== undefined && !isNaN(item.atrRatio)
      )
      .map((item, index) => ({
        x: index,
        y: item.atrRatio * 100, // 백분율로 표시
      }));

    if (atrRatioData.length > 0) {
      datasets.push({
        label: "ATR Ratio (%)",
        type: "line",
        data: atrRatioData,
        borderColor: "#795548",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: "#795548",
        tension: 0.1,
        yAxisID: "y1",
        order: 0, // 라인을 가장 앞에 표시
        fill: false,
        showLine: true,
      });
    }

    return { datasets };
  };

  const createMTTData = (analysisData) => {
    if (!analysisData || analysisData.length === 0) return null;

    const datasets = [];

    // MTT (Minervini Trend Template) 데이터 - boolean을 0/1로 변환
    const mttData = analysisData
      .filter((item) => item.is_minervini_trend !== null && item.is_minervini_trend !== undefined)
      .map((item, index) => ({
        x: index,
        y: item.is_minervini_trend ? 1 : 0,
      }));

    if (mttData.length > 0) {
      datasets.push({
        label: "MTT 조건",
        type: "line",
        data: mttData,
        borderColor: "#4CAF50",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "white",
        pointBorderColor: (context) => {
          const value = context.parsed.y;
          return value === 1 ? "#4CAF50" : "#FF5722";
        },
        tension: 0,
        stepped: true, // 계단식 라인으로 boolean 변화를 명확하게 표시
      });
    }

    return { datasets };
  };

  // Event handlers for horizontal lines
  const handleAddHorizontalLine = (yValue) => {
    const newLine = {
      id: Date.now(),
      value: adjustToKRXTickSize(yValue),
      color: "#667eea",
      isDragging: false,
      type: "entry",
    };
    setHorizontalLines((prev) => [...prev, newLine]);

    if (activeTab === 0) {
      onEntryPointChange(yValue.toString());
    }

    if (chartRef.current) {
      chartRef.current.update("active");
    }
  };

  const handleUpdateHorizontalLine = (id, newValue) => {
    setHorizontalLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, value: newValue } : line))
    );

    const line = horizontalLines.find((line) => line.id === id);
    if (line) {
      if (line.type === "entry") {
        onEntryPointChange(newValue.toString());
      } else if (line.type === "pyramiding") {
        const lineIndex = horizontalLines.findIndex((l) => l.id === id && l.type === "pyramiding");
        if (lineIndex >= 0) {
          const baseEntryPrice = parseFloat(entryPoint);
          if (baseEntryPrice && baseEntryPrice > 0) {
            const percentage = (((newValue - baseEntryPrice) / baseEntryPrice) * 100).toFixed(2);
            const percentageStr = percentage > 0 ? `+${percentage}` : percentage.toString();
            onPyramidingEntryChange(lineIndex, percentageStr);
          } else {
            onPyramidingEntryChange(lineIndex, newValue.toString());
          }
        }
      }
    }

    if (chartRef.current) {
      chartRef.current.update("active");
    }
  };

  const handleDeleteHorizontalLine = (id) => {
    setHorizontalLines((prev) => prev.filter((line) => line.id !== id));
    if (chartRef.current) {
      chartRef.current.update("active");
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  // Mouse event handlers for line dragging
  const handleLabelClick = (lineId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (selectedLineId === lineId && showEntryPopup) {
      // 이미 선택된 라인이고 팝업이 열려있으면 팝업 유지
      return;
    }

    setSelectedLineId(lineId);
    setShowEntryPopup(true);
  };

  const handleLabelMouseDown = (lineId, event) => {
    event.preventDefault();
    event.stopPropagation();

    const handleMouseMove = () => {
      dragStateRef.current = {
        isDragging: true,
        dragLineId: lineId,
      };
      setIsDragging(true);
      setDragLineId(lineId);

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      document.addEventListener("mousemove", handleGlobalMouseMove, { passive: false });
      document.addEventListener("mouseup", handleGlobalMouseUp);
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.isDragging) {
        handleLabelClick(lineId, event);
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleLabelTouchStart = (lineId, event) => {
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    const startY = touch.clientY;
    let hasMoved = false;

    const handleTouchMove = (e) => {
      const currentTouch = e.touches[0];
      const deltaY = Math.abs(currentTouch.clientY - startY);

      if (deltaY > 5 && !hasMoved) {
        hasMoved = true;
        dragStateRef.current = {
          isDragging: true,
          dragLineId: lineId,
        };
        setIsDragging(true);
        setDragLineId(lineId);

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);

        document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
        document.addEventListener("touchend", handleGlobalTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      if (!hasMoved) {
        handleLabelClick(lineId, event);
      }

      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleGlobalMouseMove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const { isDragging: refIsDragging, dragLineId: refDragLineId } = dragStateRef.current;

    if (refIsDragging && refDragLineId && chartData && ohlcvData && ohlcvData.length > 0) {
      try {
        const chartCanvas = document.querySelector("canvas");

        if (chartCanvas) {
          const rect = chartCanvas.getBoundingClientRect();
          const y = event.clientY - rect.top;

          const yScale = chartData.datasets[0]?.data || [];
          if (yScale.length === 0) return;

          const chartHeight = 350;
          const normalizedY = Math.max(0, Math.min(1, (y - 30) / (chartHeight - 60)));

          const priceArray = (ohlcvData || []).map((item) => Math.max(item.high, item.close, item.open, item.low));
          const maxPrice = priceArray.length > 0 ? Math.max(...priceArray) : 100000;
          
          const minPriceArray = (ohlcvData || []).map((item) => Math.min(item.low, item.close, item.open, item.high));
          const minPrice = minPriceArray.length > 0 ? Math.min(...minPriceArray) : 50000;
          const priceRange = maxPrice - minPrice;

          const newValue = maxPrice - normalizedY * priceRange;
          const adjustedValue = adjustToKRXTickSize(newValue);

          setHorizontalLines((prev) =>
            prev.map((line) => {
              if (line.id === refDragLineId) {
                const updatedLine = { ...line, value: adjustedValue };

                if (line.type === "entry") {
                  onEntryPointChange(adjustedValue.toString());
                } else if (line.type === "pyramiding") {
                  const baseEntryPrice = parseFloat(entryPoint);
                  if (baseEntryPrice && baseEntryPrice > 0) {
                    const percentage = (
                      ((adjustedValue - baseEntryPrice) / baseEntryPrice) *
                      100
                    ).toFixed(2);
                    const percentageStr = percentage.toString();

                    if (
                      line.pyramidingIndex !== undefined &&
                      line.pyramidingIndex >= 0 &&
                      line.pyramidingIndex < pyramidingEntries.length
                    ) {
                      onPyramidingEntryChange(line.pyramidingIndex, percentageStr);
                    }
                  }
                }

                return updatedLine;
              }
              return line;
            })
          );
        }
      } catch (error) {
        console.warn("Error during line dragging:", error);
      }
    }
  };

  const handleGlobalTouchMove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const { isDragging: refIsDragging, dragLineId: refDragLineId } = dragStateRef.current;

    if (refIsDragging && refDragLineId && chartData && ohlcvData && ohlcvData.length > 0) {
      try {
        const chartCanvas = document.querySelector("canvas");
        const touch = event.touches[0];

        if (chartCanvas && touch) {
          const rect = chartCanvas.getBoundingClientRect();
          const y = touch.clientY - rect.top;

          const yScale = chartData.datasets[0]?.data || [];
          if (yScale.length === 0) return;

          const chartHeight = 350;
          const normalizedY = Math.max(0, Math.min(1, (y - 30) / (chartHeight - 60)));

          const priceArray = (ohlcvData || []).map((item) => Math.max(item.high, item.close, item.open, item.low));
          const maxPrice = priceArray.length > 0 ? Math.max(...priceArray) : 100000;
          
          const minPriceArray = (ohlcvData || []).map((item) => Math.min(item.low, item.close, item.open, item.high));
          const minPrice = minPriceArray.length > 0 ? Math.min(...minPriceArray) : 50000;
          const priceRange = maxPrice - minPrice;

          const newValue = maxPrice - normalizedY * priceRange;
          const adjustedValue = adjustToKRXTickSize(newValue);

          setHorizontalLines((prev) =>
            prev.map((line) => {
              if (line.id === refDragLineId) {
                const updatedLine = { ...line, value: adjustedValue };

                if (line.type === "entry") {
                  onEntryPointChange(adjustedValue.toString());
                } else if (line.type === "pyramiding") {
                  const baseEntryPrice = parseFloat(entryPoint);
                  if (baseEntryPrice && baseEntryPrice > 0) {
                    const percentage = (
                      ((adjustedValue - baseEntryPrice) / baseEntryPrice) *
                      100
                    ).toFixed(2);
                    const percentageStr = percentage.toString();

                    if (
                      line.pyramidingIndex !== undefined &&
                      line.pyramidingIndex >= 0 &&
                      line.pyramidingIndex < pyramidingEntries.length
                    ) {
                      onPyramidingEntryChange(line.pyramidingIndex, percentageStr);
                    }
                  }
                }

                return updatedLine;
              }
              return line;
            })
          );
        }
      } catch (error) {
        console.warn("Error during touch line dragging:", error);
      }
    }
  };

  const handleGlobalTouchEnd = () => {
    const { isDragging: refIsDragging, dragLineId: refDragLineId } = dragStateRef.current;

    if (refIsDragging && refDragLineId) {
      const line = horizontalLines.find((line) => line.id === refDragLineId);
      if (line) {
        if (line.type === "entry") {
          onEntryPointChange(line.value.toString());
        } else if (line.type === "pyramiding") {
          const lineIndex = horizontalLines.findIndex(
            (l) => l.id === refDragLineId && l.type === "pyramiding"
          );
          if (lineIndex >= 0) {
            const baseEntryPrice = parseFloat(entryPoint);
            if (baseEntryPrice && baseEntryPrice > 0) {
              const percentage = (((line.value - baseEntryPrice) / baseEntryPrice) * 100).toFixed(
                2
              );
              const percentageStr = percentage > 0 ? `+${percentage}` : percentage.toString();
              onPyramidingEntryChange(lineIndex, percentageStr);
            } else {
              onPyramidingEntryChange(lineIndex, line.value.toString());
            }
          }
        }
      }
    }

    setIsDragging(false);
    setDragLineId(null);
    dragStateRef.current = {
      isDragging: false,
      dragLineId: null,
    };

    document.removeEventListener("touchmove", handleGlobalTouchMove);
    document.removeEventListener("touchend", handleGlobalTouchEnd);
  };

  const handleGlobalMouseUp = () => {
    const { isDragging: refIsDragging, dragLineId: refDragLineId } = dragStateRef.current;

    if (refIsDragging && refDragLineId) {
      const line = horizontalLines.find((line) => line.id === refDragLineId);
      if (line) {
        if (line.type === "entry") {
          onEntryPointChange(line.value.toString());
        } else if (line.type === "pyramiding") {
          const lineIndex = horizontalLines.findIndex(
            (l) => l.id === refDragLineId && l.type === "pyramiding"
          );
          if (lineIndex >= 0) {
            const baseEntryPrice = parseFloat(entryPoint);
            if (baseEntryPrice && baseEntryPrice > 0) {
              const percentage = (((line.value - baseEntryPrice) / baseEntryPrice) * 100).toFixed(
                2
              );
              const percentageStr = percentage > 0 ? `+${percentage}` : percentage.toString();
              onPyramidingEntryChange(lineIndex, percentageStr);
            } else {
              onPyramidingEntryChange(lineIndex, line.value.toString());
            }
          }
        }
      }
    }

    setIsDragging(false);
    setDragLineId(null);
    dragStateRef.current = {
      isDragging: false,
      dragLineId: null,
    };

    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
  };

  // Connect line to entry point
  const connectLineToEntry = (lineId) => {
    const line = horizontalLines.find((l) => l.id === lineId);
    if (line) {
      const adjustedPrice = adjustToKRXTickSize(line.value);
      onEntryPointChange(adjustedPrice.toString());
      setHorizontalLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, type: "entry", color: "#667eea" } : l))
      );
    }
  };

  const connectLineToPyramiding = (lineId, index) => {
    const line = horizontalLines.find((l) => l.id === lineId);
    if (!line) return;

    const baseEntryPrice = parseFloat(entryPoint);
    if (!baseEntryPrice || baseEntryPrice <= 0) {
      onShowSnackbar("1차 진입시점을 먼저 설정해주세요.", "warning");
      return;
    }

    const adjustedPrice = adjustToKRXTickSize(line.value);
    const percentage = (((adjustedPrice - baseEntryPrice) / baseEntryPrice) * 100).toFixed(2);
    const percentageStr = percentage.toString();

    onPyramidingEntryChange(index, percentageStr, true);

    setHorizontalLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, type: "pyramiding", color: "#ff9800", pyramidingIndex: index } : l
      )
    );
  };

  // Create chart data
  const chartData = createCandlestickData(ohlcvData, analysisData, chartType, selectedStock);
  const volumeData = createVolumeData(ohlcvData);
  const indexChartData = createIndexCandlestickData(indexOhlcvData);
  const rsRankData = createRSRankData(analysisData);
  const atrData = createATRData(analysisData);
  const mttData = createMTTData(analysisData);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },
    onClick: (event, elements, chart) => {
      if (elements.length > 0 && !isDrawingMode) {
        const element = elements[0];
        const dataset = chart.data.datasets[element.datasetIndex];
        if (dataset.label && dataset.label.includes("진입선")) {
          const lineId = dataset.lineId;
          setSelectedLineId(lineId);
          return;
        }
      }

      if (isDrawingMode && ohlcvData && ohlcvData.length > 0) {
        try {
          let dataY;

          if (event.native && chart.canvas && chart.scales.y) {
            const rect = chart.canvas.getBoundingClientRect();
            const y = event.native.clientY - rect.top;
            dataY = chart.scales.y.getValueForPixel(y);
          } else {
            const yScale = chart.scales.y;
            const minValue = yScale.min;
            const maxValue = yScale.max;
            dataY = (minValue + maxValue) / 2;
          }

          if (dataY && !isNaN(dataY)) {
            const adjustedPrice = adjustToKRXTickSize(dataY);
            handleAddHorizontalLine(adjustedPrice);
            setIsDrawingMode(false);
          }
        } catch (error) {
          if (ohlcvData && ohlcvData.length > 0) {
            const lastPrice = ohlcvData[ohlcvData.length - 1].close;
            handleAddHorizontalLine(lastPrice);
            setIsDrawingMode(false);
          }
        }
      }
    },
    onHover: (event, elements, chart) => {
      if (event.native && event.native.target) {
        if (isDrawingMode) {
          event.native.target.style.cursor = "crosshair";
        } else if (elements.length > 0) {
          const element = elements[0];
          const datasetLabel = chart.data.datasets[element.datasetIndex]?.label;
          if (datasetLabel && datasetLabel.includes("진입선")) {
            event.native.target.style.cursor = "pointer";
          } else {
            event.native.target.style.cursor = "default";
          }
        } else {
          event.native.target.style.cursor = "default";
        }
      }
    },
    scales: {
      x: {
        type: "category",
        labels: (ohlcvData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        beginAtZero: false,
        grace: "3%",
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            return new Intl.NumberFormat("ko-KR").format(Math.round(value));
          },
        },
        afterDataLimits: function (scale) {
          scale.max = scale.max * 1.02;
          scale.min = scale.min * 0.98;
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "nearest",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (ohlcvData && ohlcvData[index]) {
              return new Date(ohlcvData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            const datasetLabel = context.dataset.label;
            if (datasetLabel === "캔들스틱") {
              const data = context.raw;
              const index = context.dataIndex;
              // API의 change 값(전일 대비 등락율) 사용 - 소수점 형태를 백분율로 변환
              const changePercent = ((ohlcvData && ohlcvData[index])?.change || 0) * 100;
              const changePercentText = `등락율: ${
                changePercent > 0 ? "+" : ""
              }${changePercent.toFixed(2)}%`;
              return [
                `시가: ${new Intl.NumberFormat("ko-KR").format(data.o)}`,
                `고가: ${new Intl.NumberFormat("ko-KR").format(data.h)}`,
                `저가: ${new Intl.NumberFormat("ko-KR").format(data.l)}`,
                `종가: ${new Intl.NumberFormat("ko-KR").format(data.c)}`,
                changePercentText,
              ];
            }
            return `${datasetLabel}: ${new Intl.NumberFormat("ko-KR").format(context.parsed.y)}`;
          },
        },
      },
    },
  };

  const indexChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 0,
        left: 10,
        right: 10,
      },
    },
    scales: {
      x: {
        type: "category",
        labels: (indexOhlcvData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 0,
        },
      },
      y: {
        beginAtZero: false,
        grace: "3%",
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            return new Intl.NumberFormat("ko-KR").format(Math.round(value));
          },
        },
        afterDataLimits: function (scale) {
          scale.max = scale.max * 1.02;
          scale.min = scale.min * 0.98;
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "nearest",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (indexOhlcvData && indexOhlcvData[index]) {
              return new Date(indexOhlcvData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            const data = context.raw;
            const index = context.dataIndex;
            // API의 change 값(전일 대비 등락율) 사용 - 소수점 형태를 백분율로 변환
            const changePercent = ((indexOhlcvData && indexOhlcvData[index])?.change || 0) * 100;
            const changePercentText = `등락율: ${
              changePercent > 0 ? "+" : ""
            }${changePercent.toFixed(2)}%`;
            return [
              `시가: ${new Intl.NumberFormat("ko-KR").format(data.o)}`,
              `고가: ${new Intl.NumberFormat("ko-KR").format(data.h)}`,
              `저가: ${new Intl.NumberFormat("ko-KR").format(data.l)}`,
              `종가: ${new Intl.NumberFormat("ko-KR").format(data.c)}`,
              changePercentText,
            ];
          },
        },
      },
    },
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },
    scales: {
      x: {
        type: "category",
        labels: (ohlcvData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + "M";
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + "K";
            }
            return new Intl.NumberFormat("ko-KR").format(value);
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "nearest",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (ohlcvData && ohlcvData[index]) {
              return new Date(ohlcvData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            return `거래량: ${new Intl.NumberFormat("ko-KR").format(context.parsed.y)}`;
          },
        },
      },
    },
  };

  const rsRankOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },
    scales: {
      x: {
        type: "category",
        labels: (analysisData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          stepSize: 20,
          callback: function (value) {
            return value;
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        mode: "nearest",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (analysisData && analysisData[index]) {
              return new Date(analysisData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            return `RS Rank: ${context.parsed.y}`;
          },
        },
      },
    },
  };

  const atrOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },
    scales: {
      x: {
        type: "category",
        labels: (analysisData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            return new Intl.NumberFormat("ko-KR").format(value);
          },
        },
        title: {
          display: false,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            return value.toFixed(1) + "%";
          },
        },
        title: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
          generateLabels: function (chart) {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: dataset.borderWidth,
              pointStyle: dataset.type === "line" ? "line" : "rect",
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (analysisData && analysisData[index]) {
              return new Date(analysisData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            const label = context.dataset.label;
            const value = context.parsed.y;
            if (label === "ATR") {
              return `ATR: ${new Intl.NumberFormat("ko-KR").format(value)}`;
            } else if (label === "ATR Ratio (%)") {
              return `ATR Ratio: ${value.toFixed(2)}%`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  const mttOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },
    scales: {
      x: {
        type: "category",
        labels: (analysisData || []).map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 8,
          color: "#666",
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        min: -0.1,
        max: 1.1,
        ticks: {
          stepSize: 1,
          color: "#666",
          font: {
            size: 10,
          },
          padding: 8,
          callback: function (value) {
            return value === 1 ? "만족" : value === 0 ? "불만족" : "";
          },
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            if (analysisData && analysisData[index]) {
              return new Date(analysisData[index].date).toLocaleDateString("ko-KR");
            }
            return "";
          },
          label: function (context) {
            const value = context.parsed.y;
            return `MTT 조건: ${value === 1 ? "만족" : "불만족"}`;
          },
        },
      },
    },
  };

  return (
    <MKBox sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Main chart content */}
      <MKBox sx={{ position: "relative", flex: 1 }}>
        {chartLoading ? (
          <MKBox
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <MKTypography variant="body2" color="text">
              차트를 로드하는 중...
            </MKTypography>
          </MKBox>
        ) : chartData && ohlcvData && ohlcvData.length > 0 ? (
          <>
            {/* Chart controls - positioned inside chart */}
            <MKBox
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                display: "flex",
                gap: 1,
              }}
            >
              <Tooltip title={isDrawingMode ? "수평선 그리기 종료" : "수평선 그리기 시작"}>
                <ToggleButton
                  value="drawing"
                  selected={isDrawingMode}
                  onChange={toggleDrawingMode}
                  size="small"
                  color="primary"
                  sx={{
                    border: "1px solid #667eea",
                    color: isDrawingMode ? "white" : "#667eea",
                    backgroundColor: isDrawingMode ? "#667eea" : "transparent",
                    "&:hover": {
                      backgroundColor: isDrawingMode ? "#5a6fd8" : "rgba(102, 126, 234, 0.1)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#667eea",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#5a6fd8",
                      },
                    },
                  }}
                >
                  <Timeline sx={{ fontSize: "16px" }} />
                </ToggleButton>
              </Tooltip>

              {horizontalLines && horizontalLines.length > 0 && (
                <Tooltip title="모든 수평선 삭제">
                  <IconButton
                    onClick={() => setHorizontalLines([])}
                    size="small"
                    color="error"
                    sx={{
                      minWidth: { xs: "44px", md: "32px" },
                      minHeight: { xs: "44px", md: "32px" },
                      border: "1px solid #f44336",
                      color: "#f44336",
                      backgroundColor: "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                      },
                    }}
                  >
                    <Delete sx={{ fontSize: "16px" }} />
                  </IconButton>
                </Tooltip>
              )}
            </MKBox>

            {/* Horizontal line labels */}
            {horizontalLines.map((line) => {
              let linePosition = 175;

              if (chartRef.current) {
                const chartInstance = chartRef.current;
                if (chartInstance.scales && chartInstance.scales.y) {
                  const yScale = chartInstance.scales.y;
                  try {
                    const pixelPosition = yScale.getPixelForValue(line.value);
                    if (!isNaN(pixelPosition)) {
                      linePosition = pixelPosition - 12;
                    }
                  } catch (error) {
                    const yScale = chartData ? chartData.datasets[0]?.data : [];
                    if (yScale.length > 0) {
                      const maxPrice = Math.max(
                        ...ohlcvData.map((item) =>
                          Math.max(item.high, item.close, item.open, item.low)
                        )
                      );
                      const minPrice = Math.min(
                        ...ohlcvData.map((item) =>
                          Math.min(item.low, item.close, item.open, item.high)
                        )
                      );
                      const priceRange = maxPrice - minPrice;
                      const chartHeight = 350;
                      linePosition =
                        ((maxPrice - line.value) / priceRange) * (chartHeight - 60) + 30 - 12;
                    }
                  }
                } else {
                  const yScale = chartData ? chartData.datasets[0]?.data : [];
                  if (yScale.length > 0) {
                    const priceArrayMax = (ohlcvData || []).map((item) =>
                      Math.max(item.high, item.close, item.open, item.low)
                    );
                    const maxPrice = priceArrayMax.length > 0 ? Math.max(...priceArrayMax) : 100000;
                    
                    const priceArrayMin = (ohlcvData || []).map((item) =>
                      Math.min(item.low, item.close, item.open, item.high)
                    );
                    const minPrice = priceArrayMin.length > 0 ? Math.min(...priceArrayMin) : 50000;
                    const priceRange = maxPrice - minPrice;
                    const chartHeight = 350;
                    linePosition =
                      ((maxPrice - line.value) / priceRange) * (chartHeight - 60) + 30 - 12;
                  }
                }
              }

              return (
                <MKBox
                  key={line.id}
                  sx={{
                    position: "absolute",
                    top: `${linePosition}px`,
                    left: { xs: 4, md: 8 },
                    zIndex: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 0.3, md: 0.5 },
                    backgroundColor:
                      isDragging && dragLineId === line.id
                        ? "rgba(255, 152, 0, 0.9)"
                        : selectedLineId === line.id
                        ? "rgba(102, 126, 234, 0.9)"
                        : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 1,
                    p: { xs: 0.3, md: 0.5 },
                    border:
                      isDragging && dragLineId === line.id
                        ? "2px solid #ff9800"
                        : selectedLineId === line.id
                        ? "2px solid #667eea"
                        : "1px solid #ddd",
                    boxShadow:
                      isDragging && dragLineId === line.id
                        ? "0 4px 12px rgba(255, 152, 0, 0.3)"
                        : "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: isDragging && dragLineId === line.id ? "grabbing" : "grab",
                    transition: isDragging && dragLineId === line.id ? "none" : "all 0.2s ease",
                    transform: isDragging && dragLineId === line.id ? "scale(1.1)" : "scale(1)",
                    "&:hover": {
                      backgroundColor:
                        isDragging && dragLineId === line.id
                          ? "rgba(255, 152, 0, 0.9)"
                          : "rgba(102, 126, 234, 0.1)",
                      transform:
                        isDragging && dragLineId === line.id ? "scale(1.1)" : "scale(1.05)",
                    },
                  }}
                  onMouseDown={(e) => handleLabelMouseDown(line.id, e)}
                  onTouchStart={(e) => handleLabelTouchStart(line.id, e)}
                >
                  <MKBox
                    sx={{
                      width: { xs: 6, md: 8 },
                      height: { xs: 1.5, md: 2 },
                      backgroundColor: line.color,
                      borderRadius: 1,
                    }}
                  />

                  <MKTypography
                    variant="caption"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "10px", md: "12px" },
                      color:
                        isDragging && dragLineId === line.id
                          ? "white"
                          : selectedLineId === line.id
                          ? "white"
                          : "text.primary",
                      minWidth: { xs: "45px", md: "60px" },
                      userSelect: "none",
                    }}
                  >
                    {new Intl.NumberFormat("ko-KR").format(line.value)}
                  </MKTypography>

                  <IconButton
                    size="small"
                    color="error"
                    sx={{
                      minWidth: { xs: "24px", md: "32px" },
                      minHeight: { xs: "24px", md: "32px" },
                      p: { xs: 0.15, md: 0.25 },
                      color:
                        isDragging && dragLineId === line.id
                          ? "white"
                          : selectedLineId === line.id
                          ? "white"
                          : "#f44336",
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 0.2)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHorizontalLine(line.id);
                    }}
                  >
                    <Delete sx={{ fontSize: { xs: "10px", md: "12px" } }} />
                  </IconButton>
                </MKBox>
              );
            })}

            {/* Entry popup */}
            {showEntryPopup && selectedLineId && (
              <MKBox
                sx={{
                  position: "absolute",
                  top: { xs: 35, md: 40 },
                  right: { xs: 8, md: 8 },
                  zIndex: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  borderRadius: 1,
                  p: { xs: 0.8, md: 1 },
                  border: "2px solid #667eea",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  animation: `${fadeIn} 0.2s ease-in-out`,
                  minWidth: { xs: 180, md: 200 },
                  maxWidth: { xs: 220, md: 300 },
                }}
              >
                <MKBox
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: { xs: 0.8, md: 1 },
                  }}
                >
                  <MKTypography
                    variant="caption"
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "10px", md: "12px" },
                      lineHeight: 1.2,
                      flex: 1,
                      pr: 1,
                    }}
                  >
                    진입시점 설정 ({horizontalLines.find((l) => l.id === selectedLineId)?.value}원)
                  </MKTypography>
                  <IconButton
                    size="small"
                    color="default"
                    sx={{
                      minWidth: { xs: "24px", md: "32px" },
                      minHeight: { xs: "24px", md: "32px" },
                      padding: { xs: "1px", md: "2px" },
                    }}
                    onClick={() => setShowEntryPopup(false)}
                  >
                    <Close sx={{ fontSize: { xs: "12px", md: "14px" } }} />
                  </IconButton>
                </MKBox>
                <MKBox sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.4, md: 0.5 } }}>
                  {/* 1차 진입시점 버튼 */}
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      connectLineToEntry(selectedLineId);
                      setShowEntryPopup(false);
                    }}
                    sx={{
                      fontSize: { xs: "9px", md: "10px" },
                      py: { xs: 0.4, md: 0.5 },
                      px: { xs: 0.8, md: 1 },
                      minHeight: { xs: "28px", md: "32px" },
                      borderColor: "#667eea",
                      color: "#667eea",
                      "&:hover": {
                        borderColor: "#5a6fd8",
                        backgroundColor: "rgba(102, 126, 234, 0.04)",
                      },
                    }}
                  >
                    1차 진입시점으로 설정
                  </Button>

                  {/* 피라미딩 진입시점 버튼들 - 동적 생성 */}
                  {pyramidingEntries.map((_, index) => (
                    <Button
                      key={index}
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        connectLineToPyramiding(selectedLineId, index);
                        setShowEntryPopup(false);
                      }}
                      sx={{
                        fontSize: { xs: "9px", md: "10px" },
                        py: { xs: 0.4, md: 0.5 },
                        px: { xs: 0.8, md: 1 },
                        minHeight: { xs: "28px", md: "32px" },
                        borderColor: "#ff9800",
                        color: "#ff9800",
                        "&:hover": {
                          borderColor: "#f57c00",
                          backgroundColor: "rgba(255, 152, 0, 0.04)",
                        },
                      }}
                    >
                      {index + 2}차 진입시점으로 설정
                    </Button>
                  ))}
                </MKBox>
              </MKBox>
            )}

            {/* Drawing mode indicator */}
            {isDrawingMode && (
              <MKBox
                sx={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  zIndex: 10,
                  backgroundColor: "rgba(255, 107, 53, 0.9)",
                  color: "white",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <MKTypography variant="caption" fontWeight="bold">
                  차트 클릭으로 수평선 추가
                </MKTypography>
              </MKBox>
            )}

            {/* Main candlestick chart */}
            <MKBox
              sx={{
                height: { xs: "280px", md: "350px" },
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 0.5,
                mb: 1,
              }}
            >
              <Chart ref={chartRef} type="candlestick" data={chartData} options={chartOptions} />
            </MKBox>

            {/* Volume chart */}
            <MKBox
              sx={{
                height: { xs: "140px", md: "175px" },
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 0.5,
                mb: 1,
              }}
            >
              {volumeData && <Chart type="bar" data={volumeData} options={volumeOptions} />}
            </MKBox>

            {/* Index chart */}
            {indexData && indexData.length > 0 && (
              <MKBox
                sx={{
                  height: { xs: "280px", md: "350px" },
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 0.5,
                }}
              >
                <MKBox
                  sx={{
                    p: 0.5,
                    borderBottom: "1px solid #f0f0f0",
                    mb: 0.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <MKBox>
                    <MKTypography variant="caption" color="text">
                      {selectedIndexCode && indexData && indexData.length > 0
                        ? `${
                            indexData.find((idx) => idx.code === selectedIndexCode)?.market || ""
                          } • ${selectedIndexCode}`
                        : "인덱스를 선택하세요"}
                    </MKTypography>
                  </MKBox>

                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="index-select-label">인덱스 선택</InputLabel>
                    <Select
                      labelId="index-select-label"
                      value={selectedIndexCode}
                      label="인덱스 선택"
                      onChange={onIndexChange}
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#2196f3",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#1976d2",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#2196f3",
                        },
                      }}
                    >
                      {indexData.map((index) => (
                        <MenuItem key={index.code} value={index.code}>
                          {index.name} ({index.market})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MKBox>

                {indexChartData && indexOhlcvData && indexOhlcvData.length > 0 ? (
                  <MKBox sx={{ height: "calc(100% - 80px)" }}>
                    <Chart type="candlestick" data={indexChartData} options={indexChartOptions} />
                  </MKBox>
                ) : (
                  <MKBox
                    sx={{
                      height: "calc(100% - 80px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "#666",
                    }}
                  >
                    <MKTypography variant="body1" mb={1}>
                      {selectedIndexCode ? "인덱스 데이터를 로드하는 중..." : "인덱스를 선택하세요"}
                    </MKTypography>
                    {selectedIndexCode && <CircularProgress size={24} />}
                  </MKBox>
                )}
              </MKBox>
            )}

            {/* RS Rank chart */}
            {analysisData && analysisData.length > 0 && (
              <MKBox
                sx={{
                  height: { xs: "250px", md: "300px" },
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 0.5,
                  mb: 1,
                }}
              >
                {rsRankData ? (
                  <MKBox sx={{ height: "100%" }}>
                    <Chart type="line" data={rsRankData} options={rsRankOptions} />
                  </MKBox>
                ) : (
                  <MKBox
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "#666",
                    }}
                  >
                    <MKTypography variant="body1">RS Rank 데이터를 로드하는 중...</MKTypography>
                  </MKBox>
                )}
              </MKBox>
            )}

            {/* ATR chart */}
            {analysisData && analysisData.length > 0 && (
              <MKBox
                sx={{
                  height: { xs: "200px", md: "250px" },
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 0.5,
                }}
              >
                {atrData ? (
                  <MKBox sx={{ height: "100%" }}>
                    <Chart data={atrData} options={atrOptions} />
                  </MKBox>
                ) : (
                  <MKBox
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "#666",
                    }}
                  >
                    <MKTypography variant="body1">ATR 데이터를 로드하는 중...</MKTypography>
                  </MKBox>
                )}
              </MKBox>
            )}

            {/* MTT (Minervini Trend Template) chart */}
            {analysisData && analysisData.length > 0 && (
              <MKBox
                sx={{
                  height: { xs: "150px", md: "200px" },
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 0.5,
                  mt: 1,
                }}
              >
                {mttData ? (
                  <MKBox sx={{ height: "100%" }}>
                    <Chart data={mttData} options={mttOptions} />
                  </MKBox>
                ) : (
                  <MKBox
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "#666",
                    }}
                  >
                    <MKTypography variant="body1">MTT 데이터를 로드하는 중...</MKTypography>
                  </MKBox>
                )}
              </MKBox>
            )}
          </>
        ) : (
          <MKBox
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
              color: "#666",
            }}
          >
            <MKTypography variant="h6" mb={1}>
              {selectedStock.name}
            </MKTypography>
            <MKTypography variant="body2">차트 데이터를 사용할 수 없습니다</MKTypography>
          </MKBox>
        )}
      </MKBox>
    </MKBox>
  );
};

export default ChartContainer;
