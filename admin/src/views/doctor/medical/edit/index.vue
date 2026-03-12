<template>
  <div class="medical-edit">
    <!-- 添加空值保护 -->
    <el-page-header 
      :title="`为 ${patientInfo.nickname || '未知患者'} 填写病例`" 
      @back="$router.go(-1)" 
    />
    
    <el-form ref="form" :model="formData" label-width="100px">
      <!-- 诊断信息 -->
      <el-form-item label="诊断结论">
        <el-input
          v-model="formData.diagnosis"
          type="textarea"
          :rows="4"
          placeholder="请输入详细诊断结论"
        />
      </el-form-item>

      <!-- 治疗方案 -->
      <el-form-item label="治疗方案">
        <el-input
          v-model="formData.treatment"
          type="textarea"
          :rows="4"
          placeholder="请输入治疗方案"
        />
      </el-form-item>

      <!-- 处方信息 -->
      <prescription-form v-model="formData.prescription" />

      <!-- 附件上传 -->
      <case-attachment v-model="formData.attachments" />

      <el-form-item>
        <el-button 
          type="primary" 
          :loading="submitting" 
          @click="submit"
        >
          提交保存
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PrescriptionForm from '../components/PrescriptionForm.vue'
import CaseAttachment from '../components/CaseAttachment.vue'
import { 
  getMedicalDetail,
  saveMedicalRecord 
} from '@/api/medical'

export default defineComponent({
  components: { PrescriptionForm, CaseAttachment },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const submitting = ref(false)

    // 初始化数据结构
    const initFormData = () => ({
      appointment_id: route.params.id,
      diagnosis: '',
      treatment: '',
      prescription: [],
      attachments: []
    })

    // 响应式数据
    const formData = ref(initFormData())
    const patientInfo = ref({
      nickname: '加载中...',
      mobile: '--'
    })

    // 加载病例数据
    onMounted(async () => {
      try {
        const { code, data } = await getMedicalDetail(route.params.id)
        
        if (code === 200) {
          // 合并患者信息
          patientInfo.value = {
            nickname: data.patient_info?.nickname || '未知患者',
            mobile: data.patient_info?.mobile || '--'
          }
          
          // 填充表单数据
          formData.value = {
            ...initFormData(),
            diagnosis: data.diagnosis || '',
            treatment: data.treatment || '',
            prescription: Array.isArray(data.prescription) ? [...data.prescription] : [],
            attachments: Array.isArray(data.attachments) ? [...data.attachments] : []
          }
        } else if (code === 404) {
          ElMessage.warning('请先完成预约操作')
          router.push('/admin/doctor/appointments')
        }
      } catch (error) {
        ElMessage.error('数据加载失败')
        console.error('[病例加载错误]', error)
      }
    })

    // 提交表单
    const submit = async () => {
      try {
        submitting.value = true
        
        const { code } = await saveMedicalRecord(formData.value)
        if (code === 200) {
          ElMessage.success('保存成功')
          router.push({
            name: 'MedicalDetail',
            params: { appointmentId: route.params.id }
          })
        }
      } catch (error) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        submitting.value = false
      }
    }

    return {
      patientInfo,
      formData,
      submitting,
      submit
    }
  }
})
</script>

<style lang="scss" scoped>
.medical-edit {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;

  .el-page-header {
    margin-bottom: 24px;
  }

  .el-form {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  }
}
</style>