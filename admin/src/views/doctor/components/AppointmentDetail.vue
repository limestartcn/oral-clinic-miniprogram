<template>
  <div class="appointment-detail">
    <el-descriptions title="基本信息" border :column="2">
      <el-descriptions-item label="患者姓名">
        {{ data.patient_info?.nickname || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="联系方式">
        {{ data.patient_info?.mobile || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="预约科室">
        {{ data.department_name || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="预约时间">
        {{ dayjs(data.appointment_time).format('YYYY-MM-DD HH:mm') }}
      </el-descriptions-item>
    </el-descriptions>

    <div class="action-area" v-if="data.status === 2">
      <el-button 
        type="primary"
        @click="$emit('complete')"
      >
        标记完成
      </el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'AppointmentDetail',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup() {
    return { dayjs }
  }
})
</script>

<style scoped lang="scss">
.appointment-detail {
  padding: 20px;

  .action-area {
    margin-top: 20px;
    text-align: right;
  }
}
</style>