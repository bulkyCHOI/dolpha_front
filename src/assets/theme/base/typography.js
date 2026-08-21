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
 * The base typography styles for the Material Kit 2 React.
 * You can add new typography style using this file.
 * You can customized the typography styles for the entire Material Kit 2 React using thie file.
 */

// Material Kit 2 React Base Styles
import colors from "assets/theme/base/colors";

// Material Kit 2 React Helper Functions
import pxToRem from "assets/theme/functions/pxToRem";

const { dark } = colors;

/**
 * 타이포그래피 토큰.
 *
 * 본문용은 Pretendard(한글) → Roboto(라틴/숫자) 순으로 폴백한다.
 * 크기는 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 단일 스케일만 쓴다.
 * 컴포넌트에서 fontSize를 px로 직접 박지 말 것.
 */
const baseProperties = {
  fontFamily: '"Pretendard Variable", Pretendard, "Roboto", "Helvetica", "Arial", sans-serif',
  fontFamily2: '"Pretendard Variable", Pretendard, "Roboto Slab", serif',
  // 숫자 표(시세·수익률)에서 자릿수가 흔들리지 않게 쓰는 폰트 설정
  fontVariantNumeric: "tabular-nums",
  fontWeightLighter: 300,
  fontWeightLight: 400,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  fontSizeXXS: pxToRem(11),
  fontSizeXS: pxToRem(12),
  fontSizeSM: pxToRem(13),
  fontSizeMD: pxToRem(14),
  fontSizeLG: pxToRem(16),
  fontSizeXL: pxToRem(18),
  fontSize2XL: pxToRem(20),
  fontSize3XL: pxToRem(24),
};

const baseHeadingProperties = {
  color: dark.main,
  fontWeight: baseProperties.fontWeightBold,
};

const baseDisplayProperties = {
  fontFamily: baseProperties.fontFamily,
  color: dark.main,
  fontWeight: baseProperties.fontWeightLight,
  lineHeight: 1.2,
};

const typography = {
  fontFamily: baseProperties.fontFamily,
  fontWeightLighter: baseProperties.fontWeightLighter,
  fontWeightLight: baseProperties.fontWeightLight,
  fontWeightRegular: baseProperties.fontWeightRegular,
  fontWeightMedium: baseProperties.fontWeightMedium,
  fontWeightBold: baseProperties.fontWeightBold,

  h1: {
    fontFamily: baseProperties.fontFamily2,
    fontSize: pxToRem(32),
    lineHeight: 1.3,
    ...baseHeadingProperties,
  },

  h2: {
    fontFamily: baseProperties.fontFamily2,
    fontSize: pxToRem(26),
    lineHeight: 1.35,
    ...baseHeadingProperties,
  },

  h3: {
    fontFamily: baseProperties.fontFamily2,
    fontSize: pxToRem(22),
    lineHeight: 1.4,
    ...baseHeadingProperties,
  },

  h4: {
    fontFamily: baseProperties.fontFamily,
    fontSize: pxToRem(20),
    lineHeight: 1.375,
    ...baseHeadingProperties,
  },

  h5: {
    fontFamily: baseProperties.fontFamily,
    fontSize: pxToRem(18),
    lineHeight: 1.4,
    ...baseHeadingProperties,
  },

  h6: {
    fontFamily: baseProperties.fontFamily,
    fontSize: pxToRem(16),
    lineHeight: 1.5,
    ...baseHeadingProperties,
  },

  subtitle1: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeLG,
    fontWeight: baseProperties.fontWeightMedium,
    lineHeight: 1.5,
  },

  subtitle2: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeMD,
    fontWeight: baseProperties.fontWeightMedium,
    lineHeight: 1.5,
  },

  body1: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeMD,
    fontWeight: baseProperties.fontWeightRegular,
    lineHeight: 1.6,
  },

  body2: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeSM,
    fontWeight: baseProperties.fontWeightRegular,
    lineHeight: 1.55,
  },

  button: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeMD,
    fontWeight: baseProperties.fontWeightMedium,
    lineHeight: 1.5,
    // 한글 UI에서는 대문자 변환이 의미가 없고, 라틴 라벨만 어색해진다
    textTransform: "none",
  },

  caption: {
    fontFamily: baseProperties.fontFamily,
    fontSize: baseProperties.fontSizeXS,
    fontWeight: baseProperties.fontWeightRegular,
    lineHeight: 1.4,
  },

  overline: {
    fontFamily: baseProperties.fontFamily,
  },

  d1: {
    fontSize: pxToRem(80),
    ...baseDisplayProperties,
  },

  d2: {
    fontSize: pxToRem(72),
    ...baseDisplayProperties,
  },

  d3: {
    fontSize: pxToRem(64),
    ...baseDisplayProperties,
  },

  d4: {
    fontSize: pxToRem(56),
    ...baseDisplayProperties,
  },

  d5: {
    fontSize: pxToRem(48),
    ...baseDisplayProperties,
  },

  d6: {
    fontSize: pxToRem(40),
    ...baseDisplayProperties,
  },

  size: {
    xxs: baseProperties.fontSizeXXS,
    xs: baseProperties.fontSizeXS,
    sm: baseProperties.fontSizeSM,
    md: baseProperties.fontSizeMD,
    lg: baseProperties.fontSizeLG,
    xl: baseProperties.fontSizeXL,
    "2xl": baseProperties.fontSize2XL,
    "3xl": baseProperties.fontSize3XL,
  },

  lineHeight: {
    sm: 1.25,
    md: 1.5,
    lg: 2,
  },
};

export default typography;
