<template>
  <template v-for="route in routes" :key="route.path">
    <el-submenu 
      v-if="shouldShowSubmenu(route)"
      :index="route.path"
    >
      <template #title>
        <el-icon>
          <component :is="route.meta.icon" />
        </el-icon>
        <span>{{ route.meta.title }}</span>
      </template>
      <sidebar-item :routes="route.children" />
    </el-submenu>

    <el-menu-item 
      v-else
      :index="route.path"
      :route="route"
    >
      <el-icon>
        <component :is="route.meta.icon" />
      </el-icon>
      <span>{{ route.meta.title }}</span>
    </el-menu-item>
  </template>
</template>

<script>
export default {
  name: 'SidebarItem',
  props: {
    routes: {
      type: Array,
      required: true
    }
  },
  methods: {
    shouldShowSubmenu(route) {
      return route.children?.length && 
             route.children.some(child => this.isValidRoute(child))
    },
    
    isValidRoute(route) {
      return !route.meta?.hidden && 
            (route.meta?.roles?.length ? 
             route.meta.roles.includes(this.$store.state.user.roleId) : true)
    }
  }
}
</script>