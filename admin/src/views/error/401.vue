<!-- src/views/error/401.vue -->
<template>
  <div class="unauthorized-container">
    <h1>401</h1>
    <p>您没有访问权限</p>
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
  name: 'Unauthorized'
}
</script>

<style scoped>
.unauthorized-container {
  text-align: center;
  padding: 100px;
  
  h1 {
    font-size: 80px;
    color: var(--el-color-danger);
    margin-bottom: 20px;
  }
  
  p {
    font-size: 20px;
    margin-bottom: 30px;
  }
}
</style>