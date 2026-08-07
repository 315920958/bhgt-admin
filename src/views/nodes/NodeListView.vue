<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

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
interface Attribute {
  _id: string
  code: string
  name: string
  type: 'basic' | 'special'
}
interface AttributeThreshold {
  attributeId: string
  minValue: number
}
interface BattleConfig {
  attributeThresholds: AttributeThreshold[]
  useLuckCompensation: boolean
  useRollCount: boolean
  success: {
    text: string
    imageUrl?: string
    nextNodeIds: string[]
  }
  failure: {
    text: string
    imageUrl?: string
    extraHpDeduction?: number
    allowAd: boolean
  }
}
interface Button {
  code: string
  text: string
  type: 'normal' | 'minigame'
  minigameId?: string
  isRequired: boolean
  weight: number
  nextNodeId?: string
  // 灵活结构（文档 §6.3）：开启条件 / 点击消耗 / 点击效果；编辑态用 JSON 字符串
  conditions?: Record<string, any>
  costs?: Record<string, any>
  effects?: Record<string, any>
  conditionsJson?: string
  costsJson?: string
  effectsJson?: string
}
interface Node {
  _id?: string
  code: string
  name: string
  stageId?: string
  nodeBundleId?: string
  title: string
  text: string
  imageUrl?: string
  isBattle: boolean
  buttonCount: number
  afterCompletionOpenShop: boolean
  battleConfig?: BattleConfig
  buttons: Button[]
}

const stages = ref<Stage[]>([])
const bundles = ref<Bundle[]>([])
const attributes = ref<Attribute[]>([])
const nodes = ref<Node[]>([])
const refsLoading = ref(false)

async function fetchRefs() {
  refsLoading.value = true
  try {
    const [s, b, a, n] = await Promise.all([
      request<Stage[]>('STAGES_LIST' as ApiKey),
      request<Bundle[]>('NODE_BUNDLES_LIST' as ApiKey),
      request<Attribute[]>('ATTRIBUTES_LIST' as ApiKey),
      request<Node[]>('NODES_LIST' as ApiKey),
    ])
    stages.value = s
    bundles.value = b
    attributes.value = a
    nodes.value = n
  } catch {
    stages.value = []
    attributes.value = []
    nodes.value = []
  } finally {
    refsLoading.value = false
  }
}

function stageName(id?: string) {
  return stages.value.find((s) => s._id === id || s.code === id)?.name || id || '—'
}
function bundleName(id?: string) {
  return bundles.value.find((b) => b._id === id || b.code === id)?.name || id || '—'
}
function nodeOptions() {
  return nodes.value.map((n) => ({ label: `${n.name} (${n.code})`, value: n._id || n.code }))
}

function makeEmptyBattleConfig(): BattleConfig {
  return {
    attributeThresholds: [],
    useLuckCompensation: true,
    useRollCount: true,
    success: { text: '', nextNodeIds: [] },
    failure: { text: '', allowAd: false },
  }
}

function makeEmptyButton(): Button {
  return {
    code: '',
    text: '',
    type: 'normal',
    isRequired: false,
    weight: 100,
    conditionsJson: '',
    costsJson: '',
    effectsJson: '',
  }
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return ''
  }
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
} = useCrud<Node>({
  list: 'NODES_LIST',
  create: 'NODES_CREATE',
  update: 'NODES_UPDATE',
  remove: 'NODES_DELETE',
})

const activeTab = ref('basic')

function handleOpenCreate() {
  activeTab.value = 'basic'
  openCreate({
    isBattle: false,
    buttonCount: 3,
    afterCompletionOpenShop: false,
    battleConfig: makeEmptyBattleConfig(),
    buttons: [],
  })
}

function handleOpenEdit(row: Node) {
  activeTab.value = 'basic'
  const clone = JSON.parse(JSON.stringify(row))
  if (!clone.battleConfig) clone.battleConfig = makeEmptyBattleConfig()
  if (!clone.buttons) clone.buttons = []
  clone.buttons.forEach((b: Button) => {
    b.conditionsJson = b.conditions ? safeStringify(b.conditions) : ''
    b.costsJson = b.costs ? safeStringify(b.costs) : ''
    b.effectsJson = b.effects ? safeStringify(b.effects) : ''
  })
  openEdit(clone as Node)
}

