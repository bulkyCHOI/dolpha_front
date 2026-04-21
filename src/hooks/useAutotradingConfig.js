import { useState, useRef, useCallback } from "react";

const CACHE_TTL_MS = 60_000; // 1분 캐시

/**
 * 자동매매 설정 관리 훅
 */
export const useAutotradingConfig = (authenticatedFetch, showSnackbar, strategyType = "mtt") => {
  const [autotradingList, setAutotradingList] = useState([]);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  const cacheRef = useRef({ data: null, timestamp: 0 });

  // 자동매매 목록 가져오기 (1분 캐시 적용)
  const fetchAutotradingList = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && cacheRef.current.data && now - cacheRef.current.timestamp < CACHE_TTL_MS) {
      setAutotradingList(cacheRef.current.data);
      return;
    }

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/mypage/trading-configs?strategy_type=${strategyType}`
      );

      if (response.ok) {
        const configs = await response.json();

        const configsWithFlag = configs.map((config) => ({
          ...config,
          is_from_summary: false,
        }));

        cacheRef.current = { data: configsWithFlag, timestamp: Date.now() };
        setAutotradingList(configsWithFlag);

        if (autotradingList.length === 0) {
          showSnackbar(`${configsWithFlag.length}개의 자동매매 설정을 불러왔습니다.`, "success");
        }
      } else {
        setAutotradingList([]);
        showSnackbar("자동매매 목록 조회에 실패했습니다.", "error");
      }
    } catch (error) {
      setAutotradingList([]);
      showSnackbar(`1차 데이터 로딩 오류: ${error.message}`, "error");
    }
  }, [authenticatedFetch, showSnackbar, strategyType]);

  // 통합된 주식 목록 생성 (기존 주식 + 자동매매 설정된 주식)
  const getUnifiedStockList = (stockData) => {
    // 자동매매가 설정된 주식들을 주식 목록 형태로 변환
    const configuredStocks = autotradingList.map((config) => ({
      code: config.stock_code,
      name: config.stock_name,
      isConfigured: true, // 자동매매 설정 여부 플래그
    }));

    // 선택된 주식이 기존 목록에 없고 자동매매도 설정되지 않은 경우 추가
    if (
      stockData.selectedStock &&
      !autotradingList.find((config) => config.stock_code === stockData.selectedStock.code)
    ) {
      configuredStocks.push({
        ...stockData.selectedStock,
        isConfigured: false,
      });
    }

    // 기존 주식 데이터에 자동매매 설정 플래그 추가
    const enrichedStockData = stockData.stockData.map((stock) => ({
      ...stock,
      isConfigured: autotradingList.some((config) => config.stock_code === stock.code),
    }));

    return {
      configuredStocks,
      enrichedStockData,
    };
  };

  // 자동매매 설정 삭제
  const deleteAutotradingConfig = async (stockCode, stockName) => {
    console.log(`[FRONTEND] 삭제 요청 시작: stockCode=${stockCode}, stockName=${stockName}`);

    // 삭제 확인 알림
    const isConfirmed = window.confirm(
      `${stockName}(${stockCode})의 자동매매 설정을 삭제하시겠습니까?`
    );
    if (!isConfirmed) {
      console.log(`[FRONTEND] 사용자가 삭제 취소함`);
      return { success: false, cancelled: true };
    }

    try {
      const configToDelete = autotradingList.find((config) => config.stock_code === stockCode);
      console.log(`[FRONTEND] 삭제 대상 설정:`, configToDelete);

      if (configToDelete) {
        const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

        // stock_code와 strategy_type을 사용하여 삭제
        const deleteUrl = `${apiBaseUrl}/api/mypage/trading-configs/stock/${stockCode}?strategy_type=${strategyType}`;
        console.log(`[FRONTEND] 삭제 요청 URL: ${deleteUrl}`);

        const response = await authenticatedFetch(deleteUrl, {
          method: "DELETE",
        });

        console.log(`[FRONTEND] 서버 응답: status=${response.status}, ok=${response.ok}`);

        if (response.ok) {
          // 204 No Content나 빈 응답인 경우 처리
          let result = {};
          try {
            const text = await response.text();
            console.log(`[FRONTEND] 서버 응답 텍스트:`, text);
            if (text) {
              result = JSON.parse(text);
              console.log(`[FRONTEND] 파싱된 응답 데이터:`, result);
            }
          } catch (parseError) {
            // JSON 파싱 실패 시에도 HTTP 응답이 ok면 성공으로 간주
            console.log("[FRONTEND] Response parsing failed, but HTTP status is ok:", parseError);
          }

          // HTTP 응답이 ok면 성공으로 처리 (result.success 체크 제거)
          console.log(`[FRONTEND] 프론트엔드 상태에서 삭제 처리`);
          cacheRef.current = { data: null, timestamp: 0 }; // 캐시 무효화
          setAutotradingList((prev) => prev.filter((item) => item.stock_code !== stockCode));
          showSnackbar(`${stockName}(${stockCode}) 자동매매 설정이 삭제되었습니다.`, "success");

          return { success: true, deletedStock: { code: stockCode, name: stockName } };
        } else {
          let errorResult = {};
          try {
            errorResult = await response.json();
            console.log(`[FRONTEND] 에러 응답 데이터:`, errorResult);
          } catch (parseError) {
            console.log("[FRONTEND] Error response parsing failed:", parseError);
          }
          throw new Error(
            errorResult.message || `HTTP ${response.status}: 삭제 요청에 실패했습니다.`
          );
        }
      } else {
        console.log(`[FRONTEND] 삭제할 설정을 찾을 수 없음: stockCode=${stockCode}`);
        showSnackbar("삭제할 설정을 찾을 수 없습니다.", "warning");
        return { success: false };
      }
    } catch (error) {
      console.error("[FRONTEND] 삭제 에러:", error);
      showSnackbar(`삭제 실패: ${error.message}`, "error");
      return { success: false };
    }
  };

  // 자동매매 상태 토글 (프론트엔드 상태만 변경)
  const toggleAutotradingConfig = (stockCode, stockName, currentStatus) => {
    setAutotradingList((prev) =>
      prev.map((item) =>
        item.stock_code === stockCode ? { ...item, is_active: !currentStatus } : item
      )
    );

    showSnackbar(
      `${stockName}(${stockCode}) 자동매매 상태가 변경되었습니다. 저장 버튼을 눌러 적용하세요.`,
      "info"
    );
  };

  // 아코디언 변경 핸들러
  const handleAccordionChange = (stockCode) => {
    setExpandedAccordion(stockCode);
  };

  return {
    // State
    autotradingList,
    expandedAccordion,

    // Actions
    fetchAutotradingList,
    getUnifiedStockList,
    deleteAutotradingConfig,
    toggleAutotradingConfig,
    handleAccordionChange,
    setAutotradingList,
    setExpandedAccordion,
  };
};
