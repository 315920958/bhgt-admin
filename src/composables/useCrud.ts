import { ref, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

/**
 * 资源 CRUD 共用逻辑。
 * 假设资源主键字段为 `code: string`（所有 S1 配置表都符合）。
 *
 * 用法：
 *   const { list, loading, dialogVisible, dialogForm, fetchList, openCreate, openEdit, submit, remove }
 *     = useCrud<Attribute>({
 *         list: 'ATTRIBUTES_LIST',
 *         create: 'ATTRIBUTES_CREATE',
 *         update: 'ATTRIBUTES_UPDATE',
 *         remove: 'ATTRIBUTES_DELETE',
 *       }, { listQuery: () => ({ type: currentType.value }) })
 */
export interface CrudKeys {
  list: ApiKey
  create: ApiKey
  update: ApiKey
  remove: ApiKey
}

export interface UseCrudOptions {
  /** 列表查询参数（每次 fetchList 都会重新调用取最新值） */
  listQuery?: () => Record<string, unknown> | undefined
  /** 删除前确认提示里的"名字字段"（默认 'code'） */
  nameField?: keyof any
  /** 删除前是否弹确认框（默认 true） */
  confirmRemove?: boolean
}

export function useCrud<T extends { code: string }>(
  keys: CrudKeys,
  options: UseCrudOptions = {},
) {
  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const initialFetched = ref(false)

  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const dialogForm = ref<any>({})
  const dialogLoading = ref(false)
  const editingCode = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    try {
      const query = options.listQuery?.()
      const data = await request<T[]>(keys.list, query)
      list.value = Array.isArray(data) ? data : []
    } catch {
      // 错误已被 request 拦截器统一弹窗
      list.value = []
    } finally {
      loading.value = false
      initialFetched.value = true
    }
  }

  function openCreate(defaults: Record<string, any> = {}) {
    dialogMode.value = 'create'
    dialogForm.value = { ...defaults }
    editingCode.value = null
    dialogVisible.value = true
  }

  function openEdit(row: T) {
    dialogMode.value = 'edit'
    // 深拷贝，避免编辑过程中改动原列表
    dialogForm.value = JSON.parse(JSON.stringify(row))
    editingCode.value = row.code
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    dialogForm.value = {}
    editingCode.value = null
  }

  async function submit() {
    dialogLoading.value = true
    try {
      if (dialogMode.value === 'create') {
        await request(keys.create, { ...dialogForm.value })
        ElMessage.success('创建成功')
      } else {
        // pathParams: request 层会把 `code` 替换到 URL，并从 body 里剔除
        await request(keys.update, { code: editingCode.value, ...dialogForm.value })
        ElMessage.success('更新成功')
      }
      closeDialog()
      await fetchList()
    } catch {
      // 错误已统一处理
    } finally {
      dialogLoading.value = false
    }
  }

  async function remove(row: T) {
    if (options.confirmRemove !== false) {
      try {
        await ElMessageBox.confirm(
          `确定要删除「${(row as any)[options.nameField ?? 'code']}」吗？此操作不可恢复。`,
          '确认删除',
          { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
        )
      } catch {
        return // 用户取消
      }
    }
    try {
      await request(keys.remove, { code: row.code })
      ElMessage.success('删除成功')
      await fetchList()
    } catch {
      // 错误已统一处理
    }
  }

  return {
    list,
    loading,
    initialFetched,
    dialogVisible,
    dialogMode,
    dialogForm,
    dialogLoading,
    editingCode,
    fetchList,
    openCreate,
    openEdit,
    closeDialog,
    submit,
    remove,
  }
}
