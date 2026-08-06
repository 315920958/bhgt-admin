export type ApiMethod = 'get' | 'post' | 'put' | 'delete'

export interface ApiConfigItem {
  url: string
  method: ApiMethod
  timeout?: number
  /**
   * 路径参数名列表。request 层会把 data 中同名字段替换到 url 的 `:name` 占位符，并从 body/params 里移除。
   * 例如：url: '/api/admin/attributes/:code' + pathParams: ['code'] + data: { code: 'strength', name: '根骨' }
   *   → 最终请求 PUT /api/admin/attributes/strength，body 为 { name: '根骨' }
   */
  pathParams?: readonly string[]
}

/**
 * 接口注册表（统一管理 url / method / timeout / pathParams）
 * 业务侧只调用 request('API_KEY', data)，不直接写 url
 */
export const apiConfig = {
  // 通用
  HEALTH: { url: '/api', method: 'get' },
  ADMIN_LOGIN: { url: '/api/auth/admin-login', method: 'post' },

  // 属性 config.attributes
  ATTRIBUTES_LIST: { url: '/api/admin/attributes', method: 'get' },
  ATTRIBUTES_DETAIL: { url: '/api/admin/attributes/:code', method: 'get', pathParams: ['code'] },
  ATTRIBUTES_CREATE: { url: '/api/admin/attributes', method: 'post' },
  ATTRIBUTES_UPDATE: { url: '/api/admin/attributes/:code', method: 'put', pathParams: ['code'] },
  ATTRIBUTES_DELETE: { url: '/api/admin/attributes/:code', method: 'delete', pathParams: ['code'] },

  // 物品 config.items
  ITEMS_LIST: { url: '/api/admin/items', method: 'get' },
  ITEMS_DETAIL: { url: '/api/admin/items/:code', method: 'get', pathParams: ['code'] },
  ITEMS_CREATE: { url: '/api/admin/items', method: 'post' },
  ITEMS_UPDATE: { url: '/api/admin/items/:code', method: 'put', pathParams: ['code'] },
  ITEMS_DELETE: { url: '/api/admin/items/:code', method: 'delete', pathParams: ['code'] },

  // 天赋 config.talents
  TALENTS_LIST: { url: '/api/admin/talents', method: 'get' },
  TALENTS_DETAIL: { url: '/api/admin/talents/:code', method: 'get', pathParams: ['code'] },
  TALENTS_CREATE: { url: '/api/admin/talents', method: 'post' },
  TALENTS_UPDATE: { url: '/api/admin/talents/:code', method: 'put', pathParams: ['code'] },
  TALENTS_DELETE: { url: '/api/admin/talents/:code', method: 'delete', pathParams: ['code'] },

  // 天赋品质 config.talent_qualities
  TALENT_QUALITIES_LIST: { url: '/api/admin/talent-qualities', method: 'get' },
  TALENT_QUALITIES_DETAIL: { url: '/api/admin/talent-qualities/:code', method: 'get', pathParams: ['code'] },
  TALENT_QUALITIES_CREATE: { url: '/api/admin/talent-qualities', method: 'post' },
  TALENT_QUALITIES_UPDATE: { url: '/api/admin/talent-qualities/:code', method: 'put', pathParams: ['code'] },
  TALENT_QUALITIES_DELETE: { url: '/api/admin/talent-qualities/:code', method: 'delete', pathParams: ['code'] },

  // 全局游戏配置 config.game（单例）
  GAME_CONFIG_GET: { url: '/api/admin/game-config', method: 'get' },
  GAME_CONFIG_UPDATE: { url: '/api/admin/game-config', method: 'put' },

  // 管理员账号 sys.users（isAdmin=true），主键 _id（ObjectId），路径参数用 :id
  ADMINS_LIST: { url: '/api/admin/admins', method: 'get' },
  ADMINS_DETAIL: { url: '/api/admin/admins/:id', method: 'get', pathParams: ['id'] },
  ADMINS_CREATE: { url: '/api/admin/admins', method: 'post' },
  ADMINS_UPDATE: { url: '/api/admin/admins/:id', method: 'put', pathParams: ['id'] },
  ADMINS_DELETE: { url: '/api/admin/admins/:id', method: 'delete', pathParams: ['id'] },

  // 玩家（游戏角色）game.users
  PLAYERS_LIST: { url: '/api/admin/players', method: 'get' },
  PLAYERS_TEST_CREATE: { url: '/api/admin/players/test', method: 'post' },

  // 大阶段 config.stages
  STAGES_LIST: { url: '/api/admin/stages', method: 'get' },
  STAGES_DETAIL: { url: '/api/admin/stages/:code', method: 'get', pathParams: ['code'] },
  STAGES_CREATE: { url: '/api/admin/stages', method: 'post' },
  STAGES_UPDATE: { url: '/api/admin/stages/:code', method: 'put', pathParams: ['code'] },
  STAGES_DELETE: { url: '/api/admin/stages/:code', method: 'delete', pathParams: ['code'] },

  // 剧情节点 config.nodes
  NODES_LIST: { url: '/api/admin/nodes', method: 'get' },
  NODES_DETAIL: { url: '/api/admin/nodes/:code', method: 'get', pathParams: ['code'] },
  NODES_CREATE: { url: '/api/admin/nodes', method: 'post' },
  NODES_UPDATE: { url: '/api/admin/nodes/:code', method: 'put', pathParams: ['code'] },
  NODES_DELETE: { url: '/api/admin/nodes/:code', method: 'delete', pathParams: ['code'] },

  // 节点包 config.nodeBundles（阶段 stage 与节点 node 之间的中间层）
  NODE_BUNDLES_LIST: { url: '/api/admin/node-bundles', method: 'get' },
  NODE_BUNDLES_DETAIL: { url: '/api/admin/node-bundles/:code', method: 'get', pathParams: ['code'] },
  NODE_BUNDLES_CREATE: { url: '/api/admin/node-bundles', method: 'post' },
  NODE_BUNDLES_UPDATE: { url: '/api/admin/node-bundles/:code', method: 'put', pathParams: ['code'] },
  NODE_BUNDLES_DELETE: { url: '/api/admin/node-bundles/:code', method: 'delete', pathParams: ['code'] },

  // 境界 config.realms
  REALMS_LIST: { url: '/api/admin/realms', method: 'get' },
  REALMS_DETAIL: { url: '/api/admin/realms/:code', method: 'get', pathParams: ['code'] },
  REALMS_CREATE: { url: '/api/admin/realms', method: 'post' },
  REALMS_UPDATE: { url: '/api/admin/realms/:code', method: 'put', pathParams: ['code'] },
  REALMS_DELETE: { url: '/api/admin/realms/:code', method: 'delete', pathParams: ['code'] },

  // 商品 config.shops
  SHOPS_LIST: { url: '/api/admin/shops', method: 'get' },
  SHOPS_DETAIL: { url: '/api/admin/shops/:code', method: 'get', pathParams: ['code'] },
  SHOPS_CREATE: { url: '/api/admin/shops', method: 'post' },
  SHOPS_UPDATE: { url: '/api/admin/shops/:code', method: 'put', pathParams: ['code'] },
  SHOPS_DELETE: { url: '/api/admin/shops/:code', method: 'delete', pathParams: ['code'] },

  // CG config.cgs
  CGS_LIST: { url: '/api/admin/cgs', method: 'get' },
  CGS_DETAIL: { url: '/api/admin/cgs/:code', method: 'get', pathParams: ['code'] },
  CGS_CREATE: { url: '/api/admin/cgs', method: 'post' },
  CGS_UPDATE: { url: '/api/admin/cgs/:code', method: 'put', pathParams: ['code'] },
  CGS_DELETE: { url: '/api/admin/cgs/:code', method: 'delete', pathParams: ['code'] },

  // 战斗评分档位 config.battles
  BATTLES_LIST: { url: '/api/admin/battles', method: 'get' },
  BATTLES_DETAIL: { url: '/api/admin/battles/:code', method: 'get', pathParams: ['code'] },
  BATTLES_CREATE: { url: '/api/admin/battles', method: 'post' },
  BATTLES_UPDATE: { url: '/api/admin/battles/:code', method: 'put', pathParams: ['code'] },
  BATTLES_DELETE: { url: '/api/admin/battles/:code', method: 'delete', pathParams: ['code'] },
} as const satisfies Record<string, ApiConfigItem>

export type ApiKey = keyof typeof apiConfig
