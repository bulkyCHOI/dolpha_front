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

// Material Kit 2 React base styles
import colors from "assets/theme/base/colors";

// Material Kit 2 React helper functions
import pxToRem from "assets/theme/functions/pxToRem";
import { cssVar } from "constants/palette";

const { dark } = colors;

export default {
  styleOverrides: {
    root: {
      background: cssVar("chartbook-grid"),
      height: pxToRem(1),
      margin: `${pxToRem(16)} 0`,
      borderBottom: "none",
      opacity: 1,
    },

    vertical: {
      background: cssVar("chartbook-grid"),
      width: pxToRem(1),
      height: "100%",
      margin: `0 ${pxToRem(16)}`,
      borderRight: "none",
    },

    light: {
      background: cssVar("chartbook-grid"),

      "&.MuiDivider-vertical": {
        background: cssVar("chartbook-grid"),
      },
    },
  },
};
