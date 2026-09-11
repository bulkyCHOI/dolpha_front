import { useState, useEffect, useCallback } from "react";

const BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

const EMPTY = {
  date: "",
  stock_code: "",
  stock_name: "",
  theme_name: "",
  bars: [],
  decisions: [],
  exits: [],
  overnight: [],
  params: {},
};

/**
 * 종목별 1분봉 + 진입 판정 좌표 훅.
 *
 * 탭을 눌러 종목을 바꿀 때마다 해당 종목만 조회한다(하루치 전 종목 분봉은 무겁다).
 *
 * @param {string} date        조회 날짜 (YYYY-MM-DD)
 * @param {string} stockCode   6자리 종목코드. 비어 있으면 조회하지 않음
 * @param {Function} authFetch 인증 fetch. null이면 비활성
 */
export const useThemeEntryChart = (date, stockCode, authFetch = null) => {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChart = useCallback(async () => {
    if (!authFetch || !date || !stockCode) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setError(null);
      const response = await authFetch(
        `${BASE_URL}/api/theme-surge/entry-chart?date=${date}&code=${encodeURIComponent(stockCode)}`
      );
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "판정 차트를 불러오지 못했습니다.");
      }
      setData(result.data || EMPTY);
    } catch (err) {
      setError(err.message);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [date, stockCode, authFetch]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return { chart: data, loading, error, refresh: fetchChart };
};
