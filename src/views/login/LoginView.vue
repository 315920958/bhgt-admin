<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { request } from '@/network'

const router = useRouter()

const loginCode = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!loginCode.value.trim()) {
    ElMessage.warning('请输入登录码')
    return
  }
  loading.value = true
  try {
    // dev-login 返回的 token 会由 request 拦截器自动写入外层 auth 并存入 localStorage
    await request('DEV_LOGIN', { loginCode: loginCode.value.trim() })
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <template #header>
        <h2>BHGT 后台管理登录</h2>
      </template>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="开发登录码">
          <el-input v-model="loginCode" placeholder="请输入开发登录码" clearable />
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}
.login-card {
  width: 360px;
}
h2 {
  margin: 0;
  text-align: center;
}
</style>
