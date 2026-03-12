<template>
  <el-card class="stat-card" :style="{ borderLeft: `4px solid ${color}` }">
    <div class="card-content">
      <div class="icon" :style="{ backgroundColor: color + '20' }">
        <!-- 修改图标渲染方式 -->
        <el-icon :size="24" :color="color">
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="info">
        <div class="title">{{ title }}</div>
        <div class="value">{{ value }}</div>
        <div class="trend" :style="trendStyle">
          <i :class="trendIcon"></i>
          {{ trendText }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  props: {
    title: String,
    value: [String, Number],
    icon: String,
    color: String,
    trend: Number
  },
  computed: {
    trendIcon() {
      return this.trend > 0 ? 'el-icon-top' : 'el-icon-bottom'
    },
    trendText() {
      return `${Math.abs(this.trend * 100).toFixed(1)}%`
    },
    trendStyle() {
      return {
        color: this.trend > 0 ? '#67C23A' : '#F56C6C'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.stat-card {
  border-radius: 8px;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-3px);
  }

  .card-content {
    display: flex;
    align-items: center;
    padding: 16px;

    .icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;

      i {
        font-size: 24px;
      }
    }

    .info {
      .title {
        font-size: 14px;
        color: #909399;
        margin-bottom: 4px;
      }

      .value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .trend {
        font-size: 12px;
        display: flex;
        align-items: center;

        i {
          margin-right: 4px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>