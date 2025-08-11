// inflectionPointAnalysis.js
// HTF 차트 변곡점 분석을 위한 유틸리티 함수들

/**
 * 100% 이상 상승 구간을 찾는 함수
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @returns {Object|null} - 상승 구간 정보 또는 null
 */
export function find100PercentRiseSegment(ohlcvData) {
  if (!ohlcvData || ohlcvData.length === 0) return null;

  let minPrice = Number.MAX_VALUE;
  let minIndex = 0;
  let riseStartIndex = -1;
  let riseEndIndex = -1;

  for (let i = 0; i < ohlcvData.length; i++) {
    const currentPrice = ohlcvData[i].close;

    // 새로운 최저점 발견
    if (currentPrice < minPrice) {
      minPrice = currentPrice;
      minIndex = i;
      riseStartIndex = -1; // 리셋
    }

    // 100% 상승 확인
    const risePercentage = ((currentPrice - minPrice) / minPrice) * 100;
    if (risePercentage >= 100 && riseStartIndex === -1) {
      riseStartIndex = minIndex;
      riseEndIndex = i;

      return {
        startIndex: riseStartIndex,
        endIndex: riseEndIndex,
        startDate: ohlcvData[riseStartIndex].date,
        endDate: ohlcvData[riseEndIndex].date,
        minPrice: minPrice,
        peakPrice: currentPrice,
        risePercentage: risePercentage,
      };
    }
  }

  return null; // 100% 상승 구간 없음
}

/**
 * 지역 최고점 확인 함수
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {number} index - 확인할 인덱스
 * @param {number} windowSize - 윈도우 크기
 * @returns {boolean}
 */
export function isLocalMaximum(ohlcvData, index, windowSize) {
  if (index < windowSize || index >= ohlcvData.length - windowSize) {
    return false;
  }

  const currentPrice = ohlcvData[index].high; // 고가 기준

  // 앞뒤 windowSize만큼 확인
  for (let i = index - windowSize; i <= index + windowSize; i++) {
    if (i === index) continue;

    if (ohlcvData[i].high >= currentPrice) {
      return false; // 더 높은 가격이 있으면 지역최고점 아님
    }
  }
  return true;
}

/**
 * 지역 최저점 확인 함수
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {number} index - 확인할 인덱스
 * @param {number} windowSize - 윈도우 크기
 * @returns {boolean}
 */
export function isLocalMinimum(ohlcvData, index, windowSize) {
  if (index < windowSize || index >= ohlcvData.length - windowSize) {
    return false;
  }

  const currentPrice = ohlcvData[index].low; // 저가 기준

  // 앞뒤 windowSize만큼 확인
  for (let i = index - windowSize; i <= index + windowSize; i++) {
    if (i === index) continue;

    if (ohlcvData[i].low <= currentPrice) {
      return false; // 더 낮은 가격이 있으면 지역최저점 아님
    }
  }
  return true;
}

/**
 * 의미있는 변곡점만 필터링하고 상승/하락이 번갈아 나타나도록 하는 함수
 * @param {Array} inflectionPoints - 변곡점 배열
 * @param {number} minChangePercent - 최소 변동률 (%)
 * @returns {Array} - 필터링된 변곡점 배열
 */
export function filterSignificantInflections(inflectionPoints, minChangePercent) {
  if (inflectionPoints.length <= 1) return inflectionPoints;

  const filtered = [];
  let lastType = null;

  for (let i = 0; i < inflectionPoints.length; i++) {
    const curr = inflectionPoints[i];

    // 첫 번째 변곡점은 무조건 추가
    if (filtered.length === 0) {
      filtered.push(curr);
      lastType = curr.type;
      continue;
    }

    // 이전 변곡점과 타입이 다른 경우만 고려 (상승/하락 번갈아)
    if (curr.type !== lastType) {
      const prev = filtered[filtered.length - 1];

      // 고점은 high 가격, 저점은 low 가격으로 변동률 계산
      const prevPrice = prev.type === "peak" ? prev.high : prev.low;
      const currPrice = curr.type === "peak" ? curr.high : curr.low;
      const changePercent = Math.abs(((currPrice - prevPrice) / prevPrice) * 100);

      // 최소 변동률 이상인 경우만 추가
      if (changePercent >= minChangePercent) {
        filtered.push(curr);
        lastType = curr.type;
      }
    }
  }

  return filtered;
}

