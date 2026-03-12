import { test, expect } from '@playwright/test';

test('验证过境预测功能', async ({ page }) => {
  // 监听控制台
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // 访问卫星页面
  await page.goto('/satellite');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 等待卫星列表加载
  await page.waitForSelector('.satellite-item', { timeout: 15000 });
  console.log('卫星列表已加载');

  // 点击第一个卫星
  await page.locator('.satellite-item').first().click();
  await page.waitForTimeout(1000);

  // 等待卫星详情面板
  await page.waitForSelector('.satellite-detail', { timeout: 10000 });
  console.log('卫星详情已显示');

  // 滚动到过境预测区域
  await page.evaluate(() => {
    const el = document.querySelector('.pass-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(500);

  // 验证过境预测面板存在
  const passPrediction = page.locator('.pass-prediction');
  await expect(passPrediction).toBeVisible();
  console.log('过境预测面板已显示');

  // 点击预测按钮（过境预测面板中的）
  const predictBtn = page.locator('.pass-prediction .predict-btn');
  await expect(predictBtn).toBeEnabled();
  await predictBtn.click();
  console.log('点击预测按钮');

  // 等待预测结果
  await page.waitForSelector('.prediction-result', { timeout: 20000 });
  console.log('预测结果已显示');

  // 等待数据渲染
  await page.waitForTimeout(2000);

  // 检查过境数据
  const passCount = await page.locator('.pass-item').count();
  console.log(`找到 ${passCount} 次过境预测`);

  // 截图
  await page.screenshot({ path: 'test-results/pass-prediction-success.png', fullPage: true });
  console.log('截图已保存');

  // 验证至少有一些结果
  expect(passCount).toBeGreaterThan(0);
});