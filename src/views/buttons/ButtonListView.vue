<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

interface Node {
  _id: string
  code: string
  name: string
  buttons: Button[]
}

interface Button {
  code: string
  text: string
  type: 'normal' | 'minigame'
  minigameId?: string
  isRequired: boolean
  weight: number
  nextNodeId?: string
  isOneTime: boolean
  afterUse: 'hide' | 'disable'
}

const nodes = ref<Node[]>([])
const nodesLoading = ref(false)
const selectedNodeId = ref('')
const selectedNode = ref<Node | null>(null)
const saving = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogForm = ref<Partial<Button>>({})
const editingIndex = ref<number>(-1)

async function fetchNodes() {
  nodesLoading.value = true
  try {
    nodes.value = await request<Node[]>('NODES_LIST' as ApiKey)
  } catch {
    nodes.value = []
  } finally {
    nodesLoading.value = false
  }
}

function nodeOptions() {
  return nodes.value.map((n) => ({ label: `${n.name} (${n.code})`, value: n._id }))
}

function selectNode(nodeId: string) {
  selectedNode.value = nodes.value.find((n) => n._id === nodeId) || null
}

function makeEmptyButton(): Button {
  return {
    code: '',
    text: '',
    type: 'normal',
    isRequired: false,
    weight: 100,
    isOneTime: false,
    afterUse: 'hide',
  }
}

function openCreate() {
  dialogMode.value = 'create'
  dialogForm.value = makeEmptyButton()
  editingIndex.value = -1
  dialogVisible.value = true
}

function openEdit(btn: Button, idx: number) {
  dialogMode.value = 'edit'
  dialogForm.value = JSON.parse(JSON.stringify(btn))
  editingIndex.value = idx
  dialogVisible.value = true
}

function removeButton(idx: number) {
  if (!selectedNode.value) return
  selectedNode.value.buttons.splice(idx, 1)
}

function saveDialog() {
  if (!selectedNode.value || !dialogForm.value.code || !dialogForm.value.text) return
  const btn = dialogForm.value as Button
  if (dialogMode.value === 'create') {
    selectedNode.value.buttons.push(btn)
  } else if (editingIndex.value >= 0) {
    selectedNode.value.buttons[editingIndex.value] = btn
  }
  dialogVisible.value = false
}

async function saveNodeButtons() {
  if (!selectedNode.value) return
  saving.value = true
  try {
    await request('NODES_UPDATE' as ApiKey, {
      code: selectedNode.value.code,
      buttons: selectedNode.value.buttons,
    })
    ElMessage.success('按钮保存成功')
    await fetchNodes()
    selectNode(selectedNodeId.value)
  } finally {
    saving.value = false
  }
}

onMounted(fetchNodes)
</script>

<template>
  <div>
    <div class="page-header">
      <h3>按钮配置</h3>
    </div>

    <el-card class="selector-card">
      <el-form inline>
        <el-form-item label="选择节点">
          <el-select
            v-model="selectedNodeId"
            placeholder="请选择节点"
            style="width: 320px"
            filterable
            :loading="nodesLoading"
            @change="selectNode"
          >
            <el-option
              v-for="opt in nodeOptions()"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="selectedNode">
      <div class="toolbar">
        <span>{{ selectedNode.name }} 的按钮（共 {{ selectedNode.buttons.length }} 个）</span>
        <div>
          <el-button type="primary" @click="openCreate">+ 新增按钮</el-button>
          <el-button type="success" @click="saveNodeButtons" :loading="saving">保存按钮</el-button>
        </div>
      </div>

      <el-table :data="selectedNode.buttons" border style="width: 100%">
        <el-table-column prop="code" label="按钮 ID" width="140" />
        <el-table-column prop="text" label="文字" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'normal'">普通</el-tag>
            <el-tag v-else type="success">小游戏</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="90" />
        <el-table-column prop="isRequired" label="必现" width="80">
          <template #default="{ row }">{{ row.isRequired ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="isOneTime" label="一次性" width="90">
          <template #default="{ row }">{{ row.isOneTime ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="afterUse" label="使用后" width="90">
          <template #default="{ row }">{{ row.afterUse === 'hide' ? '隐藏' : '禁用' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row, $index }">
            <el-button link type="primary" @click="openEdit(row, $index)">编辑</el-button>
            <el-button link type="danger" @click="removeButton($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <el-empty v-else description="请先在上方选择一个节点" />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增按钮' : '编辑按钮'"
      width="680px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="按钮 ID" required>
              <el-input v-model="dialogForm.code" placeholder="btn_01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="按钮文字" required>
              <el-input v-model="dialogForm.text" placeholder="玩家看到的文案" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="按钮类型">
              <el-select v-model="dialogForm.type" placeholder="请选择" style="width: 100%">
                <el-option label="普通" value="normal" />
                <el-option label="小游戏" value="minigame" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用后表现">
              <el-select v-model="dialogForm.afterUse" placeholder="请选择" style="width: 100%">
                <el-option label="隐藏" value="hide" />
                <el-option label="禁用" value="disable" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="随机权重">
              <el-input-number v-model="dialogForm.weight" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialogForm.type === 'minigame'">
            <el-form-item label="小游戏 ID">
              <el-input v-model="dialogForm.minigameId" placeholder="minigame_01" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="下一节点">
              <el-select v-model="dialogForm.nextNodeId" placeholder="请选择" filterable clearable style="width: 100%">
                <el-option
                  v-for="opt in nodeOptions()"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item>
              <el-checkbox v-model="dialogForm.isRequired">必现按钮</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-checkbox v-model="dialogForm.isOneTime">一次性</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDialog">保存</el-button>
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
.selector-card {
  margin-bottom: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
</style>
