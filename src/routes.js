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
import SignIn from "layouts/pages/authentication/sign-in";
import MyPage from "pages/MyPage";
import Logout from "pages/Logout";
import MTT from "./layouts/pages/mtt";
import WeeklyHigh from "./layouts/pages/weekly-high";
import TopRising from "pages/TopRising";
import FiftyDayHigh from "pages/FiftyDayHigh";
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