/**
 * 변곡점을 찾는 메인 함수
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {number} startIndex - 시작 인덱스 (100% 상승 구간 이후)
 * @param {number} windowSize - 윈도우 크기 (기본값: 5)
 * @param {number} minChangePercent - 최소 변동률 (기본값: 3%)
 * @returns {Array} - 변곡점 배열
 */
export function findInflectionPoints(ohlcvData, startIndex, windowSize = 5, minChangePercent = 3) {
  if (!ohlcvData || ohlcvData.length === 0 || startIndex < 0) return [];

  const inflectionPoints = [];

  // startIndex 이후부터 변곡점 찾기
  for (let i = Math.max(startIndex, windowSize); i < ohlcvData.length - windowSize; i++) {
    const currentData = ohlcvData[i];

    // 지역 최고점 확인
    const isLocalMax = isLocalMaximum(ohlcvData, i, windowSize);
    // 지역 최저점 확인
    const isLocalMin = isLocalMinimum(ohlcvData, i, windowSize);

    if (isLocalMax || isLocalMin) {
      inflectionPoints.push({
        index: i,
        date: currentData.date,
        price: currentData.close,
        high: currentData.high,
        low: currentData.low,
        type: isLocalMax ? "peak" : "trough",
      });
    }
  }

  // 의미있는 변곡점만 필터링
  return filterSignificantInflections(inflectionPoints, minChangePercent);
}

/**
 * 변곡점간 퍼센트 변화를 계산하는 함수
 * @param {Array} inflectionPoints - 변곡점 배열
 * @returns {Array} - 퍼센트 변화 배열
 */
export function calculatePercentageChanges(inflectionPoints) {
  if (inflectionPoints.length <= 1) return [];

  const changes = [];

  for (let i = 1; i < inflectionPoints.length; i++) {
    const prev = inflectionPoints[i - 1];
    const curr = inflectionPoints[i];

    // 고점은 high 가격, 저점은 low 가격 사용
    const prevPrice = prev.type === "peak" ? prev.high : prev.low;
    const currPrice = curr.type === "peak" ? curr.high : curr.low;

    const changePercent = ((currPrice - prevPrice) / prevPrice) * 100;
    const direction = changePercent > 0 ? "up" : "down";

    changes.push({
      fromIndex: prev.index,
      toIndex: curr.index,
      fromDate: prev.date,
      toDate: curr.date,
      fromPrice: prevPrice,
      toPrice: currPrice,
      changePercent: changePercent,
      direction: direction,
      magnitude: Math.abs(changePercent),
    });
  }

  return changes;
}

/**
 * 변곡점 분석을 위한 메인 처리 함수
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {Object} options - 옵션
 * @returns {Object|null} - 분석 결과
 */
