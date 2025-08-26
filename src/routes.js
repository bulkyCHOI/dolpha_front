/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Material Kit 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Navbar.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `name` key is used for the name of the route on the Navbar.
  2. The `icon` key is used for the icon of the route on the Navbar.
  3. The `collapse` key is used for making a collapsible item on the Navbar that contains other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  4. The `route` key is used to store the route location which is used for the react router.
  5. The `href` key is used to store the external links location.
  6. The `component` key is used to store the component of its route.
  7. The `dropdown` key is used to define that the item should open a dropdown for its collapse items .
  8. The `description` key is used to define the description of
          a route under its name.
  9. The `columns` key is used to define that how the content should look inside the dropdown menu as columns,
          you can set the columns amount based on this key.
  10. The `rowsPerColumn` key is used to define that how many rows should be in a column.
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
import FiftyDayHigh from "pages/FiftyDayHigh";
import Favorites from "pages/Favorites";
import TradingConfigs from "pages/TradingConfigs";
import TradingReviews from "pages/TradingReviews";
import DailyNewsClipping from "pages/DailyNewsClipping";
import MarketInfo from "pages/MarketInfo";
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
            name: "상승률 TOP50",
            route: "/top-rising",
            component: <TopRising />,
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
