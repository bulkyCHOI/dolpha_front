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
import borders from "assets/theme/base/borders";

// Material Kit 2 React helper functions
import pxToRem from "assets/theme/functions/pxToRem";
import { cssVar } from "constants/palette";

const { grey } = colors;
const { borderRadius } = borders;

export default {
  styleOverrides: {
    root: {
      position: "relative",
      backgroundColor: cssVar("chartbook-ground"),
      borderRadius: borderRadius.sm,
      minHeight: "unset",
      padding: pxToRem(4),
    },

    flexContainer: {
      height: "100%",
      position: "relative",
      zIndex: 10,
    },

    fixed: {
      overflow: "unset !important",
      overflowX: "unset !important",
    },

    vertical: {
      "& .MuiTabs-indicator": {
        width: "100%",
      },
    },

    indicator: {
      height: "100%",
      borderRadius: borderRadius.sm,
      backgroundColor: cssVar("chartbook-ground"),
      boxShadow: "none",
      transition: "all 500ms ease",
    },
  },
};
