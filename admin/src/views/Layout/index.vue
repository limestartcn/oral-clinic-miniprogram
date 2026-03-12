<template>
  <div class="app-container">
    <!-- 侧边导航 -->
    <aside :class="['sidebar', { 'collapsed': isCollapsed }]">
      <div class="brand-area">
        <img src="@/assets/logo.svg" class="logo">
        <h1 v-show="!isCollapsed">Clinic Admin</h1>
      </div>
      <nav-menu :collapse="isCollapsed" />
    </aside>

    <!-- 主内容区 -->
    <main class="content-wrapper">
      <!-- 顶部操作栏 -->
      <header class="header-bar">
        <div class="left-group">
          <el-button 
            @click="toggleMenu" 
            circle 
            size="small"
          >
            <i class="iconfont" :class="isCollapsed ? 'icon-menu-unfold' : 'icon-menu-fold'"></i>
          </el-button>
          <breadcrumb />
        </div>
        
        <!-- 用户功能区 -->
        <div class="right-group">
          <quick-actions />
          <user-panel />
        </div>
      </header>

      <!-- 内容卡片容器 -->
      <div class="content-card">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script>
import NavMenu from './Sidebar.vue'          // 侧边栏组件在同一目录
import Breadcrumb from '@/components/Breadcrumb.vue'
import QuickActions from '@/components/QuickActions.vue'
import UserPanel from '@/components/UserPanel.vue'

export default {
  components: {
    NavMenu,
    Breadcrumb,
    QuickActions,
    UserPanel
  },
  data() {
    return {
      isCollapsed: false
    }
  },
  methods: {
    toggleMenu() {
      this.isCollapsed = !this.isCollapsed
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;

  // 侧边栏样式
  .sidebar {
    width: 240px;
    background: #fff;
    box-shadow: 2px 0 12px rgba(0,0,0,0.05);
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);

    &.collapsed {
      width: 64px;

      .brand-area h1 {
        opacity: 0;
      }
    }

    .brand-area {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;

      .logo {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }

      h1 {
        margin: 0;
        font-size: 18px;
        color: #2c3e50;
        transition: opacity 0.2s;
      }
    }
  }

  // 主内容区
  .content-wrapper {
    flex: 1;
    overflow: hidden;

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);

      .left-group {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .right-group {
        display: flex;
        align-items: center;
        gap: 20px;
      }
    }

    .content-card {
      margin: 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      padding: 24px;
    }
  }
}

// 过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
