<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/network'

interface AttributeRef {
  _id: string
  code: string
  name: string
}

interface ScoreTier {
  minScore: number
  maxScore: number
  reward: string
}

interface OpeningRow {
  attributeId: string  // 用于从属性下拉中选择
  code: string         // 实际 key（属性 code）
  value: number
}

interface GameConfig {
  code: 'global'
  basicInfo: { name: string; version: string; description?: string }
  openingInit: Record<string, number>
  optionalLimit: { maxTalentCount: number }
  completionScoreTiers: ScoreTier[]
  battleConfig: object
}

const loading = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = ref<GameConfig>({
  code: 'global',
  basicInfo: { name: '', version: '', description: '' },
  openingInit: {},
  optionalLimit: { maxTalentCount: 3 },
  completionScoreTiers: [],
  battleConfig: {},
})

const attributes = ref<AttributeRef[]>([])

// 内部数组形式的 openingInit 便于编辑
const openingRows = ref<OpeningRow[]>([])
function syncOpeningRows() {
  const rows: OpeningRow[] = []
  for (const [code, value] of Object.entries(form.value.openingInit || {})) {
    const attr = attributes.value.find((a) => a.code === code)
    rows.push({ attributeId: attr?._id ?? '', code, value })
  }
  openingRows.value = rows
}
function buildOpeningInit() {
  const out: Record<string, number> = {}
  for (const r of openingRows.value) {
    if (r.code) out[r.code] = Number(r.value) || 0
  }
  return out
}

function addOpeningRow() {
  openingRows.value.push({ attributeId: '', code: '', value: 0 })
}
function removeOpeningRow(idx: number) {
  openingRows.value.splice(idx, 1)
}
function onOpeningAttrChange(idx: number) {
  const r = openingRows.value[idx]
  const attr = attributes.value.find((a) => a._id === r.attributeId)
  r.code = attr?.code ?? ''
}

function addScoreTier() {
  form.value.completionScoreTiers.push({ minScore: 0, maxScore: 0, reward: '' })
}
function removeScoreTier(idx: number) {
  form.value.completionScoreTiers.splice(idx, 1)
}

const formRules = {
  'basicInfo.name': [{ required: true, message: '请输入游戏名', trigger: 'blur' }],
  'basicInfo.version': [{ required: true, message: '请输入版本', trigger: 'blur' }],
  'optionalLimit.maxTalentCount': [{ required: true, message: '请输入可选上限', trigger: 'blur' }],
}

async function fetchConfig() {
  loading.value = true
  try {
    const [cfg, attrs] = await Promise.all([
      request<GameConfig>('GAME_CONFIG_GET'),
      request<AttributeRef[]>('ATTRIBUTES_LIST'),
    ])
    attributes.value = Array.isArray(attrs) ? attrs : []
    if (cfg) {
      form.value = {
        ...form.value,
        ...cfg,
        basicInfo: {
          name: cfg.basicInfo?.name ?? '',
          version: cfg.basicInfo?.version ?? '',
          description: cfg.basicInfo?.description ?? '',
        },
        openingInit: cfg.openingInit || {},
        optionalLimit: cfg.optionalLimit || { maxTalentCount: 3 },
        completionScoreTiers: cfg.completionScoreTiers || [],
        battleConfig: cfg.battleConfig || {},
      }
      syncOpeningRows()
    } else {
      syncOpeningRows()
    }
  } catch {
    // 错误已统一处理
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = {
      basicInfo: form.value.basicInfo,
      openingInit: buildOpeningInit(),
      optionalLimit: form.value.optionalLimit,
      completionScoreTiers: form.value.completionScoreTiers,
      battleConfig: form.value.battleConfig,
    }
    await request('GAME_CONFIG_UPDATE', payload)
    ElMessage.success('保存成功')
    await fetchConfig()
  } catch {
    // 错误已统一处理
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="page" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <span>全局游戏配置（单例）</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="formRules" label-width="140px">
        <!-- 基本信息 -->
        <div class="section-title">基本信息</div>
        <el-form-item label="游戏名" prop="basicInfo.name">
          <el-input v-model="form.basicInfo.name" placeholder="如 仙途问道" />
        </el-form-item>
        <el-form-item label="版本" prop="basicInfo.version">
          <el-input v-model="form.basicInfo.version" placeholder="如 v0.1 MVP" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.basicInfo.description" type="textarea" :rows="2" />
        </el-form-item>

        <!-- 开局初值 -->
        <div class="section-title">开局初值（属性 code → 初始值）</div>
        <div class="kv-list">
          <div v-for="(row, idx) in openingRows" :key="idx" class="kv-row">
            <el-select
              v-model="row.attributeId"
              placeholder="选择属性"
              filterable
              style="width: 260px"
              @change="onOpeningAttrChange(idx)"
            >
              <el-option
                v-for="a in attributes"
                :key="a._id"
                :value="a._id"
                :label="`${a.name} (${a.code})`"
              />
            </el-select>
            <span class="code-preview">code: <code>{{ row.code || '—' }}</code></span>
            <el-input-number v-model="row.value" :min="-9999" :max="99999" style="width: 130px" />
            <el-button type="danger" text @click="removeOpeningRow(idx)">删除</el-button>
          </div>
          <el-button type="primary" text @click="addOpeningRow">+ 添加属性初值</el-button>
          <span v-if="!openingRows.length" class="muted">（未配置，游戏中将使用默认值）</span>
        </div>

        <!-- 可选上限 -->
        <div class="section-title">天赋可选上限</div>
        <el-form-item label="最大可选天赋数" prop="optionalLimit.maxTalentCount">
          <el-input-number v-model="form.optionalLimit.maxTalentCount" :min="1" :max="99" />
        </el-form-item>

        <!-- 通关评分档位 -->
        <div class="section-title">通关评分档位</div>
        <div class="kv-list">
          <div v-for="(tier, idx) in form.completionScoreTiers" :key="idx" class="tier-row">
            <el-input-number v-model="tier.minScore" :min="0" :max="999" style="width: 110px" />
            <span class="muted">~</span>
            <el-input-number v-model="tier.maxScore" :min="0" :max="999" style="width: 110px" />
            <el-input v-model="tier.reward" placeholder="奖励文字，如 天赋点+1" style="width: 220px" />
            <el-button type="danger" text @click="removeScoreTier(idx)">删除</el-button>
          </div>
          <el-button type="primary" text @click="addScoreTier">+ 添加档位</el-button>
          <span v-if="!form.completionScoreTiers.length" class="muted">（未配置）</span>
        </div>

        <!-- 战斗配置 -->
        <div class="section-title">战斗配置</div>
        <el-form-item label="battleConfig">
          <el-input
            :model-value="JSON.stringify(form.battleConfig || {}, null, 2)"
            type="textarea"
            :rows="3"
            readonly
            placeholder="S1 阶段占位为 {}，S3 战斗模块启用后再配置"
          />
          <span class="muted">（S1 阶段不可编辑；S3 战斗模块启用后开放）</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">保存全部</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 8px 0 12px; padding-left: 8px; border-left: 3px solid #409eff; }
.section-title:not(:first-child) { margin-top: 24px; }
.kv-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.kv-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tier-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.code-preview { font-size: 12px; color: #909399; }
.code-preview code { background: #f4f4f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
.muted { color: #909399; font-size: 12px; margin-left: 8px; }
</style>
