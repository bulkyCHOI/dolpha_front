import { useState, useEffect } from "react";
import { processInflectionPointsForHTF } from "utils/inflectionPointAnalysis";

/**
 * 변곡점 분석 및 관리를 위한 커스텀 훅
 * @param {Array} ohlcvData - OHLCV 데이터 배열
 * @param {string} chartType - 차트 타입 (선택사항)
 * @returns {Object} 변곡점 관련 상태와 핸들러들
 */
export const useInflectionPoints = (ohlcvData = [], chartType = "default") => {
  // 변곡점 관련 상태
  const [showInflectionPoints, setShowInflectionPoints] = useState(false);
  const [inflectionAnalysisResult, setInflectionAnalysisResult] = useState(null);
  const [inflectionSettings, setInflectionSettings] = useState({
    windowSize: 5,
    minChangePercent: 3,
    enable100PercentRise: true,
    showConnectionLines: true,
    showPercentageLabels: true,
  });

  // 변곡점 분석 실행
  useEffect(() => {
    if (ohlcvData && ohlcvData.length > 0 && showInflectionPoints) {
      const analysisResult = processInflectionPointsForHTF(ohlcvData, inflectionSettings);

      if (analysisResult) {
        setInflectionAnalysisResult(analysisResult);
      } else {
        setInflectionAnalysisResult(null);
      }
    } else {
      setInflectionAnalysisResult(null);
    }
  }, [ohlcvData, showInflectionPoints, inflectionSettings]);

  // 변곡점 토글 핸들러
  const toggleInflectionPoints = () => {
    setShowInflectionPoints((prev) => !prev);
  };

  // 변곡점 설정 변경 핸들러
  const updateInflectionSettings = (newSettings) => {
    setInflectionSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  // 변곡점 기능 리셋
  const resetInflectionPoints = () => {
    setShowInflectionPoints(false);
    setInflectionAnalysisResult(null);
  };

  // 변곡점 기능 활성화 여부 확인
  const isInflectionPointsAvailable = ohlcvData && ohlcvData.length > 0;

  return {
    // 상태
    showInflectionPoints,
    inflectionAnalysisResult,
    inflectionSettings,
    isInflectionPointsAvailable,

    // 핸들러
    toggleInflectionPoints,
    updateInflectionSettings,
    resetInflectionPoints,

    // 수동 상태 변경 (필요시)
    setShowInflectionPoints,
    setInflectionAnalysisResult,
  };
};

export default useInflectionPoints;
