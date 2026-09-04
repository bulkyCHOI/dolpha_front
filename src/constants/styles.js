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
 *   TradingViewChart     차트 지표 색 (chartTheme.js 가 토큰을 참조)
 *   ThemeEntryChart      진입 판정 구간/마커 색 (토큰 참조)
 *   DataManagement       로그 뷰어 — 배경이 항상 어두워 테마와 무관하게 고정
 *   GoogleLoginButton    Google 브랜드 색 — 가이드라인상 고정
 *
 * 히트맵(HEAT) · 계열 구분색(SERIES) · 전략색(STRATEGY_*) 은 아래 COLORS 에
 * 테마별로 정의돼 있다. 라이트는 진해지는 방향, 다크는 밝아지는 방향이다.
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

/**
 * 배경색에 어울리는 글자색을 고른다.
 *
 * 같은 강조색이라도 테마에 따라 밝기가 달라진다. 흰 글자로 고정하면
 * 라이트의 노랑·초록 배지에서, 어두운 글자로 고정하면 라이트의 남색
 * 배지에서 읽히지 않는다. 배경 밝기를 재서 그때그때 고른다.
 */
export const onColor = (background) => {
  const value = String(resolveColor(background));

  // CSS 변수 값은 hex 로 정의되어 있고, 계산된 색은 rgb()/color() 로 온다.
  let rgb = null;
  if (value.startsWith("#")) {
    const digits = value.slice(1);
    const full = digits.length === 3 ? digits.replace(/./g, (c) => c + c) : digits;
    if (full.length >= 6) rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  } else {
    const numbers = value.match(/[\d.]+/g);
    if (numbers && numbers.length >= 3) {
      const parts = numbers.slice(0, 3).map(Number);
      rgb = value.startsWith("color(") ? parts.map((n) => n * 255) : parts;
    }
  }
  if (!rgb) return cssVar("on-accent");

  const [r, g, b] = rgb;
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  // 0.25 를 넘으면 흰 글자로는 대비 3:1 을 못 넘긴다.
  // 다크의 primary(#818cf8, 0.298)가 경계에 걸려 여유를 뒀다.
  return luminance > 0.25 ? cssVar("on-accent-light") : "#ffffff";
};

/** 브랜드 그라데이션 (헤더 배너 · 강조 버튼) */
export const GRADIENT_COLORS = {
  PRIMARY: `linear-gradient(135deg, ${cssVar("banner-from")} 0%, ${cssVar("banner-to")} 100%)`,
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
  ROW_HOVER: cssVar("row-hover"),
  SELECTED_BG: cssVar("selected-bg"),

  // 텍스트
  TEXT: cssVar("text"),
  TEXT_SECONDARY: cssVar("text-secondary"),
  TEXT_MUTED: cssVar("text-muted"),

  // 표면 · 경계
  SURFACE: cssVar("surface"),
  SURFACE_ALT: cssVar("surface-alt"),
  SURFACE_SUNKEN: cssVar("surface-sunken"),
  SURFACE_OVERLAY: cssVar("surface-overlay"),
  OVERLAY_BORDER: cssVar("overlay-border"),
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

  /**
   * 급등 강도 히트맵 램프. 인덱스가 클수록 강한 상승.
   * 라이트는 진해지는 방향, 다크는 밝아지는 방향으로 정의돼 있다.
   */
  HEAT: {
    UP: [
      cssVar("heat-up-1"),
      cssVar("heat-up-2"),
      cssVar("heat-up-3"),
      cssVar("heat-up-4"),
      cssVar("heat-up-5"),
      cssVar("heat-up-6"),
    ],
    ZERO: cssVar("heat-zero"),
    DOWN: [
      cssVar("heat-down-1"),
      cssVar("heat-down-2"),
      cssVar("heat-down-3"),
      cssVar("heat-down-4"),
    ],
  },

  /** 산업군 계열 구분색 (범주형) */
  SERIES: [
    cssVar("series-1"),
    cssVar("series-2"),
    cssVar("series-3"),
    cssVar("series-4"),
    cssVar("series-5"),
    cssVar("series-6"),
  ],

  /** 전략 식별색 */
  STRATEGY_THEME_SURGE: cssVar("strategy-theme-surge"),

  RS_RANK: {
    HIGH: cssVar("rank-high"),
    MEDIUM: cssVar("rank-medium"),
    LOW: cssVar("rank-low"),
    DEFAULT: cssVar("rank-default"),
  },

  // Chartbook 월드 색상
  CHARTBOOK: {
    GROUND: cssVar("chartbook-ground"),
    INK: cssVar("chartbook-ink"),
    GRID: cssVar("chartbook-grid"),
    RS_RED: cssVar("chartbook-rs-red"),
    PANEL_BLUE: cssVar("chartbook-panel-blue"),
    SECONDARY: cssVar("chartbook-secondary"),
    SELECTED_BG: cssVar("chartbook-selected-bg"),
    SELECTED_INK: cssVar("chartbook-selected-ink"),
    BAND_STRONG: cssVar("chartbook-band-strong"),
    BAND_MID: cssVar("chartbook-band-mid"),
    BAND_WEAK: cssVar("chartbook-band-weak"),
  },
};

export const LAYOUT = {
  /**
   * 본문 좌우 여백 (MUI spacing 단위).
   *
   * FullWidthContainer 와 상단 헤더 알약이 같은 값을 써서 폭을 맞춘다.
   * 헤더만 MUI Container 를 쓰면 테마의 전역 max-width override(1320px)에
   * 걸려 본문보다 좁아진다.
   */
  PAGE_GUTTER: { xs: 2, sm: 3, md: 4 },
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

/**
 * 쌓임 순서(z-index).
 *
 * 상단 헤더는 "본문 위에 떠 있는 판"이라 어떤 본문 요소보다도 위여야 한다.
 * 값이 흩어져 있으면 페이지마다 임의로 1000 같은 수를 써서 헤더를 덮어버리므로
 * 층을 여기 한곳에 모아둔다. MUI 기본 스케일(appBar 1100 · modal 1300 ·
 * tooltip 1500)과 어긋나지 않게 헤더는 appBar 자리를 그대로 쓴다.
 */
export const Z_INDEX = {
  /** 표·차트 내부의 sticky 헤더나 고정 열 */
  CONTENT_STICKY: 5,
  /** 페이지 하단에 고정되는 바 (모바일 BottomNavigation 등) */
  PAGE_BOTTOM_BAR: 1000,
  /** 전역 상단 네비게이션 */
  HEADER: 1100,
  /** 헤더에서 펼쳐지는 드롭다운 — 헤더 위, MUI Modal(1300) 아래 */
  HEADER_MENU: 1200,
};
