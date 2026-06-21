const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="login"], input[type="text"]', 'uitest');
  await page.fill('input[name="password"], input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/transactions', { timeout: 10000 });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/tmp/ui-verify/01-page.png' });

  // find the day bar with most height (tallest button in calendar)
  const bars = await page.$$('.surface-card button[disabled=""], .surface-card button');
  console.log('found buttons:', bars.length);

  await browser.close();
})();
