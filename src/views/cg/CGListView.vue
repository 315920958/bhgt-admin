<script setup lang="ts">
import { onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

interface CG {
  _id?: string
  code: string
  name: string
  thumbnailUrl?: string
  originalUrl?: string
  placeholderUrl?: string
  reviewText?: string
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
} = useCrud<CG>({
  list: 'CGS_LIST',
  create: 'CGS_CREATE',
  update: 'CGS_UPDATE',
  remove: 'CGS_DELETE',
})

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
      <el-table-column label="缩略图" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.thumbnailUrl"
            :src="row.thumbnailUrl"
            style="width: 60px; height: 60px; object-fit: cover"
            fit="cover"
          />
          <span v-else class="text-gray">—</span>
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
      width="680px"
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

        <el-form-item label="缩略图">
          <el-input v-model="dialogForm.thumbnailUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="CG 原图">
          <el-input v-model="dialogForm.originalUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="未解锁占位图">
          <el-input v-model="dialogForm.placeholderUrl" placeholder="https://..." />
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
</style>
