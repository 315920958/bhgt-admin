<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from './api/request'

const message = ref('加载中...')

onMounted(async () => {
  try {
    const { data } = await request.get('/')
    message.value = typeof data === 'string' ? data : JSON.stringify(data)
  } catch (e) {
    message.value = '连接后端失败：' + (e instanceof Error ? e.message : String(e))
  }
})
</script>

<template>
  <div class="container">
    <h1>BHGT 后台管理</h1>
    <p>来自服务端 (bhgt-server :4001) 的响应：</p>
    <pre>{{ message }}</pre>
  </div>
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 40px auto;
}
pre {
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
}
</style>
