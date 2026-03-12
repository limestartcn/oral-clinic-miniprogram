<template>
  <div class="user-panel">
    <el-dropdown>
      <span class="user-info">
        <!-- 添加默认头像逻辑 -->
        <el-avatar :size="32" :src="avatar || ''">
          <el-icon v-if="!avatar"><UserFilled /></el-icon>
        </el-avatar>
        <span class="name">{{ username }}</span>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { UserFilled } from '@element-plus/icons-vue' // 导入图标

export default {
  components: { UserFilled },
  computed: {
    username() {
      return this.$store.state.user.nickname || '未登录'
    },
    avatar() {
      return this.$store.state.user.avatar || ''
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('user/logout')
    }
  }
}
</script>