<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { assetBaseUrl } from '@/config/servers'
import { stripAssetDomain, resolveAssetUrl } from '@/utils/asset'

interface CG {
  _id?: string
  code: string
  name: string
  thumbnailUrl?: string
  originalUrls?: string[]
  placeholderUrl?: string
  reviewText?: string
}

const MAX_STAGES = 4

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
} = useCrud<CG>({
  list: 'CGS_LIST',
  create: 'CGS_CREATE',
  update: 'CGS_UPDATE',
  remove: 'CGS_DELETE',
})

// 打开弹窗时确保 originalUrls 是数组（兼容新建/旧数据缺字段）
watch(dialogVisible, (v) => {
  if (v && !Array.isArray(dialogForm.value.originalUrls)) {
    dialogForm.value.originalUrls = []
  }
})

function addStage() {
  if (!Array.isArray(dialogForm.value.originalUrls)) dialogForm.value.originalUrls = []
  if (dialogForm.value.originalUrls.length >= MAX_STAGES) return
  dialogForm.value.originalUrls.push('')
}

function removeStage(idx: number) {
  dialogForm.value.originalUrls?.splice(idx, 1)
}

type PasteTarget = 'thumbnail' | 'placeholder' | { stage: number }

// 粘贴完整 URL 时自动去掉域名 / 配置的基础地址，只保留相对路径
function onPaste(e: ClipboardEvent, target: PasteTarget) {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  e.preventDefault()
  const stripped = stripAssetDomain(text, assetBaseUrl)
  if (target === 'thumbnail') dialogForm.value.thumbnailUrl = stripped
  else if (target === 'placeholder') dialogForm.value.placeholderUrl = stripped
  else dialogForm.value.originalUrls[target.stage] = stripped
}

// 失焦时再规整一次（手动输入 / 编辑后仍是完整 URL 的情况）
function onBlur(field: 'thumbnail' | 'placeholder' | number) {
  if (typeof field === 'number') {
    const v = dialogForm.value.originalUrls?.[field]
    if (v) dialogForm.value.originalUrls[field] = stripAssetDomain(v, assetBaseUrl)
  } else if (field === 'thumbnail') {
    const v = dialogForm.value.thumbnailUrl
    if (v) dialogForm.value.thumbnailUrl = stripAssetDomain(v, assetBaseUrl)
  } else {
    const v = dialogForm.value.placeholderUrl
    if (v) dialogForm.value.placeholderUrl = stripAssetDomain(v, assetBaseUrl)
  }
}

function stagePreview(idx: number) {
  return resolveAssetUrl(dialogForm.value.originalUrls?.[idx] || '', assetBaseUrl)
}

function thumbPreview(url?: string) {
  return resolveAssetUrl(url || '', assetBaseUrl)
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="page-header">
      <h3>CG 图鉴配置</h3>
      <el-button type="primary" @click="openCreate()">+ 新增 CG</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="CG ID" width="140" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image
            v-if="thumbPreview(row.thumbnailUrl || row.originalUrls?.[0])"
            :src="thumbPreview(row.thumbnailUrl || row.originalUrls?.[0])"
            style="width: 60px; height: 60px; object-fit: cover"
            fit="cover"
          />
          <span v-else class="text-gray">—</span>
        </template>
      </el-table-column>
      <el-table-column label="阶段图" width="140">
        <template #default="{ row }">
          <el-tag v-if="!(row.originalUrls?.length)" type="info" size="small">无</el-tag>
          <span v-else>{{ row.originalUrls.length }} / {{ MAX_STAGES }}</span>
        </template>
      </el-table-column>
      <el-table-column label="回看剧情" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.reviewText || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增 CG' : '编辑 CG'"
      width="720px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="CG ID" required>
              <el-input v-model="dialogForm.code" placeholder="cg_01" :disabled="dialogMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="dialogForm.name" placeholder="初入仙门" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="封面缩略图">
          <el-input
            v-model="dialogForm.thumbnailUrl"
            placeholder="粘贴图片路径（自动去域名）"
            @blur="onBlur('thumbnail')"
            @paste="onPaste($event, 'thumbnail')"
          />
        </el-form-item>

        <el-form-item label="CG 阶段图">
          <div class="stage-list">
            <div
              v-for="(url, idx) in (dialogForm.originalUrls || [])"
              :key="idx"
              class="stage-row"
            >
              <span class="stage-idx">第 {{ idx + 1 }} 阶段</span>
              <el-input
                v-model="dialogForm.originalUrls[idx]"
                placeholder="粘贴图片路径（自动去域名）"
                @blur="onBlur(idx)"
                @paste="onPaste($event, { stage: idx })"
              />
              <el-image
                v-if="stagePreview(idx)"
                :src="stagePreview(idx)"
                style="width: 48px; height: 48px; object-fit: cover"
                fit="cover"
              />
              <el-button type="danger" link @click="removeStage(idx)">删除</el-button>
            </div>
            <el-button
              :disabled="(dialogForm.originalUrls || []).length >= MAX_STAGES"
              @click="addStage"
            >
              + 新增阶段图（最多 {{ MAX_STAGES }} 张）
            </el-button>
            <div class="hint">
              最多 4 张，对应第 1~4 阶段。粘贴完整 URL 会自动去掉域名，只保留相对路径。
            </div>
          </div>
        </el-form-item>

        <el-form-item label="未解锁占位图">
          <el-input
            v-model="dialogForm.placeholderUrl"
            placeholder="粘贴图片路径（自动去域名）"
            @blur="onBlur('placeholder')"
            @paste="onPaste($event, 'placeholder')"
          />
        </el-form-item>

        <el-form-item label="回看剧情文字">
          <el-input v-model="dialogForm.reviewText" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="dialogLoading">保存</el-button>
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
.text-gray {
  color: #9ca3af;
}
.stage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.stage-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stage-idx {
  flex: 0 0 64px;
  color: #6b7280;
  font-size: 13px;
}
.hint {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}
</style>
