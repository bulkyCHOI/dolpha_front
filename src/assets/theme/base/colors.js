/**
 * Dolpha 디자인 토큰 — 색상.
 *
 * 트레이딩 대시보드 팔레트. 페이지·컴포넌트에서 색을 하드코딩하지 말고
 * 반드시 이 파일의 값을 참조한다.
 *
 * 국내 시장 관례에 따라 상승은 적색, 하락은 청색이다 (bullish / bearish).
 */

export default {
  background: {
    default: "#f5f7fb",
    // 카드·패널 같은 콘텐츠 표면
    surface: "#ffffff",
    // 표 헤더 등 한 단계 눌린 표면
    sunken: "#eef1f7",
  },

  /**
   * text에는 MK 규약(main/focus)과 MUI 규약(primary/secondary/disabled)을 함께 둔다.
   * MUI 기본 컴포넌트는 palette.text.primary를 참조하므로, 이게 없으면
   * 본문 색이 브라우저 기본값으로 떨어진다.
   */
  text: {
    main: "#64748b",
    focus: "#475569",
    // 제목·수치 등 강조 텍스트
    strong: "#0f172a",
    // 보조 설명. 더 밝으면 흰 배경에서 작은 글자가 읽히지 않는다
    // 흰 배경 위 대비 4.5 확보(3.65 → 4.55). 원래 #7a8799.
    muted: "#6b7787",

    primary: "#1e293b",
    secondary: "#64748b",
    disabled: "#94a3b8",
  },

  transparent: {
    main: "transparent",
  },

  white: {
    main: "#ffffff",
    focus: "#ffffff",
  },

  black: {
    light: "#000000",
    main: "#000000",
    focus: "#000000",
  },

  // 프로젝트 전반에서 이미 사실상의 브랜드 컬러로 쓰이던 인디고
  primary: {
    // 흰 글자 대비 4.5 (WCAG AA) 를 넘기기 위해 12% 어둡게. 원래 #667eea 는 3.66.
    main: "#5a6fce",
    focus: "#5a6fd8",
  },

  secondary: {
    main: "#64748b",
    focus: "#475569",
  },

  info: {
    // 흰 글자 대비 4.5 확보. 원래 #3b82f6 은 3.68.
    main: "#3472d8",
    focus: "#2563eb",
  },

  // 흰 배경에서 글자로도 쓰이므로 대비 3:1 을 넘기는 깊이로 잡는다
  success: {
    main: "#15803d",
    focus: "#166534",
  },

  warning: {
    main: "#f59e0b",
    focus: "#d97706",
  },

  error: {
    // 흰 글자 대비 4.5 확보. 원래 #ef4444 는 3.76.
    main: "#d23c3c",
    focus: "#dc2626",
  },

  light: {
    main: "#f1f5f9",
    focus: "#e2e8f0",
  },

  dark: {
    main: "#1e293b",
    focus: "#0f172a",
  },

  /**
   * 시세 방향 — 국내 관례(상승 적색 / 하락 청색).
   * 차트 색상(components/TradingViewChart/chartTheme.js)과 같은 값을 쓴다.
   */
  bullish: {
    // 흰 글자 대비 4.5 확보(3.76 → 4.72). 원래 #ef4444.
    main: "#d23c3c",
    focus: "#dc2626",
    faded: "rgba(239, 68, 68, 0.12)",
  },

  bearish: {
    // 흰 글자 대비 4.5 확보(3.68 → 4.62). 원래 #3b82f6.
    main: "#3472d8",
    focus: "#2563eb",
    faded: "rgba(59, 130, 246, 0.12)",
  },

  flat: {
    main: "#94a3b8",
    focus: "#64748b",
    faded: "rgba(148, 163, 184, 0.12)",
  },

  // slate 계열 — 회색은 전부 여기서 가져온다
  grey: {
    100: "#f8fafc",
    200: "#f1f5f9",
    300: "#e2e8f0",
    400: "#cbd5e1",
    500: "#94a3b8",
    600: "#64748b",
    700: "#475569",
    800: "#334155",
    900: "#1e293b",
  },

  gradients: {
    primary: {
      // 배너 그라데이션. 흰 글자를 얹으므로 primary 와 같은 값으로 맞춘다.
      main: "#5a6fce",
      state: "#764ba2",
    },

    secondary: {
      main: "#94a3b8",
      state: "#64748b",
    },

    info: {
      main: "#60a5fa",
      state: "#2563eb",
    },

    success: {
      main: "#4ade80",
      state: "#16a34a",
    },

    warning: {
      main: "#fbbf24",
      state: "#d97706",
    },

    error: {
      main: "#f87171",
      state: "#dc2626",
    },

    light: {
      main: "#f1f5f9",
      state: "#e2e8f0",
    },

    dark: {
      main: "#334155",
      state: "#0f172a",
    },
  },

  socialMediaColors: {
    facebook: {
      main: "#3b5998",
      dark: "#344e86",
    },

    twitter: {
      main: "#55acee",
      dark: "#3ea1ec",
    },

    instagram: {
      main: "#125688",
      dark: "#0e456d",
    },

    linkedin: {
      main: "#0077b5",
      dark: "#00669c",
    },

    pinterest: {
      main: "#cc2127",
      dark: "#b21d22",
    },

    youtube: {
      main: "#e52d27",
      dark: "#d41f1a",
    },

    vimeo: {
      main: "#1ab7ea",
      dark: "#13a3d2",
    },

    slack: {
      main: "#3aaf85",
      dark: "#329874",
    },

    dribbble: {
      main: "#ea4c89",
      dark: "#e73177",
    },

    github: {
      main: "#24292e",
      dark: "#171a1d",
    },

    reddit: {
      main: "#ff4500",
      dark: "#e03d00",
    },

    tumblr: {
      main: "#35465c",
      dark: "#2a3749",
    },
  },

  badgeColors: {
    primary: {
      background: "#e0e5fb",
      text: "#4c5fd7",
    },

    secondary: {
      background: "#e2e8f0",
      text: "#475569",
    },

    info: {
      background: "#dbeafe",
      text: "#1d4ed8",
    },

    success: {
      background: "#dcfce7",
      text: "#15803d",
    },

    warning: {
      background: "#fef3c7",
      text: "#b45309",
    },

    error: {
      background: "#fee2e2",
      text: "#b91c1c",
    },

    light: {
      background: "#f8fafc",
      text: "#64748b",
    },

    dark: {
      background: "#cbd5e1",
      text: "#1e293b",
    },
  },

  coloredShadows: {
    primary: "#667eea",
    secondary: "#64748b",
    info: "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    light: "#cbd5e1",
    dark: "#334155",
  },

  inputBorderColor: "#cbd5e1",

  tabs: {
    indicator: { boxShadow: "#e2e8f0" },
  },
};
