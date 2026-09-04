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
const { text, transparent, light, dark, gradients } = colors;
const { borderRadius } = borders;

export default {
  styleOverrides: {
    popper: {
      boxShadow: "none",
      border: `1px solid ${cssVar("chartbook-grid")}`,
      padding: pxToRem(8),
      fontSize: size.sm,
      color: text.main,
      textAlign: "left",
      backgroundColor: `${cssVar("chartbook-ground")} !important`,
      borderRadius: borderRadius.sm,
    },

    paper: {
      boxShadow: "none",
      backgroundColor: transparent.main,
    },

    option: {
      padding: `${pxToRem(4.8)} ${pxToRem(16)}`,
      borderRadius: borderRadius.sm,
      fontSize: size.sm,
      color: text.main,
      transition: "background-color 300ms ease, color 300ms ease",

      "&:hover, &:focus, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus": {
        backgroundColor: light.main,
        color: dark.main,
      },

      '&[aria-selected="true"]': {
        backgroundColor: `${light.main} !important`,
        color: `${cssVar("chartbook-ink")} !important`,
      },
    },

    noOptions: {
      fontSize: size.sm,
      color: text.main,
    },

    groupLabel: {
      color: dark.main,
    },

    loading: {
      fontSize: size.sm,
      color: text.main,
    },

    tag: {
      display: "flex",
      alignItems: "center",
      height: "auto",
      padding: pxToRem(4),
      backgroundColor: gradients.dark.state,
      color: cssVar("chartbook-ink"),

      "& .MuiChip-label": {
        lineHeight: 1.2,
        padding: `0 ${pxToRem(10)} 0 ${pxToRem(4)}`,
      },

      "& .MuiSvgIcon-root, & .MuiSvgIcon-root:hover, & .MuiSvgIcon-root:focus": {
        color: cssVar("chartbook-ink"),
        marginRight: 0,
      },
    },
  },
};
