<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/network'

const message = ref('加载中...')

onMounted(async () => {
  try {
    const body = await request<string>('HEALTH')
    message.value = body
  } catch {
    message.value = '请求失败（见弹窗提示）'
  }
})
</script>

<template>
  <div>
    <h3>服务状态</h3>
    <el-card>
      <p>来自服务端 (bhgt-server) 的 MESSAGE_BODY：</p>
      <pre>{{ message }}</pre>
    </el-card>
  </div>
</template>

<style scoped>
pre {
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
}
</style>
