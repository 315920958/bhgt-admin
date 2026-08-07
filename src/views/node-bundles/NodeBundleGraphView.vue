<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'

interface StageOption {
  _id: string
  code: string
  name: string
}

interface BundleBase {
  _id: string
  code: string
  name: string
  stageId?: string
}

interface BundleViewItem extends BundleBase {
  entryNodeCodes: string[]
  exitNodeCodes: string[]
  isNormal: boolean
  nextBundleIds: string[]
}

interface BundleEdge {
  from: string
  to: string
  viaNodeCode: string
}

interface GraphData {
  bundles: BundleBase[]
  bundleViews: BundleViewItem[]
  edges: BundleEdge[]
}

interface LayoutNode {
  bundle: BundleViewItem
  x: number
  y: number
  layer: number
  index: number
}

const router = useRouter()
const loading = ref(false)
const data = ref<GraphData | null>(null)
const stageOptions = ref<StageOption[]>([])
const selectedStageId = ref<string>('')

const CARD_W = 180
const CARD_H = 90
const H_GAP = 80
const V_GAP = 50
const PAD = 40

async function fetchGraph() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (selectedStageId.value) params.stageId = selectedStageId.value
    data.value = await request<GraphData>('NODE_BUNDLES_GRAPH' as ApiKey, params)
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

async function loadStages() {
  try {
    const stages = await request<StageOption[]>('STAGES_LIST')
    stageOptions.value = Array.isArray(stages) ? stages : []
  } catch {
    stageOptions.value = []
  }
}

function bundleMap(data: GraphData) {
  return new Map(data.bundleViews.map((b) => [b._id, b]))
}

function computeLayout(data: GraphData): LayoutNode[] {
  const bMap = bundleMap(data)
  const ids = data.bundleViews.map((b) => b._id)
  const incoming = new Map<string, Set<string>>()
  const outgoing = new Map<string, Set<string>>()
  for (const id of ids) {
    incoming.set(id, new Set())
    outgoing.set(id, new Set())
  }
  for (const e of data.edges) {
    if (incoming.has(e.to)) incoming.get(e.to)!.add(e.from)
    if (outgoing.has(e.from)) outgoing.get(e.from)!.add(e.to)
  }

  // 层 = 从任意源点出发的最长距离；有环时退化为拓扑排序后的最大前驱层+1
  const layer = new Map<string, number>()
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function dfs(id: string): number {
    if (layer.has(id)) return layer.get(id)!
    if (visiting.has(id)) return 0
    visiting.add(id)
    let max = 0
    for (const pre of incoming.get(id) || []) {
      max = Math.max(max, dfs(pre) + 1)
    }
    visiting.delete(id)
    visited.add(id)
    layer.set(id, max)
    return max
  }
  for (const id of ids) dfs(id)

  const layers = new Map<number, string[]>()
  for (const id of ids) {
    const l = layer.get(id) || 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(id)
  }

  // 同层按 code 排序，保持可预期
  for (const [, arr] of layers) {
    arr.sort((a, b) => (bMap.get(a)?.code || '').localeCompare(bMap.get(b)?.code || ''))
  }

  const result: LayoutNode[] = []
  for (const [l, arr] of layers) {
    arr.forEach((id, idx) => {
      const b = bMap.get(id)!
      result.push({
        bundle: b,
        x: PAD + l * (CARD_W + H_GAP),
        y: PAD + idx * (CARD_H + V_GAP),
        layer: l,
        index: idx,
      })
    })
  }
  return result
}

const layout = computed(() => {
  if (!data.value) return []
  return computeLayout(data.value)
})

const svgSize = computed(() => {
  if (!layout.value.length) return { width: 800, height: 400 }
  const maxX = Math.max(...layout.value.map((n) => n.x + CARD_W))
  const maxY = Math.max(...layout.value.map((n) => n.y + CARD_H))
  return { width: maxX + PAD, height: maxY + PAD }
})

const layoutMap = computed(() => {
  const map = new Map<string, LayoutNode>()
  for (const n of layout.value) map.set(n.bundle._id, n)
  return map
})

