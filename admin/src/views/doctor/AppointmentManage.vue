<template>
  <div class="appointment-manage">
    <!-- 筛选工具栏 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterStatus" @change="fetchData">
        <el-radio-button :label="0">全部</el-radio-button>
        <el-radio-button :label="1">待确认</el-radio-button>
        <el-radio-button :label="2">已预约</el-radio-button>
        <el-radio-button :label="3">已完成</el-radio-button>
      </el-radio-group>

      <el-input
        v-model="searchKey"
        placeholder="患者姓名/手机号"
        class="search-input"
        clearable
        @clear="fetchData"
        @keyup.enter="fetchData"
      >
        <template #append>
          <el-button icon="el-icon-search" @click="fetchData" />
        </template>
      </el-input>
    </div>

    <!-- 预约列表 -->
    <el-table
      v-loading="loading"
      :data="appointments"
      style="width: 100%"
      height="calc(100vh - 200px)"
    >
      <el-table-column prop="appointment_time" label="预约时间" width="180">
        <template #default="{row}">
          {{ dayjs(row.appointment_time).format('YYYY-MM-DD HH:mm') }}
        </template>
      </el-table-column>

      <el-table-column prop="patient_info.nickname" label="患者" width="120">
        <template #default="{row}">
          <el-tag>{{ row.patient_info.nickname }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="department_name" label="科室" width="120" />

      <el-table-column label="状态" width="100">
        <template #default="{row}">
          <status-badge :status="row.status" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <el-button
            type="primary"
            size="small"
            @click="showDetail(row)"
          >
            详情
          </el-button>
          
          <el-button
            v-if="row.status === 2"
            type="success"
            size="small"
            @click="completeAppointment(row.id)"
          >
            完成
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      class="pagination"
      :current-page="pagination.current"
      :page-size="pagination.size"
      :total="pagination.total"
      @current-change="handlePageChange"
    />

    <!-- 预约详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="预约详情"
      size="40%"
    >
      <appointment-detail :data="currentAppointment" />
    </el-drawer>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted  } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'
import AppointmentDetail from './components/AppointmentDetail.vue'
import { getDoctorAppointments, completeAppointment as apiCompleteAppointment } from '@/api/doctor'
import { useRouter } from 'vue-router'

export default defineComponent({
  components: { StatusBadge, AppointmentDetail },
  
  setup() {
    const loading = ref(false)
    const filterStatus = ref(0)
    const searchKey = ref('')
    const detailVisible = ref(false)
    const currentAppointment = ref(null)
    const router = useRouter()
    // 分页配置
    const pagination = reactive({
      current: 1,
      size: 20,
      total: 0
    })

    // 预约数据
    const appointments = ref([])

    // 获取数据
    const fetchData = async () => {
      try {
        loading.value = true
        const params = {
          status: filterStatus.value || undefined,
          keyword: searchKey.value,
          page: pagination.current,
          size: pagination.size
        }
        // 移除空值参数
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') 
        ) 
        const res = await getDoctorAppointments(cleanParams)
        appointments.value = res.data.records
        pagination.total = res.data.total
      } catch (error) {
        ElMessage.error(error.message || '获取数据失败')
      } finally {
        loading.value = false
      }
    }

    // 完成预约
    const completeAppointment = async (id) => {
      try {
        // ✅ 先完成预约再跳转
        await apiCompleteAppointment(id); 
        ElMessage.success('操作成功');

        // ✅ 正确跳转路径
        router.push({
          name: 'MedicalEdit', // 使用命名路由
          params: { id }
        });

        // ✅ 简化刷新逻辑
        const shouldReset = filterStatus.value === 2 && pagination.total === 1;
        if (shouldReset) {
          filterStatus.value = 0;
          pagination.current = 1;
        }
        
        await fetchData(); // 仅保留一次刷新

      } catch (error) {
        ElMessage.error(error.message || '操作失败');
      }
    }

    // 显示详情
    const showDetail = (row) => {
      currentAppointment.value = row
      detailVisible.value = true
    }

    // 分页变化
    const handlePageChange = (page) => {
      pagination.current = page
      fetchData()
    }

    onMounted(() => { 
      fetchData() 
    }) 

    return {
      dayjs,
      loading,
      filterStatus,
      searchKey,
      appointments,
      pagination,
      detailVisible,
      currentAppointment,
      fetchData,
      completeAppointment,
      showDetail,
      handlePageChange
    }
  }
})
</script>

<style lang="scss" scoped>
.appointment-manage {
  padding: 20px;
  height: 100%;

  .filter-bar {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;

    .search-input {
      width: 300px;
    }
  }

  .pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>