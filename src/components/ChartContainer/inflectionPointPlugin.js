// inflectionPointPlugin.js
// VCP (Volatility Contraction Pattern) 시각화 Chart.js 플러그인

/**
 * 둥근 모서리 사각형 헬퍼
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * 텍스트 배경 박스 그리기
 */
function drawLabelBox(ctx, text, cx, cy, bgColor, fontSize = 11) {
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const padX = 6;
  const padY = 4;
  const bw = metrics.width + padX * 2;
  const bh = fontSize + padY * 2;
  const bx = cx - bw / 2;
  const by = cy - bh / 2;

  ctx.globalAlpha = 0.88;
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, bx, by, bw, bh, 4);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

/**
 * VCP 패턴 시각화 플러그인
 */
export const inflectionPointPlugin = {
  id: "inflectionPointPlugin",

  afterDraw(chart, args, options) {
    if (!options || !options.enabled) return;

    const {
      ctx,
      chartArea: { left, top, right, bottom },
      scales: { x, y },
    } = chart;

    const {
      tContractions = [],
      vcpSwings = [],
      pivotPoint = null,
      showConnectionLines = true,
      showPercentageLabels = true,
    } = options;

    if (tContractions.length === 0 && vcpSwings.length === 0) return;

    ctx.save();

    // ── 1. T 수축 구간 시각화 ──────────────────────────────────────────
    tContractions.forEach((t) => {
      try {
        const highX = x.getPixelForValue(t.swingHigh.index);
        const highY = y.getPixelForValue(t.swingHigh.high);
        const lowX = x.getPixelForValue(t.swingLow.index);
        const lowY = y.getPixelForValue(t.swingLow.low);

        // 차트 영역 범위 확인
        if (
          highX < left || highX > right ||
          lowX < left || lowX > right
        ) return;

        // 수축 깊이에 따른 색상 (T1 진한 빨강 → T4 연한 주황)
        const depthColors = ["#dc2626", "#ea580c", "#d97706", "#ca8a04"];
        const color = depthColors[Math.min(t.tNumber - 1, depthColors.length - 1)];

        // ── 세로 브라켓: 스윙고점 → 스윙저점 ──
        if (showConnectionLines) {
          // 고점 수평선
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.max(highX - 12, left), highY);
          ctx.lineTo(Math.min(highX + 12, right), highY);
          ctx.stroke();

          // 저점 수평선
          ctx.beginPath();
          ctx.moveTo(Math.max(lowX - 12, left), lowY);
          ctx.lineTo(Math.min(lowX + 12, right), lowY);
          ctx.stroke();

          // 세로 연결선 (T 범위 표시)
          const midX = (highX + lowX) / 2;
          ctx.globalAlpha = 0.4;
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(midX, highY);
          ctx.lineTo(midX, lowY);
          ctx.stroke();

          ctx.setLineDash([]);
        }

        // ── T 라벨 + 깊이% ──
        if (showPercentageLabels) {
          const midX = (highX + lowX) / 2;
          const midY = (highY + lowY) / 2;

          const depthText = `${t.label} (${t.depth.toFixed(1)}%)`;
          drawLabelBox(ctx, depthText, midX, midY, color, 11);

          // 유효 VCP 여부 표시 (수축 여부)
          if (!t.isContracting) {
            const warnText = "⚠";
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 13px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(warnText, midX + 30, midY);
          }
        }
      } catch (e) {
        console.warn("VCP T 구간 렌더링 오류:", e);
      }
    });

    // ── 2. 스윙 고점 연결선 (내림차순 저항선) ──────────────────────────
    if (showConnectionLines && vcpSwings.length >= 2) {
      const peaks = vcpSwings.filter((s) => s.type === "peak");
      if (peaks.length >= 2) {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        let started = false;
        peaks.forEach((p) => {
          const px = x.getPixelForValue(p.index);
          const py = y.getPixelForValue(p.high);
          if (px < left || px > right) return;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── 스윙 저점 연결선 (오름차순 지지선) ──
      const troughs = vcpSwings.filter((s) => s.type === "trough");
      if (troughs.length >= 2) {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "#2196f3";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        let started = false;
        troughs.forEach((t) => {
          const px = x.getPixelForValue(t.index);
          const py = y.getPixelForValue(t.low);
          if (px < left || px > right) return;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ── 3. 피벗 포인트 수평선 ──────────────────────────────────────────
    if (pivotPoint) {
      try {
        const pivotPx = x.getPixelForValue(pivotPoint.index);
        const pivotPy = y.getPixelForValue(pivotPoint.price);

        if (pivotPy >= top && pivotPy <= bottom) {
          ctx.globalAlpha = 0.7;
          ctx.strokeStyle = "#8b5cf6";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.moveTo(Math.max(pivotPx, left), pivotPy);
          ctx.lineTo(right, pivotPy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Pivot 라벨
          if (showPercentageLabels) {
            const priceStr = new Intl.NumberFormat("ko-KR").format(Math.round(pivotPoint.price));
            drawLabelBox(ctx, `Pivot ${priceStr}`, right - 55, pivotPy - 14, "#7c3aed", 10);
          }
        }
      } catch (e) {
        console.warn("피벗 포인트 렌더링 오류:", e);
      }
    }

    ctx.restore();
  },
};

/**
 * VCP 분석 결과를 Chart.js 옵션에 적용
 */
export function applyInflectionAnalysisToChart(chartOptions, analysisResult, userSettings = {}) {
  if (!analysisResult) return chartOptions;

  const {
    showConnectionLines = true,
    showPercentageLabels = true,
  } = userSettings;

  const pluginOptions = {
    enabled: true,
    tContractions: analysisResult.tContractions || [],
    vcpSwings: analysisResult.vcpSwings || analysisResult.inflectionPoints || [],
    pivotPoint: analysisResult.pivotPoint || null,
    showConnectionLines,
    showPercentageLabels,
  };

  return {
    ...chartOptions,
    plugins: {
      ...(chartOptions.plugins || {}),
      inflectionPointPlugin: pluginOptions,
    },
  };
}

/**
 * 기본 플러그인 옵션
 */
export const defaultInflectionOptions = {
  enabled: false,
  tContractions: [],
  vcpSwings: [],
  pivotPoint: null,
  showConnectionLines: true,
  showPercentageLabels: true,
};

/**
 * VCP 툴팁 콜백
 */
export function inflectionPointTooltipCallback(context) {
  const data = context.raw;
  const inflectionData = data.inflectionData;
  if (!inflectionData) return [];

  const typeText = inflectionData.type === "peak" ? "스윙 고점" : "스윙 저점";
  const priceValue = inflectionData.type === "peak" ? inflectionData.high : inflectionData.low;
  const icon = inflectionData.type === "peak" ? "🔺" : "🔻";

  return [
    `${icon} ${typeText}`,
    `날짜: ${new Date(inflectionData.date).toLocaleDateString("ko-KR")}`,
    `가격: ${new Intl.NumberFormat("ko-KR").format(priceValue)}원`,
  ];
}
