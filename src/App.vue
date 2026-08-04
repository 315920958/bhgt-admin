<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/network'

const message = ref('加载中...')

onMounted(async () => {
  try {
    // request 已自动拆包 MESSAGE_BODY，并统一处理异常/弹窗
    const body = await request<string>('HEALTH')
    message.value = body
  } catch {
    message.value = '请求失败（见弹窗提示）'
  }
})
</script>

<template>
  <div class="container">
    <h1>BHGT 后台管理</h1>
    <p>来自服务端 (bhgt-server) 的 MESSAGE_BODY：</p>
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
