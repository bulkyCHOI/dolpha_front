/**
 * 로그인 세션을 1회 저장한다.
 *
 *   npm run test:visual:login
 *
 * 브라우저가 열리면 Google 로그인을 직접 완료한다.
 * 토큰이 저장되면 세션 파일을 남기고 자동으로 닫힌다.
 * 이후 인증이 필요한 화면도 시각 회귀 안전망이 검사한다.
 *
 * Playwright 번들 Chromium 은 Google 이 "보안되지 않은 브라우저" 로 차단하는 일이 잦아
 * 설치된 실제 Chrome 을 먼저 쓰고, 없을 때만 번들 Chromium 으로 떨어진다.
 *
 * 전용 프로필 디렉터리를 재사용하므로 한 번 Google 로그인해 두면
 * 다음 실행부터는 계정 선택만으로 끝난다. 사용자의 실제 Chrome 프로필은 건드리지 않는다.
 *
 * 저장 파일에는 실제 토큰이 들어 있으므로 커밋하지 않는다 (.gitignore 처리).
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const BASE_URL = "http://localhost:3000";
const SIGN_IN_PATH = "/pages/authentication/sign-in";
const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const PROFILE_DIR = path.join(__dirname, ".auth", "chrome-profile");
const WAIT_TIMEOUT_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 1000;
const PROGRESS_INTERVAL_MS = 15 * 1000;

/** 프로필을 재사용하는 컨텍스트를 연다. Chrome 이 없으면 번들 Chromium 으로 떨어진다. */
async function launchContext() {
  // Google 은 자동화 제어 브라우저의 로그인을 막는다("브라우저 또는 앱이 안전하지 않을 수 있습니다").
  // 자동화 표식을 걷어내야 OAuth 화면을 통과할 수 있다.
  const options = {
    headless: false,
    viewport: { width: 1280, height: 900 },
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled"],
  };
  try {
    const context = await chromium.launchPersistentContext(PROFILE_DIR, { ...options, channel: "chrome" });
    console.log("설치된 Chrome 으로 실행합니다. (전용 프로필 재사용)");
    return context;
  } catch (error) {
    console.log("Chrome 을 열지 못해 번들 Chromium 으로 실행합니다:", error.message.split("\n")[0]);
    return chromium.launchPersistentContext(PROFILE_DIR, options);
  }
}

/** 로그인이 어디서 막혔는지 보이도록 현재 주소와 저장된 키를 주기적으로 남긴다. */
function startProgressLog(page) {
  return setInterval(async () => {
    try {
      const keys = await page.evaluate(() => Object.keys(window.localStorage).join(", ") || "(없음)");
      console.log(`  대기 중 · ${page.url()} · localStorage: ${keys}`);
    } catch (error) {
      console.log(`  대기 중 · 페이지 상태를 읽지 못했습니다: ${error.message.split("\n")[0]}`);
    }
  }, PROGRESS_INTERVAL_MS);
}

/**
 * 토큰이 저장될 때까지 폴링한다.
 *
 * waitForFunction 은 쓸 수 없다. Google 로 리디렉션되는 순간 실행 컨텍스트가 파괴되며
 * 곧바로 예외를 던지기 때문에, 사용자가 로그인을 마치기도 전에 실패로 끝난다.
 * 여기서는 앱 주소(localhost)에 돌아와 있을 때만 확인하고, 그 외의 오류는 넘긴다.
 */
async function waitForToken(page) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (page.isClosed()) return false;
    try {
      if (page.url().startsWith(BASE_URL)) {
        const token = await page.evaluate(() => window.localStorage.getItem("access_token"));
        if (token) return true;
      }
    } catch (error) {
      // 리디렉션 도중의 컨텍스트 파괴는 정상 흐름이므로 무시한다.
    }
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }
  return false;
}

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const context = await launchContext();
  const page = context.pages()[0] || (await context.newPage());

  await page.goto(`${BASE_URL}${SIGN_IN_PATH}`);

  /*
   * 프로필을 재사용하므로 지난 실행의 토큰이 남아 있다. 그대로 두면
   * 만료된 토큰을 "로그인 성공" 으로 오인해 쓸모없는 세션을 저장한다.
   */
  await page.evaluate(() => {
    ["access_token", "refresh_token", "user_info"].forEach((key) =>
      window.localStorage.removeItem(key)
    );
  });
  await page.reload();
  await page.bringToFront();

  console.log("\n브라우저에서 Google 로그인을 완료해 주세요. (최대 15분 대기)\n");
  const progress = startProgressLog(page);

  const signedIn = await waitForToken(page);
  clearInterval(progress);

  if (!signedIn) {
    console.error("\n로그인이 확인되지 않아 저장하지 않았습니다.");
    console.error(`마지막 주소: ${page.url()}`);
    await context.close();
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });

  const user = await page.evaluate(() => window.localStorage.getItem("user_info"));
  console.log(`\n세션을 저장했습니다: ${AUTH_FILE}`);
  if (user) console.log(`로그인 계정: ${user}`);
  console.log("이제 `npm run test:visual` 이 인증 화면까지 검사합니다.\n");

  await context.close();
}

main();
