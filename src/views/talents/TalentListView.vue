<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request } from '@/network'
import { useCrud } from '@/composables/useCrud'

// ============ 类型定义 ============
interface AttributeRef {
  _id: string
  code: string
  name: string
}

interface AttributeEffect {
  attributeId: string
  value: number
}

interface Talent {
  _id: string
  code: string
  name: string
  description: string
  qualityId: string
  effect: {
    attributeEffects?: AttributeEffect[]
    specialEffect?: string
  }
  createdAt?: string
  updatedAt?: string
}

interface TalentQuality {
  _id: string
  code: string
  name: string
  color?: string
  weight?: number
}

// ============ 共享数据 ============
const activeTab = ref<'talents' | 'qualities'>('talents')

const attributes = ref<AttributeRef[]>([])
const qualities = ref<TalentQuality[]>([])
async function fetchShared() {
  try {
    const [attrs, qs] = await Promise.all([
      request<AttributeRef[]>('ATTRIBUTES_LIST'),
      request<TalentQuality[]>('TALENT_QUALITIES_LIST'),
    ])
    attributes.value = Array.isArray(attrs) ? attrs : []
    qualities.value = Array.isArray(qs) ? qs : []
  } catch {
    // 错误已统一处理
  }
}

function getQualityName(id: string) {
  return qualities.value.find((q) => q._id === id)?.name ?? id
}
function getQualityColor(id: string) {
  return qualities.value.find((q) => q._id === id)?.color ?? ''
}

// ============ 天赋列表 CRUD ============
const tFormRef = ref()
const tFormRules = {
  code: [
    { required: true, message: '请输入业务标识 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: 'code 必须以小写字母开头，仅含小写字母/数字/下划线', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入说明', trigger: 'blur' }],
  qualityId: [{ required: true, message: '请选择品质', trigger: 'change' }],
}

const {
  list: talentList,
  loading: tLoading,
  dialogVisible: tDialogVisible,
  dialogMode: tDialogMode,
  dialogForm: tDialogForm,
  dialogLoading: tDialogLoading,
  fetchList: fetchTalents,
  openCreate: tOpenCreate,
  openEdit: tOpenEdit,
  closeDialog: tCloseDialog,
  submit: tSubmit,
  remove: tRemove,
} = useCrud<Talent>({
  list: 'TALENTS_LIST',
  create: 'TALENTS_CREATE',
  update: 'TALENTS_UPDATE',
  remove: 'TALENTS_DELETE',
})

function tOnAdd() {
  tOpenCreate({ effect: { attributeEffects: [] } })
}

async function tOnSubmit() {
  if (!tFormRef.value) return
  try {
    await tFormRef.value.validate()
  } catch {
    return
  }
  // 保证 effect 必存在
  if (!tDialogForm.value.effect) tDialogForm.value.effect = { attributeEffects: [] }
  if (!Array.isArray(tDialogForm.value.effect.attributeEffects)) tDialogForm.value.effect.attributeEffects = []
  await tSubmit()
}

function tAddEffectRow() {
  if (!tDialogForm.value.effect) tDialogForm.value.effect = {}
  if (!tDialogForm.value.effect.attributeEffects) tDialogForm.value.effect.attributeEffects = []
  tDialogForm.value.effect.attributeEffects.push({ attributeId: '', value: 0 })
}
function tRemoveEffectRow(idx: number) {
  tDialogForm.value.effect.attributeEffects.splice(idx, 1)
}

