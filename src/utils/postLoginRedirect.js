/**
 * 로그인 후 돌아갈 경로를 Google OAuth 왕복 동안 보관한다.
 * 외부 URL로의 오픈 리다이렉트를 막기 위해 앱 내부 경로("/..."로 시작, "//" 제외)만 허용한다.
 */
const STORAGE_KEY = "dolpha_post_login_path";
export const DEFAULT_AFTER_LOGIN = "/mtt";
const LOGIN_PATHS = ["/login", "/auth/callback"];

const isSafeInternalPath = (path) =>
  typeof path === "string" &&
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !LOGIN_PATHS.some((p) => path.startsWith(p));

export const savePostLoginPath = (path) => {
  if (!isSafeInternalPath(path)) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // 저장이 막히면 기본 경로로 이동한다
  }
};

/** 저장된 경로를 꺼내고 지운다. 없거나 안전하지 않으면 기본 경로. */
export const consumePostLoginPath = () => {
  try {
    const path = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return isSafeInternalPath(path) ? path : DEFAULT_AFTER_LOGIN;
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
};
