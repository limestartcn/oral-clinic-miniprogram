<template>
  <div class="medical-list">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="searchKey"
          placeholder="患者姓名/手机号"
          clearable
          @keyup.enter="fetchData"
        >
          <template #append>
            <el-button icon="el-icon-search" @click="fetchData" />
          </template>
        </el-input>
      </div>

      <el-table
        :data="cases"
        height="calc(100vh - 220px)"
        v-loading="loading"
      >
        <el-table-column prop="appointment_time" label="就诊时间" width="180">
          <template #default="{row}">
            {{ dayjs(row.appointment_time).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>

        <el-table-column label="患者信息">
          <template #default="{row}">
            <div class="patient-info">
              <span class="name">{{ row.patient_info.nickname }}</span>
              <span class="mobile">{{ row.patient_info.mobile }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="主要诊断" prop="diagnosis" show-overflow-tooltip />

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{row}">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row.appointment_id)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { getMedicalList } from '@/api/doctor'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const loading = ref(false)
    const searchKey = ref('')
    const cases = ref([])
    
    const pagination = reactive({
      current: 1,
      size: 15,
      total: 0
    })

    const fetchData = async () => {
      try {
        loading.value = true
        const res = await getMedicalList({
          keyword: searchKey.value,
          page: pagination.current,
          size: pagination.size
        })
        cases.value = res.data.records
        pagination.total = res.data.total
      } finally {
        loading.value = false
      }
    }
    
    const router = useRouter()

    const viewDetail = (appointmentId) => {
      router.push({
        name: 'MedicalDetail', // 确保路由配置中定义了name
        params: { appointmentId }
      })
    }


    onMounted(() => {
      fetchData()
    })
    
    return {
      dayjs,
      searchKey,
      cases,
      pagination,
      fetchData,
      viewDetail,
      handlePageChange: (page) => {
        pagination.current = page
        fetchData()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.patient-info {
  display: flex;
  flex-direction: column;
  
  .name {
    font-weight: 500;
  }
  
  .mobile {
    font-size: 12px;
    color: #999;
  }
}
</style>