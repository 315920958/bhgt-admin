import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/network/token'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '概览' },
        },
        {
          path: 'nodes',
          name: 'NodeList',
          component: () => import('@/views/nodes/NodeListView.vue'),
          meta: { title: '剧情节点' },
        },
        {
          path: 'items',
          name: 'ItemList',
          component: () => import('@/views/items/ItemListView.vue'),
          meta: { title: '物品配置' },
        },
        {
          path: 'talents',
          name: 'TalentList',
          component: () => import('@/views/talents/TalentListView.vue'),
          meta: { title: '天赋配置' },
        },
        {
          path: 'cg',
          name: 'CGList',
          component: () => import('@/views/cg/CGListView.vue'),
          meta: { title: 'CG 图鉴' },
        },
        {
          path: 'users',
          name: 'UserList',
          component: () => import('@/views/users/UserListView.vue'),
          meta: { title: '玩家列表' },
        },
        {
          path: 'attributes',
          name: 'AttributeList',
          component: () => import('@/views/attributes/AttributeListView.vue'),
          meta: { title: '属性' },
        },
        {
          path: 'products',
          name: 'ProductList',
          component: () => import('@/views/products/ProductListView.vue'),
          meta: { title: '商品' },
        },
        {
          path: 'realms',
          name: 'RealmList',
          component: () => import('@/views/realms/RealmListView.vue'),
          meta: { title: '境界' },
        },
        {
          path: 'gameinfo',
          name: 'GameInfo',
          component: () => import('@/views/gameinfo/GameInfoView.vue'),
          meta: { title: '游戏信息' },
        },
        {
          path: 'stages',
          name: 'StageList',
          component: () => import('@/views/stages/StageListView.vue'),
          meta: { title: '大阶段' },
        },
        {
          path: 'node-bundles',
          name: 'NodeBundleList',
          component: () => import('@/views/node-bundles/NodeBundleListView.vue'),
          meta: { title: '事件' },
        },
        {
          path: 'node-bundles/view',
          name: 'NodeBundleGraph',
          component: () => import('@/views/node-bundles/NodeBundleGraphView.vue'),
          meta: { title: '事件视图' },
        },
        {
          path: 'node-bundles/:code/view',
          name: 'NodeBundleInner',
          component: () => import('@/views/node-bundles/NodeBundleInnerView.vue'),
          meta: { title: '事件内节点图' },
        },
        {
          path: 'battles',
          name: 'BattleConfig',
          component: () => import('@/views/battles/BattleConfigView.vue'),
          meta: { title: '战斗评分' },
        },
        {
          path: 'admin-users',
          name: 'AdminUserList',
          component: () => import('@/views/admin-users/AdminUserListView.vue'),
          meta: { title: '管理员列表' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = getToken()
  const isPublic = to.meta?.public === true

  if (!isPublic && !token) {
    // 未登录且访问非公开页 -> 去登录
    return next({ name: 'Login', replace: true })
  }

  if (to.name === 'Login' && token) {
    // 已登录访问登录页 -> 回首页
    return next({ path: '/', replace: true })
  }

  next()
})

export default router
