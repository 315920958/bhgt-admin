<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  Reading,
  Mouse,
  Box,
  MagicStick,
  PictureFilled,
  UserFilled,
  Setting,
  Goods,
  Medal,
  InfoFilled,
  Avatar,
  Flag,
  Trophy,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/dashboard', title: '概览', icon: HomeFilled },
  { path: '/attributes', title: '属性', icon: Setting },
  { path: '/items', title: '物品配置', icon: Box },
  { path: '/talents', title: '天赋配置', icon: MagicStick },
  { path: '/buttons', title: '按钮配置', icon: Mouse },
  { path: '/nodes', title: '剧情节点', icon: Reading },
  { path: '/stages', title: '大阶段', icon: Flag },
  { path: '/products', title: '商品', icon: Goods },
  { path: '/cg', title: 'CG 图鉴', icon: PictureFilled },
  { path: '/realms', title: '境界', icon: Medal },
  { path: '/battles', title: '战斗评分', icon: Trophy },
  { path: '/gameinfo', title: '游戏信息', icon: InfoFilled },
  { path: '/users', title: '玩家列表', icon: UserFilled },
  { path: '/admin-users', title: '管理员列表', icon: Avatar },
]

const handleLogout = () => {
  // TODO: 清 token，跳登录
  router.push('/login')
}
</script>

<template>
  <el-container class="layout-root">
    <el-aside width="220px" class="sidebar">
      <div class="logo">BHGT 后台管理</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#fff"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="page-title">{{ (route.meta.title as string) ?? '后台管理' }}</span>
        <el-button type="info" text @click="handleLogout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-root {
  height: 100vh;
}
.sidebar {
  background: #1f2937;
  color: #fff;
}
.logo {
  height: 56px;
  line-height: 56px;
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}
.menu {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.page-title {
  font-size: 16px;
  font-weight: 500;
}
.main {
  background: #f9fafb;
}
</style>
