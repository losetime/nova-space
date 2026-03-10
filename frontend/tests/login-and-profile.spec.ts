import { test } from '@playwright/test';

test('login and take profile screenshot', async ({ page }) => {
  // 登录
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  
  // 等待跳转
  await page.waitForURL('**/', { timeout: 5000 });
  
  // 访问个人中心
  await page.goto('http://localhost:5174/profile');
  await page.waitForTimeout(2000);
  
  // 截图
  await page.screenshot({ path: 'F:/wwp-work/screenshot-profile.png', fullPage: true });
});