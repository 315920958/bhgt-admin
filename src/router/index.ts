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
          path: 'buttons',
          name: 'ButtonList',
          component: () => import('@/views/buttons/ButtonListView.vue'),
          meta: { title: '按钮配置' },
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
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
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