// ============ 天赋品质 CRUD ============
const qFormRef = ref()
const qFormRules = {
  code: [
    { required: true, message: '请输入业务标识 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: 'code 必须以小写字母开头，仅含小写字母/数字/下划线', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
}

const {
  list: qualityList,
  loading: qLoading,
  dialogVisible: qDialogVisible,
  dialogMode: qDialogMode,
  dialogForm: qDialogForm,
  dialogLoading: qDialogLoading,
  fetchList: fetchQualities,
  openCreate: qOpenCreate,
  openEdit: qOpenEdit,
  closeDialog: qCloseDialog,
  submit: qSubmit,
  remove: qRemove,
} = useCrud<TalentQuality>({
  list: 'TALENT_QUALITIES_LIST',
  create: 'TALENT_QUALITIES_CREATE',
  update: 'TALENT_QUALITIES_UPDATE',
  remove: 'TALENT_QUALITIES_DELETE',
})

function qOnAdd() {
  qOpenCreate({ weight: 0 })
}

async function qOnSubmit() {
  if (!qFormRef.value) return
  try {
    await qFormRef.value.validate()
  } catch {
    return
  }
  await qSubmit()
}

onMounted(() => {
  fetchShared()
  fetchTalents()
  fetchQualities()
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <!-- ============ Tab 1: 天赋列表 ============ -->
        <el-tab-pane name="talents" label="天赋列表">
          <div class="toolbar">
            <el-button type="primary" @click="tOnAdd">+ 新增天赋</el-button>
          </div>
          <el-table v-loading="tLoading" :data="talentList" stripe border>
            <el-table-column prop="code" label="业务标识" width="160" />
            <el-table-column prop="name" label="名称" width="160" />
            <el-table-column label="品质" width="120">
              <template #default="{ row }">
                <el-tag
                  v-if="getQualityColor(row.qualityId)"
                  :style="{ background: getQualityColor(row.qualityId), color: '#fff', borderColor: getQualityColor(row.qualityId) }"
                  size="small"
                >
                  {{ getQualityName(row.qualityId) }}
                </el-tag>
                <span v-else>{{ getQualityName(row.qualityId) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
            <el-table-column label="效果" width="240">
              <template #default="{ row }">
                <div v-for="(eff, i) in (row.effect?.attributeEffects || [])" :key="i" class="effect-line">
                  {{ attributes.find((a) => a._id === eff.attributeId)?.name ?? '?' }} {{ eff.value >= 0 ? '+' : '' }}{{ eff.value }}
                </div>
                <div v-if="row.effect?.specialEffect" class="effect-line special">
                  {{ row.effect.specialEffect }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="tOpenEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="tRemove(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ============ Tab 2: 品质管理 ============ -->
        <el-tab-pane name="qualities" label="品质管理">
          <div class="toolbar">
            <el-button type="primary" @click="qOnAdd">+ 新增品质</el-button>
          </div>
          <el-table v-loading="qLoading" :data="qualityList" stripe border>
            <el-table-column prop="code" label="业务标识" width="160" />
            <el-table-column prop="name" label="显示名" width="120" />
            <el-table-column label="颜色" width="160">
              <template #default="{ row }">
                <div class="color-cell">
                  <span class="color-swatch" :style="{ background: row.color || '#ccc' }" />
                  <span>{{ row.color || '—' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="随机权重" width="120" align="right" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="qOpenEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="qRemove(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ============ 天赋编辑弹窗 ============ -->
    <el-dialog
      v-model="tDialogVisible"
      :title="tDialogMode === 'create' ? '新增天赋' : '编辑天赋'"
      width="640px"
      :close-on-click-modal="false"
      @close="tCloseDialog"
    >
      <el-form ref="tFormRef" :model="tDialogForm" :rules="tFormRules" label-width="100px">
        <el-form-item label="业务标识" prop="code">
          <el-input v-model="tDialogForm.code" :disabled="tDialogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="tDialogForm.name" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="tDialogForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="品质" prop="qualityId">
          <el-select v-model="tDialogForm.qualityId" placeholder="选择品质" style="width: 100%">
            <el-option
              v-for="q in qualities"
              :key="q._id"
              :value="q._id"
              :label="q.name"
            >
              <span :style="{ color: q.color }">●</span>
              <span style="margin-left: 6px">{{ q.name }}（{{ q.code }}）</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-divider content-position="left">属性效果</el-divider>
        <div class="effects-list">
          <div v-for="(eff, idx) in (tDialogForm.effect?.attributeEffects || [])" :key="idx" class="effects-row">
            <el-select v-model="eff.attributeId" placeholder="选择属性" filterable style="width: 280px">
              <el-option
                v-for="a in attributes"
                :key="a._id"
                :value="a._id"
                :label="`${a.name} (${a.code})`"
              />
            </el-select>
            <el-input-number v-model="eff.value" :min="-9999" :max="9999" style="width: 130px" />
            <el-button type="danger" text @click="tRemoveEffectRow(idx)">删除</el-button>
          </div>
          <el-button type="primary" text @click="tAddEffectRow">+ 添加属性效果</el-button>
        </div>

        <el-form-item label="特殊效果" style="margin-top: 12px">
          <el-input
            v-model="tDialogForm.effect.specialEffect"
            type="textarea"
            :rows="2"
            placeholder="文本描述特殊效果（如 突破时额外获得 1 点天赋点）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tCloseDialog">取消</el-button>
        <el-button type="primary" :loading="tDialogLoading" @click="tOnSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- ============ 品质编辑弹窗 ============ -->
    <el-dialog
      v-model="qDialogVisible"
      :title="qDialogMode === 'create' ? '新增品质' : '编辑品质'"
      width="500px"
      :close-on-click-modal="false"
      @close="qCloseDialog"
    >
      <el-form ref="qFormRef" :model="qDialogForm" :rules="qFormRules" label-width="100px">
        <el-form-item label="业务标识" prop="code">
          <el-input v-model="qDialogForm.code" :disabled="qDialogMode === 'edit'" placeholder="common / rare / epic / legendary" />
        </el-form-item>
        <el-form-item label="显示名" prop="name">
          <el-input v-model="qDialogForm.name" placeholder="凡 / 稀有 / 史诗 / 传说" />
        </el-form-item>
        <el-form-item label="显示色">
          <el-color-picker v-model="qDialogForm.color" />
          <span class="muted">（前端展示色，hex 如 #B5B0A5）</span>
        </el-form-item>
        <el-form-item label="随机权重">
          <el-input-number v-model="qDialogForm.weight" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qCloseDialog">取消</el-button>
        <el-button type="primary" :loading="qDialogLoading" @click="qOnSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; }
.muted { color: #909399; font-size: 12px; margin-left: 8px; }
.effect-line { font-size: 12px; line-height: 1.6; }
.effect-line.special { color: #909399; font-style: italic; }
.color-cell { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 12px; }
.color-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #dcdfe6; }
.effects-list { display: flex; flex-direction: column; gap: 8px; }
.effects-row { display: flex; gap: 8px; align-items: center; }
</style>