function addThreshold() {
  if (!dialogForm.value.battleConfig) dialogForm.value.battleConfig = makeEmptyBattleConfig()
  dialogForm.value.battleConfig.attributeThresholds.push({ attributeId: '', minValue: 0 })
}
function removeThreshold(idx: number) {
  dialogForm.value.battleConfig.attributeThresholds.splice(idx, 1)
}

function addButton() {
  if (!dialogForm.value.buttons) dialogForm.value.buttons = []
  dialogForm.value.buttons.push(makeEmptyButton())
}
function removeButton(idx: number) {
  dialogForm.value.buttons.splice(idx, 1)
}

async function handleSubmit() {
  // 非战斗节点清空 battleConfig，避免后端存冗余数据
  if (!dialogForm.value.isBattle) {
    dialogForm.value.battleConfig = undefined
  }
  // 按钮的 conditions/costs/effects：JSON 字符串 → 对象（与文档 §6.3 灵活结构对齐）
  const buttons: Button[] = dialogForm.value.buttons || []
  for (const b of buttons) {
    try {
      b.conditions = b.conditionsJson?.trim() ? JSON.parse(b.conditionsJson) : undefined
      b.costs = b.costsJson?.trim() ? JSON.parse(b.costsJson) : undefined
      b.effects = b.effectsJson?.trim() ? JSON.parse(b.effectsJson) : undefined
    } catch (e) {
      ElMessage.error(`按钮「${b.text || b.code || '?'}」的 JSON 解析失败：${(e as Error).message}`)
      return
    }
    delete b.conditionsJson
    delete b.costsJson
    delete b.effectsJson
  }
  await submit()
}

