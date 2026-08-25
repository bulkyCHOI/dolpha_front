import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EMPTY_FILTERS,
  FINANCIAL_FILTER_FIELDS,
  hasAnyFilterValue,
} from "constants/screenerFilters";
import useScreenerFilterDefaults from "./useScreenerFilterDefaults";

// 컴포넌트들이 기존 경로로 계속 가져다 쓸 수 있도록 재노출한다.
export { FINANCIAL_FILTER_FIELDS };

const isPassed = (value, threshold) => {
  if (threshold === "" || threshold === null || threshold === undefined) return true;
  const min = Number(threshold);
  if (Number.isNaN(min)) return true;
  return Number(value ?? 0) >= min;
};

/**
 * 종목 목록에 재무 조건 필터를 적용한다.
 * 입력값이 비어 있으면 해당 조건은 무시한다.
 *
 * 마이페이지에 저장한 기본값이 있으면 첫 진입 시 자동으로 채워진다.
 * 사용자가 값을 직접 바꾼 뒤에는 기본값이 다시 덮어쓰지 않는다.
 */
export default function useFinancialFilter(stocks) {
  const { defaults, isLoaded } = useScreenerFilterDefaults();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // 사용자가 이 화면에서 필터를 직접 건드렸는지 여부
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (!isLoaded || isTouched) return;
    setFilters(defaults);
  }, [isLoaded, isTouched, defaults]);

  const setFilter = useCallback((field, value) => {
    setIsTouched(true);
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    // 초기화는 '전체 보기'다. 기본값이 곧바로 다시 채워지면 전체를 볼 수 없다.
    setIsTouched(true);
    setFilters(EMPTY_FILTERS);
  }, []);

  const isActive = useMemo(() => hasAnyFilterValue(filters), [filters]);
  const hasDefaults = useMemo(() => hasAnyFilterValue(defaults), [defaults]);

  const filteredStocks = useMemo(() => {
    if (!Array.isArray(stocks)) return [];
    if (!isActive) return stocks;
    return stocks.filter((stock) =>
      Object.entries(filters).every(([field, threshold]) => isPassed(stock?.[field], threshold))
    );
  }, [stocks, filters, isActive]);

  return { filters, setFilter, resetFilters, filteredStocks, isActive, hasDefaults };
}
