import { useState, useRef, useEffect } from "react";
import { adjustToKRXTickSize } from "utils/formatters";

/**
 * Custom hook for managing chart interactions and reference lines
 * Handles horizontal line drawing, dragging, and connection to trading settings
 */
export const useChartInteractions = (
  entryPoint,
  pyramidingEntries,
  activeTab,
  onEntryPointChange,
  onPyramidingEntryChange,
  showSnackbar
) => {
  // Chart interaction state
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

  // Horizontal line handlers
  const handleAddHorizontalLine = (yValue) => {
    const newLine = {
      id: Date.now(),
      value: yValue,
      color: "#ff6b35",
      isDragging: false,
      type: "entry",
    };
    setHorizontalLines((prev) => [...prev, newLine]);

    // Force chart update
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.update("active");
      }
    }, 50);
  };

  const handleUpdateHorizontalLine = (id, newValue) => {
    setHorizontalLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, value: newValue } : line))
    );

    // Force chart update
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.update("active");
      }
    }, 50);
  };

  const handleDeleteHorizontalLine = (id) => {
    setHorizontalLines((prev) => prev.filter((line) => line.id !== id));

    // Force chart update
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.update("active");
      }
    }, 50);
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  // Label interaction handlers
  const handleLabelClick = (lineId, event) => {
    event.preventDefault();
    event.stopPropagation();

    // Toggle popup for same line, open for different line
    if (selectedLineId === lineId) {
      setShowEntryPopup(!showEntryPopup);
    } else {
      setSelectedLineId(lineId);
      setShowEntryPopup(true);
    }
  };

  // Label drag handlers
  const handleLabelMouseDown = (lineId, event) => {
    event.preventDefault();
    event.stopPropagation();

    // Store initial position for drag detection
    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      // Start drag if moved more than 5 pixels
      if (deltaX > 5 || deltaY > 5) {
        // Update state and ref simultaneously
        setIsDragging(true);
        setDragLineId(lineId);
        setSelectedLineId(lineId);

        // Immediately update ref for real-time access
        dragStateRef.current = {
          isDragging: true,
          dragLineId: lineId,
        };

        // Remove temporary listeners
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Add global drag listeners
        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);
      }
    };

    const handleMouseUp = () => {
      // If drag didn't start, treat as click
      if (!dragStateRef.current.isDragging) {
        handleLabelClick(lineId, event);
      }

      // Remove temporary listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // Add temporary listeners for drag detection
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleGlobalMouseMove = (event) => {
    // Use ref for immediate access to current state
    const { isDragging: refIsDragging, dragLineId: refDragLineId } = dragStateRef.current;

    if (refIsDragging && refDragLineId) {
      try {
        // Find chart canvas
        const chartCanvas = document.querySelector("canvas");

        if (chartCanvas) {
          const rect = chartCanvas.getBoundingClientRect();
          const y = event.clientY - rect.top;

          // Calculate Y-axis range from chart data
          const chartHeight = 350; // Fixed chart height
          const normalizedY = Math.max(0, Math.min(1, (y - 30) / (chartHeight - 60)));

          // Estimate price range (this is approximate - ideally would use chart scales)
          // For now, we'll use a simplified calculation
          const estimatedMaxPrice = 100000; // This should be calculated from actual data
          const estimatedMinPrice = 50000; // This should be calculated from actual data
          const priceRange = estimatedMaxPrice - estimatedMinPrice;

          const dataY = estimatedMaxPrice - normalizedY * priceRange;

          if (dataY && !isNaN(dataY)) {
            handleUpdateHorizontalLine(refDragLineId, Math.round(dataY), false);
          }
        }
      } catch (error) {
        // Silent error handling during drag
      }
    }
  };

  const handleGlobalMouseUp = () => {
    // 드래그 완료 시 진입시점 자동 업데이트 없음 - 팝업 버튼으로만 설정

    setIsDragging(false);
    setDragLineId(null);

    // Reset ref
    dragStateRef.current = {
      isDragging: false,
      dragLineId: null,
    };

    // Remove global listeners
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
  };

  // Connect line to trading settings
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

  const connectLineToPyramiding = (lineId, pyramidingIndex) => {
    const line = horizontalLines.find((l) => l.id === lineId);
    if (!line) return;

    // Check if base entry point is set
    const baseEntryPrice = parseFloat(entryPoint);
    if (!baseEntryPrice || baseEntryPrice <= 0) {
      showSnackbar("1차 진입시점을 먼저 설정해주세요.", "warning");
      return;
    }

    // Adjust line price to KRX tick size
    const adjustedLinePrice = adjustToKRXTickSize(line.value);

    // Calculate percentage relative to base entry (rounded to integer)
    const percentage = Math.round(((adjustedLinePrice - baseEntryPrice) / baseEntryPrice) * 100);
    const percentageStr = percentage > 0 ? `+${percentage}` : percentage.toString();

    onPyramidingEntryChange(pyramidingIndex, percentageStr);

    setHorizontalLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, type: "pyramiding", color: "#ff9800" } : l))
    );
  };

  // Chart options factory (returns chart options with interaction handlers)
  const createChartOptions = (ohlcvData, chartData) => ({
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
      // Handle horizontal line selection
      if (elements.length > 0 && !isDrawingMode) {
        const element = elements[0];
        const dataset = chart.data.datasets[element.datasetIndex];
        if (dataset.label && dataset.label.includes("진입선")) {
          const lineId = dataset.lineId;
          setSelectedLineId(lineId);
          return;
        }
      }

      // Handle line drawing
      if (isDrawingMode && ohlcvData.length > 0) {
        try {
          let dataY;

          if (event.native && chart.canvas && chart.scales.y) {
            const rect = chart.canvas.getBoundingClientRect();
            const y = event.native.clientY - rect.top;
            dataY = chart.scales.y.getValueForPixel(y);
          } else {
            // Fallback: use price range midpoint
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
          // Fallback: use last price
          if (ohlcvData.length > 0) {
            const lastPrice = ohlcvData[ohlcvData.length - 1].close;
            const adjustedPrice = adjustToKRXTickSize(lastPrice);
            handleAddHorizontalLine(adjustedPrice);
            setIsDrawingMode(false);
          }
        }
      }
    },
    onHover: (event, elements, chart) => {
      try {
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
      } catch (error) {
        // Silent error handling
      }
    },
    scales: {
      x: {
        type: "category",
        labels: ohlcvData.map((item) =>
          new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
        ),
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 10,
          color: "#666",
          font: {
            size: 12,
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
        },
      },
      y: {
        beginAtZero: false,
        grace: "5%",
        grid: {
          display: true,
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          color: "#666",
          font: {
            size: 12,
          },
          padding: 8,
          callback: function (value) {
            return new Intl.NumberFormat("ko-KR").format(Math.round(value));
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          filter: function (legendItem) {
            // Exclude candlestick from legend
            return legendItem.text !== "캔들스틱";
          },
          usePointStyle: true,
          pointStyle: "line",
          font: {
            size: 10,
          },
          color: "#666",
        },
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const index = context[0].parsed.x;
            return ohlcvData[index]
              ? new Date(ohlcvData[index].date).toLocaleDateString("ko-KR")
              : "";
          },
          beforeBody: function (context) {
            const candleData = context.find((ctx) => ctx.dataset.label === "캔들스틱");
            if (!candleData || !candleData.parsed.o) return "";

            const data = candleData.parsed;
            const changePercent = (((data.c - data.o) / data.o) * 100).toFixed(2);
            return `당일변화: ${changePercent > 0 ? "+" : ""}${changePercent}%`;
          },
          label: function (context) {
            if (context.dataset.label === "캔들스틱") {
              const data = context.parsed;
              if (!data) return "";

              return [
                `시가: ${new Intl.NumberFormat("ko-KR").format(data.o)}`,
                `고가: ${new Intl.NumberFormat("ko-KR").format(data.h)}`,
                `저가: ${new Intl.NumberFormat("ko-KR").format(data.l)}`,
                `종가: ${new Intl.NumberFormat("ko-KR").format(data.c)}`,
              ];
            } else {
              // Moving averages
              return `${context.dataset.label}: ${new Intl.NumberFormat("ko-KR").format(
                Math.round(context.parsed.y)
              )}`;
            }
          },
        },
        backgroundColor: "rgba(0,0,0,0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#667eea",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  });

  return {
    // State
    chartLoading,
    horizontalLines,
    isDrawingMode,
    isDragging,
    dragLineId,
    selectedLineId,
    showEntryPopup,
    chartRef,
    dragStateRef,

    // Setters
    setChartLoading,
    setHorizontalLines,
    setIsDrawingMode,
    setIsDragging,
    setDragLineId,
    setSelectedLineId,
    setShowEntryPopup,

    // Handlers
    handleAddHorizontalLine,
    handleUpdateHorizontalLine,
    handleDeleteHorizontalLine,
    toggleDrawingMode,
    handleLabelClick,
    handleLabelMouseDown,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    connectLineToEntry,
    connectLineToPyramiding,

    // Chart options
    createChartOptions,
  };
};
