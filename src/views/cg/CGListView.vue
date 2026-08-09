<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { ossDomain } from '@/config/servers'
import { resolveAssetUrl } from '@/utils/asset'
import ImagePathInput from '@/components/ImagePathInput.vue'

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

const MIN_STAGES = 2

// 打开弹窗时确保 originalUrls 是数组且至少 MIN_STAGES 个（新建/编辑均适用）
watch(dialogVisible, (v) => {
  if (v) {
    if (!Array.isArray(dialogForm.value.originalUrls)) {
      dialogForm.value.originalUrls = []
    }
    while (dialogForm.value.originalUrls.length < MIN_STAGES) {
      dialogForm.value.originalUrls.push('')
    }
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

function thumbPreview(url?: string) {
  return resolveAssetUrl(url || '', ossDomain)
}

function phasePreviewList(urls?: string[]) {
  return (urls || []).map((url) => thumbPreview(url)).filter(Boolean)
}

// 提交前清理 originalUrls：trim 去空字符串
async function handleSubmit() {
  if (Array.isArray(dialogForm.value.originalUrls)) {
    dialogForm.value.originalUrls = dialogForm.value.originalUrls
      .map((v: string) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v: string) => v.length > 0)
  }
  await submit()
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
            :preview-src-list="[thumbPreview(row.thumbnailUrl || row.originalUrls?.[0])]"
            preview-teleported
            style="width: 60px; height: 60px; object-fit: cover"
            fit="cover"
          />
          <span v-else class="text-gray">—</span>
        </template>
      </el-table-column>
      <el-table-column label="阶段图" width="140">
        <template #default="{ row }">
          <div v-if="phasePreviewList(row.originalUrls).length" class="phase-thumbs">
            <el-image
              v-for="(url, idx) in phasePreviewList(row.originalUrls)"
              :key="`${row._id || row.code}-phase-${idx}`"
              :src="url"
              :preview-src-list="phasePreviewList(row.originalUrls)"
              :initial-index="idx"
              preview-teleported
              class="phase-thumb"
              fit="cover"
            />
          </div>
          <el-tag v-else type="info" size="small">无</el-tag>
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
          <ImagePathInput v-model="dialogForm.thumbnailUrl" />
        </el-form-item>

        <el-form-item label="CG 阶段图">
          <div class="stage-list">
            <div
              v-for="(_url, idx) in (dialogForm.originalUrls || [])"
              :key="idx"
              class="stage-row"
            >
              <span class="stage-idx">第 {{ idx + 1 }} 阶段</span>
              <ImagePathInput
                v-model="dialogForm.originalUrls[idx]"
                :thumb-size="48"
                :show-full-url="false"
              />
              <el-button
                type="danger"
                link
                :disabled="(dialogForm.originalUrls || []).length <= MIN_STAGES"
                @click="removeStage(idx)"
              >删除</el-button>
            </div>
            <el-button
              :disabled="(dialogForm.originalUrls || []).length >= MAX_STAGES"
              @click="addStage"
            >
              + 新增阶段图（最多 {{ MAX_STAGES }} 张）
            </el-button>
            <div class="hint">
              最多 4 张，对应第 1~4 阶段。只需填域名后的相对路径；粘贴完整 URL 会自动去掉域名。
            </div>
          </div>
        </el-form-item>

        <el-form-item label="未解锁占位图">
          <ImagePathInput v-model="dialogForm.placeholderUrl" />
        </el-form-item>

        <el-form-item label="回看剧情文字">
          <el-input v-model="dialogForm.reviewText" type="textarea" :rows="4" />
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
.text-gray {
  color: #9ca3af;
}
.stage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.phase-thumbs {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}
.phase-thumb {
  width: 38px;
  height: 38px;
  border-radius: 3px;
}
.stage-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stage-row :deep(.image-path-input) {
  flex: 1 1 auto;
  min-width: 0;
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
