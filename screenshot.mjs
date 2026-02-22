/**
 * screenshot.mjs
 * Usage:  node screenshot.mjs <url> [label]
 * Saves:  ./temporary screenshots/screenshot-N.png
 *         ./temporary screenshots/screenshot-N-label.png  (with optional label)
 *
 * Screenshots auto-increment and are never overwritten.
 */

import { createRequire } from 'module';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/billy/AppData/Roaming/npm/node_modules/puppeteer');

const CHROME_PATH = 'C:/Users/billy/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe';
const SCREENSHOT_DIR = './temporary screenshots';
const VIEWPORT = { width: 1440, height: 900 };

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  console.error('Example: node screenshot.mjs http://localhost:3000');
  console.error('Example: node screenshot.mjs http://localhost:3000 header');
  process.exit(1);
}

// Ensure output directory exists
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Find next available N (never overwrite)
const existing = readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
let maxN = 0;
for (const f of existing) {
  const match = f.match(/^screenshot-(\d+)/);
  if (match) maxN = Math.max(maxN, parseInt(match[1], 10));
}
const n = maxN + 1;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const filepath = join(SCREENSHOT_DIR, filename);

// Launch, navigate, screenshot
const browser = await puppeteer.launch({ executablePath: CHROME_PATH });
const page = await browser.newPage();
await page.setViewport(VIEWPORT);
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.screenshot({ path: filepath, fullPage: false });
await browser.close();

console.log(`Saved: ${filepath}`);
