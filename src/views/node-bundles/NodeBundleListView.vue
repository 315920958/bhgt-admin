<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'

interface StageOption {
  _id: string
  code: string
  name: string
}
interface NodeOption {
  referenceId: string
  title: string
  code: string
}
interface BundleOption {
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
  positionX: number
  positionY: number
  entryNodeRef: string
  exitNodeRef: string
  nextNodeBundleId?: string
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
const nodeOptions = ref<NodeOption[]>([])
const bundleOptions = ref<BundleOption[]>([])

async function loadOptions() {
  try {
    const stages = await request<StageOption[]>('STAGES_LIST')
    stageOptions.value = Array.isArray(stages) ? stages : []
  } catch {
    stageOptions.value = []
  }
  try {
    const nodes = await request<NodeOption[]>('NODES_LIST')
    nodeOptions.value = (Array.isArray(nodes) ? nodes : []).filter((n) => !!n.referenceId)
  } catch {
    nodeOptions.value = []
  }
  try {
    const bundles = await request<BundleOption[]>('NODE_BUNDLES_LIST')
    bundleOptions.value = Array.isArray(bundles) ? bundles : []
  } catch {
    bundleOptions.value = []
  }
}

function stageName(id?: string) {
  return stageOptions.value.find((s) => s._id === id)?.name ?? id ?? '-'
}
function bundleLabel(id?: string) {
  const b = bundleOptions.value.find((x) => x._id === id)
  return b ? `${b.code} · ${b.name}` : id ?? '-'
}

async function handleCreate() {
  await loadOptions()
  openCreate({ positionX: 0, positionY: 0 })
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
      <h3>节点包配置（阶段 → 节点包 → 节点）</h3>
      <el-button type="primary" @click="handleCreate">+ 新增节点包</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="节点包 ID" width="150" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column label="所属阶段" width="160">
        <template #default="{ row }">{{ stageName(row.stageId) }}</template>
      </el-table-column>
      <el-table-column prop="entryNodeRef" label="入口节点引用" width="160" show-overflow-tooltip />
      <el-table-column prop="exitNodeRef" label="出口节点引用" width="160" show-overflow-tooltip />
      <el-table-column label="后继节点包" width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ bundleLabel(row.nextNodeBundleId) }}</template>
      </el-table-column>
      <el-table-column label="坐标" width="110">
        <template #default="{ row }">{{ row.positionX }}, {{ row.positionY }}</template>
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
      :title="dialogMode === 'create' ? '新增节点包' : '编辑节点包'"
      width="760px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="节点包 ID" required>
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

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="入口节点引用">
              <el-select
                v-model="dialogForm.entryNodeRef"
                placeholder="选择入口节点 referenceId"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="n in nodeOptions"
                  :key="n.referenceId"
                  :label="`${n.referenceId} · ${n.title}`"
                  :value="n.referenceId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出口节点引用">
              <el-select
                v-model="dialogForm.exitNodeRef"
                placeholder="选择出口节点 referenceId"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="n in nodeOptions"
                  :key="n.referenceId"
                  :label="`${n.referenceId} · ${n.title}`"
                  :value="n.referenceId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="后继节点包">
          <el-select
            v-model="dialogForm.nextNodeBundleId"
            placeholder="请选择后继节点包（可空）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="b in bundleOptions"
              :key="b._id"
              :label="`${b.code} · ${b.name}`"
              :value="b._id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="图形坐标 X">
              <el-input-number v-model="dialogForm.positionX" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图形坐标 Y">
              <el-input-number v-model="dialogForm.positionY" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

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
