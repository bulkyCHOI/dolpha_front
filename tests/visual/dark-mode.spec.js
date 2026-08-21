const { test, expect } = require("@playwright/test");
const { PUBLIC_ROUTES } = require("./routes");

/**
 * 다크 테마 검증.
 *
 * 색 참조가 CSS 변수를 거치지 않고 고정 값으로 남으면, 어두운 배경 위에
 * 어두운 글자가 얹혀 "보이지 않는" 상태가 된다. 화면은 멀쩡해 보이므로
 * 눈으로만 확인하면 놓치기 쉽다. 대비를 실제로 계산해 걸러낸다.
 */
test.describe.configure({ timeout: 90_000 });

/** 상대 휘도 (WCAG) */
const LUMINANCE = `(rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}`;

async function enableDarkMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme_mode", "dark");
  });
}

test.describe("다크 테마", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of PUBLIC_ROUTES) {
    test(`${route.label} — 어두운 배경에 묻히는 글자가 없다`, async ({ page }) => {
      await enableDarkMode(page);
      await page.goto(route.path);
      await page.waitForLoadState("load").catch(() => {});
      await page
        .waitForFunction(() => document.body.innerText.length > 60, null, { timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(1500);

      // 테마가 실제로 적용됐는지 먼저 확인
      const mode = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme")
      );
      expect(mode, "다크 테마가 적용되지 않았습니다").toBe("dark");

      // 배경과 글자색 대비가 3:1 미만인 텍스트를 찾는다.
      // 3:1 은 큰 글자 기준 최소 대비로, 이보다 낮으면 사실상 안 보인다.
      const lowContrast = await page.evaluate(
        ([luminanceSource]) => {
          const luminance = eval(luminanceSource);
          /**
           * 계산된 색 문자열을 0~255 RGB 로 바꾼다.
           * color-mix() 결과는 브라우저가 color(srgb 0..1) 로 돌려주므로
           * 그대로 읽으면 전부 검정으로 오인한다.
           */
          const parse = (value) => {
            const numbers = value.match(/[\d.]+/g);
            if (!numbers) return null;
            const parts = numbers.slice(0, 3).map(Number);
            if (parts.length < 3) return null;
            return value.startsWith("color(") ? parts.map((n) => n * 255) : parts;
          };

          /** 색 문자열의 알파. 없으면 1. */
          const alphaOf = (value) => {
            const slash = value.match(/\/\s*([\d.]+)\s*\)/); // color(srgb r g b / a)
            if (slash) return Number(slash[1]);
            const numbers = value.match(/[\d.]+/g);
            return value.startsWith("rgba") && numbers && numbers.length > 3
              ? Number(numbers[3])
              : 1;
          };

          /**
           * 실제로 칠해진 배경을 찾을 때까지 부모를 거슬러 올라간다.
           * 반투명 배경(옅은 틴트)은 아래 색이 비쳐 보이므로 건너뛴다 —
           * 그대로 배경으로 삼으면 글자색과 같은 계열이라 대비가 1에 가깝게 나온다.
           */
          const backgroundOf = (element) => {
            let node = element;
            while (node && node !== document.documentElement) {
              const bg = getComputedStyle(node).backgroundColor;
              if (bg && !bg.startsWith("rgba(0, 0, 0, 0)") && alphaOf(bg) >= 0.9) return parse(bg);
              node = node.parentElement;
            }
            return [15, 23, 42];
          };

          const results = [];
          document.querySelectorAll("body *").forEach((element) => {
            if (element.children.length > 0) return;
            const text = element.textContent.trim();
            if (!text) return;
            const style = getComputedStyle(element);
            if (style.visibility === "hidden" || style.display === "none") return;
            if (parseFloat(style.opacity) < 0.5) return;
            const rect = element.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) return;

            const fg = parse(style.color);
            const bg = backgroundOf(element);
            if (!fg || !bg) return;

            const light = Math.max(luminance(fg), luminance(bg));
            const dark = Math.min(luminance(fg), luminance(bg));
            const ratio = (light + 0.05) / (dark + 0.05);
            if (ratio < 3) {
              results.push(`"${text.slice(0, 20)}" 대비 ${ratio.toFixed(2)} (${style.color})`);
            }
          });
          return results.slice(0, 10);
        },
        [LUMINANCE]
      );

      expect(lowContrast, lowContrast.join("\n")).toHaveLength(0);
    });
  }
});
