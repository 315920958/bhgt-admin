<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'

interface StageOption {
  _id: string
  code: string
  name: string
}
interface NodeBundle {
  _id?: string
  code: string
  name: string
  stageId?: string
  description?: string
}

const {
  list,
  loading,
  dialogVisible,
  dialogMode,
  dialogForm,
  dialogLoading,
  fetchList,
  openCreate,
  openEdit,
  submit,
  remove,
} = useCrud<NodeBundle>({
  list: 'NODE_BUNDLES_LIST',
  create: 'NODE_BUNDLES_CREATE',
  update: 'NODE_BUNDLES_UPDATE',
  remove: 'NODE_BUNDLES_DELETE',
})

const stageOptions = ref<StageOption[]>([])

async function loadOptions() {
  try {
    const stages = await request<StageOption[]>('STAGES_LIST')
    stageOptions.value = Array.isArray(stages) ? stages : []
  } catch {
    stageOptions.value = []
  }
}

function stageName(id?: string) {
  return stageOptions.value.find((s) => s._id === id)?.name ?? id ?? '-'
}

async function handleCreate() {
  await loadOptions()
  openCreate()
}
async function handleEdit(row: NodeBundle) {
  await loadOptions()
  openEdit(row)
}
async function handleSubmit() {
  await submit()
  await loadOptions()
}

onMounted(() => {
  loadOptions()
  fetchList()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>事件配置（阶段 → 事件 → 节点）</h3>
      <el-button type="primary" @click="handleCreate">+ 新增事件</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="事件 ID" width="150" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column label="所属阶段" width="160">
        <template #default="{ row }">{{ stageName(row.stageId) }}</template>
      </el-table-column>
      <el-table-column prop="description" label="说明" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增事件' : '编辑事件'"
      width="760px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="事件 ID" required>
              <el-input
                v-model="dialogForm.code"
                placeholder="nb_world_01"
                :disabled="dialogMode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="dialogForm.name" placeholder="初入宗门" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="所属阶段">
          <el-select
            v-model="dialogForm.stageId"
            placeholder="请选择阶段（可空）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="s in stageOptions"
              :key="s._id"
              :label="`${s.name} (${s.code})`"
              :value="s._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="dialogForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="dialogLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
h3 {
  margin: 0;
}
</style>
