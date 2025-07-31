import { useState } from "react";

/**
 * 재무제표 데이터 관리 훅
 */
export const useFinancialData = () => {
  const [openFinancialModal, setOpenFinancialModal] = useState(false);
  const [financialData, setFinancialData] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState(null);

  // 재무제표 데이터 가져오기
  const fetchFinancialData = async (stockCode) => {
    if (!stockCode) {
      setFinancialData([]);
      setFinancialError(null);
      return [];
    }

    try {
      setFinancialLoading(true);
      setFinancialError(null);
      
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiBaseUrl}/api/find_stock_financial?code=${stockCode}&limit=85`
      );
      
      if (!response.ok) {
        // HTTP 상태 코드에 따른 다른 처리
        if (response.status === 404) {
          setFinancialData([]);
          setFinancialError("해당 종목의 재무제표 데이터를 찾을 수 없습니다.");
          return [];
        } else if (response.status >= 500) {
          setFinancialData([]);
          setFinancialError("서버 오류로 인해 재무제표 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.");
          return [];
        } else {
          setFinancialData([]);
          setFinancialError("재무제표 데이터를 가져오는 중 오류가 발생했습니다.");
          return [];
        }
      }
      
      const result = await response.json();
      const data = result.data || [];

      if (data.length === 0) {
        setFinancialData([]);
        setFinancialError("해당 종목의 재무제표 데이터가 없습니다.");
        return [];
      }

      setFinancialData(data);
      setFinancialError(null);
      return data;
    } catch (err) {
      console.error("재무제표 데이터 로딩 실패:", err);
      setFinancialData([]);
      
      // 네트워크 오류와 기타 오류 구분
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setFinancialError("네트워크 연결을 확인하고 다시 시도해주세요.");
      } else {
        setFinancialError("재무제표 데이터를 불러오는 중 예상치 못한 오류가 발생했습니다.");
      }
      
      // 에러를 throw하지 않고 graceful하게 처리
      return [];
    } finally {
      setFinancialLoading(false);
    }
  };

  // 재무제표 모달 열기
  const handleOpenFinancialModal = async (selectedStock) => {
    setOpenFinancialModal(true);
    setFinancialError(null); // 모달 열 때 이전 에러 상태 초기화
    
    if (selectedStock && selectedStock.code) {
      await fetchFinancialData(selectedStock.code);
    }
  };

  // 재무제표 모달 닫기
  const handleCloseFinancialModal = () => {
    setOpenFinancialModal(false);
    setFinancialError(null); // 모달 닫을 때 에러 상태 초기화
  };

  return {
    // State
    openFinancialModal,
    financialData,
    financialLoading,
    financialError,

    // Actions
    fetchFinancialData,
    handleOpenFinancialModal,
    handleCloseFinancialModal,
  };
};
