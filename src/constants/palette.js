/**
 * 라이트 · 다크 팔레트 정의.
 *
 * 화면에서는 이 값을 직접 쓰지 않는다. constants/styles.js 가 여기서
 * CSS 변수를 만들고, 컴포넌트는 var(--dolpha-*) 를 참조한다.
 * 그래서 테마가 바뀌면 800곳 넘는 호출부를 고치지 않아도 색이 따라온다.
 *
 * 두 팔레트는 키가 정확히 같아야 한다 (아래 assert 로 검사).
 */
import colors from "assets/theme/base/colors";

const { bearish, bullish, flat, grey, info, primary, success, warning, error } = colors;

/** rgba 문자열 (팔레트 정의용 — 실제 hex 값이 필요한 곳) */
const rgba = (hex, opacity) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const LIGHT_PALETTE = {
  // 브랜드
  primary: primary.main,
  "primary-hover": primary.focus,
  "primary-dark": colors.gradients.primary.state,
  "hover-bg": rgba(primary.main, 0.08),
  "selected-bg": rgba(primary.main, 0.12),

  // 텍스트
  text: colors.text.primary,
  "text-secondary": colors.text.secondary,
  "text-muted": colors.text.muted,

  // 표면 · 경계
  surface: colors.background.surface,
  "surface-alt": grey[100],
  "surface-sunken": colors.background.sunken,
  border: grey[300],
  "border-strong": grey[400],
  divider: grey[200],

  // 상태
  info: info.main,
  "info-dark": info.focus,
  success: success.main,
  "success-dark": success.focus,
  warning: warning.main,
  "warning-dark": warning.focus,
  error: error.main,
  "error-dark": error.focus,

  // 시세 방향
  up: bullish.main,
  down: bearish.main,
  flat: flat.main,
  "up-bg": bullish.faded,
  "down-bg": bearish.faded,

  // 배지 틴트
  "tint-primary": rgba(primary.main, 0.12),
  "tint-up": bullish.faded,
  "tint-down": bearish.faded,
  "tint-success": rgba(success.main, 0.14),
  "tint-warning": rgba(warning.main, 0.16),
  "tint-error": rgba(error.main, 0.12),

  /**
   * 채도 있는 배경(배지·버튼) 위에 얹는 글자색.
   * 다크에서는 강조색 자체가 밝아지므로 흰 글자면 대비가 무너진다.
   */
  "on-accent": "#ffffff",
  // 노랑·주황처럼 밝은 배경 위 글자. 두 테마 모두 어두워야 읽힌다.
  "on-accent-light": "#0f172a",

  // 등급 배지
  "rank-high": success.main,
  "rank-medium": warning.main,
  "rank-low": error.main,
  "rank-default": flat.main,
};

/**
 * 다크 팔레트.
 *
 * 표면은 순수 검정 대신 slate 계열을 쓴다. 순수 검정 위의 채도 높은 색은
 * 번져 보이고, 장시간 보는 트레이딩 화면에서 눈이 빨리 피로해진다.
 * 시세 색(up/down)은 어두운 배경에서 대비가 떨어지므로 한 단계 밝게 잡는다.
 */
export const DARK_PALETTE = {
  primary: "#818cf8",
  "primary-hover": "#a5b4fc",
  "primary-dark": "#6366f1",
  "hover-bg": "rgba(129, 140, 248, 0.12)",
  "selected-bg": "rgba(129, 140, 248, 0.2)",

  text: "#e2e8f0",
  "text-secondary": "#94a3b8",
  "text-muted": "#8b98ac",

  surface: "#1e293b",
  "surface-alt": "#243244",
  "surface-sunken": "#0f172a",
  border: "#334155",
  "border-strong": "#475569",
  divider: "#293548",

  info: "#60a5fa",
  "info-dark": "#3b82f6",
  success: "#4ade80",
  "success-dark": "#22c55e",
  warning: "#fbbf24",
  "warning-dark": "#f59e0b",
  error: "#f87171",
  "error-dark": "#ef4444",

  up: "#f87171",
  down: "#60a5fa",
  flat: "#64748b",
  "up-bg": "rgba(248, 113, 113, 0.16)",
  "down-bg": "rgba(96, 165, 250, 0.16)",

  "tint-primary": "rgba(129, 140, 248, 0.18)",
  "tint-up": "rgba(248, 113, 113, 0.18)",
  "tint-down": "rgba(96, 165, 250, 0.18)",
  "tint-success": "rgba(74, 222, 128, 0.18)",
  "tint-warning": "rgba(251, 191, 36, 0.2)",
  "tint-error": "rgba(248, 113, 113, 0.18)",

  "on-accent": "#0f172a",
  "on-accent-light": "#0f172a",

  "rank-high": "#4ade80",
  "rank-medium": "#fbbf24",
  "rank-low": "#f87171",
  "rank-default": "#64748b",
};

// 키가 어긋나면 다크에서 해당 색만 조용히 라이트로 남는다. 개발 중에 잡는다.
if (process.env.NODE_ENV !== "production") {
  const lightKeys = Object.keys(LIGHT_PALETTE).sort().join(",");
  const darkKeys = Object.keys(DARK_PALETTE).sort().join(",");
  if (lightKeys !== darkKeys) {
    // eslint-disable-next-line no-console
    console.error("팔레트 키 불일치 — LIGHT_PALETTE 와 DARK_PALETTE 를 맞추세요.");
  }
}

export const CSS_VAR_PREFIX = "--dolpha";

/** 팔레트를 CSS 커스텀 프로퍼티 객체로 만든다 (emotion 이 객체를 받는다). */
export const toCssVars = (palette) =>
  Object.fromEntries(
    Object.entries(palette).map(([name, value]) => [`${CSS_VAR_PREFIX}-${name}`, value])
  );

/** 팔레트 키 → var() 참조 */
export const cssVar = (name) => `var(${CSS_VAR_PREFIX}-${name})`;
