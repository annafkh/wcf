// Optional local audit; these test packages are not production dependencies.
import { chromium } from 'playwright-core';
import lighthouse from 'lighthouse';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--remote-debugging-port=9223'],
});
try {
  await mkdir('qa-results', { recursive: true });
  const result = await lighthouse('http://127.0.0.1:4321', {
    port: 9223,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  await writeFile('qa-results/lighthouse-mobile.json', result.report);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([name, category]) => [name, category.score * 100]))));
  const mismatch = result.lhr.audits['label-content-name-mismatch'];
  if (mismatch?.score === 0) throw new Error('Accessible names do not match visible labels.');
} finally {
  await browser.close();
}
