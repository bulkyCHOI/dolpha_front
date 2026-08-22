const { test, expect } = require("@playwright/test");
const { PUBLIC_ROUTES } = require("./routes");

/**
 * 두 테마의 색 정합성 검증.
 *
 * 색 참조가 CSS 변수를 거치지 않고 고정 값으로 남으면 한쪽 테마에서만
 * 어긋난다. 라이트에서는 어두운 배경 위의 검은 글자로, 다크에서는
 * 흰 배경이 그대로 남아 눈에 튀는 형태로 나타난다. 화면 구조는 멀쩡해서
 * 눈으로만 보면 놓치기 쉬우므로 값을 직접 계산해 걸러낸다.
 */
test.describe.configure({ timeout: 90_000 });

/** 큰 글자 기준 최소 대비 (WCAG AA). 이보다 낮으면 사실상 읽히지 않는다. */
const MIN_CONTRAST = 3;

/**
 * 다크에서 허용하는 표면 밝기 상한.
 * 어두운 화면에 순백에 가까운 면이 남으면 그 부분만 발광하듯 도드라진다.
 */
const MAX_DARK_SURFACE_LUMINANCE = 0.5;

/** 넓이가 이 값 이상인 면만 "표면"으로 본다 (배지·아이콘 제외) */
const SURFACE_MIN_AREA = 4000;

const AUDIT = `() => {
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // color-mix 결과는 color(srgb 0..1) 로 계산된다. 그대로 읽으면 검정으로 오인한다.
  const parse = (value) => {
    const numbers = value.match(/[\\d.]+/g);
    if (!numbers) return null;
    const parts = numbers.slice(0, 3).map(Number);
    if (parts.length < 3) return null;
    return value.startsWith("color(") ? parts.map((n) => n * 255) : parts;
  };

  const alphaOf = (value) => {
    const slash = value.match(/\\/\\s*([\\d.]+)\\s*\\)/);
    if (slash) return Number(slash[1]);
    const numbers = value.match(/[\\d.]+/g);
    return value.startsWith("rgba") && numbers && numbers.length > 3 ? Number(numbers[3]) : 1;
  };

  /** 그라데이션의 첫 색을 대표값으로 쓴다 (정확한 합성 대신 근사). */
  const gradientColor = (image) => {
    if (!image || image === "none" || !image.includes("gradient")) return null;
    const match = image.match(/(rgba?\([^)]*\)|color\([^)]*\))/);
    return match ? parse(match[1]) : null;
  };

  /**
   * 실제로 칠해진 배경을 찾는다.
   * 반투명 면은 아래 색이 비쳐 보이므로 건너뛰고, 그라데이션은 배경으로 인정한다.
   */
  const backgroundOf = (element) => {
    let node = element;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const bg = style.backgroundColor;
      if (bg && !bg.startsWith("rgba(0, 0, 0, 0)") && alphaOf(bg) >= 0.9) return parse(bg);
      const gradient = gradientColor(style.backgroundImage);
      if (gradient) return gradient;
      node = node.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
  };

  const isRendered = (element) => {
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (parseFloat(style.opacity) < 0.5) return false;
    const rect = element.getBoundingClientRect();
    return rect.width >= 4 && rect.height >= 4;
  };

  const lowContrast = [];
  const brightSurfaces = [];

  document.querySelectorAll("body *").forEach((element) => {
    if (!isRendered(element)) return;
    const style = getComputedStyle(element);

    // 1) 글자 대비
    if (element.children.length === 0 && element.textContent.trim()) {
      const fg = parse(style.color);
      const bg = backgroundOf(element);
      if (fg && bg) {
        const hi = Math.max(luminance(fg), luminance(bg));
        const lo = Math.min(luminance(fg), luminance(bg));
        const ratio = (hi + 0.05) / (lo + 0.05);
        if (ratio < ${MIN_CONTRAST}) {
          lowContrast.push(
            '"' + element.textContent.trim().slice(0, 18) + '" 대비 ' + ratio.toFixed(2) +
            " (글자 " + style.color + ")"
          );
        }
      }
    }

    // 2) 넓은 면의 밝기 (다크 전용)
    const bg = style.backgroundColor;
    if (bg && !bg.startsWith("rgba(0, 0, 0, 0)") && alphaOf(bg) >= 0.9) {
      const rect = element.getBoundingClientRect();
      if (rect.width * rect.height >= ${SURFACE_MIN_AREA}) {
        const rgb = parse(bg);
        if (rgb && luminance(rgb) > ${MAX_DARK_SURFACE_LUMINANCE}) {
          brightSurfaces.push(
            element.tagName.toLowerCase() +
            (element.className && typeof element.className === "string"
              ? "." + element.className.split(" ").slice(0, 2).join(".")
              : "") +
            " " + Math.round(rect.width) + "x" + Math.round(rect.height) + " " + bg
          );
        }
      }
    }
  });

  return { lowContrast: [...new Set(lowContrast)].slice(0, 10),
           brightSurfaces: [...new Set(brightSurfaces)].slice(0, 10) };
}`;

async function settle(page) {
  await page.waitForLoadState("load").catch(() => {});
  await page
    .waitForFunction(() => document.body.innerText.length > 60, null, { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
}

for (const mode of ["light", "dark"]) {
  test.describe(`${mode === "dark" ? "다크" : "라이트"} 테마`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route.label}`, async ({ page }) => {
        await page.addInitScript((value) => {
          window.localStorage.setItem("theme_mode", value);
        }, mode);

        await page.goto(route.path);
        await settle(page);

        const applied = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme")
        );
        expect(applied, "테마가 적용되지 않았습니다").toBe(mode);

        const { lowContrast, brightSurfaces } = await page.evaluate(`(${AUDIT})()`);

        expect(lowContrast, `배경에 묻히는 글자\n${lowContrast.join("\n")}`).toHaveLength(0);

        // 밝은 면 검사는 다크에서만 의미가 있다
        if (mode === "dark") {
          expect(
            brightSurfaces,
            `어두운 화면에서 도드라지는 밝은 면\n${brightSurfaces.join("\n")}`
          ).toHaveLength(0);
        }
      });
    }
  });
}
