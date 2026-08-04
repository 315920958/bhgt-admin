<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const username = ref('')
const nickname = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  loading.value = true
  try {
    // TODO: 接 /auth/dev-login，成功后 setToken(token) 再跳转
    ElMessage.success(`开发登录占位：${username.value} / ${nickname.value || username.value}`)
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
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="开发测试用户名" clearable />
        </el-form-item>
        <el-form-item label="昵称（可选）">
          <el-input v-model="nickname" placeholder="默认同用户名" clearable />
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
          开发登录（待接接口）
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
