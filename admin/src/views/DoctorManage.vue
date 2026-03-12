<template>
  <div class="doctor-manage-container">
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <div class="left-actions">
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="handleCreate"
        >
          新增医生
        </el-button>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索医生/手机号"
          class="search-input"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="right-actions">
        <el-button-group>
          <el-button 
            :type="filterStatus === '' ? 'primary' : ''"
            @click="changeStatus('')"
          >全部</el-button>
          <el-button 
            :type="filterStatus === 1 ? 'success' : ''"
            @click="changeStatus(1)"
          >启用中</el-button>
          <el-button 
            :type="filterStatus === 0 ? 'danger' : ''"
            @click="changeStatus(0)"
          >已禁用</el-button>
        </el-button-group>
        
        <el-dropdown @command="handleBatch">
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="enable">批量启用</el-dropdown-item>
              <el-dropdown-item command="disable">批量禁用</el-dropdown-item>
              <el-dropdown-item command="export">导出数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="doctorList"
      v-loading="loading"
      stripe
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="医生头像" width="100" align="center">
        <template #default="{row}">
          <el-avatar 
            :size="50" 
            :src="row.avatar || '/default-avatar.png'"
          />
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="name" 
        label="姓名" 
        width="120"
        sortable
      />
      
      <el-table-column label="职称/科室" width="200">
        <template #default="{row}">
          <div class="title-department">
            <el-tag type="info">{{ row.title }}</el-tag>
            <span class="department">{{ row.department?.name }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="账户信息" width="220">
        <template #default="{row}">
          <div class="account-info">
            <div class="mobile">{{ row.user?.mobile }}</div>
            <el-tag 
              v-if="row.user" 
              :type="row.user.status === 1 ? 'success' : 'danger'" 
              size="small"
            >
              {{ row.user.status === 1 ? '已激活' : '已禁用' }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="specialty" 
        label="擅长领域" 
        min-width="200"
        show-overflow-tooltip
      />
      
      <el-table-column 
        prop="service_count" 
        label="接诊数" 
        width="100"
        sortable
        align="center"
      >
        <template #default="{row}">
          <el-statistic :value="row.service_count" />
        </template>
      </el-table-column>
      
      <el-table-column 
        label="评分" 
        width="120"
        sortable
        align="center"
      >
        <template #default="{row}">
          <el-rate 
            v-model="row.rating" 
            disabled 
            show-score
            :colors="['#F56C6C', '#E6A23C', '#67C23A']"
          />
        </template>
      </el-table-column>
      
      <el-table-column 
        label="操作" 
        width="220" 
        fixed="right"
        align="center"
      >
        <template #default="{row}">
          <el-button 
            type="primary" 
            size="small"
            icon="el-icon-edit"
            @click="handleEdit(row)"
          >编辑</el-button>
          
          <el-popconfirm 
            title="确定删除该医生吗？"
            @confirm="handleDelete(row.id)"
          >
            <template #reference>
              <el-button 
                type="danger" 
                size="small"
                icon="el-icon-delete"
              >删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:currentPage="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="rules"
        label-width="100px"
        label-position="left"
      >
        <!-- 用户账户信息 -->
        <el-divider content-position="left">账户信息</el-divider>
        <div class="form-section">
          <el-form-item label="手机号" prop="mobile">
            <el-input 
              v-model="formData.mobile" 
              placeholder="请输入手机号"
              :disabled="!isCreate"
            />
          </el-form-item>
          
          <el-form-item 
            label="登录密码" 
            prop="password"
            v-if="isCreate"
          >
            <el-input 
              v-model="formData.password" 
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
        </div>

        <!-- 医生专业信息 -->
        <el-divider content-position="left">专业信息</el-divider>
        <div class="form-section">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医生姓名" prop="name">
                <el-input v-model="formData.name" />
              </el-form-item>
              
              <el-form-item label="所属科室" prop="department_id">
                <el-select 
                  v-model="formData.department_id" 
                  placeholder="选择科室"
                  @focus="loadDepartments"
                >
                  <el-option
                    v-for="d in departments"
                    :key="d.id"
                    :label="d.name"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="职称" prop="title">
                <el-select v-model="formData.title">
                  <el-option
                    v-for="t in titleOptions"
                    :key="t"
                    :label="t"
                    :value="t"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="头像上传" prop="avatar">
                <el-upload
                  class="avatar-uploader"
                  action="/api/upload"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                >
                  <img 
                    v-if="formData.avatar" 
                    :src="formData.avatar" 
                    class="avatar"
                  >
                  <el-icon v-else class="avatar-uploader-icon">
                    <Plus />
                  </el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="擅长领域" prop="specialty">
            <el-input
              v-model="formData.specialty"
              type="textarea"
              :rows="3"
              placeholder="多个擅长领域用逗号分隔"
            />
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitForm"
          :loading="submitting"
        >确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 逻辑部分代码参考之前实现
</script>

<style lang="scss" scoped>
.doctor-manage-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;

  .operation-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .left-actions {
      display: flex;
      gap: 15px;
      align-items: center;

      .search-input {
        width: 300px;
      }
    }

    .right-actions {
      display: flex;
      gap: 15px;
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

    .mobile {
      font-weight: 500;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .form-section {
    padding: 0 20px;

    .avatar-uploader {
      :deep(.el-upload) {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--el-transition-duration-fast);
        
        &:hover {
          border-color: var(--el-color-primary);
        }
      }
      
      .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 120px;
        height: 120px;
        line-height: 120px;
        text-align: center;
      }
      
      .avatar {
        width: 120px;
        height: 120px;
        display: block;
      }
    }
  }
}
</style>