onMounted(() => {
  fetchRefs()
  fetchList()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>剧情节点配置</h3>
      <el-button type="primary" @click="handleOpenCreate" :loading="refsLoading">+ 新增节点</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="节点 ID" width="140" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column label="大阶段" width="140">
        <template #default="{ row }">{{ stageName(row.stageId) }}</template>
      </el-table-column>
      <el-table-column label="事件" width="140">
        <template #default="{ row }">{{ bundleName(row.nodeBundleId) }}</template>
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
          <el-button link type="primary" @click="handleOpenEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增节点' : '编辑节点'"
      width="860px"
      top="5vh"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="dialogForm" label-width="120px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="节点 ID" required>
                  <el-input v-model="dialogForm.code" placeholder="n001" :disabled="dialogMode === 'edit'" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="节点名称" required>
                  <el-input v-model="dialogForm.name" placeholder="后台搜索用名称" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="所属大阶段" required>
              <el-select v-model="dialogForm.stageId" placeholder="请选择" style="width: 100%" filterable>
                <el-option
                  v-for="s in stages"
                  :key="s._id"
                  :label="`${s.name} (${s.code})`"
                  :value="s._id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="所属事件">
              <el-select v-model="dialogForm.nodeBundleId" placeholder="请选择（可空）" clearable filterable style="width: 100%">
                <el-option
                  v-for="b in bundles"
                  :key="b._id"
                  :label="`${b.name} (${b.code})`"
                  :value="b._id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="剧情标题" required>
              <el-input v-model="dialogForm.title" />
            </el-form-item>

            <el-form-item label="剧情正文" required>
              <el-input v-model="dialogForm.text" type="textarea" :rows="4" />
            </el-form-item>

            <el-form-item label="剧情图片">
              <el-input v-model="dialogForm.imageUrl" placeholder="https://..." />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="显示按钮数">
                  <el-input-number v-model="dialogForm.buttonCount" :min="1" :max="5" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="战斗节点">
                  <el-switch v-model="dialogForm.isBattle" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="通过后开商店">
                  <el-switch v-model="dialogForm.afterCompletionOpenShop" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="战斗配置" name="battle" :disabled="!dialogForm.isBattle">
          <el-form :model="dialogForm.battleConfig" label-width="140px" v-if="dialogForm.battleConfig">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="使用气运补差">
                  <el-switch v-model="dialogForm.battleConfig.useLuckCompensation" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="使用投掷次数">
                  <el-switch v-model="dialogForm.battleConfig.useRollCount" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="判定属性门槛">
              <div v-for="(th, idx) in dialogForm.battleConfig.attributeThresholds" :key="idx" class="sub-row">
                <el-select v-model="th.attributeId" placeholder="属性" style="width: 180px" filterable>
                  <el-option
                    v-for="a in attributes.filter((x) => x.type === 'basic')"
                    :key="a._id"
                    :label="a.name"
                    :value="a._id"
                  />
                </el-select>
                <el-input-number v-model="th.minValue" :min="0" placeholder="门槛" style="width: 120px; margin: 0 8px" />
                <el-button type="danger" link @click="removeThreshold(idx)">删除</el-button>
              </div>
              <el-button type="primary" link @click="addThreshold">+ 添加属性门槛</el-button>
            </el-form-item>

            <el-divider content-position="left">战斗成功</el-divider>
            <el-form-item label="成功文案">
              <el-input v-model="dialogForm.battleConfig.success.text" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="成功图片">
              <el-input v-model="dialogForm.battleConfig.success.imageUrl" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="成功下一节点">
              <el-select
                v-model="dialogForm.battleConfig.success.nextNodeIds"
                multiple
                filterable
                placeholder="可多选"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in nodeOptions()"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">战斗失败</el-divider>
            <el-form-item label="失败文案">
              <el-input v-model="dialogForm.battleConfig.failure.text" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="失败图片">
              <el-input v-model="dialogForm.battleConfig.failure.imageUrl" placeholder="https://..." />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="额外寿元扣除">
                  <el-input-number v-model="dialogForm.battleConfig.failure.extraHpDeduction" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="允许广告续命">
                  <el-switch v-model="dialogForm.battleConfig.failure.allowAd" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="按钮列表" name="buttons">
          <div class="buttons-header">
            <span>共 {{ dialogForm.buttons?.length || 0 }} 个按钮</span>
            <el-button type="primary" link @click="addButton">+ 添加按钮</el-button>
          </div>

          <div
            v-for="(btn, idx) in dialogForm.buttons || []"
            :key="idx"
            class="button-card"
          >
            <div class="button-card-header">
              <span>按钮 #{{ idx + 1 }}</span>
              <el-button type="danger" link @click="removeButton(idx)">删除</el-button>
            </div>
            <el-row :gutter="12">
              <el-col :span="6">
                <el-input v-model="btn.code" placeholder="按钮 ID" />
              </el-col>
              <el-col :span="10">
                <el-input v-model="btn.text" placeholder="按钮文字" />
              </el-col>
              <el-col :span="4">
                <el-select v-model="btn.type" placeholder="类型">
                  <el-option label="普通" value="normal" />
                  <el-option label="小游戏" value="minigame" />
                </el-select>
              </el-col>
            </el-row>
            <el-row :gutter="12" style="margin-top: 8px">
              <el-col :span="6">
                <el-input-number v-model="btn.weight" :min="0" placeholder="权重" style="width: 100%" />
              </el-col>
              <el-col :span="6">
                <el-select v-model="btn.nextNodeId" placeholder="下一节点" filterable clearable style="width: 100%">
                  <el-option
                    v-for="opt in nodeOptions()"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-checkbox v-model="btn.isRequired">必现</el-checkbox>
              </el-col>
              <el-col :span="4" v-if="btn.type === 'minigame'">
                <el-input v-model="btn.minigameId" placeholder="小游戏 ID" />
              </el-col>
            </el-row>
            <el-divider content-position="left">高级（可选 · JSON，对应文档 §6.3）</el-divider>
            <el-form label-width="92px" style="margin-top: 2px">
              <el-form-item label="开启条件">
                <el-input
                  v-model="btn.conditionsJson"
                  type="textarea"
                  :rows="2"
                  placeholder='如 {"minLevel":3} 或留空'
                />
              </el-form-item>
              <el-form-item label="点击消耗">
                <el-input
                  v-model="btn.costsJson"
                  type="textarea"
                  :rows="2"
                  placeholder='如 {"spiritStone":10} 或留空'
                />
              </el-form-item>
              <el-form-item label="点击效果">
                <el-input
                  v-model="btn.effectsJson"
                  type="textarea"
                  :rows="2"
                  placeholder='如 {"lifespan":5,"spiritStone":-2} 或留空'
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>

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
.sub-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.buttons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.button-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
}
.button-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
