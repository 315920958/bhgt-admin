<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/network'

interface PlayerRow {
  _id: string
  name: string
  realm?: string
  attrs?: Record<string, unknown>
  userId?: { username?: string; nickname?: string; isAdmin?: boolean }
  createdAt?: string
}

interface TestPlayerResult {
  _id: string
  name: string
  realm: string
  userId: string
  account: { username: string; nickname: string; isAdmin: boolean }
  loginCode: string
}

const list = ref<PlayerRow[]>([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const data = await request<PlayerRow[]>('PLAYERS_LIST')
    list.value = Array.isArray(data) ? data : []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// —— 增加测试玩家 ——
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogForm = ref<{ name: string; nickname: string; loginCode: string }>({
  name: '',
  nickname: '',
  loginCode: '',
})
const lastLoginCode = ref<string>('')

function openCreate() {
  dialogForm.value = { name: '', nickname: '', loginCode: '' }
  dialogVisible.value = true
}

async function onSubmit() {
  dialogLoading.value = true
  try {
    const body: Record<string, string> = {}
    if (dialogForm.value.name.trim()) body.name = dialogForm.value.name.trim()
    if (dialogForm.value.nickname.trim()) body.nickname = dialogForm.value.nickname.trim()
    if (dialogForm.value.loginCode.trim()) body.loginCode = dialogForm.value.loginCode.trim()

    const res = await request<TestPlayerResult>('PLAYERS_TEST_CREATE', body)
    lastLoginCode.value = res.loginCode
    ElMessage.success(`测试玩家已创建，dev 登录码：${res.loginCode}`)
    dialogVisible.value = false
    await fetchList()
  } catch {
    // 错误已统一处理
  } finally {
    dialogLoading.value = false
  }
}

const totalText = computed(() => `共 ${list.value.length} 名玩家`)

onMounted(fetchList)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="title">玩家列表（game.users 游戏角色）</span>
        <span class="count">{{ totalText }}</span>
        <div class="spacer" />
        <el-button type="primary" @click="openCreate">+ 增加测试玩家</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe border row-key="_id">
        <el-table-column prop="name" label="角色名" width="180" />
        <el-table-column prop="realm" label="境界" width="120">
          <template #default="{ row }">{{ row.realm || '—' }}</template>
        </el-table-column>
        <el-table-column label="账号" width="160">
          <template #default="{ row }">{{ row.userId?.username || '—' }}</template>
        </el-table-column>
        <el-table-column label="昵称" width="140">
          <template #default="{ row }">{{ row.userId?.nickname || '—' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="增加测试玩家"
      width="480px"
      :close-on-click-modal="false"
      @close="dialogForm = { name: '', nickname: '', loginCode: '' }"
    >
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item label="角色名">
          <el-input v-model="dialogForm.name" placeholder="留空自动生成，如 测试角色_xxxx" />
        </el-form-item>
        <el-form-item label="账号昵称">
          <el-input v-model="dialogForm.nickname" placeholder="留空为「测试玩家」" />
        </el-form-item>
        <el-form-item label="开发登录码">
          <el-input v-model="dialogForm.loginCode" placeholder="留空自动生成 t_xxxx；用于 h5 dev-login 直登（需唯一）" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="将同时创建 sys.users 账号与 game.users 角色，返回 dev 登录码可在 h5 端直接登录联调。"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="onSubmit">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; }
.title { font-weight: 500; }
.count { color: #6b7280; font-size: 13px; margin-left: 10px; }
.spacer { flex: 1; }
</style>
