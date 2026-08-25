import { useCallback, useEffect, useState } from "react";

import { useAuth } from "contexts/AuthContext";
import { EMPTY_FILTERS, toFilterValues, toSettingsPayload } from "constants/screenerFilters";

const getApiBaseUrl = () => window.REACT_APP_API_BASE_URL || "http://localhost:8000";
const ENDPOINT = "/api/mypage/screener-filters";

/**
 * 마이페이지에 저장된 재무 필터 기본값을 다룬다.
 *
 * 비로그인 사용자는 서버에 저장할 곳이 없으므로 항상 빈 값(전체 표시)으로 동작한다.
 */
export default function useScreenerFilterDefaults() {
  const { isAuthenticated, authenticatedFetch } = useAuth();
  const [defaults, setDefaults] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  // 서버 응답을 받기 전인지 구분한다(로그인 상태에서만 의미가 있다).
  const [isLoaded, setIsLoaded] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setDefaults(EMPTY_FILTERS);
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await authenticatedFetch(`${getApiBaseUrl()}${ENDPOINT}`);
        if (!response.ok) throw new Error(`기본값 조회 실패 (${response.status})`);
        const result = await response.json();
        if (cancelled) return;
        setDefaults(toFilterValues(result?.data));
      } catch (error) {
        // 기본값을 못 읽어도 화면은 전체 목록으로 정상 동작해야 한다.
        if (!cancelled) {
          console.warn("재무 필터 기본값 로드 실패:", error.message);
          setDefaults(EMPTY_FILTERS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsLoaded(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authenticatedFetch]);

  /** 기본값을 저장한다. 성공하면 { success: true }, 실패하면 { success: false, error } */
  const saveDefaults = useCallback(
    async (filters) => {
      if (!isAuthenticated) {
        return { success: false, error: "로그인이 필요합니다." };
      }
      try {
        const response = await authenticatedFetch(`${getApiBaseUrl()}${ENDPOINT}`, {
          method: "POST",
          body: JSON.stringify(toSettingsPayload(filters)),
        });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          return { success: false, error: result?.error || "저장에 실패했습니다." };
        }
        setDefaults(toFilterValues(toSettingsPayload(filters)));
        return { success: true, message: result.message };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [isAuthenticated, authenticatedFetch]
  );

  return { defaults, loading, isLoaded, saveDefaults };
}
