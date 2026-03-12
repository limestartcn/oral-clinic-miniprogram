<template>
  <el-tag :type="tagType" effect="plain">
    {{ statusText }}
  </el-tag>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    status: {
      type: Number,
      required: true
    }
  },
  
  computed: {
    statusText() {
      const map = {
        1: '待确认',
        2: '已预约',
        3: '已完成',
        4: '已取消'
      }
      return map[this.status] || '未知状态'
    },
    
    tagType() {
      const typeMap = {
        1: 'warning',
        2: 'primary',
        3: 'success',
        4: 'info'
      }
      return typeMap[this.status] || 'danger'
    }
  }
})
</script>