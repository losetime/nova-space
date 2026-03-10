import { test } from '@playwright/test';

test('screenshot settings tab', async ({ page }) => {
  await page.goto('http://localhost:5174/profile');
  await page.click('text=设置');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-settings.png', fullPage: false });
});