<template>
  <div class="doctor-list-container">
    <!-- 搜索和操作区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.search"
        placeholder="搜索医生姓名/手机号"
        class="filter-item"
        clearable
        @keyup.enter="getList"
        @clear="handleFilter"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>

      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-plus"
        @click="handleCreate"
      >
        新增医生
      </el-button>

      <el-button
        :disabled="multipleSelection.length === 0"
        icon="el-icon-delete"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      
      <el-table-column label="头像" width="100" align="center">
        <template #default="{row}">
          <el-avatar :size="50" :src="row.avatar || defaultAvatar" />
        </template>
      </el-table-column>

      <el-table-column 
        label="医生姓名" 
        prop="name" 
        min-width="120"
        sortable
      />

      <el-table-column label="职称/科室" min-width="180">
        <template #default="{row}">
          <div class="title-department">
            <el-tag type="info">{{ row.title }}</el-tag>
            <span class="department">{{ row.department?.name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="账户信息" min-width="200">
        <template #default="{row}">
          <div class="account-info">
            <div>{{ row.user?.mobile }}</div>
            <el-tag 
                :type="getStatusType(row.user?.status)"
                size="small"
            >
                {{ getStatusText(row.user?.status) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column 
        label="接诊数" 
        prop="service_count" 
        width="120"
        align="center"
        sortable
      >
        <template #default="{row}">
          <el-statistic :value="row.service_count" />
        </template>
      </el-table-column>

      <el-table-column 
        label="评分" 
        prop="rating" 
        width="150"
        align="center"
        sortable
      >
        <template #default="{row}">
          <el-rate
            v-model="row.rating"
            disabled
            show-score
            :colors="ratingColors"
          />
        </template>
      </el-table-column>

      <el-table-column 
        label="操作" 
        width="220" 
        align="center"
        fixed="right"
      >
        <template #default="{row}">
          <el-button 
            type="primary" 
            size="small"
            icon="el-icon-edit"
            @click="handleUpdate(row)"
          >
            编辑
          </el-button>
          
          <el-popconfirm
            title="确定删除该医生吗？"
            @confirm="handleDelete(row.id)"
          >
            <template #reference>
              <el-button
                type="danger"
                size="small"
                icon="el-icon-delete"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="listQuery.page"
      v-model:limit="listQuery.limit"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { getDoctorList, deleteDoctor } from '@/api/doctor'
import Pagination from '@/components/Pagination/index.vue'
import defaultAvatar from '@/assets/default-avatar.jpg'

export default {
  name: 'DoctorList',
  components: { Pagination },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      multipleSelection: [],
      ratingColors: ['#F56C6C', '#E6A23C', '#67C23A'],
      defaultAvatar,
      listQuery: {
        page: 1,
        limit: 20,
        search: '',
        sort: '-id'
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    // 状态类型映射方法
    getStatusType(status) {
      const statusMap = { 1: 'success', 0: 'danger' }
      return statusMap[status] || ''
    },

    // 状态文本映射方法  
    getStatusText(status) {
      const statusMap = { 1: '启用', 0: '禁用' }
      return statusMap[status] || '未知状态'
    },
    async getList() {
      this.listLoading = true
      try {
        const res = await getDoctorList(this.listQuery)
        console.log('接口响应:', res.data)
        
        // 修正数据路径
        this.list = res.data.data
        this.total = res.data.total
        
        // 同步分页当前页（如需）
        // this.listQuery.page = res.data.current_page
      } catch (error) {
        console.error('获取医生列表失败:', error)
        this.$message.error('数据加载失败')
      } finally {
        this.listLoading = false
      }
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    handleCreate() {
      this.$router.push('/admin/doctor/create')
    },

    handleUpdate(row) {
      this.$router.push(`/admin/doctor/edit/${row.id}`)
    },

    async handleDelete(id) {
      try {
        await deleteDoctor(id)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        console.error('删除失败:', error)
      }
    },

    async handleBatchDelete() {
      try {
        const ids = this.multipleSelection.map(item => item.id)
        await deleteDoctor(ids)
        this.$message.success(`已删除 ${ids.length} 位医生`)
        this.getList()
      } catch (error) {
        console.error('批量删除失败:', error)
      }
    },

    handleSelectionChange(val) {
      this.multipleSelection = val
    }
  }
}
</script>

<style lang="scss" scoped>
.doctor-list-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;

  .filter-container {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;

    .filter-item {
      width: 200px;
    }
  }

  .title-department {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .department {
      color: #666;
      font-size: 12px;
    }
  }

  .account-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.el-rate {
  :deep(.el-rate__item) {
    vertical-align: middle;
  }
}
</style>