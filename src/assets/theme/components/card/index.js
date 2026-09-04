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
import borders from "assets/theme/base/borders";

// Material Kit 2 React Helper Function
import rgba from "assets/theme/functions/rgba";
import { cssVar } from "constants/palette";

const { black } = colors;
const { borderWidth, borderRadius } = borders;

export default {
  styleOverrides: {
    root: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minWidth: 0,
      wordWrap: "break-word",
      backgroundColor: cssVar("chartbook-ground"),
      backgroundClip: "border-box",
      border: `1px solid ${cssVar("chartbook-grid")}`,
      borderRadius: borderRadius.sm,
      boxShadow: "none",
      overflow: "visible",
    },
  },
};
