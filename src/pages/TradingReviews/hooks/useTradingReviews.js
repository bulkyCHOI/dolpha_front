/**
 * 매매복기 API 통신 훅
 */

import { useState, useCallback } from "react";

const API_BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

function useTradingReviews() {
  const [tradingReviews, setTradingReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    stock_name: "",
    trading_mode: "all",
    final_status: "all", 
    profit_filter: "all",
    start_date: null,
    end_date: null,
    page: 1,
    page_size: 20
  });

  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 0, // MUI TablePagination은 0부터 시작
    page_size: 20,
    total: 0
  });

  // 인증 토큰 가져오기
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  // API 헤더 생성
  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }, [getAuthToken]);

  // API 응답 처리 헬퍼
  const handleResponse = async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // 매매복기 목록 조회 (Autobot 데이터)
  const fetchTradingReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Autobot 데이터를 가져오기 (인증 불필요)
      const response = await fetch(
        `${API_BASE_URL}/api/autobot/trading-summary-data`,
        { 
          method: 'GET',
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const result = await handleResponse(response);
      
      if (result && result.success && result.data) {
        // 클라이언트 사이드 필터링 적용
        let filteredData = result.data;

        // 종목명/종목코드 필터링
        if (filters.stock_name) {
          filteredData = filteredData.filter(item => 
            item.stock_name.includes(filters.stock_name) || 
            item.stock_code.includes(filters.stock_name)
          );
        }

        // 거래 모드 필터링
        if (filters.trading_mode && filters.trading_mode !== "all") {
          filteredData = filteredData.filter(item => item.trading_mode === filters.trading_mode);
        }

        // 최종 상태 필터링
        if (filters.final_status && filters.final_status !== "all") {
          filteredData = filteredData.filter(item => item.final_status === filters.final_status);
        }

        // 수익/손실 필터링
        if (filters.profit_filter === "positive") {
          filteredData = filteredData.filter(item => item.total_profit_loss > 0);
        } else if (filters.profit_filter === "negative") {
          filteredData = filteredData.filter(item => item.total_profit_loss < 0);
        }

        // 날짜 필터링
        if (filters.start_date) {
          const startDate = filters.start_date.toISOString().split('T')[0];
          filteredData = filteredData.filter(item => {
            if (!item.first_entry_date) return false;
            const itemDate = new Date(item.first_entry_date).toISOString().split('T')[0];
            return itemDate >= startDate;
          });
        }

        if (filters.end_date) {
          const endDate = filters.end_date.toISOString().split('T')[0];
          filteredData = filteredData.filter(item => {
            if (!item.first_entry_date) return false;
            const itemDate = new Date(item.first_entry_date).toISOString().split('T')[0];
            return itemDate <= endDate;
          });
        }

        // 페이지네이션 적용
        const startIndex = pagination.page * pagination.page_size;
        const endIndex = startIndex + pagination.page_size;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setTradingReviews(paginatedData);
        setPagination(prev => ({
          ...prev,
          total: filteredData.length
        }));
      }
    } catch (err) {
      console.error("매매복기 목록 조회 실패:", err);
      setError(err.message || "데이터를 불러올 수 없습니다.");
      setTradingReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.page_size]);

  // 매매복기 통계 조회 (클라이언트 사이드 계산)
  const fetchStats = useCallback(async () => {
    try {
      setError(null);

      // Autobot 데이터를 가져와서 통계 계산
      const response = await fetch(
        `${API_BASE_URL}/api/autobot/trading-summary-data`,
        { 
          method: 'GET',
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const result = await handleResponse(response);
      
      if (result && result.success && result.data) {
        const data = result.data;
        
        // 통계 계산
        const total_count = data.length;
        const closed_count = data.filter(item => item.final_status === 'CLOSED').length;
        const holding_count = data.filter(item => item.final_status === 'HOLDING').length;
        
        const total_profit_loss = data.reduce((sum, item) => sum + item.total_profit_loss, 0);
        const avg_profit_loss = total_count > 0 ? total_profit_loss / total_count : 0;
        
        const profitable_count = data.filter(item => item.total_profit_loss > 0).length;
        const win_rate = total_count > 0 ? (profitable_count / total_count * 100) : 0;
        
        setStats({
          total_count,
          closed_count,
          holding_count,
          total_profit_loss,
          avg_profit_loss,
          win_rate,
          profitable_count
        });
      }
    } catch (err) {
      console.error("통계 조회 실패:", err);
      setError(err.message || "통계를 불러올 수 없습니다.");
    }
  }, []);

  // 매매복기 상세 조회
  const fetchTradingReview = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/trading-summary/${id}`,
        { 
          method: 'GET',
          headers: getHeaders() 
        }
      );

      return await handleResponse(response);
    } catch (err) {
      console.error("매매복기 상세 조회 실패:", err);
      setError(err.message || "상세 정보를 불러올 수 없습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // 매매복기 수정
  const updateTradingReview = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/trading-summary/${id}`,
        { 
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await handleResponse(response);

      // 목록 갱신
      await fetchTradingReviews();
      
      return result;
    } catch (err) {
      console.error("매매복기 수정 실패:", err);
      setError(err.message || "수정에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, fetchTradingReviews]);

  // 매매복기 삭제
  const deleteTradingReview = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/trading-summary/${id}`,
        { 
          method: 'DELETE',
          headers: getHeaders()
        }
      );

      await handleResponse(response);

      // 목록 갱신
      await fetchTradingReviews();
      
      return true;
    } catch (err) {
      console.error("매매복기 삭제 실패:", err);
      setError(err.message || "삭제에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, fetchTradingReviews]);

  // 매매복기 생성 (Autobot용)
  const createTradingReview = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/trading-summary`,
        { 
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await handleResponse(response);

      // 목록 갱신
      await fetchTradingReviews();
      
      return result;
    } catch (err) {
      console.error("매매복기 생성 실패:", err);
      setError(err.message || "생성에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, fetchTradingReviews]);

  return {
    // 데이터
    tradingReviews,
    stats,
    loading,
    error,
    
    // 상태
    filters,
    setFilters,
    pagination,
    setPagination,
    
    // API 함수들
    fetchTradingReviews,
    fetchStats,
    fetchTradingReview,
    updateTradingReview,
    deleteTradingReview,
    createTradingReview
  };
}

export default useTradingReviews;