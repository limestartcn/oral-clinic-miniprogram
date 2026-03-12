<template>
  <div class="dashboard-container">
    <!-- 数据卡片 -->
    <el-row :gutter="20">
      <el-col 
        v-for="(item, index) in stats" 
        :key="index"
        :xs="24" :sm="12" :md="8" :lg="6"
      >
        <stat-card
          :title="item.title"
          :value="item.value"
          :icon="item.icon"
          :color="item.color"
          :trend="item.trend"
        />
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span class="title">预约趋势分析</span>
          <div class="toolbar">
            <el-radio-group v-model="chartType">
              <el-radio-button value="line">折线图</el-radio-button>
              <el-radio-button value="bar">柱状图</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </div>
        </div>
      </template>
      <div ref="chart" class="chart"></div>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { debounce } from 'lodash'
import StatCard from '@/components/StatCard.vue'
import { 
  Calendar as DateIcon,
  AlarmClock,
  UserFilled,
  Money
} from '@element-plus/icons-vue'

export default {
  components: {
    StatCard
  },
  data() {
    return {
      stats: [
        { title: '今日预约', value: 28, icon: DateIcon, color: '#409EFF', trend: 0.12 },
        { title: '待确认', value: 12, icon: AlarmClock, color: '#E6A23C', trend: -0.05 },
        { title: '总用户', value: '1,589', icon: UserFilled, color: '#67C23A', trend: 0.08 },
        { title: '本月收入', value: '¥56,800', icon: Money, color: '#F56C6C', trend: 0.15 }
      ],
      dateRange: [],
      chartType: 'line',
      chart: null
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    this.chart?.dispose()
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chart)
      this.updateChart()
    },
    updateChart: debounce(function() {
      const isLineChart = this.chartType === 'line';
      const option = {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: ['周一','周二','周三','周四','周五','周六','周日'],
          axisLabel: { color: '#606266' }
        },
        yAxis: { 
          type: 'value',
          axisLabel: { color: '#606266' }
        },
        series: [{
          data: [12, 18, 15, 28, 24, 20, 16],
          type: this.chartType || 'line', // ✅ 关键修改：动态绑定类型
          name: '预约量',
          smooth: isLineChart, // 仅在折线图启用平滑
          lineStyle: { width: 2 },
          itemStyle: { 
            borderRadius: isLineChart ? 0 : [4, 4, 0, 0] // 柱状图圆角
          },
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0)' }
            ])
          }
        }]
      }
      this.chart?.dispose();
      this.chart = echarts.init(this.$refs.chart);
      this.chart.setOption(option);
    }, 300),
    handleResize() {
      this.chart?.resize()
    }
  },
  watch: {
    chartType() {
      this.updateChart();
      this.$nextTick(() => this.chart?.resize());
    },
    dateRange(newVal) {
      // ✅ 添加日期筛选后的数据更新逻辑
      if (newVal) this.fetchChartData();
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;

  .chart-card {
    margin-top: 24px;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: 500;
      }

      .toolbar {
        display: flex;
        gap: 16px;
        align-items: center;
      }
    }

    .chart {
      height: 400px;
    }
  }
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
}
</style>