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
import typography from "assets/theme/base/typography";
import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";

// Material Kit 2 React helper functions
import pxToRem from "assets/theme/functions/pxToRem";
import { cssVar } from "constants/palette";

const { size } = typography;
const { text } = colors;
const { borderRadius } = borders;

export default {
  defaultProps: {
    disableAutoFocusItem: true,
  },

  styleOverrides: {
    paper: {
      minWidth: pxToRem(160),
      boxShadow: "none",
      border: `1px solid ${cssVar("chartbook-grid")}`,
      padding: `${pxToRem(16)} ${pxToRem(8)}`,
      fontSize: size.sm,
      color: text.main,
      textAlign: "left",
      backgroundColor: `${cssVar("chartbook-ground")} !important`,
      borderRadius: borderRadius.sm,
    },
  },
};
