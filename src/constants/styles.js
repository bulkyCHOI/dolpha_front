/**
 * 화면에서 쓰는 색 · 그림자 · 레이아웃 상수.
 *
 * 값은 디자인 토큰(assets/theme/base/colors)에서 가져온다.
 * 페이지나 컴포넌트에 hex를 직접 쓰지 말고 여기를 거친다.
 * 다크 테마를 도입할 때 이 파일과 토큰만 손보면 전체가 따라온다.
 */
import colors from "assets/theme/base/colors";

const { bearish, bullish, flat, grey, info, primary, success, warning, error } = colors;

/** rgba 문자열을 만든다. 테두리·호버 배경처럼 투명도가 필요한 곳에 쓴다. */
const alpha = (hex, opacity) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** 브랜드 그라데이션 (헤더 배너 · 강조 버튼) */
export const GRADIENT_COLORS = {
  PRIMARY: `linear-gradient(135deg, ${colors.gradients.primary.main} 0%, ${colors.gradients.primary.state} 100%)`,
  // 호버 시 그라데이션 양끝을 한 단계씩 어둡게
  PRIMARY_HOVER: `linear-gradient(135deg, ${primary.focus} 0%, ${colors.dark.main} 100%)`,
  SELECTED_BG: `linear-gradient(135deg, ${alpha(primary.main, 0.1)} 0%, ${alpha(
    colors.gradients.primary.state,
    0.1
  )} 100%)`,
  DARK_GRADIENT: `linear-gradient(135deg, ${colors.dark.main} 0%, ${colors.dark.focus} 100%)`,
};

export const COLORS = {
  // 브랜드
  PRIMARY: primary.main,
  PRIMARY_HOVER: primary.focus,
  PRIMARY_DARK: colors.gradients.primary.state,
  PRIMARY_BLUE: primary.main, // 기존 이름 유지 (사용처 다수)
  HOVER_BG: alpha(primary.main, 0.08),
  SELECTED_BG: alpha(primary.main, 0.12),

  // 텍스트
  TEXT: colors.text.primary,
  TEXT_SECONDARY: colors.text.secondary,
  TEXT_MUTED: colors.text.muted,

  // 표면 · 경계
  SURFACE: colors.background.surface,
  SURFACE_SUNKEN: colors.background.sunken,
  SURFACE_ALT: grey[100], // 표 줄무늬 · 비활성 영역처럼 아주 옅게 눌린 면
  BORDER: grey[300],
  BORDER_STRONG: grey[400],
  DIVIDER: grey[200],

  // 상태
  INFO: info.main,
  INFO_DARK: info.focus,
  SUCCESS: success.main,
  SUCCESS_DARK: success.focus,
  WARNING: warning.main,
  WARNING_DARK: warning.focus,
  ERROR: error.main,
  ERROR_DARK: error.focus,
  ERROR_BLUE: info.focus, // 기존 이름 유지

  // 시세 방향 (국내 관례: 상승 적색 / 하락 청색)
  UP: bullish.main,
  DOWN: bearish.main,
  FLAT: flat.main,
  UP_BG: bullish.faded,
  DOWN_BG: bearish.faded,

  RS_RANK: {
    HIGH: success.main,
    MEDIUM: warning.main,
    LOW: error.main,
    DEFAULT: flat.main,
  },
};

export const LAYOUT = {
  NAVBAR_HEIGHT: "80px",
  CONTENT_HEIGHT: "calc(100vh - 80px)",
  BOX_SHADOW: "0 4px 6px rgba(0, 0, 0, 0.1)",
  HOVER_SHADOW: "0 2px 8px rgba(0, 0, 0, 0.08)",
  SELECTED_SHADOW: `0 2px 12px ${alpha(primary.main, 0.2)}`,
};

export const SCROLLBAR_STYLES = {
  width: "8px",
  track: {
    background: grey[200],
    borderRadius: "4px",
  },
  thumb: {
    background: grey[400],
    borderRadius: "4px",
    hover: grey[500],
  },
};

export { alpha };
