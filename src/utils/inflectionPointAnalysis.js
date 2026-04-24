// inflectionPointAnalysis.js
// VCP (Volatility Contraction Pattern) 분석 유틸리티
// Mark Minervini의 VCP 패턴 감지: Stage 2 상승 후 수축하는 스윙(T1→T2→T3→T4) 감지

/**
 * 100% 이상 상승 구간을 찾는 함수 (Stage 2 uptrend 확인)
 */
export function find100PercentRiseSegment(ohlcvData) {
  if (!ohlcvData || ohlcvData.length === 0) return null;

  // 전체 데이터에서 최고 고가를 먼저 찾는다
  let peakPrice = 0;
  let peakIndex = 0;
  for (let i = 0; i < ohlcvData.length; i++) {
    if (ohlcvData[i].high > peakPrice) {
      peakPrice = ohlcvData[i].high;
      peakIndex = i;
    }
  }

  // 최고 고가 이전 구간에서 최저 저가를 찾는다
  let minPrice = Number.MAX_VALUE;
  let minIndex = 0;
  for (let i = 0; i <= peakIndex; i++) {
    if (ohlcvData[i].low > 0 && ohlcvData[i].low < minPrice) {
      minPrice = ohlcvData[i].low;
      minIndex = i;
    }
  }

  const risePercentage = ((peakPrice - minPrice) / minPrice) * 100;
  if (risePercentage < 100) return null;

  return {
    startIndex: minIndex,
    endIndex: peakIndex,
    startDate: ohlcvData[minIndex].date,
    endDate: ohlcvData[peakIndex].date,
    minPrice,
    peakPrice,
    risePercentage,
  };
}

/**
 * 지역 최고점 확인 함수
 */
export function isLocalMaximum(ohlcvData, index, windowSize) {
  if (index < windowSize || index >= ohlcvData.length - windowSize) return false;
  const currentPrice = ohlcvData[index].high;
  for (let i = index - windowSize; i <= index + windowSize; i++) {
    if (i === index) continue;
    if (ohlcvData[i].high >= currentPrice) return false;
  }
  return true;
}

/**
 * 지역 최저점 확인 함수
 */
export function isLocalMinimum(ohlcvData, index, windowSize) {
  if (index < windowSize || index >= ohlcvData.length - windowSize) return false;
  const currentPrice = ohlcvData[index].low;
  if (currentPrice <= 0) return false; // 거래 정지일(low=0) 제외
  for (let i = index - windowSize; i <= index + windowSize; i++) {
    if (i === index) continue;
    if (ohlcvData[i].low <= 0) continue; // 거래 정지일 이웃은 비교에서 제외
    if (ohlcvData[i].low <= currentPrice) return false;
  }
  return true;
}

/**
 * 연속된 같은 타입 스윙을 병합: 가장 극단적인 값만 유지
 */
function filterAlternatingSwings(swings) {
  if (swings.length === 0) return [];

  const filtered = [swings[0]];

  for (let i = 1; i < swings.length; i++) {
    const curr = swings[i];
    const prev = filtered[filtered.length - 1];

    if (curr.type === prev.type) {
      if (curr.type === "peak" && curr.high > prev.high) {
        filtered[filtered.length - 1] = curr;
      } else if (curr.type === "trough" && curr.low < prev.low) {
        filtered[filtered.length - 1] = curr;
      }
    } else {
      filtered.push(curr);
    }
  }

  return filtered;
}

/**
 * Stage 2 peak 이후 VCP 베이스 내 스윙(고점/저점) 감지
 */
function findVCPSwings(ohlcvData, startIndex, windowSize) {
  const rawSwings = [];

  for (let i = Math.max(startIndex, windowSize); i < ohlcvData.length - windowSize; i++) {
    const d = ohlcvData[i];
    if (isLocalMaximum(ohlcvData, i, windowSize)) {
      rawSwings.push({
        index: i,
        type: "peak",
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume || 0,
        date: d.date,
      });
    } else if (isLocalMinimum(ohlcvData, i, windowSize) && d.low > 0) {
      rawSwings.push({
        index: i,
        type: "trough",
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume || 0,
        date: d.date,
      });
    }
  }

  return filterAlternatingSwings(rawSwings);
}

/**
 * 스윙 배열에서 T 수축 구간을 감지
 * 각 T = 스윙고점 → 스윙저점 (하락 구간)
 */
function detectTContractions(swings) {
  const tContractions = [];

  for (let i = 0; i < swings.length - 1; i++) {
    const from = swings[i];
    const to = swings[i + 1];

    if (from.type === "peak" && to.type === "trough") {
      const depth = ((from.high - to.low) / from.high) * 100;
      const tNumber = tContractions.length + 1;
      const prevDepth = tNumber > 1 ? tContractions[tNumber - 2].depth : null;
      const isContracting = prevDepth === null || depth < prevDepth;

      tContractions.push({
        tNumber,
        label: `T${tNumber}`,
        swingHigh: from,
        swingLow: to,
        depth,
        isContracting,
      });
    }
  }

  return tContractions;
}

/**
 * 피벗 포인트 계산: 베이스 내 최초 스윙 고점 (저항선)
 */
function findPivotPoint(swings) {
  const firstPeak = swings.find((s) => s.type === "peak");
  if (!firstPeak) return null;

  return {
    index: firstPeak.index,
    price: firstPeak.high,
    date: firstPeak.date,
  };
}

