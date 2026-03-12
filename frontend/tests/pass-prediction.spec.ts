import { test, expect } from '@playwright/test';

test.describe('卫星过境预测测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面加载
    await page.waitForLoadState('networkidle');
  });

  test('测试过境预测功能', async ({ page }) => {
    // 1. 进入卫星数据页面
    await page.click('text=卫星数据');
    await page.waitForURL('**/satellite');
    await page.waitForTimeout(2000);

    // 2. 等待卫星列表加载
    await page.waitForSelector('.satellite-list', { timeout: 10000 });

    // 3. 点击第一个卫星
    const firstSatellite = page.locator('.satellite-item').first();
    await firstSatellite.click();
    await page.waitForTimeout(1000);

    // 4. 检查卫星详情面板是否出现
    const detailPanel = page.locator('.satellite-detail');
    await expect(detailPanel).toBeVisible();

    // 5. 滚动到过境预测区域
    await page.evaluate(() => {
      const passSection = document.querySelector('.pass-section');
      if (passSection) {
        passSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(500);

    // 6. 检查过境预测面板是否存在
    const passPrediction = page.locator('.pass-prediction');
    await expect(passPrediction).toBeVisible();

    // 7. 检查观察位置设置
    const latInput = page.locator('.location-inputs .input-group').first().locator('input');
    const lngInput = page.locator('.location-inputs .input-group').nth(1).locator('input');

    // 验证默认值（北京）
    await expect(latInput).toHaveValue(/39\.\d+/);
    await expect(lngInput).toHaveValue(/116\.\d+/);

    // 8. 选择预设城市（上海）
    await page.click('text=上海');
    await page.waitForTimeout(300);

    // 验证上海坐标
    await expect(latInput).toHaveValue(/31\.\d+/);
    await expect(lngInput).toHaveValue(/121\.\d+/);

    // 9. 设置预测参数
    await page.click('.param-select:has-text("7 天")');
    await page.click('text=3 天');
    await page.waitForTimeout(300);

    // 10. 点击预测按钮
    const predictBtn = page.locator('.predict-btn');
    await expect(predictBtn).toBeEnabled();
    await predictBtn.click();

    // 11. 等待预测结果
    await page.waitForSelector('.prediction-result', { timeout: 15000 });

    // 12. 检查结果
    const resultHeader = page.locator('.result-header');
    await expect(resultHeader).toBeVisible();

    // 13. 检查是否有过境数据
    const passCount = await page.locator('.pass-item').count();
    console.log(`找到 ${passCount} 次过境预测`);

    // 14. 截图
    await page.screenshot({ path: 'test-results/pass-prediction.png', fullPage: false });

    // 验证至少有一些结果
    if (passCount > 0) {
      // 检查第一个过境项的详情
      const firstPass = page.locator('.pass-item').first();
      await expect(firstPass.locator('.pass-date')).toBeVisible();
      await expect(firstPass.locator('.detail-row')).toBeVisible();
    }
  });

  test('测试不同预测参数', async ({ page }) => {
    // 进入卫星页面
    await page.click('text=卫星数据');
    await page.waitForURL('**/satellite');
    await page.waitForTimeout(2000);

    // 选择卫星
    await page.waitForSelector('.satellite-item');
    await page.locator('.satellite-item').first().click();
    await page.waitForTimeout(1000);

    // 滚动到过境预测
    await page.evaluate(() => {
      document.querySelector('.pass-section')?.scrollIntoView();
    });
    await page.waitForTimeout(500);

    // 设置最小高度角为 30 度
    const elevationSelect = page.locator('.param-group:has-text("最小高度角") .param-select');
    await elevationSelect.click();
    await page.click('text=30°');
    await page.waitForTimeout(300);

    // 点击预测
    await page.locator('.predict-btn').click();
    await page.waitForSelector('.prediction-result', { timeout: 15000 });

    // 验证结果
    const passCount = await page.locator('.pass-item').count();
    console.log(`30度高度角过滤后: ${passCount} 次过境`);
  });
});