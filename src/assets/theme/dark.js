import { createTheme } from "@mui/material/styles";

import baseTheme from "assets/theme";
import { DARK_PALETTE, cssVar } from "constants/palette";

/**
 * 다크 테마.
 *
 * 우리 컴포넌트의 색은 CSS 변수가 담당하므로, 여기서는 MUI 기본
 * 컴포넌트(Card · Menu · Table 등)가 어두운 표면을 쓰도록만 맞춘다.
 *
 * palette 에는 실제 색 값을 넣는다. MUI 내부에서 alpha·darken 같은
 * 색 연산을 하는데, var() 문자열은 파싱하지 못한다.
 * 반면 styleOverrides 는 그대로 CSS 로 나가므로 변수를 써도 된다.
 */
const surface = cssVar("surface");
const surfaceAlt = cssVar("surface-alt");
const text = cssVar("text");
const border = cssVar("border");
const onAccent = DARK_PALETTE["on-accent"];

export default createTheme(baseTheme, {
  palette: {
    mode: "dark",
    background: {
      default: DARK_PALETTE["surface-sunken"],
      paper: DARK_PALETTE.surface,
    },
    text: {
      primary: DARK_PALETTE.text,
      secondary: DARK_PALETTE["text-secondary"],
      disabled: DARK_PALETTE["text-muted"],
      main: DARK_PALETTE["text-secondary"],
      focus: DARK_PALETTE.text,
    },
    // 다크에서는 강조색이 밝아지므로 그 위 글자는 어두워야 읽힌다.
    // 지정하지 않으면 MUI 가 흰색으로 계산해 Chip·Button 글자가 흐려진다.
    primary: {
      main: DARK_PALETTE.primary,
      focus: DARK_PALETTE["primary-hover"],
      contrastText: onAccent,
    },
    info: { main: DARK_PALETTE.info, focus: DARK_PALETTE["info-dark"], contrastText: onAccent },
    success: {
      main: DARK_PALETTE.success,
      focus: DARK_PALETTE["success-dark"],
      contrastText: onAccent,
    },
    warning: {
      main: DARK_PALETTE.warning,
      focus: DARK_PALETTE["warning-dark"],
      contrastText: onAccent,
    },
    error: { main: DARK_PALETTE.error, focus: DARK_PALETTE["error-dark"], contrastText: onAccent },
    divider: DARK_PALETTE.divider,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: surface, backgroundImage: "none", color: text },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundColor: surface, color: text, border: `1px solid ${border}` },
      },
    },
    MuiMenu: { styleOverrides: { paper: { backgroundColor: surfaceAlt, color: text } } },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: surfaceAlt, color: text } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: border, color: text } } },
    MuiDivider: { styleOverrides: { root: { borderColor: border } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { color: text },
        notchedOutline: { borderColor: border },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: cssVar("text-secondary") } } },
    MuiSelect: {
      styleOverrides: {
        icon: { color: cssVar("text-secondary") },
        select: { color: text },
      },
    },
    // MK 기본 스타일이 입력 글자색을 고정해 두어, 다크에서 선택 값이 묻힌다.
    MuiInputBase: { styleOverrides: { root: { color: text }, input: { color: text } } },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: text,
          "&:hover": { backgroundColor: cssVar("hover-bg") },
          "&.Mui-selected": { backgroundColor: cssVar("selected-bg") },
        },
      },
    },
    // Alert 기본 배경은 밝은 파스텔이라 다크에서 글자가 묻힌다.
    MuiAlert: {
      styleOverrides: {
        standardInfo: { backgroundColor: cssVar("tint-down"), color: text },
        standardSuccess: { backgroundColor: cssVar("tint-success"), color: text },
        standardWarning: { backgroundColor: cssVar("tint-warning"), color: text },
        standardError: { backgroundColor: cssVar("tint-error"), color: text },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: DARK_PALETTE["surface-alt"], color: DARK_PALETTE.text },
      },
    },
  },
});
