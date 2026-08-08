<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { request } from '@/network'
import { useCrud } from '@/composables/useCrud'
import { ossDomain } from '@/config/servers'
import { resolveAssetUrl } from '@/utils/asset'
import ImagePathInput from '@/components/ImagePathInput.vue'

type ItemType = 'relic' | 'consumable' | 'plot'
type TabValue = ItemType | 'all'

interface AttributeRef {
  _id: string
  code: string
  name: string
}

interface AttributeEffect {
  attributeId: string
  value: number
  durationNodes?: number
  kind?: 'buff' | 'debuff'
}

interface Item {
  _id: string
  code: string
  type: ItemType
  name: string
  description?: string
  imageUrl?: string
  // relic
  quality?: 'common' | 'rare' | 'epic' | 'legendary'
  permanent?: boolean
  purchasable?: boolean
  nodeReward?: boolean
  // consumable
  consumablePerUse?: number
  maxHold?: number
  useCondition?: string
  lifespan?: number
  // shared
  attributes?: AttributeEffect[]
  createdAt?: string
  updatedAt?: string
}

const TYPE_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'relic', label: '遗物' },
  { value: 'consumable', label: '消耗品' },
  { value: 'plot', label: '剧情道具' },
]
const QUALITY_LABEL: Record<string, string> = {
  common: '凡',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}
const QUALITY_TAG: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  common: 'info',
  rare: 'success',
  epic: 'warning',
  legendary: 'danger',
}

const currentType = ref<TabValue>('all')

const { list, loading, dialogVisible, dialogMode, dialogForm, dialogLoading, fetchList, openCreate, openEdit, closeDialog, submit, remove } =
  useCrud<Item>(
    {
      list: 'ITEMS_LIST',
      create: 'ITEMS_CREATE',
      update: 'ITEMS_UPDATE',
      remove: 'ITEMS_DELETE',
    },
    { listQuery: () => (currentType.value === 'all' ? {} : { type: currentType.value }) },
  )

watch(currentType, () => fetchList())

// 属性下拉（用于 attributes[] 编辑器）
const attributes = ref<AttributeRef[]>([])
async function fetchAttributes() {
  try {
    const data = await request<AttributeRef[]>('ATTRIBUTES_LIST')
    attributes.value = Array.isArray(data) ? data : []
  } catch {
    attributes.value = []
  }
}

// 切换 tab 时类型写回（dialogForm.type 需与 currentType 同步）
function onAdd() {
  const initType: ItemType = currentType.value === 'all' ? 'relic' : currentType.value
  openCreate({ type: initType, attributes: [], permanent: false, purchasable: false, nodeReward: false })
}

