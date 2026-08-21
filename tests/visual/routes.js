/**
 * 디자인 리팩터링 회귀 검증 대상 화면.
 *
 * PUBLIC_ROUTES: 누구나 접근 가능. layout-invariants.spec.js 가 검사한다.
 * AUTH_ROUTES:   로그인 필요.
 *   - 비로그인 상태에서 로그인 화면으로 가는지는 layout-invariants 가,
 *   - 로그인 상태의 실제 화면은 auth-routes.spec.js 가 검사한다
 *     (`npm run test:visual:login` 으로 세션을 1회 저장해야 동작).
 */
const PUBLIC_ROUTES = [
  { path: "/", name: "mtt", label: "MTT", hasChart: true },
  { path: "/htf", name: "htf", label: "HTF 패턴", hasChart: true },
  { path: "/weekly-high", name: "weekly-high", label: "52주 신고가", hasChart: true },
  { path: "/fifty-day-high", name: "fifty-day-high", label: "50일 신고가", hasChart: true },
  { path: "/top-rising", name: "top-rising", label: "상승률 TOP 50", hasChart: true },
  { path: "/theme-surge", name: "theme-surge", label: "급등테마주", hasChart: false },
  { path: "/market-info", name: "market-info", label: "세계 주요 지수", hasChart: false },
  { path: "/issue-info", name: "issue-info", label: "이슈 정보", hasChart: false },
  { path: "/daily-news-clipping", name: "daily-news", label: "일간뉴스클리핑", hasChart: false },
];

const AUTH_ROUTES = [
  { path: "/trading-configs", name: "trading-configs", label: "설정 목록" },
  { path: "/trading-reviews", name: "trading-reviews", label: "매매복기" },
  { path: "/favorites", name: "favorites", label: "즐겨찾기" },
  { path: "/pages/my-page", name: "my-page", label: "마이페이지" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

module.exports = { PUBLIC_ROUTES, AUTH_ROUTES, VIEWPORTS };
