<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request } from '@/network'
import { useCrud } from '@/composables/useCrud'

interface Attribute {
  _id: string
  code: string
  type: 'basic' | 'special'
  name: string
  description?: string
  min?: number
  max?: number
  defaultValue?: number
  createdAt?: string
  updatedAt?: string
}

const TYPE_LABEL: Record<string, string> = { basic: '基础', special: '特殊' }

const typeFilter = ref<'all' | 'basic' | 'special'>('all')

const { list, loading, dialogVisible, dialogMode, dialogForm, dialogLoading, fetchList, openCreate, openEdit, closeDialog, submit, remove } =
  useCrud<Attribute>(
    {
      list: 'ATTRIBUTES_LIST',
      create: 'ATTRIBUTES_CREATE',
      update: 'ATTRIBUTES_UPDATE',
      remove: 'ATTRIBUTES_DELETE',
    },
    { listQuery: () => (typeFilter.value === 'all' ? undefined : { type: typeFilter.value }) },
  )

// 表单校验
const formRef = ref()
const formRules = {
  code: [
    { required: true, message: '请输入业务标识 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: 'code 必须以小写字母开头，仅含小写字母/数字/下划线', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
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
  openCreate({ type: 'basic' })
}

// 直接 fetch 拉取下拉（openingInit 用）
const allAttributes = ref<Attribute[]>([])
async function fetchAllAttributes() {
  try {
    const data = await request<Attribute[]>('ATTRIBUTES_LIST')
    allAttributes.value = Array.isArray(data) ? data : []
  } catch {
    allAttributes.value = []
  }
}
defineExpose({ allAttributes })

onMounted(() => {
  fetchList()
  fetchAllAttributes()
})

const filteredTypeLabel = computed(() => (t: string) => TYPE_LABEL[t] ?? t)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-radio-group v-model="typeFilter" @change="fetchList">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="basic">基础</el-radio-button>
          <el-radio-button value="special">特殊</el-radio-button>
        </el-radio-group>
        <div class="spacer" />
        <el-button type="primary" @click="onAdd">+ 新增属性</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="code" label="业务标识" width="160" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'basic' ? 'success' : 'warning'" size="small">
              {{ filteredTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="显示名" width="120" />
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="min" label="最小值" width="80" align="right" />
        <el-table-column prop="max" label="最大值" width="80" align="right" />
        <el-table-column prop="defaultValue" label="默认值" width="80" align="right" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增属性' : '编辑属性'"
      width="560px"
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <el-form ref="formRef" :model="dialogForm" :rules="formRules" label-width="100px">
        <el-form-item label="业务标识" prop="code">
          <el-input v-model="dialogForm.code" placeholder="如 strength / luck（小写字母+数字+下划线）" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="dialogForm.type">
            <el-radio value="basic">基础属性</el-radio>
            <el-radio value="special">特殊属性</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示名" prop="name">
          <el-input v-model="dialogForm.name" placeholder="如 根骨 / 气运" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="dialogForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="最小值">
          <el-input-number v-model="dialogForm.min" :min="-9999" :max="99999" />
        </el-form-item>
        <el-form-item label="最大值">
          <el-input-number v-model="dialogForm.max" :min="-9999" :max="99999" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input-number v-model="dialogForm.defaultValue" :min="-9999" :max="99999" />
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
.spacer { flex: 1; }
</style>