// 表单校验
const formRef = ref()
const formRules = {
  code: [
    { required: true, message: '请输入业务标识 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: 'code 必须以小写字母开头，仅含小写字母/数字/下划线', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // plot 类型强制清空 attributes（服务端默认 []）
  if (dialogForm.value.type === 'plot') {
    dialogForm.value.attributes = []
  } else if (!Array.isArray(dialogForm.value.attributes)) {
    dialogForm.value.attributes = []
  }
  await submit()
}

// attributes[] 子编辑器操作
function addAttributeRow() {
  if (!Array.isArray(dialogForm.value.attributes)) dialogForm.value.attributes = []
  dialogForm.value.attributes.push({ attributeId: '', value: 0, kind: 'buff' })
}
function removeAttributeRow(idx: number) {
  dialogForm.value.attributes.splice(idx, 1)
}

function thumb(url?: string) {
  return resolveAssetUrl(url || '', ossDomain)
}

onMounted(() => {
  fetchList()
  fetchAttributes()
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <el-tabs v-model="currentType" class="item-tabs">
        <el-tab-pane v-for="t in TYPE_TABS" :key="t.value" :name="t.value" :label="t.label" />
      </el-tabs>

      <div class="toolbar">
        <span class="hint">当前列表：{{ TYPE_TABS.find((x) => x.value === currentType)?.label }}</span>
        <div class="spacer" />
        <el-button type="primary" @click="onAdd">+ 新增{{ currentType === 'all' ? '物品' : TYPE_TABS.find((x) => x.value === currentType)?.label }}</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="thumb(row.imageUrl)"
              :src="thumb(row.imageUrl)"
              :preview-src-list="[thumb(row.imageUrl)]"
              preview-teleported
              style="width: 44px; height: 44px"
              fit="cover"
            />
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="业务标识" width="160" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="description" label="说明" />
        <el-table-column v-if="currentType === 'all'" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ TYPE_TABS.find((x) => x.value === row.type)?.label ?? row.type }}</el-tag>
          </template>
        </el-table-column>

        <!-- relic 字段 -->
        <template v-if="currentType === 'relic'">
          <el-table-column prop="quality" label="品质" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.quality" :type="QUALITY_TAG[row.quality]" size="small">
                {{ QUALITY_LABEL[row.quality] ?? row.quality }}
              </el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="永久保留" width="100" align="center">
            <template #default="{ row }">{{ row.permanent ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="可购买" width="80" align="center">
            <template #default="{ row }">{{ row.purchasable ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="节点奖励" width="100" align="center">
            <template #default="{ row }">{{ row.nodeReward ? '是' : '否' }}</template>
          </el-table-column>
        </template>

        <!-- consumable 字段 -->
        <template v-else-if="currentType === 'consumable'">
          <el-table-column prop="consumablePerUse" label="每次消耗" width="100" align="right" />
          <el-table-column prop="maxHold" label="最大持有" width="100" align="right" />
          <el-table-column prop="useCondition" label="使用条件" />
        </template>

        <!-- plot 字段 -->
        <template v-else>
          <el-table-column label="可购买" width="80" align="center">
            <template #default="{ row }">{{ row.purchasable ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="节点奖励" width="100" align="center">
            <template #default="{ row }">{{ row.nodeReward ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column prop="maxHold" label="最大持有" width="100" align="right" />
        </template>

        <el-table-column label="属性效果数" width="100" align="right">
          <template #default="{ row }">{{ (row.attributes || []).length }}</template>
        </el-table-column>

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
      :title="dialogMode === 'create' ? '新增物品' : '编辑物品'"
      width="640px"
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <el-form ref="formRef" :model="dialogForm" :rules="formRules" label-width="100px">
        <el-form-item label="业务标识" prop="code">
          <el-input v-model="dialogForm.code" placeholder="如 rel_01 / con_01 / plot_01" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="dialogForm.type" :disabled="dialogMode === 'edit'">
            <el-radio value="relic">遗物</el-radio>
            <el-radio value="consumable">消耗品</el-radio>
            <el-radio value="plot">剧情道具</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="dialogForm.name" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="dialogForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="图片">
          <ImagePathInput v-model="dialogForm.imageUrl" />
        </el-form-item>

        <!-- relic 专属 -->
        <template v-if="dialogForm.type === 'relic'">
          <el-form-item label="品质">
            <el-select v-model="dialogForm.quality" placeholder="不选则无品质" clearable style="width: 200px">
              <el-option v-for="q in ['common', 'rare', 'epic', 'legendary']" :key="q" :value="q" :label="QUALITY_LABEL[q]" />
            </el-select>
          </el-form-item>
          <el-form-item label="永久保留">
            <el-switch v-model="dialogForm.permanent" />
            <span class="muted">（重生不消失）</span>
          </el-form-item>
          <el-form-item label="可购买">
            <el-switch v-model="dialogForm.purchasable" />
          </el-form-item>
          <el-form-item label="节点奖励">
            <el-switch v-model="dialogForm.nodeReward" />
          </el-form-item>
        </template>

        <!-- consumable 专属 -->
        <template v-else-if="dialogForm.type === 'consumable'">
          <el-form-item label="每次消耗">
            <el-input-number v-model="dialogForm.consumablePerUse" :min="1" :max="999" />
          </el-form-item>
          <el-form-item label="最大持有">
            <el-input-number v-model="dialogForm.maxHold" :min="0" :max="9999" />
          </el-form-item>
          <el-form-item label="使用条件">
            <el-input v-model="dialogForm.useCondition" />
          </el-form-item>
          <el-form-item label="寿元增益">
            <el-input-number v-model="dialogForm.lifespan" :min="0" :max="9999" />
            <span class="muted">（消耗品使用增加的寿元，独立字段，不计入属性）</span>
          </el-form-item>
        </template>

        <!-- plot 专属 -->
        <template v-else-if="dialogForm.type === 'plot'">
          <el-form-item label="可购买">
            <el-switch v-model="dialogForm.purchasable" />
          </el-form-item>
          <el-form-item label="节点奖励">
            <el-switch v-model="dialogForm.nodeReward" />
          </el-form-item>
          <el-form-item label="最大持有">
            <el-input-number v-model="dialogForm.maxHold" :min="0" :max="999" />
          </el-form-item>
        </template>

        <!-- 属性效果数组（relic/consumable 才有） -->
        <template v-if="dialogForm.type !== 'plot'">
          <el-divider content-position="left">属性效果</el-divider>
          <div class="effects-list">
            <div v-for="(eff, idx) in (dialogForm.attributes || [])" :key="idx" class="effects-row">
              <el-select v-model="eff.attributeId" placeholder="选择属性" filterable style="width: 220px">
                <el-option
                  v-for="a in attributes"
                  :key="a._id"
                  :value="a._id"
                  :label="`${a.name} (${a.code})`"
                />
              </el-select>
              <el-input-number v-model="eff.value" :min="-9999" :max="9999" style="width: 110px" />
              <el-input-number
                v-if="dialogForm.type === 'consumable'"
                v-model="eff.durationNodes"
                :min="0"
                :max="999"
                placeholder="持续节点"
                style="width: 130px"
              />
              <el-select v-model="eff.kind" placeholder="buff/debuff" clearable style="width: 130px">
                <el-option value="buff" label="增益" />
                <el-option value="debuff" label="减益" />
              </el-select>
              <el-button type="danger" text @click="removeAttributeRow(idx)">删除</el-button>
            </div>
            <el-button type="primary" text @click="addAttributeRow">+ 添加效果</el-button>
            <span v-if="!dialogForm.attributes?.length" class="muted">（未配置）</span>
          </div>
        </template>
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
.item-tabs { margin-bottom: 8px; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; }
.hint { color: #909399; font-size: 13px; }
.spacer { flex: 1; }
.muted { color: #909399; font-size: 12px; margin-left: 8px; }
.effects-list { display: flex; flex-direction: column; gap: 8px; }
.effects-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
</style>
