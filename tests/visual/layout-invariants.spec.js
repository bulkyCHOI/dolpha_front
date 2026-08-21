const { test, expect } = require("@playwright/test");
const { PUBLIC_ROUTES, AUTH_ROUTES, VIEWPORTS } = require("./routes");

/**
 * 디자인 리팩터링 안전망.
 *
 * 시세 데이터가 매일 바뀌므로 픽셀 비교 대신 "레이아웃 불변식"을 검증한다.
 * 디자인 작업이 실제로 깨뜨리는 것들 — 가로 스크롤, 사라진 네비게이션,
 * 렌더되지 않는 차트, 콘솔 에러 — 을 잡는 것이 목적이다.
 */

/**
 * 무시하는 콘솔 메시지.
 *
 * 각 항목은 "왜 지금 고치지 않는가"가 분명한 것만 넣는다.
 * 새 에러가 이 목록에 추가되어야 한다면, 먼저 고칠 수 있는지부터 검토할 것.
 */
const IGNORED_CONSOLE_PATTERNS = [
  /Download the React DevTools/,
  /React Router Future Flag Warning/,
  /ResizeObserver loop/,

  // 시장정보 페이지가 임베드하는 외부 TradingView 위젯의 요청 (앱 코드 아님)
  /support-portal-problems/,
  /Failed to load resource: the server responded with a status of 403/,

  // react-data-table-component 내부 styled-components가 minWidth를 DOM으로
  // 흘리는 서드파티 이슈. 우리 코드에서 고칠 수 없다.
  /non-boolean attribute/,
  /React does not recognize the .* prop on a DOM element/,

  // MKTypography는 color="text.secondary"를 허용하지 않는다 (86곳).
  // Phase 3에서 MUI Typography로 교체하면 유효한 값이 되므로 그때 해소된다.
  /Invalid prop `color` of value `text\./,
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

/**
 * 데이터 로딩과 차트 첫 렌더가 끝날 때까지 기다린다.
 *
 * networkidle은 쓸 수 없다 — 급등테마주는 1분마다 폴링하고 시장정보는
 * 외부 위젯을 계속 물어와서 idle 상태에 도달하지 않는다.
 */
async function settle(page) {
  await page.waitForLoadState("load").catch(() => {});
  // 목록 API 응답으로 본문이 채워질 때까지 기다린다 (페이지마다 로딩 속도가 다르다)
  await page
    .waitForFunction(() => document.body.innerText.length > 200, null, { timeout: 20000 })
    .catch(() => {});
  // 차트 마운트 + 첫 렌더
  await page.waitForTimeout(1500);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route.label} — 레이아웃 불변식`, async ({ page }) => {
        const consoleErrors = collectConsoleErrors(page);

        await page.goto(route.path);
        await settle(page);

        // 1. 페이지가 실제로 렌더됐다 (빈 화면 / 크래시 아님)
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length, "본문이 비어 있음").toBeGreaterThan(100);

        // 2. 전역 네비게이션이 살아 있다
        await expect(page.getByText("Dolpha").first()).toBeVisible();

        // 3. 가로 스크롤이 생기지 않는다 (반응형 깨짐의 대표 증상)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `가로 오버플로 ${overflow}px`).toBeLessThanOrEqual(1);

        // 4. 콘솔 에러가 없다
        expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
      });
    }
  });
}

test.describe("차트 렌더링", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of PUBLIC_ROUTES.filter((r) => r.hasChart)) {
    test(`${route.label} — TradingView 차트가 그려진다`, async ({ page }) => {
      await page.goto(route.path);
      await settle(page);

      // lightweight-charts는 canvas로 렌더된다
      const canvasCount = await page.locator("canvas").count();
      expect(canvasCount, "차트 canvas가 없음").toBeGreaterThan(0);

      // 폭 0으로 마운트되어 복구 못 하는 상태가 아닌지 확인.
      // 쓰지 않는 좌측 가격축 canvas는 폭이 0이므로 최대값으로 판단한다.
      const widestCanvas = await page.evaluate(() =>
        Math.max(
          0,
          ...[...document.querySelectorAll("canvas")].map(
            (element) => element.getBoundingClientRect().width
          )
        )
      );
      expect(widestCanvas, "차트 canvas 폭이 0").toBeGreaterThan(100);
    });
  }
});

test.describe("로그인 게이트", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of AUTH_ROUTES) {
    test(`${route.label} — 비로그인 시 로그인 화면`, async ({ page }) => {
      await page.goto(route.path);
      await settle(page);
      await expect(page.getByText(/로그인/).first()).toBeVisible();
    });
  }
});
