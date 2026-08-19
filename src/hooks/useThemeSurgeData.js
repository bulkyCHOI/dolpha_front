import { useState, useEffect, useCallback } from "react";

const BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

/** YYYY-MM-DD (KST 기준 오늘) */
export const todayKST = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(
    kst.getDate()
  ).padStart(2, "0")}`;
};

const EMPTY_TIMELINE = {
  date: "",
  slots: [],
  themes: [],
  signals: [],
  summary: {
    theme_count: 0,
    surge_theme_count: 0,
    signal_count: 0,
    entry_count: 0,
    scanned_slots: 0,
  },
};

/**
 * 급등테마주 타임라인 데이터 훅.
 *
 * @param {string} date            조회 날짜 (YYYY-MM-DD)
 * @param {Function} authFetch     인증 fetch (있으면 내 진입 시그널까지 함께 조회)
 * @param {number} refreshInterval 자동 갱신 주기(ms). 0이면 사용 안 함
 */
export const useThemeSurgeData = (date, authFetch = null, refreshInterval = 0) => {
  const [timeline, setTimeline] = useState(EMPTY_TIMELINE);
  const [liveThemes, setLiveThemes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const request = useCallback(
    async (path) => {
      const url = `${BASE_URL}/api${path}`;
      const response = authFetch ? await authFetch(url) : await fetch(url);
      if (!response.ok) {
        throw new Error(`요청 실패 (HTTP ${response.status})`);
      }
      const result = await response.json();
      if (result.status !== "OK") {
        throw new Error(result.message || "응답 형식이 올바르지 않습니다.");
      }
      return result.data;
    },
    [authFetch]
  );

  const fetchTimeline = useCallback(async () => {
    if (!date) return;
    try {
      setError(null);
      const [timelineData, candidateData] = await Promise.all([
        request(`/theme-surge/timeline?date=${date}`),
        request(`/theme-surge/candidates?date=${date}`),
      ]);
      setTimeline(timelineData || EMPTY_TIMELINE);
      setCandidates(candidateData || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      setTimeline(EMPTY_TIMELINE);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [date, request]);

  const fetchLive = useCallback(async () => {
    try {
      setLiveThemes((await request("/theme-surge/live?limit=15")) || []);
    } catch (err) {
      // 실시간 랭킹은 보조 정보이므로 타임라인 조회 실패로 확대하지 않는다
      setLiveThemes([]);
    }
  }, [request]);

  const triggerScan = useCallback(async () => {
    if (!authFetch) {
      throw new Error("로그인이 필요합니다.");
    }
    const response = await authFetch(`${BASE_URL}/api/theme-surge/scan`, { method: "POST" });
    const result = await response.json();
    if (!response.ok || result.status !== "OK") {
      throw new Error(result.message || "스캔 실행에 실패했습니다.");
    }
    await Promise.all([fetchTimeline(), fetchLive()]);
    return result.data;
  }, [authFetch, fetchTimeline, fetchLive]);

  useEffect(() => {
    setLoading(true);
    fetchTimeline();
    fetchLive();
  }, [fetchTimeline, fetchLive]);

  useEffect(() => {
    if (!refreshInterval) return undefined;
    const timer = setInterval(() => {
      fetchTimeline();
      fetchLive();
    }, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval, fetchTimeline, fetchLive]);

  return {
    timeline,
    liveThemes,
    candidates,
    loading,
    error,
    lastUpdated,
    refresh: fetchTimeline,
    triggerScan,
  };
};
