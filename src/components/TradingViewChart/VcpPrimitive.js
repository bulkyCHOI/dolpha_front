/**
 * VcpPrimitive
 *
 * lightweight-charts v5 ISeriesPrimitive 구현체.
 * VCP(변곡점) 분석 결과를 캔들 위에 그린다.
 *
 * Chart.js 시절 inflectionPointPlugin이 캔버스에 직접 그리던 것을 옮긴 것으로,
 * 표시 내용은 동일하다.
 *   - T 수축 구간: 스윙 고점/저점의 눈금과 세로 연결선, 깊이(%) 라벨
 *   - 스윙 고점 연결선(저항) · 저점 연결선(지지)
 *   - 피벗 수평선과 가격 라벨
 *
 * 좌표 변환만 Chart.js 스케일에서 lightweight-charts의
 * timeScale.timeToCoordinate / series.priceToCoordinate 로 바뀌었다.
 */

import { COLORS } from "constants/styles";

const LABEL_FONT = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const LABEL_PADDING = 4;

// T 수축 깊이별 색 (T1 진한 빨강 → T4 연한 노랑)
const DEPTH_COLORS = ["#dc2626", "#ea580c", "#d97706", "#ca8a04"];

const PEAK_LINE_COLOR = "#ef4444";
const TROUGH_LINE_COLOR = "#3b82f6";
const PIVOT_COLOR = "#8b5cf6";
const PIVOT_LABEL_COLOR = "#7c3aed";
const WARN_COLOR = "#f59e0b";

const TICK_HALF_WIDTH = 12;

class VcpRenderer {
  constructor(primitive) {
    this._p = primitive;
  }

  draw(target) {
    const { _chart: chart, _series: series, _data: data, _settings: settings } = this._p;
    if (!chart || !series || !data) return;

    const { tContractions = [], vcpSwings = [], pivotPoint = null } = data;
    if (tContractions.length === 0 && vcpSwings.length === 0 && !pivotPoint) return;

    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context;
      const width = scope.mediaSize.width;
      const timeScale = chart.timeScale();

      const toX = (index) => {
        const time = this._p.timeAt(index);
        return time == null ? null : timeScale.timeToCoordinate(time);
      };
      const toY = (price) => series.priceToCoordinate(price);

      ctx.save();
      this._drawContractions(ctx, tContractions, toX, toY, width, settings);
      this._drawSwingLines(ctx, vcpSwings, toX, toY, settings);
      this._drawPivot(ctx, pivotPoint, toX, toY, width, settings);
      ctx.restore();
    });
  }

  _drawContractions(ctx, contractions, toX, toY, width, settings) {
    contractions.forEach((t) => {
      const highX = toX(t.swingHigh?.index);
      const highY = toY(t.swingHigh?.high);
      const lowX = toX(t.swingLow?.index);
      const lowY = toY(t.swingLow?.low);
      if (highX === null || highY === null || lowX === null || lowY === null) return;

      const color = DEPTH_COLORS[Math.min((t.tNumber ?? 1) - 1, DEPTH_COLORS.length - 1)];
      const midX = (highX + lowX) / 2;

      if (settings.showConnectionLines) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);

        // 고점 / 저점 눈금
        ctx.beginPath();
        ctx.moveTo(Math.max(highX - TICK_HALF_WIDTH, 0), highY);
        ctx.lineTo(Math.min(highX + TICK_HALF_WIDTH, width), highY);
        ctx.moveTo(Math.max(lowX - TICK_HALF_WIDTH, 0), lowY);
        ctx.lineTo(Math.min(lowX + TICK_HALF_WIDTH, width), lowY);
        ctx.stroke();

        // 수축 범위 세로선
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(midX, highY);
        ctx.lineTo(midX, lowY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (settings.showPercentageLabels) {
        const midY = (highY + lowY) / 2;
        const depth = typeof t.depth === "number" ? t.depth.toFixed(1) : "-";
        this._drawLabel(ctx, `${t.label} (${depth}%)`, midX, midY, COLORS.SURFACE, color);

        // 수축하지 않는(=VCP 조건에 어긋나는) 구간 경고
        if (t.isContracting === false) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = WARN_COLOR;
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⚠", midX + 34, midY);
        }
      }
    });
    ctx.globalAlpha = 1;
  }

  _drawSwingLines(ctx, swings, toX, toY, settings) {
    if (!settings.showConnectionLines || swings.length < 2) return;

    const connect = (points, color, priceKey) => {
      if (points.length < 2) return;
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();

      let started = false;
      points.forEach((point) => {
        const x = toX(point.index);
        const y = toY(point[priceKey]);
        if (x === null || y === null) return;
        if (started) {
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
          started = true;
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    connect(
      swings.filter((s) => s.type === "peak"),
      PEAK_LINE_COLOR,
      "high"
    );
    connect(
      swings.filter((s) => s.type === "trough"),
      TROUGH_LINE_COLOR,
      "low"
    );
  }

  _drawPivot(ctx, pivotPoint, toX, toY, width, settings) {
    if (!pivotPoint) return;
    const x = toX(pivotPoint.index);
    const y = toY(pivotPoint.price);
    if (y === null) return;

    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = PIVOT_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(Math.max(x ?? 0, 0), y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (settings.showPercentageLabels) {
      const price = new Intl.NumberFormat("ko-KR").format(Math.round(pivotPoint.price));
      this._drawLabel(ctx, `Pivot ${price}`, width - 55, y - 14, COLORS.SURFACE, PIVOT_LABEL_COLOR);
    }
  }

  /** 캔들 위에서도 읽히도록 색 배경 박스를 깔고 텍스트를 그린다. */
  _drawLabel(ctx, text, x, y, textColor, backgroundColor) {
    ctx.globalAlpha = 1;
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + LABEL_PADDING * 2;
    const boxHeight = 16;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);

    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
  }
}

class VcpPrimitive {
  constructor() {
    this._data = null;
    this._settings = { showConnectionLines: true, showPercentageLabels: true };
    // 분석 결과의 index를 차트의 time으로 바꾸기 위한 원본 봉 배열
    this._bars = [];
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
    this._renderer = new VcpRenderer(this);
    // 캔들 위에 그려야 라벨이 가려지지 않는다
    this._view = { renderer: () => this._renderer, zOrder: () => "top" };
  }

  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
  }

  detached() {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  updateAllViews() {}

  paneViews() {
    return [this._view];
  }

  /** 분석 결과의 봉 인덱스를 차트 시간으로 변환한다. */
  timeAt(index) {
    if (index == null) return null;
    return this._bars[index]?.date ?? null;
  }

  /**
   * @param {object|null} analysisResult processVCPPattern 결과
   * @param {Array} bars 원본 OHLCV (index → date 변환용)
   * @param {object} settings showConnectionLines · showPercentageLabels
   */
  setAnalysis(analysisResult, bars = [], settings = {}) {
    this._data = analysisResult;
    this._bars = bars;
    this._settings = {
      showConnectionLines: settings.showConnectionLines ?? true,
      showPercentageLabels: settings.showPercentageLabels ?? true,
    };
    if (this._requestUpdate) this._requestUpdate();
  }
}

export default VcpPrimitive;
