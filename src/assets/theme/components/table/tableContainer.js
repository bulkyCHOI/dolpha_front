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
import borders from "assets/theme/base/borders";
import { cssVar } from "constants/palette";

const { borderRadius } = borders;

export default {
  styleOverrides: {
    root: {
      backgroundColor: cssVar("chartbook-ground"),
      boxShadow: "none",
      border: `1px solid ${cssVar("chartbook-grid")}`,
      borderRadius: borderRadius.sm,
    },
  },
};
