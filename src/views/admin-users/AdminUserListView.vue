<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useIdCrud } from '@/composables/useIdCrud'

interface AdminUser {
  _id: string
  username: string
  nickname?: string
  loginCode?: string | null
  isAdmin: boolean
  createdAt?: string
  updatedAt?: string
}

const { list, loading, dialogVisible, dialogMode, dialogForm, dialogLoading, fetchList, openCreate, openEdit, closeDialog, submit, remove } =
  useIdCrud<AdminUser>(
    {
      list: 'ADMINS_LIST',
      create: 'ADMINS_CREATE',
      update: 'ADMINS_UPDATE',
      remove: 'ADMINS_DELETE',
    },
    {
      nameField: 'username',
      // 编辑时：密码留空则不传，避免覆盖为 SHA1(空串)
      transformEdit: (form) => {
        const body: Record<string, any> = { ...form }
        if (!body.password) delete body.password
        return body
      },
    },
  )

const formRef = ref()
const formRules = {
  username: [{ required: true, message: '请输入登录用户名', trigger: 'blur' }],
  password: [
    {
      validator: (_rule: unknown, value: string, cb: (err?: Error) => void) => {
        if (dialogMode.value === 'create' && !value) {
          return cb(new Error('请输入初始密码'))
        }
        cb()
      },
      trigger: 'blur',
    },
  ],
}

async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  await submit()
}

function onAdd() {
  openCreate({ nickname: '', loginCode: '' })
}

// 编辑时用户名不可改（唯一登录名），仅展示
const isEdit = computed(() => dialogMode.value === 'edit')

/** 打开编辑后，显式清除密码字段（防止浏览器 autofill 填入已存凭据） */
function onOpenEdit(row: AdminUser) {
  openEdit(row)
  dialogForm.value.password = ''
}

onMounted(fetchList)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="title">管理员账号（sys.users · isAdmin=true）</span>
        <div class="spacer" />
        <el-button type="primary" @click="onAdd">+ 新增管理员</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe border row-key="_id">
        <el-table-column prop="username" label="登录用户名" width="160" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column prop="loginCode" label="开发登录码" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.loginCode" size="small" type="info">{{ row.loginCode }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="isAdmin" label="管理员" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isAdmin" type="success" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onOpenEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '新增管理员'"
      width="520px"
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <el-form ref="formRef" :model="dialogForm" :rules="formRules" label-width="110px">
        <el-form-item label="登录用户名" prop="username">
          <el-input
            v-model="dialogForm.username"
            placeholder="如 oper2 / 13521011078"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="dialogForm.password"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="isEdit ? '留空则不修改' : '初始密码，将以 SHA1 入库'"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="dialogForm.nickname" placeholder="缺省等于用户名" />
        </el-form-item>
        <el-form-item label="开发登录码">
          <el-input
            v-model="dialogForm.loginCode"
            placeholder="留空则不设置；用于 h5 dev-login 直登（需唯一）"
          />
          <div class="hint">生产环境不暴露 dev-login，此码仅在 test/dev 可用。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; }
.title { font-weight: 500; }
.spacer { flex: 1; }
.muted { color: #9ca3af; }
.hint { font-size: 12px; color: #9ca3af; line-height: 1.4; margin-top: 4px; }
</style>
