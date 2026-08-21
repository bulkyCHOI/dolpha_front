/**
 * ZonePrimitive
 *
 * lightweight-charts v5 ISeriesPrimitive 구현체.
 * 캔들 시리즈에 attachPrimitive() 하면 시간 구간을 세로 밴드(음영)로 칠하고,
 * 지정 시각에 세로 점선을 그린다. 눌림 구간·직전 상승 구간·판정 시점 표시에 쓴다.
 *
 * 사용법:
 *   const zones = new ZonePrimitive();
 *   candleSeries.attachPrimitive(zones);
 *   zones.setShapes(
 *     [{ from, to, fill, stroke, label, labelColor }],
 *     [{ time, color, label }]
 *   );
 */

import { COLORS, alpha } from "constants/styles";

const LABEL_FONT = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const LABEL_TOP = 6;
const LABEL_PADDING = 4;
const MIN_ZONE_WIDTH = 2;
const DASH = [4, 3];

class ZoneRenderer {
  constructor(primitive) {
    this._p = primitive;
  }

  draw(target) {
    const { _chart: chart, _zones: zones, _verticals: verticals } = this._p;
    if (!chart || (zones.length === 0 && verticals.length === 0)) return;

    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context;
      const height = scope.mediaSize.height;
      const timeScale = chart.timeScale();
      const halfBar = Math.max(timeScale.options().barSpacing / 2, 1);

      ctx.save();
      zones.forEach((zone) => this._drawZone(ctx, timeScale, zone, height, halfBar));
      verticals.forEach((line) => this._drawVertical(ctx, timeScale, line, height));
      ctx.restore();
    });
  }

  _drawZone(ctx, timeScale, zone, height, halfBar) {
    const start = timeScale.timeToCoordinate(zone.from);
    const end = timeScale.timeToCoordinate(zone.to);
    if (start === null || end === null) return;

    const left = start - halfBar;
    const width = Math.max(end - start + halfBar * 2, MIN_ZONE_WIDTH);

    ctx.fillStyle = zone.fill;
    ctx.fillRect(left, 0, width, height);

    ctx.setLineDash(DASH);
    ctx.strokeStyle = zone.stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, height);
    ctx.moveTo(left + width, 0);
    ctx.lineTo(left + width, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 구간이 좁으면 라벨끼리 겹쳐 오히려 읽기 나빠지므로 생략한다 (색은 범례로 안내)
    if (zone.label && this._fits(ctx, zone.label, width)) {
      this._drawLabel(ctx, zone.label, left + width / 2, LABEL_TOP, zone.labelColor, "center");
    }
  }

  _drawVertical(ctx, timeScale, line, height) {
    const x = timeScale.timeToCoordinate(line.time);
    if (x === null) return;

    ctx.setLineDash(DASH);
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    if (line.label) {
      this._drawLabel(ctx, line.label, x, height - 18, line.color, "center");
    }
  }

  /** 라벨 박스가 구간 폭 안에 들어가는지. */
  _fits(ctx, text, width) {
    ctx.font = LABEL_FONT;
    return ctx.measureText(text).width + LABEL_PADDING * 2 <= width;
  }

  /** 음영 위에서도 읽히도록 흰 배경 박스를 깔고 텍스트를 그린다. */
  _drawLabel(ctx, text, x, y, color, align) {
    ctx.font = LABEL_FONT;
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    const width = ctx.measureText(text).width;
    const boxLeft = align === "center" ? x - width / 2 - LABEL_PADDING : x - LABEL_PADDING;

    ctx.fillStyle = alpha(COLORS.SURFACE, 0.82);
    ctx.fillRect(boxLeft, y - 2, width + LABEL_PADDING * 2, 15);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}

class ZonePrimitive {
  constructor() {
    this._zones = [];
    this._verticals = [];
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
    this._renderer = new ZoneRenderer(this);
    // 캔들 뒤에 깔아야 봉을 가리지 않는다
    this._view = { renderer: () => this._renderer, zOrder: () => "bottom" };
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

  /**
   * 표시할 도형을 교체한다.
   *
   * @param {Array<{from:number,to:number,fill:string,stroke:string,label?:string,labelColor?:string}>} zones
   * @param {Array<{time:number,color:string,label?:string}>} verticals
   */
  setShapes(zones = [], verticals = []) {
    this._zones = zones;
    this._verticals = verticals;
    // 데이터 변경이 없어도 다시 그려야 하므로 명시적으로 재렌더를 요청한다
    if (this._requestUpdate) this._requestUpdate();
  }
}

export default ZonePrimitive;
