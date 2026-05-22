import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const base = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:3456';
const outDir = path.join(process.cwd(), 'docs', 'visual-captures');

const viewports = [
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    const file = path.join(outDir, `${vp.name}-shell.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log('saved', file);
    await page.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
