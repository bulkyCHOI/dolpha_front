// 버튼 스타일
//
// MKButton이 제공하던 variant="gradient"를 MUI 테마의 커스텀 variant로
// 옮겨, 별도 래퍼 컴포넌트 없이 <Button variant="gradient"> 로 쓴다.
import root from "assets/theme/components/button/root";
import contained from "assets/theme/components/button/contained";
import outlined from "assets/theme/components/button/outlined";
import text from "assets/theme/components/button/text";

const GRADIENT_COLORS = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
  "light",
  "dark",
];

/** color별 gradient variant 정의 */
const gradientVariants = GRADIENT_COLORS.map((color) => ({
  props: { variant: "gradient", color },
  style: ({ theme }) => {
    const { gradients, white, dark } = theme.palette;
    const { linearGradient } = theme.functions;
    const textColor = color === "light" ? dark.main : white.main;

    return {
      color: textColor,
      background: linearGradient(gradients[color].main, gradients[color].state),
      boxShadow: theme.boxShadows.md,
      "&:hover": {
        background: linearGradient(gradients[color].state, gradients[color].main),
        boxShadow: theme.boxShadows.lg,
      },
      "&:focus:not(:hover)": {
        boxShadow: theme.boxShadows.md,
      },
      "&:disabled": {
        color: textColor,
        background: linearGradient(gradients[color].main, gradients[color].state),
        opacity: 0.65,
      },
    };
  },
}));

export default {
  defaultProps: {
    disableRipple: false,
  },
  variants: gradientVariants,
  styleOverrides: {
    root: { ...root },
    contained: { ...contained.base },
    containedSizeSmall: { ...contained.small },
    containedSizeLarge: { ...contained.large },
    containedPrimary: { ...contained.primary },
    containedSecondary: { ...contained.secondary },
    outlined: { ...outlined.base },
    outlinedSizeSmall: { ...outlined.small },
    outlinedSizeLarge: { ...outlined.large },
    outlinedPrimary: { ...outlined.primary },
    outlinedSecondary: { ...outlined.secondary },
    text: { ...text.base },
    textSizeSmall: { ...text.small },
    textSizeLarge: { ...text.large },
    textPrimary: { ...text.primary },
    textSecondary: { ...text.secondary },
  },
};
