<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapse"
    :router="true"
    class="sidebar-menu"
  >
    <sidebar-item :routes="menuList" />
  </el-menu>
</template>

<script>
import SidebarItem from '@/components/SidebarItem.vue'

export default {
  name: 'Sidebar',
  components: { SidebarItem },
  props: {
    collapse: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    },
    menuList() {
      const adminRoute = this.findAdminRoute()
      if (!adminRoute) return []
      
      return this.filterRoutes(adminRoute.children)
    }
  },
  methods: {
    findAdminRoute() {
      return this.$router.options.routes.find(r => r.path === '/admin')
    },

    filterRoutes(routes) {
      return routes
        .map(route => {
          // 深度处理子路由
          if (route.children) {
            const filteredChildren = this.filterRoutes(route.children)
            return filteredChildren.length > 0 ? { 
              ...route,
              children: filteredChildren
            } : null
          }
          return this.hasPermission(route) ? route : null
        })
        .filter(Boolean)
        .filter(route => {
          // 隐藏无有效子项的父路由
          if (route.children) {
            return route.children.some(child => !child.meta?.hidden)
          }
          return true
        })
    },

    hasPermission(route) {
      // 允许没有权限配置的路由显示（如父级菜单）
      const requiredRoles = route.meta?.roles || []
      const userRole = this.$store.state.user.roleId
      
      // 调试日志
      console.log('[权限检查] 路由:', route.path, 
                '需要角色:', requiredRoles, 
                '当前角色:', userRole)
                
      return requiredRoles.length ? requiredRoles.includes(userRole) : true
    }
  }
}
</script>

<style lang="scss">
.sidebar-menu {
  border-right: none;
  user-select: none;

  .el-menu-item,
  .el-submenu__title {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .el-icon {
      font-size: 18px;
      margin-right: 12px;
      color: inherit;
    }
  }

  .el-menu--inline {
    .el-menu-item {
      padding-left: 56px !important;
    }
  }
}

.menu-popper {
  .el-menu--inline {
    padding: 8px 0;
    
    .el-menu-item {
      height: 40px;
      line-height: 40px;
      margin: 4px 0;
    }
  }
}
</style>