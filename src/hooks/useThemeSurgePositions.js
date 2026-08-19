import { useState, useEffect, useCallback } from "react";

const BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

const EMPTY = {
  positions: [],
  watching: [],
  summary: {
    position_count: 0,
    watching_count: 0,
    total_profit_loss: 0,
    total_profit_rate: 0,
  },
};

/**
 * 급등테마주 자동매매 현황(보유 포지션 + 대기 후보) 훅.
 *
 * 로그인하지 않았으면 조회하지 않고 빈 상태를 유지한다.
 *
 * @param {string} date            조회 날짜 (YYYY-MM-DD)
 * @param {Function} authFetch     인증 fetch. null이면 비활성
 * @param {number} refreshInterval 자동 갱신 주기(ms). 0이면 사용 안 함
 */
export const useThemeSurgePositions = (date, authFetch = null, refreshInterval = 0) => {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(authFetch));
  const [error, setError] = useState(null);

  const fetchPositions = useCallback(async () => {
    if (!authFetch || !date) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const response = await authFetch(`${BASE_URL}/api/theme-surge/positions?date=${date}`);
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "자동매매 현황을 불러오지 못했습니다.");
      }
      setData(result.data || EMPTY);
    } catch (err) {
      setError(err.message);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [date, authFetch]);

  useEffect(() => {
    setLoading(Boolean(authFetch));
    fetchPositions();
  }, [fetchPositions, authFetch]);

  useEffect(() => {
    if (!refreshInterval || !authFetch) return undefined;
    const timer = setInterval(fetchPositions, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval, authFetch, fetchPositions]);

  return { ...data, loading, error, refresh: fetchPositions };
};
