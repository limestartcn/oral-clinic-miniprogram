<template>
  <div class="not-found-container">
    <h1>404</h1>
    <p>您访问的页面不存在</p>
    <el-button 
      type="primary" 
      @click="$router.push('/')"
    >
      返回首页
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found-container {
  text-align: center;
  padding: 100px;
}

.not-found-container h1 {
  font-size: 80px;
  color: var(--el-color-primary);
  margin-bottom: 20px;
}

.not-found-container p {
  font-size: 20px;
  margin-bottom: 30px;
}
</style>