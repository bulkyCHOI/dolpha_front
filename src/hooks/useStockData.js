import { useState, useEffect } from "react";

export const useStockData = () => {
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

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/api/find_stock_inMTT?format=json`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        const data = result.data || [];
        setStockData(data);
        if (data.length > 0) {
          setSelectedStock(data[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

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
  };
};
