<script setup lang="ts">
/**
 * 图片路径输入框（后台统一组件）
 *
 * 约定：数据库只存「相对 OSS 域名的路径」（如 /cg/cg_01.png），
 * 域名由 VITE_BHGT_OSS_DOMAIN 配置，展示时前端拼接。
 *
 * 行为：
 * - 粘贴完整 URL 自动剥掉域名，只保留路径
 * - 失焦时再规整一次（手输 / 编辑旧数据的情况）
 * - 有值即实时预览缩略图，点击可放大查看
 * - 下方显示拼接后的完整地址，便于核对
 */
import { computed } from 'vue'
import { ossDomain } from '@/config/servers'
import { resolveAssetUrl, stripAssetDomain } from '@/utils/asset'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    /** 缩略图边长（px） */
    thumbSize?: number
    disabled?: boolean
    /** 是否显示下方完整地址 */
    showFullUrl?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '填 OSS 相对路径，如 /cg/cg_01.png（粘贴完整链接会自动去域名）',
    thumbSize: 56,
    disabled: false,
    showFullUrl: true,
  },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const inner = computed<string>({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v ?? ''),
})

const fullUrl = computed(() => resolveAssetUrl(inner.value, ossDomain))
const previewList = computed(() => (fullUrl.value ? [fullUrl.value] : []))

function normalize(raw: string): string {
  return stripAssetDomain((raw ?? '').trim(), ossDomain)
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  e.preventDefault()
  inner.value = normalize(text)
}

function onBlur() {
  const n = normalize(inner.value)
  if (n !== inner.value) inner.value = n
}
</script>

<template>
  <div class="image-path-input">
    <div class="ipi-row">
      <el-input
        v-model="inner"
        :placeholder="placeholder"
        :disabled="disabled"
        clearable
        @paste="onPaste"
        @blur="onBlur"
      />
      <div class="ipi-thumb" :style="{ width: thumbSize + 'px', height: thumbSize + 'px' }">
        <el-image
          v-if="fullUrl"
          :src="fullUrl"
          :preview-src-list="previewList"
          preview-teleported
          fit="cover"
          style="width: 100%; height: 100%"
        >
          <template #error>
            <div class="ipi-state ipi-error">失败</div>
          </template>
          <template #placeholder>
            <div class="ipi-state">…</div>
          </template>
        </el-image>
        <div v-else class="ipi-state">无图</div>
      </div>
    </div>
    <div v-if="showFullUrl && inner" class="ipi-full" :title="fullUrl">{{ fullUrl }}</div>
  </div>
</template>

<style scoped>
.image-path-input {
  width: 100%;
}
.ipi-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.ipi-row :deep(.el-input) {
  flex: 1 1 auto;
  min-width: 0;
}
.ipi-thumb {
  flex: 0 0 auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-fill-color-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ipi-state {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  line-height: 1;
}
.ipi-error {
  color: var(--el-color-danger, #f56c6c);
}
.ipi-full {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.4;
  word-break: break-all;
}
</style>
