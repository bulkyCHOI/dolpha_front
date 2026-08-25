const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { PUBLIC_ROUTES, AUTH_ROUTES } = require("./routes");

/**
 * 두 테마의 색 정합성 검증.
 *
 * 색 참조가 CSS 변수를 거치지 않고 고정 값으로 남으면 한쪽 테마에서만
 * 어긋난다. 라이트에서는 어두운 배경 위의 검은 글자로, 다크에서는
 * 흰 배경이 그대로 남아 눈에 튀는 형태로 나타난다. 화면 구조는 멀쩡해서
 * 눈으로만 보면 놓치기 쉬우므로 값을 직접 계산해 걸러낸다.
 */
test.describe.configure({ timeout: 90_000 });

/**
 * 최소 대비 (WCAG AA).
 *
 * 큰 글자만 3.0 이고 본문·버튼 라벨은 4.5 다. 전부 3.0 으로 재면
 * 3.0~4.5 구간 — 배경과 같은 계열이라 눈에 잘 안 띄는 바로 그 구간 — 이
 * 통째로 통과해 버린다.
 */
const MIN_CONTRAST_LARGE = 3;
const MIN_CONTRAST_NORMAL = 4.5;

/** 큰 글자 기준: 24px 이상, 또는 18.66px 이상이면서 굵은 글자 */
const LARGE_PX = 24;
const LARGE_BOLD_PX = 18.66;
const BOLD_WEIGHT = 700;

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const hasSession = fs.existsSync(AUTH_FILE);

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

  /** 위 색을 아래 색에 알파만큼 겹친다. */
  const over = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));

  /** 그라데이션의 첫 색을 대표값으로 쓰되, 투명도를 함께 돌려준다. */
  const gradientColor = (image) => {
    if (!image || image === "none" || !image.includes("gradient")) return null;
    const match = image.match(/(rgba?\([^)]*\)|color\([^)]*\))/);
    if (!match) return null;
    const rgb = parse(match[1]);
    return rgb ? [rgb, alphaOf(match[1])] : null;
  };

  /**
   * 눈에 보이는 실제 배경색을 구한다.
   *
   * 반투명 면을 건너뛰면 안 된다. 틴트 배경(알파 0.1 안팎) 위의 글자는
   * 아래 색과 섞인 색을 배경으로 삼아야 하고, 건너뛰면 실제보다 대비가
   * 높게 계산돼 결함을 놓친다.
   */
  const backgroundOf = (element) => {
    const layers = [];
    let node = element;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const gradient = gradientColor(style.backgroundImage);
      if (gradient) {
        layers.push(gradient);
        if (gradient[1] >= 0.999) break;
      }
      const bg = style.backgroundColor;
      const alpha = alphaOf(bg);
      const rgb = parse(bg);
      if (rgb && alpha > 0.001) {
        layers.push([rgb, alpha]);
        if (alpha >= 0.999) break;
      }
      node = node.parentElement;
    }
    let base = parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i][0], layers[i][1], base);
    return base;
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
    // 자식이 있어도 자기 텍스트 노드를 가진 요소가 있다 (버튼 라벨 등).
    const ownText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join("")
      .trim();
    // 그라데이션을 글자에 입히는 기법(background-clip: text)은
    // 배경이 아니라 글자가 칠해진다. 배경으로 재면 오탐이 난다.
    const clipsToText =
      style.webkitBackgroundClip === "text" || style.backgroundClip === "text";
    if (ownText && !clipsToText) {
      const raw = parse(style.color);
      const bg = backgroundOf(element);
      if (raw && bg) {
        const fg = over(raw, alphaOf(style.color), bg);
        const hi = Math.max(luminance(fg), luminance(bg));
        const lo = Math.min(luminance(fg), luminance(bg));
        const ratio = (hi + 0.05) / (lo + 0.05);
        const size = parseFloat(style.fontSize);
        const weight = parseInt(style.fontWeight, 10) || 400;
        const isLarge =
          size >= ${LARGE_PX} || (size >= ${LARGE_BOLD_PX} && weight >= ${BOLD_WEIGHT});
        const required = isLarge ? ${MIN_CONTRAST_LARGE} : ${MIN_CONTRAST_NORMAL};
        if (ratio < required) {
          lowContrast.push(
            '"' + ownText.slice(0, 18) + '" 대비 ' + ratio.toFixed(2) +
            " (필요 " + required + ", 글자 " + style.color + ")"
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

/**
 * 인증 화면도 같은 기준으로 본다.
 * 세션이 없으면 통과로 위장하지 않고 건너뛴다.
 */
for (const mode of ["light", "dark"]) {
  test.describe(`${mode === "dark" ? "다크" : "라이트"} 테마 · 인증 화면`, () => {
    test.skip(
      !hasSession,
      "로그인 세션이 없습니다. `npm run test:visual:login` 을 먼저 실행하세요."
    );
    test.use({
      storageState: hasSession ? AUTH_FILE : undefined,
      viewport: { width: 1440, height: 900 },
    });

    for (const route of AUTH_ROUTES) {
      test(`${route.label}`, async ({ page }) => {
        await page.addInitScript((value) => {
          window.localStorage.setItem("theme_mode", value);
        }, mode);

        await page.goto(route.path);
        await settle(page);

        expect(page.url(), "세션이 만료돼 로그인 화면으로 이동했습니다").not.toContain("sign-in");

        const { lowContrast, brightSurfaces } = await page.evaluate(`(${AUDIT})()`);
        expect(lowContrast, `배경에 묻히는 글자\n${lowContrast.join("\n")}`).toHaveLength(0);
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
