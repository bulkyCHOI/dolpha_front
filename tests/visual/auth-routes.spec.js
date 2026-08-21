const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { AUTH_ROUTES } = require("./routes");

/**
 * 로그인이 필요한 화면의 레이아웃 불변식.
 *
 * 세션 파일이 있어야 동작한다. 먼저 한 번 실행:
 *   npm run test:visual:login
 *
 * 세션이 없으면 조용히 실패하지 않고 건너뛴다 —
 * "통과"로 보이면 검증 공백을 놓치게 된다.
 */
const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const hasSession = fs.existsSync(AUTH_FILE);

const IGNORED_CONSOLE_PATTERNS = [
  /Download the React DevTools/,
  /React Router Future Flag Warning/,
  /ResizeObserver loop/,
  /non-boolean attribute/,
  /React does not recognize the .* prop on a DOM element/,
];

function collectConsoleErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

async function settle(page) {
  await page.waitForLoadState("load").catch(() => {});
  await page
    .waitForFunction(() => document.body.innerText.length > 60, null, { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
}

test.describe.configure({ timeout: 90_000 });

test.describe("인증 화면", () => {
  test.skip(
    !hasSession,
    "로그인 세션이 없습니다. `npm run test:visual:login` 을 먼저 실행하세요."
  );
  test.use({
    storageState: hasSession ? AUTH_FILE : undefined,
    viewport: { width: 1440, height: 900 },
  });

  for (const route of AUTH_ROUTES) {
    test(`${route.label} — 레이아웃 불변식`, async ({ page }) => {
      const consoleErrors = collectConsoleErrors(page);

      await page.goto(route.path);
      await settle(page);

      // 로그인 화면으로 튕기지 않았는지 (세션 만료 조기 감지)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText, "로그인 화면으로 돌아갔습니다. 세션을 다시 저장하세요.").not.toContain(
        "GOOGLE로 로그인"
      );

      expect(bodyText.length, "본문이 비어 있음").toBeGreaterThan(100);
      await expect(page.getByText("Dolpha").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `가로 오버플로 ${overflow}px`).toBeLessThanOrEqual(1);

      expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
    });
  }
});
