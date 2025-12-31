<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
body {
  background-color: #f7f8fa;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
    Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei',
    sans-serif;
}

.app-container {
  max-width: 600px; /* PC端预览时限制宽度，模拟手机 */
  margin: 0 auto;
  min-height: 100vh;
  background: #fff;
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

/* 移动端全屏 */
@media screen and (max-width: 600px) {
  .app-container {
    max-width: 100%;
    box-shadow: none;
  }
}
</style>
