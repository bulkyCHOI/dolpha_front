const fs = require("fs");
const path = require("path");
const { test } = require("@playwright/test");
const { PUBLIC_ROUTES, VIEWPORTS } = require("./routes");

/**
 * 디자인 before/after 비교용 스크린샷 아카이브.
 *
 * 시세가 매일 바뀌어 픽셀 단위 비교(toHaveScreenshot)는 항상 실패하므로,
 * 검증 대신 "사람이 눈으로 비교할 이미지"를 남긴다.
 *
 *   BASELINE_LABEL=before npx playwright test tests/visual/screenshots --project=chromium
 *   ... 디자인 작업 ...
 *   BASELINE_LABEL=after  npx playwright test tests/visual/screenshots --project=chromium
 *
 * 결과: tests/visual/__archive__/<label>/<viewport>/<page>.png
 */

const LABEL = process.env.BASELINE_LABEL || "current";
const ARCHIVE_DIR = path.join(__dirname, "__archive__", LABEL);

for (const viewport of VIEWPORTS) {
  test.describe(`${LABEL} · ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route.label}`, async ({ page }) => {
        await page.goto(route.path);
        // networkidle은 폴링 페이지에서 도달하지 않는다
        await page.waitForLoadState("load").catch(() => {});
        await page.waitForTimeout(2500);

        const outputDir = path.join(ARCHIVE_DIR, viewport.name);
        fs.mkdirSync(outputDir, { recursive: true });

        await page.screenshot({
          path: path.join(outputDir, `${route.name}.png`),
          fullPage: true,
          animations: "disabled",
        });
      });
    }
  });
}
