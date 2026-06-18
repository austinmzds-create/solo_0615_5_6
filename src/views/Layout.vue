<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import { mockUsers } from '../mock/accounts'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)

const currentUser = computed(() => {
  const username = localStorage.getItem('parking_current_user')
  if (!username) return null
  return mockUsers.find((u) => u.username === username) || null
})

const menuItems = [
  { path: '/dashboard', icon: '📊', title: '首页概览' },
  { path: '/parking-overview', icon: '🅿️', title: '车位概览' },
  { path: '/entry-exit', icon: '🚗', title: '进出记录' },
  { path: '/monthly-rental', icon: '📋', title: '月租车管理' }
]

const handleLogout = () => {
  localStorage.removeItem('parking_current_user')
  ElMessage.success('已退出登录')
  router.replace('/login')
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo-area" @click="toggleCollapse">
        <span v-if="!isCollapsed" class="logo-text">停车管理</span>
        <span v-else class="logo-text-mini">P</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        :collapse="isCollapsed"
        class="side-menu"
        background-color="#1a2a4a"
        text-color="#b0c4de"
        active-text-color="#409eff"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <span class="menu-icon">{{ item.icon }}</span>
          <template #title>
            <span class="menu-title">{{ item.title }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="header-title">停车管理基础工作台</span>
        </div>
        <div class="header-right">
          <span class="user-info">{{ currentUser?.name }}（{{ currentUser?.roleLabel }}）</span>
          <el-button :icon="SwitchButton" text @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-aside {
  background: #1a2a4a;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
}

.logo-text-mini {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
}

.side-menu {
  border-right: none;
}

.side-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.menu-icon {
  font-size: 18px;
  margin-right: 8px;
}

.menu-title {
  font-size: 14px;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 24px;
  height: 60px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  font-size: 14px;
  color: #606266;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  min-height: calc(100vh - 60px);
}
</style>
