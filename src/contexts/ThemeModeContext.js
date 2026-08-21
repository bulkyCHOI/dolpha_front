import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const STORAGE_KEY = "theme_mode";
const MODES = ["light", "dark"];

const ThemeModeContext = createContext({ mode: "light", toggleMode: () => {} });

/** 저장된 설정을 읽는다. 없으면 라이트로 시작한다. */
function readStoredMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored) ? stored : "light";
  } catch (error) {
    // 사생활 보호 모드 등에서 localStorage 접근이 막힐 수 있다
    return "light";
  }
}

/** 문서에 모드를 반영하고 설정을 저장한다. */
function applyMode(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    // 저장에 실패해도 이번 세션 동안은 정상 동작한다
  }
}

/**
 * 라이트 · 다크 전환 상태.
 *
 * 실제 색은 CSS 변수가 담당한다. 여기서는 <html data-theme> 만 바꾸고,
 * globals 에 선언된 :root[data-theme="dark"] 블록이 값을 갈아끼운다.
 */
export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);

  // 첫 렌더에도 속성이 붙어 있어야 자식이 색을 제대로 읽는다.
  useLayoutEffect(() => {
    applyMode(mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      // 여기서 곧바로 반영한다. effect 를 기다리면 자식의 layout effect 가
      // 먼저 실행되어 (차트 재생성 등) 이전 테마의 색을 읽는다.
      applyMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

ThemeModeProvider.propTypes = {
  children: PropTypes.node,
};

export const useThemeMode = () => useContext(ThemeModeContext);

export default ThemeModeContext;
