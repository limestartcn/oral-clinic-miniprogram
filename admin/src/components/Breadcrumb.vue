<!-- Breadcrumb.vue -->
<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbs" 
        :key="index"
        :to="item.path"
      >
        {{ item.meta.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  name: 'Breadcrumb',
  computed: {
    breadcrumbs() {
      return this.$route.matched.filter(route => route.meta?.title)
    }
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  padding: 8px 0;
  
  .el-breadcrumb {
    font-size: 14px;

    :deep(.el-breadcrumb__item) {
      &:last-child .el-breadcrumb__inner {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>