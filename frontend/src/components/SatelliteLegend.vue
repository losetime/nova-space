<template>
  <div class="satellite-legend">
    <div class="legend-title">轨道分类</div>
    <div class="legend-items">
      <div class="legend-item">
        <span class="legend-dot leo"></span>
        <span class="legend-label">LEO 低轨</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot meo"></span>
        <span class="legend-label">MEO 中轨</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot geo"></span>
        <span class="legend-label">GEO 地球同步</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot heo"></span>
        <span class="legend-label">HEO 大椭圆</span>
      </div>
    </div>
    <div class="legend-tip">
      <BulbOutlined class="tip-icon" />
      <span>可放大缩小界面查看全部卫星态势</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BulbOutlined } from "@ant-design/icons-vue";
</script>

<style scoped lang="scss">
.satellite-legend {
  position: absolute;
  right: 20px;
  bottom: 40px;
  background: rgba(12, 12, 20, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  z-index: 40;

  .legend-title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .legend-dot {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    flex-shrink: 0;

    &.leo { background: #00ff88; }
    &.meo { background: #00d4ff; }
    &.geo { background: #b366e8; }
    &.heo { background: #ffaa00; }
  }

  .legend-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }

  .legend-tip {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    gap: 6px;

    .tip-icon {
      font-size: 12px;
      color: #ffaa00;
    }
  }
}
</style>
