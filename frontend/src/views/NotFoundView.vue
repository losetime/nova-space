<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <a-button type="primary" @click="$router.push('/')">返回首页</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.not-found {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);

  .content {
    text-align: center;

    h1 {
      font-size: 120px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.1);
      margin: 0;
      line-height: 1;
    }

    p {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.6);
      margin: 20px 0 30px;
    }
  }
}
</style>
