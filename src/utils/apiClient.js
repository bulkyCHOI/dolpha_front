/**
 * 백엔드 API 인증 클라이언트.
 *
 * 백엔드는 모든 /api 요청에 승인된 사용자의 JWT를 요구한다. 화면 곳곳의 fetch 호출을
 * 하나하나 고치는 대신, installAuthFetch()가 window.fetch를 한 번 감싸서
 * - /api 요청에 Authorization 헤더를 붙이고
 * - 401이면 refresh 토큰으로 한 번 갱신한 뒤 재시도하며
 * - 갱신마저 실패하면 토큰을 지우고 AUTH_EXPIRED_EVENT를 보낸다 (AuthContext가 로그아웃 처리)
 * 외부 도메인 요청은 건드리지 않는다.
 */

export const TOKEN_KEYS = Object.freeze({
  ACCESS: "access_token",
  REFRESH: "refresh_token",
  USER: "user_info",
});

export const AUTH_EXPIRED_EVENT = "auth:expired";

/** 세션 만료 사유. 로그인 화면 안내 문구에 쓴다. */
export const AUTH_REASON = Object.freeze({
  EXPIRED: "expired",
  PENDING: "pending",
});

// 토큰 없이 호출해야 하고, 401이어도 재시도하면 안 되는 엔드포인트
const PUBLIC_API_PATHS = ["/api/auth/google/", "/api/auth/refresh/", "/api/auth/logout/"];

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export const getApiBaseUrl = () => window.REACT_APP_API_BASE_URL || "http://localhost:8000";

const safeStorage = {
  get: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 사생활 보호 모드 등에서 저장이 막힐 수 있다
    }
  },
  remove: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 위와 동일
    }
  },
};

export const getAccessToken = () => safeStorage.get(TOKEN_KEYS.ACCESS);
export const getRefreshToken = () => safeStorage.get(TOKEN_KEYS.REFRESH);

export const saveSession = ({ accessToken, refreshToken, user }) => {
  safeStorage.set(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) safeStorage.set(TOKEN_KEYS.REFRESH, refreshToken);
  if (user) safeStorage.set(TOKEN_KEYS.USER, JSON.stringify(user));
};

export const clearSession = () => {
  Object.values(TOKEN_KEYS).forEach(safeStorage.remove);
};

export const getStoredUser = () => {
  const raw = safeStorage.get(TOKEN_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const expireSession = (reason) => {
  clearSession();
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { reason } }));
};

/** 우리 백엔드의 /api 경로인지 판별한다 (같은 출처 또는 API_BASE 출처). */
const resolveApiPath = (input) => {
  const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
  if (!rawUrl) return null;

  let url;
  try {
    url = new URL(rawUrl, window.location.origin);
  } catch {
    return null;
  }

  const apiOrigin = new URL(getApiBaseUrl(), window.location.origin).origin;
  const isOurOrigin = url.origin === window.location.origin || url.origin === apiOrigin;
  if (!isOurOrigin || !url.pathname.startsWith("/api/")) return null;
  return url.pathname;
};

const withAuthHeader = (init, token) => {
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
};

let refreshPromise = null;

/**
 * refresh 토큰으로 access 토큰을 갱신한다. 동시에 여러 요청이 401을 받아도
 * 갱신 요청은 한 번만 보내도록 진행 중인 Promise를 공유한다.
 * 실패하면 세션을 만료시키고 null을 반환한다.
 */
export const refreshAccessToken = (nativeFetch = window.fetch) => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      expireSession(AUTH_REASON.EXPIRED);
      return null;
    }

    try {
      const response = await nativeFetch(`${getApiBaseUrl()}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        // 403은 관리자 승인이 취소된 경우
        const reason =
          response.status === HTTP_FORBIDDEN ? AUTH_REASON.PENDING : AUTH_REASON.EXPIRED;
        expireSession(reason);
        return null;
      }

      const data = await response.json();
      saveSession({ accessToken: data.access_token });
      return data.access_token;
    } catch (error) {
      // 네트워크 장애로 갱신을 못 한 경우는 세션을 지우지 않는다 (복구 후 재시도 가능)
      console.error("[apiClient] 토큰 갱신 요청 실패:", error);
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

let isInstalled = false;

/** window.fetch를 인증 래퍼로 교체한다. 앱 시작 시 한 번만 호출한다. */
export const installAuthFetch = () => {
  if (isInstalled) return;
  isInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const apiPath = resolveApiPath(input);
    if (!apiPath || PUBLIC_API_PATHS.includes(apiPath)) {
      return nativeFetch(input, init);
    }

    const token = getAccessToken();
    const response = await nativeFetch(input, withAuthHeader(init, token));
    if (response.status !== HTTP_UNAUTHORIZED || !token) {
      return response;
    }

    const newToken = await refreshAccessToken(nativeFetch);
    if (!newToken) return response;

    // 호출부가 직접 넣은 옛 토큰 헤더는 새 토큰으로 바꿔서 재시도한다
    const retryHeaders = new Headers(init?.headers || {});
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    return nativeFetch(input, { ...init, headers: retryHeaders });
  };
};

/** EventSource처럼 헤더를 못 붙이는 요청용: URL에 access_token 쿼리를 붙인다. */
export const withAccessTokenQuery = (url) => {
  const token = getAccessToken();
  if (!token) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}access_token=${encodeURIComponent(token)}`;
};
