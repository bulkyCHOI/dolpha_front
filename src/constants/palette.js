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
  /**
   * 배너·네비게이션의 넓은 그라데이션.
   * primary 를 그대로 쓰면 다크에서 면적이 넓어 화면이 발광하듯 뜬다.
   */
  "banner-from": colors.gradients.primary.main,
  "banner-to": colors.gradients.primary.state,

  "hover-bg": rgba(primary.main, 0.08),
  "selected-bg": rgba(primary.main, 0.12),
  /** 표 행 마우스오버. 줄무늬 배경 위에 얹혀도 과하게 튀지 않아야 한다. */
  "row-hover": rgba(primary.main, 0.1),

  // 텍스트
  text: colors.text.primary,
  "text-secondary": colors.text.secondary,
  "text-muted": colors.text.muted,

  // 표면 · 경계
  surface: colors.background.surface,
  "surface-alt": grey[100],
  "surface-sunken": colors.background.sunken,
  /** 본문 위에 뜨는 패널(드롭다운·메뉴). 본문 표면과 구분돼야 메뉴로 읽힌다. */
  "surface-overlay": colors.background.surface,
  "overlay-border": grey[300],
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

  /**
   * 급등 강도 히트맵 램프 (급등테마주 타임라인).
   * 라이트에서는 흰 배경 위라 강할수록 진해지고, 다크에서는 어두운 배경 위라
   * 강할수록 밝아진다. 방향이 반대이므로 두 팔레트를 따로 정의한다.
   */
  "heat-up-6": "#8e0000",
  "heat-up-5": "#b71c1c",
  "heat-up-4": bullish.main,
  "heat-up-3": "#f4776e",
  "heat-up-2": "#ffab9e",
  "heat-up-1": "#ffdad4",
  "heat-zero": "#e3e7ec",
  "heat-down-1": "#cfe3f7",
  "heat-down-2": "#93c2ef",
  "heat-down-3": "#4a95dd",
  "heat-down-4": bearish.main,

  /** 산업군 계열 구분색 (범주형). 서로 구분되기만 하면 된다. */
  "series-1": "#6a1b9a",
  "series-2": "#00838f",
  "series-3": "#c2185b",
  "series-4": "#5d4037",
  "series-5": "#455a64",
  "series-6": "#9e9d24",

  /** 전략 식별색 — 급등테마주 (MTT·터틀은 up·down 을 쓴다) */
  "strategy-theme-surge": "#7b1fa2",

  // 등급 배지
  "rank-high": success.main,
  "rank-medium": warning.main,
  "rank-low": error.main,
  "rank-default": flat.main,

  // Chartbook 월드 (기술 chartbook 미학)
  "chartbook-ground": "#f4f1ea",
  "chartbook-ink": "#141414",
  "chartbook-grid": "#d8d3c6",
  "chartbook-rs-red": "#8a1c1c",
  "chartbook-panel-blue": "#1f4e79",
  "chartbook-secondary": "#9aa39a",
  "chartbook-selected-bg": "#141414",
  "chartbook-selected-ink": "#f4f1ea",
  /**
   * 강도 밴드 색 글자(RS·상승률 칩, 상태 라벨) — 크림 지면 위 AA(4.5) 확보.
   * 시세 의미색(up/down)과 달리 "글자로 읽히는" 용도라 채도를 낮추고 어둡게 잡는다.
   */
  "chartbook-band-strong": "#a52722",
  "chartbook-band-mid": "#6b5410",
  "chartbook-band-weak": "#1a5c32",
};

/**
 * 다크 팔레트.
 *
 * 표면은 순수 검정 대신 slate 계열을 쓴다. 순수 검정 위의 채도 높은 색은
 * 번져 보이고, 장시간 보는 트레이딩 화면에서 눈이 빨리 피로해진다.
 * 시세 색(up/down)은 어두운 배경에서 대비가 떨어지므로 한 단계 밝게 잡는다.
 */
export const DARK_PALETTE = {
  primary: "#6b97e4",
  "primary-hover": "#8fb3ec",
  "primary-dark": "#4d7cc4",
  // 다크에서는 한 단계 깊게 — 흰 글자 대비를 확보하고 눈부심을 줄인다
  "banner-from": "#3730a3",
  "banner-to": "#4c1d95",

  "hover-bg": "rgba(129, 140, 248, 0.12)",
  "selected-bg": "rgba(129, 140, 248, 0.2)",
  // 흰색 계열로 밝히면 행 전체가 종이처럼 떠 버린다. 색조를 유지한 채 살짝만 밝힌다.
  "row-hover": "rgba(129, 140, 248, 0.14)",

  text: "#e8eef7",
  // 회색이 어두우면 본문 옆 보조 텍스트가 배경에 묻힌다 (대비 7:1 이상 확보)
  "text-secondary": "#c0cbdb",
  "text-muted": "#a4b2c5",

  surface: "#1e293b",
  "surface-alt": "#243244",
  "surface-sunken": "#0f172a",
  // 본문 표면(#1e293b)보다 한 단계 밝게 — 그래야 떠 있는 패널로 읽힌다
  "surface-overlay": "#2c3a4f",
  "overlay-border": "#4a5a72",
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

  // 어두운 배경 위에서는 강할수록 밝아지는 방향으로 뒤집는다
  "heat-up-6": "#ff6b6b",
  "heat-up-5": "#e14b4b",
  "heat-up-4": "#c23a3a",
  "heat-up-3": "#9a3132",
  "heat-up-2": "#6d2828",
  "heat-up-1": "#472122",
  "heat-zero": "#243244",
  "heat-down-1": "#1f3a5c",
  "heat-down-2": "#26527f",
  "heat-down-3": "#2f6fae",
  "heat-down-4": "#60a5fa",

  "series-1": "#c084fc",
  "series-2": "#2dd4bf",
  "series-3": "#f472b6",
  "series-4": "#d6a77a",
  "series-5": "#94a3b8",
  "series-6": "#d4d152",

  "strategy-theme-surge": "#c084fc",

  "rank-high": "#4ade80",
  "rank-medium": "#fbbf24",
  "rank-low": "#f87171",
  "rank-default": "#64748b",

  // Chartbook 월드 (기술 chartbook 미학) — 다크 모드
  "chartbook-ground": "#2a2520",
  "chartbook-ink": "#f5f1ec",
  "chartbook-grid": "#4c4438",
  "chartbook-rs-red": "#e07070",
  "chartbook-panel-blue": "#8fb3ec",
  "chartbook-secondary": "#b8bfb8",
  "chartbook-selected-bg": "#3d3630",
  "chartbook-selected-ink": "#f5f1ec",
  // 강도 밴드 색 글자 — 워치 차콜 위 AA 확보 (라이트와 방향 반대: 밝게)
  "chartbook-band-strong": "#e8908c",
  "chartbook-band-mid": "#d9a441",
  "chartbook-band-weak": "#6cc48a",
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
