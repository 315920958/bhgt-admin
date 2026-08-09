<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '@/network'
import type { ApiKey } from '@/config/api'
import NodeEditDialog from '@/views/nodes/NodeEditDialog.vue'
import { ossDomain } from '@/config/servers'
import { resolveAssetUrl } from '@/utils/asset'

interface BundleInfo {
  _id: string
  code: string
  name: string
  stageId?: string
  entryNodeCodes: string[]
  exitNodeCodes: string[]
  isNormal: boolean
}

interface InnerNode {
  _id: string
  code: string
  name: string
  title: string
  imageUrl?: string
  isBattle: boolean
  inDegree: number
  outDegree: number
  externalOuts: { code: string; bundleId: string; bundleName: string }[]
  buttons: { code: string; text: string; nextNodeId?: string }[]
}

interface InnerEdge {
  from: string
  to: string
  viaButton: string
}

interface InnerData {
  bundle: BundleInfo
  nodes: InnerNode[]
  edges: InnerEdge[]
}

interface LayoutNode {
  node: InnerNode
  x: number
  y: number
  layer: number
  index: number
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const data = ref<InnerData | null>(null)

// 节点编辑弹窗（就地编辑，不离开图）
const nodeDialogVisible = ref(false)
const nodeDialogCode = ref('')

const code = computed(() => route.params.code as string)

const CARD_W = 160
const CARD_H = 94
const H_GAP = 70
const V_GAP = 50
const PAD = 40

async function fetchInner() {
  if (!code.value) return
  loading.value = true
  try {
    data.value = await request<InnerData>('NODE_BUNDLE_NODES' as ApiKey, { code: code.value })
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

function computeLayout(data: InnerData): LayoutNode[] {
  const nodes = data.nodes
  const ids = nodes.map((n) => n.code)
  const nodeByCode = new Map<string, InnerNode>()
  for (const n of nodes) nodeByCode.set(n.code, n)

  const incoming = new Map<string, Set<string>>()
  const outgoing = new Map<string, Set<string>>()
  for (const c of ids) {
    incoming.set(c, new Set())
    outgoing.set(c, new Set())
  }
  for (const e of data.edges) {
    if (incoming.has(e.to)) incoming.get(e.to)!.add(e.from)
    if (outgoing.has(e.from)) outgoing.get(e.from)!.add(e.to)
  }

  const layer = new Map<string, number>()
  const visiting = new Set<string>()
  function dfs(c: string): number {
    if (layer.has(c)) return layer.get(c)!
    if (visiting.has(c)) return 0
    visiting.add(c)
    let max = 0
    for (const pre of incoming.get(c) || []) {
      max = Math.max(max, dfs(pre) + 1)
    }
    visiting.delete(c)
    layer.set(c, max)
    return max
  }
  for (const c of ids) dfs(c)

  const layers = new Map<number, string[]>()
  for (const c of ids) {
    const l = layer.get(c) || 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(c)
  }
  for (const [, arr] of layers) {
    arr.sort((a, b) => a.localeCompare(b))
  }

  const result: LayoutNode[] = []
  for (const [l, arr] of layers) {
    arr.forEach((c, idx) => {
      result.push({
        node: nodeByCode.get(c)!,
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
  for (const n of layout.value) map.set(n.node.code, n)
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

function isEntry(n: InnerNode): boolean {
  return data.value?.bundle.entryNodeCodes.includes(n.code) || false
}
function isExit(n: InnerNode): boolean {
  return data.value?.bundle.exitNodeCodes.includes(n.code) || false
}

function thumb(url?: string) {
  return resolveAssetUrl(url || '', ossDomain)
}

function editNode(nodeCode: string) {
  nodeDialogCode.value = nodeCode
  nodeDialogVisible.value = true
}

function onNodeSaved() {
  // 编辑保存后刷新图，反映最新的出口/按钮指向变化
  fetchInner()
}

onMounted(fetchInner)
</script>

<template>
  <div v-loading="loading" class="graph-wrap">
    <div class="toolbar">
      <div class="left">
        <el-button link @click="router.push('/node-bundles/view')">← 返回事件图</el-button>
        <h3>{{ data?.bundle.name || code }} · 事件内节点图</h3>
      </div>
      <div class="legend">
        <span class="tag entry">入口节点</span>
        <span class="tag exit">出口节点</span>
        <span class="tag normal">普通节点</span>
      </div>
    </div>

    <el-alert
      v-if="data && !data.bundle.isNormal"
      :title="`当前事件非正常：入口节点 ${data.bundle.entryNodeCodes.length} 个，出口节点 ${data.bundle.exitNodeCodes.length} 个`"
      type="warning"
      :closable="false"
      class="banner"
    />

    <div class="canvas">
      <svg
        v-if="data && layout.length"
        :width="svgSize.width"
        :height="svgSize.height"
        class="graph-svg"
      >
        <defs>
          <marker id="inner-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
          <marker id="external-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
          </marker>
        </defs>

        <!-- 事件内边 -->
        <path
          v-for="(edge, idx) in data.edges"
          :key="`edge-${idx}`"
          :d="edgePath(layoutMap.get(edge.from)!, layoutMap.get(edge.to)!)"
          class="edge-path"
          marker-end="url(#inner-arrow)"
        />

        <!-- 外部边（虚线，从出口节点向右指出） -->
        <path
          v-for="(out, idx) in layout.filter((n) => n.node.externalOuts.length)"
          :key="`ext-${idx}`"
          :d="`M ${out.x + CARD_W} ${out.y + CARD_H / 2} C ${out.x + CARD_W + 40} ${out.y + CARD_H / 2}, ${out.x + CARD_W + 80} ${out.y + CARD_H / 2}, ${out.x + CARD_W + 100} ${out.y + CARD_H / 2}`"
          class="edge-path external"
          marker-end="url(#external-arrow)"
        />

        <g
          v-for="n in layout"
          :key="n.node._id"
          class="node-card"
          :class="{ entry: isEntry(n.node), exit: isExit(n.node) }"
          :transform="`translate(${n.x}, ${n.y})`"
          @click="editNode(n.node.code)"
        >
          <rect width="160" height="94" rx="6" />
          <image
            v-if="thumb(n.node.imageUrl)"
            :href="thumb(n.node.imageUrl)"
            x="8"
            y="8"
            width="38"
            height="38"
            preserveAspectRatio="xMidYMid slice"
            class="node-image"
          />
          <text x="84" y="24" class="code" text-anchor="middle">{{ n.node.code }}</text>
          <text x="84" y="44" class="name" text-anchor="middle">{{ n.node.name }}</text>
          <text x="84" y="70" class="meta" text-anchor="middle">
            {{ n.node.isBattle ? '战斗 · ' : '' }}入{{ n.node.inDegree }} / 出{{ n.node.outDegree }}
            {{ n.node.externalOuts.length ? ` / 外部${n.node.externalOuts.length}` : '' }}
          </text>
        </g>
      </svg>

      <el-empty v-else-if="!loading" description="该事件暂无节点" />
    </div>

    <NodeEditDialog
      v-model:visible="nodeDialogVisible"
      :node-code="nodeDialogCode"
      @saved="onNodeSaved"
    />
  </div>
</template>

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
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.left h3 {
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
  background: #f3f4f6;
  color: #374151;
}
.tag.entry {
  background: #dbeafe;
  color: #1e40af;
}
.tag.exit {
  background: #ffedd5;
  color: #9a3412;
}
.banner {
  margin-bottom: 12px;
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
.node-card {
  cursor: pointer;
}
.node-image {
  clip-path: inset(0 round 4px);
}
.node-card rect {
  fill: #fff;
  stroke: #d1d5db;
  stroke-width: 1.5;
  transition: all 0.2s;
}
.node-card:hover rect {
  stroke: #3b82f6;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08));
}
.node-card.entry rect {
  stroke: #2563eb;
  fill: #eff6ff;
}
.node-card.exit rect {
  stroke: #ea580c;
  fill: #fff7ed;
}
.node-card.entry.exit rect {
  stroke: #7c3aed;
  fill: #f5f3ff;
}
.node-card text {
  pointer-events: none;
}
.node-card .code {
  font-size: 11px;
  fill: #6b7280;
}
.node-card .name {
  font-size: 13px;
  font-weight: 500;
  fill: #111827;
}
.node-card .meta {
  font-size: 10px;
  fill: #6b7280;
}
.edge-path {
  fill: none;
  stroke: #9ca3af;
  stroke-width: 1.5;
}
.edge-path.external {
  stroke: #f97316;
  stroke-dasharray: 4 4;
}
</style>