export function processInflectionPointsForHTF(ohlcvData, options = {}) {
  const { windowSize = 5, minChangePercent = 3, enable100PercentRise = true } = options;

  try {
    let startIndex = 0;
    let riseSegment = null;

    // 1. 100% 상승 구간 찾기 (옵션에 따라)
    if (enable100PercentRise) {
      riseSegment = find100PercentRiseSegment(ohlcvData);
      if (!riseSegment) {
        console.log("HTF: 100% 상승 구간을 찾을 수 없습니다.");
        return null;
      }
      startIndex = riseSegment.endIndex;
      console.log(`HTF: 100% 상승 구간 발견 (${riseSegment.startIndex} ~ ${riseSegment.endIndex})`);
    }

    // 2. 변곡점 감지
    const inflectionPoints = findInflectionPoints(
      ohlcvData,
      startIndex,
      windowSize,
      minChangePercent
    );

    if (inflectionPoints.length === 0) {
      console.log("HTF: 변곡점을 찾을 수 없습니다.");
      return null;
    }

    console.log(`HTF: 찾은 변곡점 개수: ${inflectionPoints.length}`);

    // 3. 퍼센트 변화 계산
    const percentageChanges = calculatePercentageChanges(inflectionPoints);

    return {
      riseSegment,
      inflectionPoints,
      percentageChanges,
      summary: {
        riseSegmentExists: !!riseSegment,
        inflectionPointCount: inflectionPoints.length,
        averageChange:
          percentageChanges.length > 0
            ? percentageChanges.reduce((sum, change) => sum + Math.abs(change.changePercent), 0) /
              percentageChanges.length
            : 0,
      },
    };
  } catch (error) {
    console.error("HTF 변곡점 처리 중 오류:", error);
    return null;
  }
}

/**
 * Chart.js용 변곡점 데이터셋 생성 (오프셋 적용)
 * @param {Array} inflectionPoints - 변곡점 배열
 * @param {Array} ohlcvData - 전체 OHLCV 데이터 (오프셋 계산용)
 * @returns {Object} - Chart.js 데이터셋
 */
export function createInflectionPointDataset(inflectionPoints, ohlcvData) {
  if (!inflectionPoints || inflectionPoints.length === 0) return null;

  // 전체 가격 범위를 구해서 적절한 오프셋 계산
  let priceRange = 0;
  if (ohlcvData && ohlcvData.length > 0) {
    const prices = ohlcvData.flatMap((item) => [item.high, item.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    priceRange = maxPrice - minPrice;
  }

  // 오프셋: 가격 범위의 1.5% (상승점은 위로, 하락점은 아래로)
  const offsetPercent = 0.015;

  return {
    label: "변곡점",
    type: "scatter",
    data: inflectionPoints.map((point) => {
      const basePrice = point.type === "peak" ? point.high : point.low;
      const offset = priceRange * offsetPercent;
      const offsetPrice = point.type === "peak" ? basePrice + offset : basePrice - offset;

      return {
        x: point.index,
        y: offsetPrice,
        inflectionData: point,
        originalPrice: basePrice, // 원래 가격 저장
      };
    }),
    backgroundColor: inflectionPoints.map((point) =>
      point.type === "peak" ? "rgba(239, 68, 68, 0.9)" : "rgba(33, 150, 243, 0.9)"
    ),
    borderColor: inflectionPoints.map((point) => (point.type === "peak" ? "#ef4444" : "#2196f3")),
    borderWidth: 2,
    pointRadius: 8,
    pointHoverRadius: 10,
    pointStyle: inflectionPoints.map((point) => (point.type === "peak" ? "triangle" : "triangle")),
    order: 0, // 최상위 표시
    showLine: false,
    pointRotation: inflectionPoints.map((point) => (point.type === "peak" ? 0 : 180)), // 하락점은 역삼각형
  };
}

/**
 * 100% 상승 구간 하이라이트용 데이터셋 생성
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {Object} riseSegment - 상승 구간 정보
 * @returns {Object} - Chart.js 데이터셋
 */
export function createRiseSegmentDataset(ohlcvData, riseSegment) {
  if (!riseSegment || !ohlcvData) return null;

  const data = [];
  for (let i = riseSegment.startIndex; i <= riseSegment.endIndex; i++) {
    if (ohlcvData[i]) {
      data.push({
        x: i,
        y: ohlcvData[i].high * 1.03, // 고점보다 약간 위에 표시
      });
    }
  }

  return {
    label: "100% 상승구간",
    type: "line",
    data: data,
    borderColor: "rgba(76, 175, 80, 0.6)",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 3,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0.1,
    fill: "origin",
    order: 9,
  };
}
