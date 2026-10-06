// Optional developer QA. Install playwright-core and @axe-core/playwright without saving.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
await mkdir("qa-results", { recursive: true });
try {
  for (const width of [375, 768, 1024, 1440]) {
    const viewportContext = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await viewportContext.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("http://127.0.0.1:4321", {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("html").getAttribute("lang"), "id");
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.content <= dimensions.viewport,
      `Overflow at ${width}: ${JSON.stringify(dimensions)}`,
    );
    const anchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .map((a) => a.getAttribute("href"))
          .filter((href) => !document.getElementById(href.slice(1))),
      );
    assert.deepEqual(anchors, []);
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
      assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
    }
    await page.evaluate(() => scrollTo(0, 0));
    if (width < 1200) {
      const toggle = page.locator(".menu-toggle");
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(
        await toggle.evaluate((element) => element === document.activeElement),
        true,
      );
      await toggle.click();
      await page
        .locator("#main-nav")
        .getByRole("link", { name: "Layanan", exact: true })
        .click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.equal(
      axe.violations.length,
      0,
      JSON.stringify(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    );
    assert.deepEqual(errors, []);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `qa-results/${width}.png`, fullPage: true });
    results.push({
      width,
      status: response.status(),
      horizontalOverflow: false,
      axeViolations: 0,
      consoleErrors: errors,
    });
    await viewportContext.close();
  }
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4321");
  assert.equal(await page.locator("#main-nav").isVisible(), true);
  assert.equal(await page.locator("#layanan").isVisible(), true);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  results.push({
    javascriptDisabled: "navigation and content visible, no overflow",
  });
  await context.close();
  await writeFile("qa-results/browser.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
