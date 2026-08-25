/**
 * 종목 목록 화면(MTT · 52주 신고가)의 재무 필터 정의.
 *
 * - field: API 응답의 종목 데이터 필드명
 * - settingKey: 마이페이지 기본값 API(/api/mypage/screener-filters)의 필드명
 * 각 값은 "입력값 % 이상"만 통과시키며, 비어 있으면 조건에서 제외된다.
 */
export const FINANCIAL_FILTER_FIELDS = [
  { field: "매출증가율", label: "매출증가율", settingKey: "min_revenue_growth" },
  { field: "영업이익증가율", label: "영업이익증가율", settingKey: "min_op_profit_growth" },
  { field: "영업이익율", label: "영업이익률", settingKey: "min_op_margin" },
];

/** 모든 조건이 비어 있는(= 전체 표시) 필터 값 */
export const EMPTY_FILTERS = FINANCIAL_FILTER_FIELDS.reduce(
  (acc, { field }) => ({ ...acc, [field]: "" }),
  {}
);

/** 마이페이지 기본값 응답을 필터 입력값 형태로 변환한다. null 은 빈 문자열이 된다. */
export const toFilterValues = (settings) =>
  FINANCIAL_FILTER_FIELDS.reduce((acc, { field, settingKey }) => {
    const value = settings?.[settingKey];
    return { ...acc, [field]: value === null || value === undefined ? "" : String(value) };
  }, {});

/** 필터 입력값을 마이페이지 기본값 저장 형식으로 변환한다. 빈 값은 null(미적용). */
export const toSettingsPayload = (filters) =>
  FINANCIAL_FILTER_FIELDS.reduce((acc, { field, settingKey }) => {
    const raw = filters?.[field];
    if (raw === "" || raw === null || raw === undefined) return { ...acc, [settingKey]: null };
    const parsed = Number(raw);
    return { ...acc, [settingKey]: Number.isNaN(parsed) ? null : parsed };
  }, {});

/** 하나라도 값이 채워져 있으면 true */
export const hasAnyFilterValue = (filters) =>
  Object.values(filters || {}).some(
    (value) => value !== "" && value !== null && value !== undefined
  );
