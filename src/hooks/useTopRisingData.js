import { useState, useEffect, useCallback } from "react";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export const useTopRisingData = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [indexData, setIndexData] = useState([]);
  const [indexOhlcvData, setIndexOhlcvData] = useState([]);
  const [selectedIndexCode, setSelectedIndexCode] = useState("");
  const [analysisData, setAnalysisData] = useState([]);

  // 상승률 TOP 50 종목 데이터 조회
  const fetchTopRisingStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/api/find_stock_top_rising`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === "OK" && result.data) {
        setStockData(result.data);

        // 첫 번째 종목 자동 선택
        if (result.data.length > 0) {
          const firstStock = result.data[0];
          setSelectedStock(firstStock);

          // 선택된 종목의 상세 데이터 로딩
          await Promise.all([
            fetchOHLCVData(firstStock.code),
            fetchStockIndexData(firstStock.code),
            fetchStockAnalysisData(firstStock.code),
          ]);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching top rising stocks:", err);
      setError(err.message);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // OHLCV 데이터 조회
  const fetchOHLCVData = useCallback(async (code) => {
    try {
      const response = await fetch(`${BASE_URL}/api/find_stock_ohlcv?code=${code}&limit=150`);
      const result = await response.json();
      if (result.status === "OK") {
        setOhlcvData(result.data || []);
      } else {
        setOhlcvData([]);
      }
    } catch (err) {
      console.error("Error fetching OHLCV data:", err);
      setOhlcvData([]);
    }
  }, []);

  // 종목 인덱스 데이터 조회
  const fetchStockIndexData = useCallback(async (code) => {
    try {
      const response = await fetch(`${BASE_URL}/api/find_stock_index?code=${code}`);
      const result = await response.json();
      if (result.status === "OK" && result.data && result.data.length > 0) {
        setIndexData(result.data);
        const firstIndex = result.data[0];
        setSelectedIndexCode(firstIndex.code);
        await fetchIndexOHLCVData(firstIndex.code);
      } else {
        setIndexData([]);
        setIndexOhlcvData([]);
        setSelectedIndexCode("");
      }
    } catch (err) {
      console.error("Error fetching stock index data:", err);
      setIndexData([]);
      setIndexOhlcvData([]);
      setSelectedIndexCode("");
    }
  }, []);

  // 인덱스 OHLCV 데이터 조회
  const fetchIndexOHLCVData = useCallback(async (indexCode) => {
    try {
      const response = await fetch(`${BASE_URL}/api/find_index_ohlcv?code=${indexCode}&limit=150`);
      const result = await response.json();
      if (result.status === "OK") {
        setIndexOhlcvData(result.data || []);
      } else {
        setIndexOhlcvData([]);
      }
    } catch (err) {
      console.error("Error fetching index OHLCV data:", err);
      setIndexOhlcvData([]);
    }
  }, []);

  // 종목 분석 데이터 조회
  const fetchStockAnalysisData = useCallback(async (code) => {
    try {
      const response = await fetch(`${BASE_URL}/api/find_stock_analysis?code=${code}&limit=150`);
      const result = await response.json();
      if (result.status === "OK") {
        setAnalysisData(result.data || []);
      } else {
        setAnalysisData([]);
      }
    } catch (err) {
      console.error("Error fetching stock analysis data:", err);
      setAnalysisData([]);
    }
  }, []);

  // 종목 클릭 핸들러
  const handleStockClick = useCallback(
    async (stock) => {
      if (selectedStock && selectedStock.code === stock.code) {
        return; // 같은 종목 클릭 시 아무 작업 안 함
      }

      setSelectedStock(stock);

      // 선택된 종목의 상세 데이터 로딩
      await Promise.all([
        fetchOHLCVData(stock.code),
        fetchStockIndexData(stock.code),
        fetchStockAnalysisData(stock.code),
      ]);
    },
    [selectedStock, fetchOHLCVData, fetchStockIndexData, fetchStockAnalysisData]
  );

  // 인덱스 변경 핸들러
  const handleIndexChange = useCallback(
    async (indexCode) => {
      setSelectedIndexCode(indexCode);
      await fetchIndexOHLCVData(indexCode);
    },
    [fetchIndexOHLCVData]
  );

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    fetchTopRisingStocks();
  }, [fetchTopRisingStocks]);

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
    refreshData: fetchTopRisingStocks,
  };
};