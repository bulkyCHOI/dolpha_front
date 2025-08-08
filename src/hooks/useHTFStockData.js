import { useState, useEffect } from "react";

export const useHTFStockData = (filters = {}) => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [indexData, setIndexData] = useState([]);
  const [indexOhlcvData, setIndexOhlcvData] = useState([]);
  const [selectedIndexCode, setSelectedIndexCode] = useState("");
  const [analysisData, setAnalysisData] = useState([]);

  const fetchOHLCVData = async (stockCode) => {
    if (!stockCode) return [];

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiBaseUrl}/api/find_stock_ohlcv?code=${stockCode}&limit=150`
      );
      if (!response.ok) {
        throw new Error("OHLCV 데이터를 가져올 수 없습니다");
      }
      const result = await response.json();
      const data = result.data || [];

      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setOhlcvData(sortedData);
      return sortedData;
    } catch (err) {
      setOhlcvData([]);
      return [];
    }
  };

  const fetchStockIndexData = async (stockCode) => {
    if (!stockCode) return [];

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/api/find_stock_index?code=${stockCode}&limit=10`);
      if (!response.ok) {
        throw new Error("인덱스 데이터를 가져올 수 없습니다");
      }
      const result = await response.json();
      const data = result.data || [];
      setIndexData(data);

      if (data.length > 0) {
        setSelectedIndexCode(data[0].code);
        await fetchIndexOHLCVData(data[0].code);
      } else {
        setSelectedIndexCode("");
        setIndexOhlcvData([]);
      }

      return data;
    } catch (err) {
      setIndexData([]);
      setSelectedIndexCode("");
      return [];
    }
  };

  const fetchIndexOHLCVData = async (indexCode) => {
    if (!indexCode) return [];

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiBaseUrl}/api/find_index_ohlcv?code=${indexCode}&limit=150`
      );
      if (!response.ok) {
        throw new Error("인덱스 OHLCV 데이터를 가져올 수 없습니다");
      }
      const result = await response.json();
      const data = result.data || [];

      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setIndexOhlcvData(sortedData);
      return sortedData;
    } catch (err) {
      setIndexOhlcvData([]);
      return [];
    }
  };

  const fetchStockAnalysisData = async (stockCode) => {
    if (!stockCode) return [];

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiBaseUrl}/api/find_stock_analysis?code=${stockCode}&limit=150`
      );
      if (!response.ok) {
        throw new Error("주식 분석 데이터를 가져올 수 없습니다");
      }
      const result = await response.json();
      const data = result.data || [];

      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setAnalysisData(sortedData);
      return sortedData;
    } catch (err) {
      setAnalysisData([]);
      return [];
    }
  };

  const fetchHTFStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      
      // 쿼리 매개변수 구성
      const queryParams = new URLSearchParams();
      if (filters.minGainPercent) queryParams.append('min_gain_percent', filters.minGainPercent);
      if (filters.maxPullbackPercent) queryParams.append('max_pullback_percent', filters.maxPullbackPercent);
      if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sort_order', filters.sortOrder);
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      
      const url = `${apiBaseUrl}/api/htf-stocks/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("HTF 종목 데이터를 가져올 수 없습니다");
      }
      
      const result = await response.json();
      const data = result.data || [];
      
      setStockData(data);
      
      // 첫 번째 종목을 기본 선택으로 설정
      if (data.length > 0 && !selectedStock) {
        setSelectedStock(data[0]);
      }
    } catch (err) {
      setError(err.message);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIndexChange = async (event) => {
    const indexCode = event.target.value;
    setSelectedIndexCode(indexCode);
    if (indexCode) {
      await fetchIndexOHLCVData(indexCode);
    } else {
      setIndexOhlcvData([]);
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  // 초기 HTF 데이터 로드
  useEffect(() => {
    fetchHTFStocks();
  }, []); // filters 변경 시에는 수동으로 fetchHTFStocks 호출

  // 선택된 종목의 상세 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (selectedStock && selectedStock.code) {
        await Promise.all([
          fetchOHLCVData(selectedStock.code),
          fetchStockIndexData(selectedStock.code),
          fetchStockAnalysisData(selectedStock.code),
        ]);
      }
    };

    loadData();
  }, [selectedStock]);

  return {
    stockData,
    loading,
    error,
    selectedStock,
    ohlcvData,
    indexData,
    indexOhlcvData,
    selectedIndexCode,
    analysisData,
    handleStockClick,
    handleIndexChange,
    setSelectedStock,
    fetchHTFStocks, // 필터 변경 시 수동으로 호출할 수 있도록 export
  };
};