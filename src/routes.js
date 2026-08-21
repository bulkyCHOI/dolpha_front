/**
 * 전역 라우트 정의.
 *
 * 여기에 추가한 항목은 상단 네비게이션에도 자동으로 노출된다.
 *
 * - name: 네비게이션에 표시할 이름
 * - icon: 네비게이션 아이콘
 * - route: react-router 경로
 * - href: 외부 링크
 * - component: 렌더할 컴포넌트
 * - collapse: 하위 항목 (중첩 가능)
 * - columns / rowsPerColumn: 드롭다운을 여러 열로 배치할 때 사용
 */

// @mui material components
import Icon from "@mui/material/Icon";

// Pages
import SignIn from "pages/SignIn";
import MyPage from "pages/MyPage";
import Logout from "pages/Logout";
import MTT from "pages/MTT";
import HTF from "pages/HTF";
import WeeklyHigh from "pages/WeeklyHigh";
import IssueInfo from "pages/IssueInfo";
import TopRising from "pages/TopRising";
import ThemeSurge from "pages/ThemeSurge";
import FiftyDayHigh from "pages/FiftyDayHigh";
import Favorites from "pages/Favorites";
import TradingConfigs from "pages/TradingConfigs";
import TradingReviews from "pages/TradingReviews";
import DailyNewsClipping from "pages/DailyNewsClipping";
import MarketInfo from "pages/MarketInfo";
import DataManagement from "pages/DataManagement";
import ProtectedRoute from "components/ProtectedRoute";

const routes = [
  {
    name: "전략",
    icon: <Icon>psychology</Icon>,
    columns: 1,
    rowsPerColumn: 4,
    collapse: [
      {
        name: "투자 전략",
        collapse: [
          {
            name: "MTT",
            route: "/mtt",
            component: <MTT />,
          },
          {
            name: "HTF 패턴",
            route: "/htf",
            component: <HTF />,
          },
          {
            name: "52주 신고가",
            route: "/weekly-high",
            component: <WeeklyHigh />,
          },
          {
            name: "50일 신고가",
            route: "/fifty-day-high",
            component: <FiftyDayHigh />,
          },
          {
            name: "상승률 TOP 50",
            route: "/top-rising",
            component: <TopRising />,
          },
          {
            name: "급등테마주",
            route: "/theme-surge",
            component: <ThemeSurge />,
          },
          {
            name: "즐겨찾기",
            route: "/favorites",
            component: (
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    name: "자동매매",
    icon: <Icon>smart_toy</Icon>,
    columns: 1,
    rowsPerColumn: 2,
    collapse: [
      {
        name: "관리",
        collapse: [
          {
            name: "설정 목록",
            route: "/trading-configs",
            component: (
              <ProtectedRoute>
                <TradingConfigs />
              </ProtectedRoute>
            ),
          },
          {
            name: "매매복기",
            route: "/trading-reviews",
            component: (
              <ProtectedRoute>
                <TradingReviews />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    name: "정보",
    icon: <Icon>info</Icon>,
    columns: 1,
    rowsPerColumn: 4,
    collapse: [
      {
        name: "시장 정보",
        collapse: [
          {
            name: "세계 주요 지수",
            route: "/market-info",
            component: <MarketInfo />,
          },
          {
            name: "이슈 정보",
            route: "/issue-info",
            component: <IssueInfo />,
          },
          {
            name: "일간뉴스클리핑",
            route: "/daily-news-clipping",
            component: <DailyNewsClipping />,
          },
        ],
      },
    ],
  },
  {
    name: "관리",
    icon: <Icon>storage</Icon>,
    columns: 1,
    rowsPerColumn: 2,
    collapse: [
      {
        name: "데이터",
        collapse: [
          {
            name: "데이터 관리",
            route: "/data-management",
            component: <DataManagement />,
          },
        ],
      },
    ],
  },
  {
    name: "계정",
    icon: <Icon>account_circle</Icon>,
    columns: 1,
    rowsPerColumn: 3,
    collapse: [
      {
        name: "account",
        collapse: [
          {
            name: "로그인",
            route: "/pages/authentication/sign-in",
            component: <SignIn />,
          },
          {
            name: "마이페이지",
            route: "/pages/my-page",
            component: (
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            ),
          },
          {
            name: "로그아웃",
            route: "/pages/logout",
            component: <Logout />,
          },
        ],
      },
    ],
  },
];

export default routes;
