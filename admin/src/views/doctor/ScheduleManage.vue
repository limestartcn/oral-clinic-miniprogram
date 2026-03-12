<template>
  <div class="schedule-manage">
    <el-card>
      <template #header>
        <div class="filter-header">
          <div class="filter-group">
            <el-select
              v-model="selectedDoctor"
              placeholder="选择医生"
              filterable
              clearable
              @change="loadData"
              style="width: 200px; margin-right: 10px;"
            >
              <el-option
                v-for="doctor in doctorOptions"
                :key="doctor.value"
                :label="doctor.label"
                :value="doctor.value"
              />
            </el-select>

            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="(val) => { dateRange = val; loadData(); }"
              style="margin-right: 10px;"
            />

            <el-button
              type="primary"
              @click="generateNextWeek"
              :loading="generating"
            >
              生成下周排班
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="schedules" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column label="医生" width="150" v-if="!selectedDoctor">
          <template #default="{row}">
            {{ doctorMap[row.doctor_id]?.name || '未知医生' }}
          </template>
        </el-table-column>

        <el-table-column prop="date" label="日期" width="120" sortable>
          <template #default="{row}">
            {{ row.date }} 
            <div style="color: #909399; font-size: 12px">
              周{{ ['日','一','二','三','四','五','六'][new Date(row.date).getDay()] }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="时间段" width="180">
          <template #default="{row}">
            <div class="time-slot">
              <span>{{ row.time_slot }}</span>
              <el-tag 
                size="small" 
                :type="row.time_type === 1 ? 'warning' : 'success'"
                effect="plain"
              >
                {{ row.time_type === 1 ? '上午' : '下午' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="预约情况" width="150">
          <template #default="{row}">
            <div class="patient-count">
              <el-progress 
                :percentage="(row.booked_patients / row.max_patients) * 100"
                :color="customColors"
                :show-text="false"
                style="flex: 1;"
              />
              <span style="margin-left: 8px;">
                {{ row.booked_patients }}/{{ row.max_patients }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="160">
          <template #default="{row}">
            <div class="status-control">
              <el-switch
                v-model="row.available"
                :active-value="1"
                :inactive-value="0"
                :disabled="row.booked_patients >= row.max_patients"
                @change="handleToggleStatus(row)"
              />
              <el-tooltip 
                content="当已预约数≥最大数时自动关闭"
                placement="top"
              >
                <el-icon class="tip-icon"><Warning /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="最大预约数" width="150">
          <template #default="{row}">
            <el-input-number
              v-model="row.max_patients"
              :min="Math.max(1, row.booked_patients)"
              :max="20"
              :step="1"
              size="small"
              @change="val => handleMaxChange(val, row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { 
  getScheduleList, 
  updateMaxPatients,
  generateNextWeekSchedule,
  getDoctors,
  toggleScheduleStatus
} from '@/api/schedule'

export default {
  components: { Warning },
  setup() {
    const schedules = ref([])
    const loading = ref(false)
    const generating = ref(false)
    const dateRange = ref([])
    const selectedDoctor = ref(null)
    const doctorOptions = ref([])
    const doctorMap = ref({})

    // 进度条颜色配置
    const customColors = [
      { color: '#67C23A', percentage: 70 },
      { color: '#E6A23C', percentage: 90 },
      { color: '#F56C6C', percentage: 100 }
    ]

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    const loadDoctors = async () => {
      try {
        const res = await getDoctors({ page: 1, pageSize: 100 })
        if (res?.code === 200 && Array.isArray(res.data?.data)) {
          doctorOptions.value = res.data.data.map(doctor => ({
            label: doctor.name,
            value: doctor.id,
            department: doctor.department?.name || '未知科室'
          }))
          doctorMap.value = res.data.data.reduce((map, doctor) => {
            map[doctor.id] = doctor
            return map
          }, {})
        }
      } catch (error) {
        ElMessage.error('医生列表加载失败')
      }
    }

    const loadData = async () => {
      try {
        loading.value = true
        // 构建基础参数
        const params = {
          page: pagination.current,
          pageSize: pagination.size,
          doctorId: selectedDoctor.value,
          startDate: dateRange.value?.[0], // 参数名保持前端逻辑
          endDate: dateRange.value?.[1]
        }

        // 清理空值参数（直接删除未定义的键）
        const filteredParams = JSON.parse(JSON.stringify(params))

        console.log('请求参数:', filteredParams)
        const res = await getScheduleList(filteredParams)// 传入有效参数
        if (res?.code === 200) {
          schedules.value = res.data.list.map(item => ({
            ...item,
            // 确保有预约数字段
            booked_patients: item.booked_patients || 0
          }))
          pagination.total = res.data.total
        }
      } catch (error) {
        ElMessage.error('加载排班数据失败')
      } finally {
        loading.value = false
      }
    }
    // 新增处理方法
    const handleDateChange = (val) => {
      dateRange.value = val || []
      loadData()
    }
    const generateNextWeek = async () => {
      try {
        generating.value = true
        await generateNextWeekSchedule()
        ElMessage.success('排班生成成功')
        loadData()
      } catch (error) {
        ElMessage.error('排班生成失败')
      } finally {
        generating.value = false
      }
    }

    const handleToggleStatus = async (row) => {
      try {
        // 前端二次验证
        if (row.booked_patients >= row.max_patients) {
          ElMessage.warning('当前预约已满，不可开启')
          row.available = 0
          return
        }
        // 获取最新状态值
        const newStatus = row.available ? 1 : 0;
        // 发送状态值到后端
        await toggleScheduleStatus(row.id, newStatus);
        ElMessage.success('状态更新成功')
      } catch (error) {
        // 回滚状态
        row.available = !row.available;
        ElMessage.error('状态更新失败')
      }
    }

    const handleMaxChange = async (val, row) => {
      try {
        // 调用正确的更新接口
        await updateMaxPatients(row.id, { max_patients: val });
        
        // 自动关闭已满的排班
        if (row.booked_patients >= val) {
          await toggleScheduleStatus(row.id, 0);
          row.available = 0;
        }
        
        ElMessage.success('最大预约数更新成功');
      } catch (error) {
        ElMessage.error('更新失败: ' + (error.msg || error.message));
      }
    }

    const handleSizeChange = (size) => {
      pagination.size = size
      pagination.current = 1
      loadData()
    }

    onMounted(() => {
      loadDoctors()
      // 默认加载未来7天数据
      const today = new Date()
      dateRange.value = [] 
      loadData()
    })

    return {
      schedules,
      loading,
      generating,
      dateRange,
      selectedDoctor,
      doctorOptions,
      doctorMap,
      pagination,
      customColors,
      loadData,
      generateNextWeek,
      handleToggleStatus,
      handleMaxChange,
      handleSizeChange,
      handleDateChange 
    }
  }
}
</script>

<style scoped>
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.patient-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-icon {
  color: #909399;
  cursor: help;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.el-table {
  margin-top: 15px;
}

.el-tag {
  margin-left: 5px;
}
</style>