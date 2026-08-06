<script setup lang="ts">
import { onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

interface Realm {
  _id?: string
  code: string
  name: string
  order: number
  levels: number
  progressPerLevel: number
  breakthrough: {
    success: {
      hpBonus: number
      attributePoints: number
      perAttributeCap: number
    }
    failure: {
      hpPenalty: number
    }
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
} = useCrud<Realm>({
  list: 'REALMS_LIST',
  create: 'REALMS_CREATE',
  update: 'REALMS_UPDATE',
  remove: 'REALMS_DELETE',
})

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="page-header">
      <h3>境界配置</h3>
      <el-button type="primary" @click="openCreate({ breakthrough: { success: { hpBonus: 0, attributePoints: 0, perAttributeCap: 0 }, failure: { hpPenalty: 0 } } })">+ 新增境界</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="境界 ID" width="140" />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column prop="order" label="顺序" width="80" />
      <el-table-column prop="levels" label="层数" width="80" />
      <el-table-column prop="progressPerLevel" label="每层修为" width="120" />
      <el-table-column label="突破成功" min-width="200">
        <template #default="{ row }">
          <span v-if="row.breakthrough?.success">
            寿元+{{ row.breakthrough.success.hpBonus }} /
            属性点{{ row.breakthrough.success.attributePoints }} /
            单项上限{{ row.breakthrough.success.perAttributeCap }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="breakthrough.failure.hpPenalty" label="失败扣寿元" width="110" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增境界' : '编辑境界'"
      width="720px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="境界 ID" required>
              <el-input v-model="dialogForm.code" placeholder="qi_refining" :disabled="dialogMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="dialogForm.name" placeholder="练气期" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="顺序" required>
              <el-input-number v-model="dialogForm.order" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="层数" required>
              <el-input-number v-model="dialogForm.levels" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每层修为" required>
              <el-input-number v-model="dialogForm.progressPerLevel" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">突破成功</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="寿元增加">
              <el-input-number v-model="dialogForm.breakthrough.success.hpBonus" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可分配属性点">
              <el-input-number v-model="dialogForm.breakthrough.success.attributePoints" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单项分配上限">
              <el-input-number v-model="dialogForm.breakthrough.success.perAttributeCap" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">突破失败</el-divider>
        <el-form-item label="扣寿元">
          <el-input-number v-model="dialogForm.breakthrough.failure.hpPenalty" :min="0" style="width: 100%" />
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
