<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-input
            v-model="searchKey"
            placeholder="搜索姓名/手机号"
            style="width: 240px"
            @keyup.enter="loadData"
          >
            <template #append>
              <el-button @click="loadData">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          <el-button type="primary" @click="showCreateDialog">新增用户</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="nickname" label="姓名" min-width="120" />
        <el-table-column prop="mobile" label="手机号" min-width="150" />
        <el-table-column prop="role.name" label="角色" min-width="120" />
        <el-table-column label="状态" min-width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="180">
          <template #default="{row}">
            {{ dayjs(row.create_time).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button 
              size="small" 
              @click="showEditDialog(row)"
              :disabled="row.id === currentUserId"
            >编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row.id)"
              :disabled="row.id === currentUserId"
            >删除</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      :close-on-click-modal="false"
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="100px"
      >
        <el-form-item label="姓名：" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="手机号：" prop="mobile">
          <el-input 
            v-model="form.mobile" 
            placeholder="请输入手机号" 
            maxlength="11" 
            clearable
          />
        </el-form-item>
        <el-form-item label="角色：" prop="role_id">
          <el-select 
            v-model="form.role_id" 
            placeholder="请选择角色" 
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item 
          label="密码：" 
          prop="password" 
          v-if="isCreate"
        >
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
          />
        </el-form-item>
        <el-form-item label="状态：" prop="status" v-if="!isCreate">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button 
            type="primary" 
            @click="submitForm"
            :loading="submitLoading"
          >确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { 
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserInfo
} from '@/api/user'
import { getRoleList } from '@/api/role'

export default {
  components: {
    Search
  },
  setup() {
    const formRef = ref(null)
    const tableData = ref([])
    const loading = ref(false)
    const submitLoading = ref(false)
    const dialogVisible = ref(false)
    const isCreate = ref(true)
    const currentUserId = ref(null)
    const roleOptions = ref([])
    const searchKey = ref('')

    // 分页配置
    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    // 表单配置
    const form = reactive({
      id: null,
      nickname: '',
      mobile: '',
      role_id: 1,
      password: '',
      status: 1
    })

    // 验证规则
    const rules = reactive({
      nickname: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在2-20个字符', trigger: 'blur' }
      ],
      mobile: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { 
          pattern: /^1[3-9]\d{9}$/,
          message: '手机号格式不正确',
          trigger: 'blur'
        }
      ],
      role_id: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ],
      password: [
        { 
          required: true,
          message: '请输入密码',
          trigger: 'blur',
          validator: (rule, value, callback) => {
            if (isCreate.value && !value) {
              callback(new Error('密码不能为空'))
            } else {
              callback()
            }
          }
        },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ]
    })

    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true
        const params = {
          page: pagination.current,
          pageSize: pagination.size,
          search: searchKey.value
        }
        const res = await getUserList(params)
        tableData.value = res.data.list
        pagination.total = res.data.total
      } catch (error) {
        ElMessage.error(error.message || '加载数据失败')
      } finally {
        loading.value = false
      }
    }

    // 加载角色列表
    const loadRoles = async () => {
      try {
        const res = await getRoleList()
        roleOptions.value = res.data
      } catch (error) {
        ElMessage.error('加载角色列表失败')
      }
    }

    // 显示创建弹窗
    const showCreateDialog = () => {
      isCreate.value = true
      resetForm()
      dialogVisible.value = true
    }

    // 显示编辑弹窗
    const showEditDialog = (row) => {
      isCreate.value = false
      Object.assign(form, {
        id: row.id,
        nickname: row.nickname,
        mobile: row.mobile,
        role_id: row.role_id,
        status: row.status
      })
      dialogVisible.value = true
    }

    // 提交表单
    const submitForm = async () => {
      try {
        await formRef.value.validate()
        submitLoading.value = true

        if (isCreate.value) {
          await createUser(form)
          ElMessage.success('创建用户成功')
        } else {
          await updateUser(form.id, form)
          ElMessage.success('更新用户成功')
        }
        
        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }

    // 删除用户
    const handleDelete = async (id) => {
      try {
        await ElMessageBox.confirm('确定删除该用户？此操作不可恢复！', '警告', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteUser(id)
        ElMessage.success('删除成功')
        loadData()
      } catch (error) {
        // 取消删除不处理
      }
    }

    // 切换用户状态
    const toggleStatus = async (row) => {
      try {
        await toggleUserStatus(row.id, { status: row.status === 1 ? 0 : 1 })
        ElMessage.success('状态更新成功')
        loadData()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }

    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        id: null,
        nickname: '',
        mobile: '',
        role_id: 1,
        password: '',
        status: 1
      })
    }

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.size = size
      loadData()
    }

    const handlePageChange = (page) => {
      pagination.current = page
      loadData()
    }

    // 初始化
    onMounted(async () => {
      try {
        const userRes = await getUserInfo()
        currentUserId.value = userRes.data.id
        await loadRoles()
        loadData()
      } catch (error) {
        ElMessage.error('初始化失败: ' + error.message)
      }
    })

    return {
      // 模板引用
      formRef,
      tableData,
      loading,
      submitLoading,
      dialogVisible,
      isCreate,
      pagination,
      searchKey,
      form,
      rules,
      roleOptions,
      currentUserId,

      // 计算属性
      dialogTitle: computed(() => isCreate.value ? '新增用户' : '编辑用户'),

      // 方法
      dayjs,
      loadData,
      showCreateDialog,
      showEditDialog,
      submitForm,
      handleDelete,
      toggleStatus,
      handleSizeChange,
      handlePageChange
    }
  }
}
</script>

<style lang="scss" scoped>
.user-manage {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>