/**
 * 로그인 세션을 1회 저장한다.
 *
 *   npm run test:visual:login
 *
 * 브라우저가 열리면 Google 로그인을 직접 완료한다.
 * 토큰이 저장되면 세션 파일을 남기고 자동으로 닫힌다.
 * 이후 인증이 필요한 화면도 시각 회귀 안전망이 검사한다.
 *
 * 저장 파일에는 실제 토큰이 들어 있으므로 커밋하지 않는다 (.gitignore 처리).
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const BASE_URL = "http://localhost:3000";
const SIGN_IN_PATH = "/pages/authentication/sign-in";
const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const WAIT_TIMEOUT_MS = 5 * 60 * 1000;

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}${SIGN_IN_PATH}`);

  console.log("\n브라우저에서 Google 로그인을 완료해 주세요. (최대 5분 대기)\n");

  try {
    await page.waitForFunction(() => !!window.localStorage.getItem("access_token"), null, {
      timeout: WAIT_TIMEOUT_MS,
    });
  } catch (error) {
    console.error("\n로그인이 확인되지 않아 저장하지 않았습니다.");
    await browser.close();
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });

  const user = await page.evaluate(() => window.localStorage.getItem("user_info"));
  console.log(`\n세션을 저장했습니다: ${AUTH_FILE}`);
  if (user) console.log(`로그인 계정: ${user}`);
  console.log("이제 `npm run test:visual` 이 인증 화면까지 검사합니다.\n");

  await browser.close();
}

main();
