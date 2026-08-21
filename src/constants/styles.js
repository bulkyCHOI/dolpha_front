/**
 * 화면에서 쓰는 색 · 그림자 · 레이아웃 상수.
 *
 * 값은 디자인 토큰(assets/theme/base/colors)에서 가져온다.
 * 페이지나 컴포넌트에 hex를 직접 쓰지 말고 여기를 거친다.
 * 다크 테마를 도입할 때 이 파일과 토큰만 손보면 전체가 따라온다.
 *
 * ── 예외: 여기로 옮기지 않는 색 ────────────────────────────────
 * 아래는 "의미"가 아니라 "용도 전용 팔레트"라 시맨틱 토큰으로 옮기면
 * 오히려 뜻이 흐려진다. 각자 쓰이는 파일에 이름 붙은 상수로 둔다.
 * 다만 다크 테마에서는 각각 따로 손봐야 하므로 여기 적어둔다.
 *
 *   ThemeTimeline        급등 강도 히트맵 스케일 (연속 색상 램프)
 *   ThemeRateLineChart   산업군 계열 구분색 (범주형 팔레트)
 *   ThemeEntryChart      진입 판정 구간/마커 색
 *   TradingViewChart     차트 지표 색 (chartTheme.js 가 토큰을 참조)
 *   DataManagement       로그 뷰어 구문 강조 테마
 *   TradingConfigs       전략별 식별색 (MTT · Turtle · 급등테마주)
 *   GoogleLoginButton    Google 브랜드 색 (임의로 바꾸면 안 됨)
 */
import colors from "assets/theme/base/colors";
import { cssVar } from "constants/palette";

/**
 * 색에 투명도를 얹는다.
 *
 * CSS 변수는 rgba()로 분해할 수 없으므로 color-mix 를 쓴다.
 * 캔버스(차트)에서는 color-mix 를 해석하지 못하니 resolveColor 로 먼저 값을 얻을 것.
 */
export const alpha = (color, opacity) => {
  if (typeof color === "string" && color.startsWith("var(")) {
    return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  }
  const value = String(color).replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * var(--x) 를 실제 색 값으로 바꾼다.
 *
 * 캔버스 2D 컨텍스트는 CSS 변수를 해석하지 못하므로, 차트에 색을 넘기기
 * 전에 이 함수를 거친다. 테마가 바뀌면 다시 호출해야 한다.
 */
export const resolveColor = (color) => {
  if (typeof color !== "string" || !color.startsWith("var(")) return color;
  const name = color.slice(4, -1).trim();
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return resolved || color;
};

/** 브랜드 그라데이션 (헤더 배너 · 강조 버튼) */
export const GRADIENT_COLORS = {
  PRIMARY: `linear-gradient(135deg, ${cssVar("primary")} 0%, ${cssVar("primary-dark")} 100%)`,
  PRIMARY_HOVER: `linear-gradient(135deg, ${cssVar("primary-hover")} 0%, ${cssVar(
    "primary"
  )} 100%)`,
  SELECTED_BG: `linear-gradient(135deg, ${cssVar("tint-primary")} 0%, ${cssVar(
    "tint-primary"
  )} 100%)`,
  DARK_GRADIENT: `linear-gradient(135deg, ${colors.dark.main} 0%, ${colors.dark.focus} 100%)`,
};

/**
 * 화면에서 쓰는 색.
 *
 * 값은 CSS 변수 참조라 테마가 바뀌면 그대로 따라온다.
 * 캔버스에 넘길 때는 resolveColor() 를 거칠 것.
 */
export const COLORS = {
  // 브랜드
  PRIMARY: cssVar("primary"),
  PRIMARY_HOVER: cssVar("primary-hover"),
  PRIMARY_DARK: cssVar("primary-dark"),
  PRIMARY_BLUE: cssVar("primary"), // 기존 이름 유지 (사용처 다수)
  HOVER_BG: cssVar("hover-bg"),
  SELECTED_BG: cssVar("selected-bg"),

  // 텍스트
  TEXT: cssVar("text"),
  TEXT_SECONDARY: cssVar("text-secondary"),
  TEXT_MUTED: cssVar("text-muted"),

  // 표면 · 경계
  SURFACE: cssVar("surface"),
  SURFACE_ALT: cssVar("surface-alt"),
  SURFACE_SUNKEN: cssVar("surface-sunken"),
  BORDER: cssVar("border"),
  BORDER_STRONG: cssVar("border-strong"),
  DIVIDER: cssVar("divider"),

  // 상태
  INFO: cssVar("info"),
  INFO_DARK: cssVar("info-dark"),
  SUCCESS: cssVar("success"),
  SUCCESS_DARK: cssVar("success-dark"),
  WARNING: cssVar("warning"),
  WARNING_DARK: cssVar("warning-dark"),
  ERROR: cssVar("error"),
  ERROR_DARK: cssVar("error-dark"),
  ERROR_BLUE: cssVar("info-dark"), // 기존 이름 유지

  // 시세 방향 (국내 관례: 상승 적색 / 하락 청색)
  UP: cssVar("up"),
  DOWN: cssVar("down"),
  FLAT: cssVar("flat"),
  UP_BG: cssVar("up-bg"),
  DOWN_BG: cssVar("down-bg"),

  // 채도 있는 배경 위 글자색 (배지 · 강조 버튼)
  ON_ACCENT: cssVar("on-accent"),
  ON_ACCENT_LIGHT: cssVar("on-accent-light"),

  // 배지·구간 강조용 옅은 배경
  TINT_PRIMARY: cssVar("tint-primary"),
  TINT_UP: cssVar("tint-up"),
  TINT_DOWN: cssVar("tint-down"),
  TINT_SUCCESS: cssVar("tint-success"),
  TINT_WARNING: cssVar("tint-warning"),
  TINT_ERROR: cssVar("tint-error"),

  RS_RANK: {
    HIGH: cssVar("rank-high"),
    MEDIUM: cssVar("rank-medium"),
    LOW: cssVar("rank-low"),
    DEFAULT: cssVar("rank-default"),
  },
};

export const LAYOUT = {
  NAVBAR_HEIGHT: "80px",
  CONTENT_HEIGHT: "calc(100vh - 80px)",
  BOX_SHADOW: "0 4px 6px rgba(0, 0, 0, 0.1)",
  HOVER_SHADOW: "0 2px 8px rgba(0, 0, 0, 0.08)",
  SELECTED_SHADOW: `0 2px 12px ${cssVar("tint-primary")}`,
};

export const SCROLLBAR_STYLES = {
  width: "8px",
  track: {
    background: cssVar("divider"),
    borderRadius: "4px",
  },
  thumb: {
    background: cssVar("border-strong"),
    borderRadius: "4px",
    hover: cssVar("text-muted"),
  },
};

