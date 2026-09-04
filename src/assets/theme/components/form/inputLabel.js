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
import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";
import { cssVar } from "constants/palette";

const { info } = colors;
const { size } = typography;

export default {
  styleOverrides: {
    root: {
      fontSize: size.sm,
      // chartbook: MK2 raw text.main/disabled 은 크림/차콜 어느 한쪽에서 AA 미달 —
      // 테마 반응형 CSS 변수로 교체.
      color: cssVar("text-secondary"),
      lineHeight: 0.9,

      "&.Mui-focused": {
        color: info.main,
      },

      "&.Mui-disabled": {
        color: cssVar("text-secondary"),
      },

      "&.MuiInputLabel-shrink": {
        lineHeight: 1.5,
        fontSize: size.md,

        "~ .MuiInputBase-root .MuiOutlinedInput-notchedOutline legend": {
          fontSize: "0.85em",
        },
      },
    },

    sizeSmall: {
      fontSize: size.xs,
      lineHeight: 1.625,

      "&.MuiInputLabel-shrink": {
        lineHeight: 1.6,
        fontSize: size.sm,

        "~ .MuiInputBase-root .MuiOutlinedInput-notchedOutline legend": {
          fontSize: "0.72em",
        },
      },
    },
  },
};
