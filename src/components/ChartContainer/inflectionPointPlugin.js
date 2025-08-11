// inflectionPointPlugin.js
// Chart.js용 변곡점 표시 커스텀 플러그인

/**
 * 변곡점간 퍼센트 변화를 시각화하는 Chart.js 플러그인
 */
export const inflectionPointPlugin = {
  id: "inflectionPointPlugin",

  afterDraw(chart, args, options) {
    if (!options || !options.enabled) return;

    const {
      ctx,
      chartArea: { left, top, width, height },
      scales: { x, y },
    } = chart;

    const {
      inflectionPoints = [],
      percentageChanges = [],
      showConnectionLines = true,
      showPercentageLabels = true,
      lineStyle = {},
      labelStyle = {},
    } = options;

    if (inflectionPoints.length === 0 || percentageChanges.length === 0) {
      return;
    }

    ctx.save();

    // 기본 스타일 설정
    const defaultLineStyle = {
      upColor: "#ef4444", // 상승: 빨간색
      downColor: "#2196f3", // 하락: 파란색
      lineWidth: 2,
      lineDash: [8, 4],
      alpha: 0.7,
    };

    const defaultLabelStyle = {
      fontSize: 11,
      fontFamily: "Arial, sans-serif",
      fontWeight: "bold",
      textColor: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 4,
      padding: 6,
    };

    const finalLineStyle = { ...defaultLineStyle, ...lineStyle };
    const finalLabelStyle = { ...defaultLabelStyle, ...labelStyle };

    // 변곡점간 연결 라인과 퍼센트 라벨 그리기
    percentageChanges.forEach((change, index) => {
      try {
        // 좌표 계산
        const fromPixelX = x.getPixelForValue(change.fromIndex);
        const fromPixelY = y.getPixelForValue(change.fromPrice);
        const toPixelX = x.getPixelForValue(change.toIndex);
        const toPixelY = y.getPixelForValue(change.toPrice);

        // 차트 영역 내부에 있는지 확인
        if (
          fromPixelX < left ||
          fromPixelX > left + width ||
          toPixelX < left ||
          toPixelX > left + width
        ) {
          return;
        }

        // 연결 라인 그리기
        if (showConnectionLines) {
          ctx.beginPath();
          ctx.globalAlpha = finalLineStyle.alpha;
          ctx.strokeStyle =
            change.direction === "up" ? finalLineStyle.upColor : finalLineStyle.downColor;
          ctx.lineWidth = finalLineStyle.lineWidth;
          ctx.setLineDash(finalLineStyle.lineDash);

          ctx.moveTo(fromPixelX, fromPixelY);
          ctx.lineTo(toPixelX, toPixelY);
          ctx.stroke();
          ctx.setLineDash([]); // 실선으로 복원
        }

        // 퍼센트 변화 라벨 표시
        if (showPercentageLabels) {
          const midX = (fromPixelX + toPixelX) / 2;
          const midY = (fromPixelY + toPixelY) / 2;

          // 라벨 텍스트 준비 - 상승/하락 구분하여 표시
          const isRising = change.direction === "up";
          const directionIcon = isRising ? "▲" : "▼"; // 유니코드 삼각형 사용
          const changeText = `${Math.abs(change.changePercent).toFixed(1)}%`;

          // 아이콘과 텍스트 크기 측정
          ctx.font = `${finalLabelStyle.fontWeight} ${finalLabelStyle.fontSize}px ${finalLabelStyle.fontFamily}`;
          const iconMetrics = ctx.measureText(directionIcon);
          const textMetrics = ctx.measureText(changeText);
          const iconWidth = iconMetrics.width;
          const textWidth = textMetrics.width;
          const spacing = 4; // 아이콘과 텍스트 간격
          const totalWidth = iconWidth + spacing + textWidth;
          const textHeight = finalLabelStyle.fontSize;

          // 라벨 배경 그리기 - 상승/하락에 따라 색상 변경
          const labelPadding = finalLabelStyle.padding;
          const labelWidth = totalWidth + labelPadding * 2;
          const labelHeight = textHeight + labelPadding * 2;

          const labelX = midX - labelWidth / 2;
          const labelY = midY - labelHeight / 2 - 15; // 라인 위쪽으로 더 이동

          ctx.globalAlpha = 0.9;
          // 상승은 빨간색 배경, 하락은 파란색 배경
          ctx.fillStyle = isRising ? "rgba(239, 68, 68, 0.8)" : "rgba(33, 150, 243, 0.8)";

          // 둥근 모서리 사각형
          this.drawRoundedRect(
            ctx,
            labelX,
            labelY,
            labelWidth,
            labelHeight,
            finalLabelStyle.borderRadius
          );

          ctx.fill();

          // 아이콘 그리기 (상승/하락에 따라 색상 다르게)
          ctx.globalAlpha = 1;
          ctx.fillStyle = isRising ? "#ffffff" : "#2196f3"; // 상승은 흰색, 하락은 파란색
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          const iconX = midX - totalWidth / 2;
          ctx.fillText(directionIcon, iconX, labelY + labelHeight / 2);

          // 텍스트 그리기
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          const textX = iconX + iconWidth + spacing;
          ctx.fillText(changeText, textX, labelY + labelHeight / 2);
        }
      } catch (error) {
        console.warn("변곡점 플러그인 렌더링 오류:", error);
      }
    });

    ctx.restore();
  },

  /**
   * 둥근 모서리 사각형을 그리는 헬퍼 함수
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  },
};

/**
 * 변곡점 토글 버튼 생성을 위한 헬퍼 함수
 * @param {Function} onToggle - 토글 콜백 함수
 * @returns {Object} - 버튼 설정 객체
 */
export function createInflectionToggleButton(onToggle) {
  return {
    id: "inflectionToggle",
    text: "변곡점",
    icon: "📈",
    active: false,
    onClick: onToggle,
  };
}

/**
 * 변곡점 설정 패널 생성을 위한 헬퍼 함수
 * @param {Object} currentSettings - 현재 설정
 * @param {Function} onSettingsChange - 설정 변경 콜백
 * @returns {Object} - 설정 패널 구성
 */
export function createInflectionSettingsPanel(currentSettings, onSettingsChange) {
  return {
    title: "변곡점 설정",
    settings: [
      {
        type: "range",
        label: "감지 민감도",
        key: "windowSize",
        min: 3,
        max: 10,
        value: currentSettings.windowSize || 5,
        description: "작을수록 더 많은 변곡점을 감지합니다",
      },
      {
        type: "range",
        label: "최소 변동률 (%)",
        key: "minChangePercent",
        min: 1,
        max: 10,
        value: currentSettings.minChangePercent || 3,
        description: "이 값보다 작은 변동은 무시합니다",
      },
      {
        type: "toggle",
        label: "연결선 표시",
        key: "showConnectionLines",
        value: currentSettings.showConnectionLines !== false,
      },
      {
        type: "toggle",
        label: "퍼센트 라벨 표시",
        key: "showPercentageLabels",
        value: currentSettings.showPercentageLabels !== false,
      },
      {
        type: "toggle",
        label: "100% 상승 구간만",
        key: "enable100PercentRise",
        value: currentSettings.enable100PercentRise !== false,
        description: "100% 상승 구간 이후 변곡점만 표시",
      },
    ],
    onChange: onSettingsChange,
  };
}

/**
 * 변곡점 데이터를 Chart.js 툴팁에서 표시하기 위한 콜백
 * @param {Object} context - Chart.js 툴팁 컨텍스트
 * @returns {Array} - 툴팁 라벨 배열
 */
export function inflectionPointTooltipCallback(context) {
  const data = context.raw;
  const inflectionData = data.inflectionData;

  if (!inflectionData) return [];

  const typeText = inflectionData.type === "peak" ? "상승 변곡점" : "하락 변곡점";
  const priceKey = inflectionData.type === "peak" ? "high" : "low";
  const priceValue = inflectionData[priceKey];
  const icon = inflectionData.type === "peak" ? "🔺" : "🔻";

  return [
    `${icon} ${typeText}`,
    `날짜: ${new Date(inflectionData.date).toLocaleDateString("ko-KR")}`,
    `${inflectionData.type === "peak" ? "고가" : "저가"}: ${new Intl.NumberFormat("ko-KR").format(
      priceValue
    )}원`,
    `종가: ${new Intl.NumberFormat("ko-KR").format(inflectionData.price)}원`,
  ];
}

/**
 * 변곡점 플러그인 기본 옵션
 */
export const defaultInflectionOptions = {
  enabled: false,
  inflectionPoints: [],
  percentageChanges: [],
  showConnectionLines: true,
  showPercentageLabels: true,
  lineStyle: {
    upColor: "#ef4444",
    downColor: "#2196f3",
    lineWidth: 2,
    lineDash: [8, 4],
    alpha: 0.7,
  },
  labelStyle: {
    fontSize: 11,
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold",
    textColor: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 4,
    padding: 6,
  },
};

/**
 * 변곡점 분석 결과를 Chart.js 옵션에 적용하는 함수
 * @param {Object} chartOptions - 기존 차트 옵션
 * @param {Object} analysisResult - 변곡점 분석 결과
 * @param {Object} userSettings - 사용자 설정
 * @returns {Object} - 업데이트된 차트 옵션
 */
export function applyInflectionAnalysisToChart(chartOptions, analysisResult, userSettings = {}) {
  if (!analysisResult || !analysisResult.inflectionPoints) {
    return chartOptions;
  }

  const pluginOptions = {
    ...defaultInflectionOptions,
    enabled: true,
    inflectionPoints: analysisResult.inflectionPoints,
    percentageChanges: analysisResult.percentageChanges,
    ...userSettings,
  };

  return {
    ...chartOptions,
    plugins: {
      ...(chartOptions.plugins || {}),
      inflectionPointPlugin: pluginOptions,
    },
  };
}
