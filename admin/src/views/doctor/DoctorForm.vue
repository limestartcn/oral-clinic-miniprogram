<template>
  <div class="doctor-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
    >
      <!-- 用户账户信息 -->
      <el-divider content-position="left">账户信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="手机号码：" prop="mobile">
            <el-input
              v-model="formData.mobile"
              placeholder="请输入手机号"
              :disabled="!isCreateMode"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录密码：" prop="password" v-if="isCreateMode">
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 医生基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="医生姓名：" prop="name">
            <el-input v-model="formData.name" placeholder="请输入真实姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属科室：" prop="department_id">
            <el-select
              v-model="formData.department_id"
              placeholder="请选择科室"
              filterable
              clearable
              @focus="loadDepartments"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 专业信息 -->
      <el-divider content-position="left">专业信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="职称：" prop="title">
            <el-select v-model="formData.title" placeholder="请选择职称">
              <el-option
                v-for="title in titleOptions"
                :key="title"
                :label="title"
                :value="title"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="头像：" prop="avatar">
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <img v-if="formData.avatar" :src="formData.avatar" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="擅长领域：" prop="specialty">
        <el-input
          v-model="formData.specialty"
          type="textarea"
          :rows="3"
          placeholder="请输入擅长领域，多个用逗号分隔"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="cancelForm">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { createDoctor, updateDoctor, getDoctorDetail } from '@/api/doctor'
import { getDepartmentList } from '@/api/department'
import { Plus } from '@element-plus/icons-vue' // 新增导入


export default {
  name: 'DoctorForm',
  components: { // 新增组件注册
    Plus
  },
  props: {
    id: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      uploadUrl: import.meta.env.VITE_APP_BASE_API + '/api/upload',
      isCreateMode: true,
      departments: [],
      titleOptions: ['主任医师', '副主任医师', '主治医师', '医师'],
      formData: {
        mobile: '',
        password: '',
        name: '',
        department_id: null,
        title: '医师',
        specialty: '',
        avatar: ''
      },
      formRules: {
        mobile: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入医生姓名', trigger: 'blur' }
        ],
        department_id: [
          { required: true, message: '请选择所属科室', trigger: 'change' }
        ],
        title: [
          { required: true, message: '请选择职称', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    formTitle() {
      return this.isCreateMode ? '新增医生' : '编辑医生信息'
    }
  },
  created() {
    this.isCreateMode = !this.id
    if (!this.isCreateMode) {
      this.loadDoctorDetail()
    }
  },
  methods: {
    async loadDepartments() {
      if (this.departments.length > 0) return
      try {
        const { data } = await getDepartmentList()
        this.departments = data
      } catch (error) {
        console.error('加载科室列表失败:', error)
      }
    },

    async loadDoctorDetail() {
      try {
        const { data } = await getDoctorDetail(this.id)
        this.formData = {
          ...data,
          department_id: data.department?.id
        }
      } catch (error) {
        console.error('加载医生详情失败:', error)
        this.$message.error('获取医生信息失败')
      }
    },

    handleAvatarSuccess(res) {
      if (res.code === 200) {
        this.formData.avatar = res.data.url
        this.$message.success('头像上传成功')
      }
    },

    beforeAvatarUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('只能上传图片文件')
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过2MB')
      }
      return isImage && isLt2M
    },

    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        
        const formData = { ...this.formData }
        if (this.isCreateMode) {
          await createDoctor(formData)
          this.$message.success('医生创建成功')
        } else {
          await updateDoctor(this.id, formData)
          this.$message.success('信息更新成功')
        }
        
        this.$router.push('/admin/doctor/list')
      } catch (error) {
        console.error('表单提交失败:', error)
        this.$message.error(error.response?.data?.message || '操作失败')
      }
    },

    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>
.doctor-form-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;

  .el-divider {
    margin: 30px 0;
  }

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
</style>