<template>
  <div class="quick-actions">
    <el-button type="text" icon="el-icon-refresh" @click="refresh"></el-button>
    <el-button type="text" icon="el-icon-setting" @click="openSettings"></el-button>
  </div>
</template>

<script>
export default {
  methods: {
    refresh() {
      this.$emit('refresh')
    },
    openSettings() {
      this.$router.push('/settings')
    }
  }
}
</script>