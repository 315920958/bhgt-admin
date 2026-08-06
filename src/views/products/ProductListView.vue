<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

interface Item {
  _id: string
  code: string
  name: string
  type: 'relic' | 'consumable' | 'plot'
}

interface Product {
  _id?: string
  code: string
  itemId: string
  type: 'relic' | 'consumable' | 'plot'
  price: number
  isOnShelf: boolean
  repeatable: boolean
  perLifeLimit?: number
}

const items = ref<Item[]>([])
const itemsLoading = ref(false)

async function fetchItems() {
  itemsLoading.value = true
  try {
    items.value = await request<Item[]>('ITEMS_LIST' as ApiKey)
  } catch {
    items.value = []
  } finally {
    itemsLoading.value = false
  }
}

function itemName(itemId?: string) {
  return items.value.find((i) => i._id === itemId || i.code === itemId)?.name || itemId || '—'
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
} = useCrud<Product>({
  list: 'SHOPS_LIST',
  create: 'SHOPS_CREATE',
  update: 'SHOPS_UPDATE',
  remove: 'SHOPS_DELETE',
})

onMounted(() => {
  fetchItems()
  fetchList()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>商品配置</h3>
      <el-button type="primary" @click="openCreate({ type: 'relic', isOnShelf: true, repeatable: false })">+ 新增商品</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="code" label="商品 ID" width="140" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.type === 'relic'">遗物</el-tag>
          <el-tag v-else-if="row.type === 'consumable'" type="success">消耗品</el-tag>
          <el-tag v-else type="info">剧情道具</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="引用物品" width="160">
        <template #default="{ row }">{{ itemName(row.itemId) }}</template>
      </el-table-column>
      <el-table-column prop="price" label="灵石价格" width="110" />
      <el-table-column prop="isOnShelf" label="上架" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isOnShelf ? 'success' : 'info'">{{ row.isOnShelf ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="repeatable" label="重复购买" width="100">
        <template #default="{ row }">{{ row.repeatable ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="perLifeLimit" label="每世上限" width="100">
        <template #default="{ row }">{{ row.perLifeLimit ?? '—' }}</template>
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
      :title="dialogMode === 'create' ? '新增商品' : '编辑商品'"
      width="680px"
    >
      <el-form :model="dialogForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商品 ID" required>
              <el-input v-model="dialogForm.code" placeholder="shop_01" :disabled="dialogMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品类型" required>
              <el-select v-model="dialogForm.type" placeholder="请选择" style="width: 100%">
                <el-option label="遗物" value="relic" />
                <el-option label="消耗品" value="consumable" />
                <el-option label="剧情道具" value="plot" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="引用物品" required>
          <el-select
            v-model="dialogForm.itemId"
            placeholder="请选择物品"
            style="width: 100%"
            filterable
            :loading="itemsLoading"
          >
            <el-option
              v-for="item in items.filter((i) => i.type === dialogForm.type)"
              :key="item._id"
              :label="`${item.name} (${item.code})`"
              :value="item._id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="灵石价格" required>
              <el-input-number v-model="dialogForm.price" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每世上限">
              <el-input-number v-model="dialogForm.perLifeLimit" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="是否上架">
              <el-switch v-model="dialogForm.isOnShelf" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复购买">
              <el-switch v-model="dialogForm.repeatable" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
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
