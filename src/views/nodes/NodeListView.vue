<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'
import { ossDomain } from '@/config/servers'
import { resolveAssetUrl } from '@/utils/asset'
import NodeEditDialog from './NodeEditDialog.vue'

const route = useRoute()

interface Stage {
  _id: string
  code: string
  name: string
}
interface Bundle {
  _id: string
  code: string
  name: string
}
interface Node {
  _id?: string
  code: string
  name: string
  stageId?: string
  nodeBundleCode?: string
  title: string
  text: string
  imageUrl?: string
  isBattle: boolean
  buttonCount: number
  afterCompletionOpenShop: boolean
  battleConfig?: Record<string, any>
  buttons: any[]
}

const stages = ref<Stage[]>([])
const bundles = ref<Bundle[]>([])
const nodes = ref<Node[]>([])
const refsLoading = ref(false)

async function fetchRefs() {
  refsLoading.value = true
  try {
    const [s, b, n] = await Promise.all([
      request<Stage[]>('STAGES_LIST' as ApiKey),
      request<Bundle[]>('NODE_BUNDLES_LIST' as ApiKey),
      request<Node[]>('NODES_LIST' as ApiKey),
    ])
    stages.value = s || []
    bundles.value = b || []
    nodes.value = n || []
  } catch {
    stages.value = []
    bundles.value = []
    nodes.value = []
  } finally {
    refsLoading.value = false
  }
}

function stageName(id?: string) {
  return stages.value.find((s) => s._id === id || s.code === id)?.name || id || '—'
}
function bundleName(code?: string) {
  return bundles.value.find((b) => b.code === code)?.name || code || '—'
}

function thumb(url?: string) {
  return resolveAssetUrl(url || '', ossDomain)
}

const {
  list,
  loading,
  fetchList,
  remove,
} = useCrud<Node>({
  list: 'NODES_LIST',
  create: 'NODES_CREATE',
  update: 'NODES_UPDATE',
  remove: 'NODES_DELETE',
})

// 节点编辑弹窗状态
const nodeDialogVisible = ref(false)
const nodeDialogCode = ref<string>('')
const nodeDialogCreate = ref(false)

function openCreateDialog() {
  nodeDialogCode.value = ''
  nodeDialogCreate.value = true
  nodeDialogVisible.value = true
}
function openEditDialog(code: string) {
  nodeDialogCode.value = code
  nodeDialogCreate.value = false
  nodeDialogVisible.value = true
}
function onNodeSaved() {
  fetchList()
}

async function handleRemove(row: Node) {
  try {
    await remove(row)
    fetchList()
  } catch {
    // 错误已在 useCrud 内提示
  }
}

onMounted(async () => {
  await fetchRefs()
  await fetchList()
  const editCode = route.query.edit
  if (editCode) {
    const code = String(editCode)
    const exists = list.value.find((n) => n.code === code) || nodes.value.find((n) => n.code === code)
    if (exists) openEditDialog(code)
  }
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>剧情节点配置</h3>
      <el-button type="primary" @click="openCreateDialog" :loading="refsLoading">+ 新增节点</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="节点 ID" width="140" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column label="大阶段" width="140">
        <template #default="{ row }">{{ stageName(row.stageId) }}</template>
      </el-table-column>
      <el-table-column label="事件" width="140">
        <template #default="{ row }">{{ bundleName(row.nodeBundleCode) }}</template>
      </el-table-column>
      <el-table-column label="剧情图片" width="86" align="center">
        <template #default="{ row }">
          <el-image
            v-if="thumb(row.imageUrl)"
            :src="thumb(row.imageUrl)"
            :preview-src-list="[thumb(row.imageUrl)]"
            preview-teleported
            style="width: 48px; height: 48px"
            fit="cover"
          >
            <template #error><span class="image-error">失败</span></template>
          </el-image>
          <span v-else class="text-gray">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="剧情标题" show-overflow-tooltip />
      <el-table-column prop="isBattle" label="战斗" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isBattle ? 'danger' : 'info'">{{ row.isBattle ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="buttonCount" label="按钮数" width="90" />
      <el-table-column prop="afterCompletionOpenShop" label="开商店" width="90">
        <template #default="{ row }">{{ row.afterCompletionOpenShop ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row.code)">编辑</el-button>
          <el-button link type="danger" @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <NodeEditDialog
      v-model:visible="nodeDialogVisible"
      :node-code="nodeDialogCode"
      :create="nodeDialogCreate"
      @saved="onNodeSaved"
    />
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
.text-gray {
  color: #9ca3af;
}
.image-error {
  color: #f56c6c;
  font-size: 12px;
}
</style>
