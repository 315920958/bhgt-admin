import { ref, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

/**
 * 资源 CRUD 共用逻辑（按 `_id` ObjectId 主键）。
 * 与 useCrud（按 code 主键的配置表）区分：管理员 / 玩家等账号类资源用 `_id` 作主键，
 * 路径参数为 `:id`（可经 idField 配置）。响应不含 password 等敏感字段。
 *
 * 用法：
 *   const { list, loading, dialogVisible, dialogForm, fetchList, openCreate, openEdit, submit, remove }
 *     = useIdCrud<Admin>({
 *         list: 'ADMINS_LIST',
 *         create: 'ADMINS_CREATE',
 *         update: 'ADMINS_UPDATE',
 *         remove: 'ADMINS_DELETE',
 *       })
 */
export interface IdCrudKeys {
  list: ApiKey
  create: ApiKey
  update: ApiKey
  remove: ApiKey
}

export interface UseIdCrudOptions {
  /** 路径参数名（默认 'id'，与服务端 @Param('id') 对应） */
  idField?: string
  /** 列表查询参数（每次 fetchList 都会重新调用取最新值） */
  listQuery?: () => Record<string, unknown> | undefined
  /** 删除前确认提示里的"名字字段"（默认 'name'） */
  nameField?: string
  /** 删除前是否弹确认框（默认 true） */
  confirmRemove?: boolean
  /** 编辑提交时，从 body 中剔除的字段（如空密码不覆盖）。回调返回最终 body。 */
  transformEdit?: (form: Record<string, any>) => Record<string, any>
}

export function useIdCrud<T extends { _id: string }>(
  keys: IdCrudKeys,
  options: UseIdCrudOptions = {},
) {
  const idField = options.idField ?? 'id'

  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const initialFetched = ref(false)

  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const dialogForm = ref<Record<string, any>>({})
  const dialogLoading = ref(false)
  const editingId = ref<string | null>(null)

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
    editingId.value = null
    dialogVisible.value = true
  }

  function openEdit(row: T) {
    dialogMode.value = 'edit'
    // 深拷贝，避免编辑过程中改动原列表
    dialogForm.value = JSON.parse(JSON.stringify(row))
    editingId.value = (row as any)._id
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    dialogForm.value = {}
    editingId.value = null
  }

  async function submit() {
    dialogLoading.value = true
    try {
      if (dialogMode.value === 'create') {
        // 创建：剔除可能残留的 _id
        const { _id, ...createBody } = dialogForm.value
        void _id
        await request(keys.create, createBody)
        ElMessage.success('创建成功')
      } else {
        // 更新：拼路径参数 id，并从 body 剔除 _id；允许 transformEdit 二次裁剪（如空密码不覆盖）
        const { _id, ...rest } = dialogForm.value
        void _id
        const body = options.transformEdit ? options.transformEdit(rest) : rest
        await request(keys.update, { [idField]: editingId.value, ...body })
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
          `确定要删除「${(row as any)[options.nameField ?? 'name']}」吗？此操作不可恢复。`,
          '确认删除',
          { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
        )
      } catch {
        return // 用户取消
      }
    }
    try {
      await request(keys.remove, { [idField]: (row as any)._id })
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
    editingId,
    fetchList,
    openCreate,
    openEdit,
    closeDialog,
    submit,
    remove,
  }
}
