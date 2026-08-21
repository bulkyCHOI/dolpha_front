/**
 * BandFillPrimitive
 *
 * lightweight-charts v5 ISeriesPrimitive 구현체.
 * candleSeries에 attachPrimitive() 하면 두 가격 경계선 사이를
 * 캔버스에 직접 그려 녹색 음영 밴드로 표시합니다.
 *
 * 사용법:
 *   const primitive = new BandFillPrimitive();
 *   candleSeries.attachPrimitive(primitive);
 *   primitive.updateBand(lower, upper); // [{time, price}] 배열
 */

const FILL_COLOR = "rgba(34, 197, 94, 0.12)";
const LINE_COLOR = "rgba(34, 197, 94, 0.55)";
const LINE_WIDTH = 1;

class BandFillRenderer {
  constructor(primitive) {
    this._p = primitive;
  }

  draw(target) {
    const { _chart: chart, _series: series, _lower: lower, _upper: upper } = this._p;
    if (!chart || !series || lower.length < 2 || upper.length < 2) return;

    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context;
      const timeScale = chart.timeScale();

      const toPoint = ({ time, price }) => {
        const x = timeScale.timeToCoordinate(time);
        const y = series.priceToCoordinate(price);
        return x !== null && y !== null ? { x, y } : null;
      };

      const upperPts = upper.map(toPoint).filter(Boolean);
      const lowerPts = lower.map(toPoint).filter(Boolean);
      if (upperPts.length < 2 || lowerPts.length < 2) return;

      ctx.save();

      // ── 1. 녹색 음영 채우기 ──────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(upperPts[0].x, upperPts[0].y);
      for (let i = 1; i < upperPts.length; i++) ctx.lineTo(upperPts[i].x, upperPts[i].y);
      for (let i = lowerPts.length - 1; i >= 0; i--) ctx.lineTo(lowerPts[i].x, lowerPts[i].y);
      ctx.closePath();
      ctx.fillStyle = FILL_COLOR;
      ctx.fill();

      // ── 2. 상단 경계선 (MA60 × 1.75) ────────────────────────
      ctx.beginPath();
      ctx.moveTo(upperPts[0].x, upperPts[0].y);
      for (let i = 1; i < upperPts.length; i++) ctx.lineTo(upperPts[i].x, upperPts[i].y);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();

      // ── 3. 하단 경계선 (MA60 × 1.5) ─────────────────────────
      ctx.beginPath();
      ctx.moveTo(lowerPts[0].x, lowerPts[0].y);
      for (let i = 1; i < lowerPts.length; i++) ctx.lineTo(lowerPts[i].x, lowerPts[i].y);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();

      ctx.restore();
    });
  }
}

class BandFillPrimitive {
  constructor() {
    this._lower = [];
    this._upper = [];
    this._chart = null;
    this._series = null;
    this._renderer = new BandFillRenderer(this);
    this._view = { renderer: () => this._renderer };
  }

  /** lightweight-charts가 시리즈에 연결될 때 호출 */
  attached({ chart, series }) {
    this._chart = chart;
    this._series = series;
  }

  detached() {
    this._chart = null;
    this._series = null;
  }

  updateAllViews() {}

  paneViews() {
    return [this._view];
  }

  /**
   * 밴드 데이터를 갱신합니다.
   * @param {Array<{time: string, price: number}>} lower  MA60 × 1.5
   * @param {Array<{time: string, price: number}>} upper  MA60 × 1.75
   */
  updateBand(lower, upper) {
    this._lower = lower;
    this._upper = upper;
  }
}

export default BandFillPrimitive;
