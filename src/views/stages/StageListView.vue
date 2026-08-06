<script setup lang="ts">
import { onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

interface Stage {
  _id?: string
  code: string
  name: string
  order: number
  description?: string
  atmosphere?: string
  mapImageUrl?: string
  lastNodeCode?: string
  hpRestoreType: 'none' | 'fixed' | 'full'
  hpRestoreValue?: number
  nextStageCode?: string
  passText?: string
  passImageUrl?: string
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
} = useCrud<Stage>({
  list: 'STAGES_LIST',
  create: 'STAGES_CREATE',
  update: 'STAGES_UPDATE',
  remove: 'STAGES_DELETE',
})

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="page-header">
      <h3>大阶段配置</h3>
      <el-button type="primary" @click="openCreate({ hpRestoreType: 'none' })">+ 新增阶段</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="阶段 ID" width="140" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column prop="order" label="顺序" width="80" />
      <el-table-column prop="lastNodeCode" label="最后节点" width="140" />
      <el-table-column prop="nextStageCode" label="下一阶段" width="140" />
      <el-table-column prop="hpRestoreType" label="寿元处理" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.hpRestoreType === 'none'">不恢复</el-tag>
          <el-tag v-else-if="row.hpRestoreType === 'fixed'" type="success">固定恢复</el-tag>
          <el-tag v-else type="warning">回满</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增阶段' : '编辑阶段'"
      width="720px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="阶段 ID" required>
              <el-input v-model="dialogForm.code" placeholder="stage_01" :disabled="dialogMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="dialogForm.name" placeholder="初入仙门" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="顺序" required>
              <el-input-number v-model="dialogForm.order" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="寿元处理">
              <el-select v-model="dialogForm.hpRestoreType" placeholder="请选择" style="width: 100%">
                <el-option label="不恢复" value="none" />
                <el-option label="固定恢复" value="fixed" />
                <el-option label="回满" value="full" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="固定恢复值" v-if="dialogForm.hpRestoreType === 'fixed'">
          <el-input-number v-model="dialogForm.hpRestoreValue" :min="0" style="width: 100%" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最后节点 ID">
              <el-input v-model="dialogForm.lastNodeCode" placeholder="N020" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下一阶段 ID">
              <el-input v-model="dialogForm.nextStageCode" placeholder="stage_02" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="氛围描述">
          <el-input v-model="dialogForm.atmosphere" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="阶段说明">
          <el-input v-model="dialogForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="地图图片">
              <el-input v-model="dialogForm.mapImageUrl" placeholder="https://..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通关图片">
              <el-input v-model="dialogForm.passImageUrl" placeholder="https://..." />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="通关文案">
          <el-input v-model="dialogForm.passText" type="textarea" :rows="3" />
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
</style>