/**
 * T 구간별 평균 거래량 분석 (VCP는 우측으로 갈수록 거래량 감소)
 */
function analyzeVolumeTrend(ohlcvData, tContractions) {
  if (tContractions.length === 0) return { isDecreasing: null, tVolumeAverages: [] };

  const tVolumeAverages = tContractions.map((t) => {
    const start = t.swingHigh.index;
    const end = t.swingLow.index;
    let total = 0;
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (ohlcvData[i] && ohlcvData[i].volume) {
        total += ohlcvData[i].volume;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  });

  const isDecreasing = tVolumeAverages.every(
    (vol, i) => i === 0 || vol < tVolumeAverages[i - 1]
  );

  return { isDecreasing, tVolumeAverages };
}

/**
 * VCP 패턴 분석 메인 함수
 * @param {Array} ohlcvData - OHLCV 데이터
 * @param {Object} options - 옵션
 * @returns {Object|null} - VCP 분석 결과
 */
export function processVCPPattern(ohlcvData, options = {}) {
  const { windowSize = 5, enable100PercentRise = true } = options;

  try {
    let startIndex = 0;
    let riseSegment = null;

    if (enable100PercentRise) {
      riseSegment = find100PercentRiseSegment(ohlcvData);
      if (!riseSegment) {
        console.log("VCP: 100% 상승 구간(Stage 2)을 찾을 수 없습니다.");
        return null;
      }
      startIndex = riseSegment.endIndex;
    }

    const stage2Peak = riseSegment
      ? {
          index: riseSegment.endIndex,
          price: ohlcvData[riseSegment.endIndex].high,
          date: ohlcvData[riseSegment.endIndex].date,
        }
      : null;

    const swings = findVCPSwings(ohlcvData, startIndex, windowSize);

    if (swings.length < 2) {
      console.log("VCP: 베이스 내 스윙 포인트가 부족합니다.");
      return null;
    }

    const tContractions = detectTContractions(swings);

    if (tContractions.length === 0) {
      console.log("VCP: T 수축 구간을 찾을 수 없습니다.");
      return null;
    }

    const pivotPoint = findPivotPoint(swings);
    const volumeTrend = analyzeVolumeTrend(ohlcvData, tContractions);
    const isValidVCP =
      tContractions.length >= 2 &&
      tContractions.every((t, i) => i === 0 || t.depth < tContractions[i - 1].depth);

    console.log(`VCP: T 수축 ${tContractions.length}개 감지, 유효 VCP: ${isValidVCP}`);

    return {
      riseSegment,
      stage2Peak,
      vcpSwings: swings,
      tContractions,
      pivotPoint,
      volumeTrend,
      isValidVCP,
      // 하위 호환성 유지
      inflectionPoints: swings,
      percentageChanges: [],
      summary: {
        riseSegmentExists: !!riseSegment,
        tCount: tContractions.length,
        isValidVCP,
        inflectionPointCount: swings.length,
        averageChange:
          tContractions.length > 0
            ? tContractions.reduce((s, t) => s + t.depth, 0) / tContractions.length
            : 0,
      },
    };
  } catch (error) {
    console.error("VCP 패턴 처리 중 오류:", error);
    return null;
  }
}

// 하위 호환 alias
export const processInflectionPointsForHTF = processVCPPattern;

/**
 * VCP 스윙 포인트용 Chart.js scatter 데이터셋 생성
 */
export function createInflectionPointDataset(inflectionPoints, ohlcvData) {
  if (!inflectionPoints || inflectionPoints.length === 0) return null;

  let priceRange = 0;
  if (ohlcvData && ohlcvData.length > 0) {
    const prices = ohlcvData.flatMap((item) => [item.high, item.low]);
    priceRange = Math.max(...prices) - Math.min(...prices);
  }

  const offsetPercent = 0.015;

  return {
    label: "VCP 스윙",
    type: "scatter",
    data: inflectionPoints.map((point) => {
      const basePrice = point.type === "peak" ? point.high : point.low;
      const offset = priceRange * offsetPercent;
      return {
        x: point.index,
        y: point.type === "peak" ? basePrice + offset : basePrice - offset,
        inflectionData: point,
        originalPrice: basePrice,
      };
    }),
    backgroundColor: inflectionPoints.map((p) =>
      p.type === "peak" ? "rgba(239, 68, 68, 0.9)" : "rgba(33, 150, 243, 0.9)"
    ),
    borderColor: inflectionPoints.map((p) => (p.type === "peak" ? "#ef4444" : "#2196f3")),
    borderWidth: 2,
    pointRadius: 7,
    pointHoverRadius: 9,
    pointStyle: "triangle",
    pointRotation: inflectionPoints.map((p) => (p.type === "peak" ? 0 : 180)),
    order: 0,
    showLine: false,
  };
}

/**
 * 100% 상승 구간 하이라이트 데이터셋
 */
export function createRiseSegmentDataset(ohlcvData, riseSegment) {
  if (!riseSegment || !ohlcvData) return null;

  const data = [];
  for (let i = riseSegment.startIndex; i <= riseSegment.endIndex; i++) {
    if (ohlcvData[i]) {
      data.push({ x: i, y: ohlcvData[i].high * 1.03 });
    }
  }

  return {
    label: "Stage 2 상승구간",
    type: "line",
    data,
    borderColor: "rgba(76, 175, 80, 0.6)",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 3,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0.1,
    fill: "origin",
    order: 9,
  };
}
