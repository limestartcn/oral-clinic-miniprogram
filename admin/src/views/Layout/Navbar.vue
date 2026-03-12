<template>
  <div class="navbar">
    <div class="left-panel">
      <el-button
        type="text"
        @click="$emit('toggleSidebar')"
      >
        <i :class="['el-icon-s-fold', { 'rotate-icon': isCollapse }]" />
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="right-panel">
      <el-dropdown>
        <div class="user-info">
          <el-avatar :size="30" :src="$store.state.user.avatar" />
          <span class="username">{{ $store.state.user.nickname }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleProfile">个人中心</el-dropdown-item>
            <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    currentRouteName() {
      return this.$route.meta.title || ''
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('user/logout').then(() => {
        this.$router.push('/login')
      })
    },
    handleProfile() {
      this.$router.push('/profile')
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  
  .left-panel {
    display: flex;
    align-items: center;
    
    .el-icon-s-fold {
      font-size: 24px;
      margin-right: 15px;
      transition: transform .3s;
      
      &.rotate-icon {
        transform: rotate(180deg);
      }
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    
    .username {
      margin-left: 10px;
    }
  }
}
</style>