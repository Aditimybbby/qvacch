// Optional: npm install --no-save --package-lock=false playwright
// Then: npx playwright install chromium
// With npm start running in another terminal: node scripts/capture.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${process.env.PORT || 3210}`);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByRole('button', { name: 'Make it click' }).click();
  await page.waitForFunction(() => {
    const badge = document.getElementById('result-badge').textContent;
    return badge === 'LOCAL AI OUTPUT' || badge === 'INCOMPLETE';
  }, { }, { timeout: 20 * 60 * 1000 });
  if (await page.locator('#result-badge').textContent() !== 'LOCAL AI OUTPUT') {
    throw new Error(await page.locator('#error').textContent());
  }
  const output = await page.locator('#output').textContent();
  if (output.trim().length < 30) throw new Error('No usable AI output; screenshot not saved.');
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/recall-desk-running.png', fullPage: true });
  await writeFile('docs/captured-output.txt', output, 'utf8');
  console.log('Saved docs/recall-desk-running.png and docs/captured-output.txt from a real local generation.');
} finally { await browser.close(); }
