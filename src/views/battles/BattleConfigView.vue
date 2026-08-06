<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'

interface BattleTier {
  _id?: string
  code: string
  name: string
  minExcess: number
  maxExcess: number
  score: number
}

interface GameConfig {
  basicInfo: { name: string; version: string; description?: string }
  openingInit: Record<string, number>
  optionalLimit: { maxTalentCount: number }
  completionScoreTiers: any[]
  battleConfig: {
    scoreMultiplier?: number
  }
}

const gameConfig = ref<GameConfig | null>(null)
const gameLoading = ref(false)
const scoreMultiplier = ref(1)

async function fetchGameConfig() {
  gameLoading.value = true
  try {
    gameConfig.value = await request<GameConfig>('GAME_CONFIG_GET')
    scoreMultiplier.value = gameConfig.value?.battleConfig?.scoreMultiplier ?? 1
  } catch {
    gameConfig.value = null
  } finally {
    gameLoading.value = false
  }
}

async function saveMultiplier() {
  if (!gameConfig.value) return
  gameLoading.value = true
  try {
    const next = {
      ...gameConfig.value,
      battleConfig: {
        ...gameConfig.value.battleConfig,
        scoreMultiplier: scoreMultiplier.value,
      },
    }
    await request('GAME_CONFIG_UPDATE', next)
    ElMessage.success('全局乘数已保存')
    await fetchGameConfig()
  } finally {
    gameLoading.value = false
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
} = useCrud<BattleTier>({
  list: 'BATTLES_LIST',
  create: 'BATTLES_CREATE',
  update: 'BATTLES_UPDATE',
  remove: 'BATTLES_DELETE',
})

onMounted(() => {
  fetchGameConfig()
  fetchList()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>战斗评分配置</h3>
    </div>

    <el-card class="config-card" v-loading="gameLoading">
      <template #header>
        <span>全局评分乘数</span>
      </template>
      <el-form inline>
        <el-form-item label="评分乘数">
          <el-input-number v-model="scoreMultiplier" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveMultiplier">保存乘数</el-button>
        </el-form-item>
      </el-form>
      <div class="hint">
        所有战斗评分档位的分值将统一乘以该数值，得到最终评分。
      </div>
    </el-card>

    <div class="tier-header">
      <h4>评分档位</h4>
      <el-button type="primary" @click="openCreate()">+ 新增档位</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="档位 ID" width="140" />
      <el-table-column prop="name" label="档位名称" width="160" />
      <el-table-column prop="minExcess" label="超额下限" width="110" />
      <el-table-column prop="maxExcess" label="超额上限" width="110" />
      <el-table-column prop="score" label="档位分值" width="110" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增档位' : '编辑档位'"
      width="600px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="档位 ID" required>
              <el-input v-model="dialogForm.code" placeholder="bs_01" :disabled="dialogMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="档位名称" required>
              <el-input v-model="dialogForm.name" placeholder="险胜" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="超额下限" required>
              <el-input-number v-model="dialogForm.minExcess" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超额上限" required>
              <el-input-number v-model="dialogForm.maxExcess" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="档位分值" required>
          <el-input-number v-model="dialogForm.score" :min="0" style="width: 100%" />
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
h3, h4 {
  margin: 0;
}
.config-card {
  margin-bottom: 24px;
}
.hint {
  color: #6b7280;
  font-size: 13px;
  margin-top: 8px;
}
.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
