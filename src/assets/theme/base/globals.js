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

// Material Kit 2 React Base Styles
import { DARK_PALETTE, LIGHT_PALETTE, cssVar, toCssVars } from "constants/palette";

export default {
  html: {
    scrollBehavior: "smooth",
  },
  /**
   * 색 토큰을 CSS 변수로 노출한다.
   * 컴포넌트는 var(--dolpha-*) 를 참조하므로, 아래 선언만 바뀌면
   * 호출부를 건드리지 않고 테마 전체가 바뀐다.
   *
   * prefers-color-scheme 은 쓰지 않는다. OS 설정만으로 화면이 바뀌면
   * 사용자가 앱 안에서 되돌릴 방법이 없다. 전환은 data-theme 로만 한다.
   */
  ":root": toCssVars(LIGHT_PALETTE),
  ':root[data-theme="dark"]': toCssVars(DARK_PALETTE),
  "*, *::before, *::after": {
    margin: 0,
    padding: 0,
  },
  body: {
    // MKBox가 모든 요소에 강제하던 본문 색을 여기서 한 번만 정의한다.
    // 고정 값이 아니라 변수를 써야 다크에서도 따라온다.
    color: cssVar("text"),
    backgroundColor: cssVar("surface-sunken"),
  },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${cssVar("text")} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${cssVar("info")} !important`,
  },
};