function edgePath(from: LayoutNode, to: LayoutNode): string {
  const x1 = from.x + CARD_W
  const y1 = from.y + CARD_H / 2
  const x2 = to.x
  const y2 = to.y + CARD_H / 2
  const cp1x = x1 + (x2 - x1) / 2
  const cp2x = x2 - (x2 - x1) / 2
  return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`
}

function goInner(code: string) {
  router.push(`/node-bundles/${code}/view`)
}

function statusText(b: BundleViewItem): string {
  if (b.isNormal) return '正常'
  if (!b.entryNodeCodes.length && !b.exitNodeCodes.length) return '无入口/出口'
  if (!b.entryNodeCodes.length) return '缺入口'
  return '缺出口'
}

onMounted(async () => {
  await loadStages()
  await fetchGraph()
})

watch(selectedStageId, () => { fetchGraph() })
</script>

<template>
  <div v-loading="loading" class="graph-wrap">
    <div class="toolbar">
      <div class="toolbar-left">
        <h3>事件路径图</h3>
        <el-select
          v-model="selectedStageId"
          placeholder="筛选阶段"
          clearable
          size="small"
          style="width: 180px; margin-left: 12px"
        >
          <el-option
            v-for="s in stageOptions"
            :key="s._id"
            :label="s.name"
            :value="s._id"
          />
        </el-select>
      </div>
      <div class="legend">
        <span class="tag normal">正常</span>
        <span class="tag warn">缺入口/缺出口</span>
        <span class="tag entry">入口</span>
        <span class="tag exit">出口</span>
      </div>
      <el-button type="primary" link @click="fetchGraph" :icon="RefreshRight">刷新</el-button>
    </div>

    <div class="canvas">
      <svg
        v-if="data && layout.length"
        :width="svgSize.width"
        :height="svgSize.height"
        class="graph-svg"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>

        <path
          v-for="(edge, idx) in data.edges"
          :key="`edge-${idx}`"
          :d="edgePath(layoutMap.get(edge.from)!, layoutMap.get(edge.to)!)"
          class="edge-path"
          marker-end="url(#arrowhead)"
        />

        <g
          v-for="n in layout"
          :key="n.bundle._id"
          class="bundle-card"
          :class="{ abnormal: !n.bundle.isNormal }"
          :transform="`translate(${n.x}, ${n.y})`"
          @click="goInner(n.bundle.code)"
        >
          <rect width="180" height="90" rx="8" />
          <text x="90" y="28" class="code" text-anchor="middle">{{ n.bundle.code }}</text>
          <text x="90" y="50" class="name" text-anchor="middle">{{ n.bundle.name }}</text>
          <text x="90" y="72" class="status" text-anchor="middle">{{ statusText(n.bundle) }}</text>
        </g>
      </svg>

      <el-empty v-else-if="!loading" description="暂无事件数据" />
    </div>
  </div>
</template>

<script lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
export { RefreshRight }
</script>

<style scoped>
.graph-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.toolbar-left {
  display: flex;
  align-items: center;
}
.toolbar h3 {
  margin: 0;
  font-size: 16px;
}
.legend {
  display: flex;
  gap: 8px;
}
.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.tag.normal {
  background: #dcfce7;
  color: #166534;
}
.tag.warn {
  background: #fee2e2;
  color: #991b1b;
}
.tag.entry {
  background: #dbeafe;
  color: #1e40af;
}
.tag.exit {
  background: #ffedd5;
  color: #9a3412;
}
.canvas {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.graph-svg {
  display: block;
}
.bundle-card {
  cursor: pointer;
}
.bundle-card rect {
  fill: #fff;
  stroke: #d1d5db;
  stroke-width: 1.5;
  transition: all 0.2s;
}
.bundle-card:hover rect {
  stroke: #3b82f6;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08));
}
.bundle-card.abnormal rect {
  stroke: #ef4444;
  fill: #fef2f2;
}
.bundle-card text {
  pointer-events: none;
}
.bundle-card .code {
  font-size: 12px;
  fill: #6b7280;
}
.bundle-card .name {
  font-size: 14px;
  font-weight: 500;
  fill: #111827;
}
.bundle-card .status {
  font-size: 11px;
  fill: #6b7280;
}
.edge-path {
  fill: none;
  stroke: #9ca3af;
  stroke-width: 1.5;
}
</style>
