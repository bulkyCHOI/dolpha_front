import { useState, useEffect, useCallback } from "react";

/**
 * 즐겨찾기 데이터 관리 훅
 * @param {Function} authenticatedFetch - 인증된 fetch 함수
 * @param {Function} showSnackbar - 알림 표시 함수
 * @returns {object} 즐겨찾기 관련 상태와 함수들
 */
export const useFavoritesData = (authenticatedFetch, showSnackbar) => {
  // 즐겨찾기 목록 상태
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  
  // 검색 관련 상태
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 로딩 및 에러 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 선택된 종목 관련 상태
  const [selectedStock, setSelectedStock] = useState(null);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [indexData, setIndexData] = useState([]);
  const [indexOhlcvData, setIndexOhlcvData] = useState([]);
  const [selectedIndexCode, setSelectedIndexCode] = useState("");
  const [analysisData, setAnalysisData] = useState(null);

  const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

  /**
   * 즐겨찾기 목록 로드
   */
  const loadFavoriteStocks = useCallback(async () => {
    if (!authenticatedFetch) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/favorites`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFavoriteStocks(data.favorites || []);
        } else {
          setError(data.message || "즐겨찾기 목록을 불러올 수 없습니다.");
        }
      } else {
        setError("즐겨찾기 목록 조회에 실패했습니다.");
      }
    } catch (err) {
      setError(`즐겨찾기 목록 로드 중 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, apiBaseUrl]);

  /**
   * 종목 검색
   * @param {string} query - 검색어
   */
  const searchStocks = useCallback(async (query) => {
    if (!authenticatedFetch || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/search/stocks?q=${encodeURIComponent(query.trim())}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 검색 결과에 즐겨찾기 여부 추가
          const resultsWithFavorites = data.stocks.map(stock => ({
            ...stock,
            is_favorite: favoriteStocks.some(fav => fav.stock_code === stock.code)
          }));
          setSearchResults(resultsWithFavorites);
        } else {
          setError(data.message || "검색에 실패했습니다.");
          setSearchResults([]);
        }
      } else {
        setError("종목 검색에 실패했습니다.");
        setSearchResults([]);
      }
    } catch (err) {
      setError(`검색 중 오류: ${err.message}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, apiBaseUrl, favoriteStocks]);

  /**
   * 검색 결과 초기화
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery("");
  }, []);

  /**
   * 즐겨찾기 토글 (추가/제거)
   * @param {object} stock - 종목 정보
   */
  const toggleFavorite = useCallback(async (stock) => {
    if (!authenticatedFetch) {
      showSnackbar("로그인이 필요합니다.", "warning");
      return;
    }
    
    try {
      const stockCode = stock.code || stock.stock_code;
      const isFavorite = stock.is_favorite || favoriteStocks.some(fav => fav.stock_code === stockCode);
      
      if (isFavorite) {
        // 즐겨찾기 제거
        const response = await authenticatedFetch(
          `${apiBaseUrl}/api/mypage/favorites/${stockCode}`,
          { method: "DELETE" }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 즐겨찾기 목록 다시 로드 (서버와 동기화)
            await loadFavoriteStocks();
            
            showSnackbar(`${stock.name}이(가) 즐겨찾기에서 제거되었습니다.`, "success");
          } else {
            throw new Error(data.message || "즐겨찾기 제거에 실패했습니다.");
          }
        } else {
          throw new Error("즐겨찾기 제거 요청에 실패했습니다.");
        }
      } else {
        // 즐겨찾기 추가
        const response = await authenticatedFetch(
          `${apiBaseUrl}/api/mypage/favorites`,
          {
            method: "POST",
            body: JSON.stringify({
              stock_code: stockCode,
              stock_name: stock.name || stock.stock_name,
              memo: ""
            })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 즐겨찾기 목록 다시 로드 (서버와 동기화)
            await loadFavoriteStocks();
            
            showSnackbar(`${stock.name}이(가) 즐겨찾기에 추가되었습니다.`, "success");
          } else {
            throw new Error(data.message || "즐겨찾기 추가에 실패했습니다.");
          }
        } else {
          throw new Error("즐겨찾기 추가 요청에 실패했습니다.");
        }
      }
    } catch (err) {
      showSnackbar(`즐겨찾기 설정 실패: ${err.message}`, "error");
      throw err;
    }
  }, [authenticatedFetch, apiBaseUrl, favoriteStocks, searchResults, showSnackbar]);

  /**
   * 지수 데이터 로드
   */
  const loadIndexData = useCallback(async (stockCode) => {
    try {
      if (!stockCode) return;
      
      // 지수 목록 로드
      const indexResponse = await fetch(`${apiBaseUrl}/api/find_stock_index?code=${stockCode}&limit=10`);
      if (indexResponse.ok) {
        const indexResult = await indexResponse.json();
        const data = indexResult.data || [];
        setIndexData(data);
        
        if (data.length > 0) {
          const indexCode = data[0].code;
          setSelectedIndexCode(indexCode);
          
          // 선택된 지수의 OHLCV 데이터 로드
          const indexOhlcvResponse = await fetch(
            `${apiBaseUrl}/api/find_index_ohlcv?code=${indexCode}&limit=150`
          );
          if (indexOhlcvResponse.ok) {
            const indexOhlcvResult = await indexOhlcvResponse.json();
            const sortedIndexData = (indexOhlcvResult.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            setIndexOhlcvData(sortedIndexData);
          }
        } else {
          setSelectedIndexCode("");
          setIndexOhlcvData([]);
        }
      }
    } catch (err) {
      console.warn("지수 데이터 로드 실패:", err.message);
      setIndexData([]);
      setSelectedIndexCode("");
      setIndexOhlcvData([]);
    }
  }, [apiBaseUrl]);

  /**
   * 종목 클릭 핸들러 (차트 데이터 로드)
   * @param {object} stock - 선택된 종목
   */
  const handleStockClick = useCallback(async (stock) => {
    try {
      setSelectedStock(stock);
      setLoading(true);
      
      // 초기화 - 이전 데이터 클리어
      setOhlcvData([]);
      setAnalysisData(null);
      setIndexOhlcvData([]);
      
      // OHLCV 데이터 로드
      const stockCode = stock.code || stock.stock_code;
      if (!stockCode) {
        throw new Error("종목 코드가 없습니다.");
      }
      
      const ohlcvResponse = await fetch(
        `${apiBaseUrl}/api/find_stock_ohlcv?code=${stockCode}&limit=150`
      );
      
      if (ohlcvResponse.ok) {
        const ohlcvResult = await ohlcvResponse.json();
        const sortedData = (ohlcvResult.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        setOhlcvData(sortedData);
      } else {
        setOhlcvData([]);
        showSnackbar(`OHLCV 데이터 로드 실패: ${stock.name}`, "warning");
      }
      
      // 분석 데이터 로드
      const analysisResponse = await fetch(
        `${apiBaseUrl}/api/find_stock_analysis?code=${stockCode}&limit=150`
      );
      
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        const sortedAnalysisData = (analysisResult.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        setAnalysisData(sortedAnalysisData);
      } else {
        setAnalysisData([]);
        showSnackbar(`분석 데이터 로드 실패: ${stock.name}`, "warning");
      }
      
      // 지수 데이터 로드
      await loadIndexData(stockCode);
      
    } catch (err) {
      console.error("차트 데이터 로드 에러:", err);
      setOhlcvData([]);
      setAnalysisData(null);
      setIndexOhlcvData([]);
      showSnackbar(`차트 데이터 로드 실패: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, showSnackbar, loadIndexData]);

  /**
   * 지수 변경 핸들러
   * @param {string} indexCode - 새로운 지수 코드
   */
  const handleIndexChange = useCallback(async (indexCode) => {
    setSelectedIndexCode(indexCode);
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/find_index_ohlcv?code=${indexCode}&limit=150`
      );
      if (response.ok) {
        const result = await response.json();
        const sortedData = (result.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        setIndexOhlcvData(sortedData);
      }
    } catch (err) {
      console.warn("지수 데이터 변경 실패:", err.message);
    }
  }, [apiBaseUrl]);

  // 컴포넌트 마운트 시 즐겨찾기 목록 로드
  useEffect(() => {
    if (authenticatedFetch) {
      loadFavoriteStocks();
    }
  }, [loadFavoriteStocks]);

  // 즐겨찾기 목록이 변경되면 검색 결과의 즐겨찾기 상태 업데이트
  useEffect(() => {
    if (searchResults.length > 0) {
      setSearchResults(prev => 
        prev.map(stock => ({
          ...stock,
          is_favorite: favoriteStocks.some(fav => fav.stock_code === stock.code)
        }))
      );
    }
  }, [favoriteStocks]);

  // 지수 데이터는 종목 선택 시에만 로드됩니다

  return {
    // 데이터 상태
    favoriteStocks,
    searchResults,
    searchQuery,
    loading,
    error,
    selectedStock,
    ohlcvData,
    indexData,
    indexOhlcvData,
    selectedIndexCode,
    analysisData,
    
    // 함수들
    loadFavoriteStocks,
    searchStocks,
    clearSearch,
    toggleFavorite,
    handleStockClick,
    loadIndexData,
    handleIndexChange,
    setSelectedStock,
    setSearchQuery,
  };
};