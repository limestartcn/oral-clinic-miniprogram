<template>
  <div class="medical-detail">
    <!-- 加载状态 -->
    <el-skeleton :loading="loading" animated :rows="5">
      <template #default>
        <el-page-header @back="$router.go(-1)">
          <template #content>
            <!-- 安全访问 + 多重保护 -->
            <span class="title">
                {{ patientInfo?.nickname || '未知患者' }} 的就诊记录
            </span>
            <el-tag v-if="data.appointment_time" type="info" size="small">
              {{ dayjs(data.appointment_time).format('YYYY-MM-DD HH:mm') }}
            </el-tag>
          </template>
        </el-page-header>

        <el-card class="main-card">
          <!-- 诊断信息 -->
          <section class="section">
            <h3>诊断记录</h3>
            <div class="content-box">
              <pre>{{ data.diagnosis || '暂无诊断记录' }}</pre>
            </div>
          </section>

          <!-- 治疗方案 -->
          <section class="section">
            <h3>治疗方案</h3>
            <div class="content-box">
              <pre>{{ data.treatment || '暂无治疗方案' }}</pre>
            </div>
          </section>

          <!-- 处方信息 -->
          <prescription-form 
            v-if="data.prescription && data.prescription.length"
            :data="data.prescription" 
            readonly 
          />

          <!-- 附件资料 -->
          <case-attachment 
            v-if="data.attachments && data.attachments.length"
            :files="data.attachments" 
          />
        </el-card>
      </template>
    </el-skeleton>
  </div>
</template>

<script>
import { defineComponent, ref, onBeforeUnmount, computed  } from 'vue'
import { useRoute } from 'vue-router'
import { getMedicalDetail } from '@/api/doctor'
import PrescriptionForm from '@/views/doctor/medical/components/PrescriptionForm.vue'
import CaseAttachment from '@/views/doctor/medical/components/CaseAttachment.vue'
import dayjs from 'dayjs'

export default defineComponent({
  components: { PrescriptionForm, CaseAttachment },
  
  setup() {
    const route = useRoute()
    const loading = ref(true)
    let abortController = new AbortController()

    // 强化数据初始化
    const data = ref({
        diagnosis: '',
        treatment: '',
        prescription: [],
        attachments: [],
        appointment_time: null,
        patient_info: {  // ✅ 确保嵌套结构完整
            nickname: '加载中...',
            mobile: '--',
            id: null
        }
    })

    // 独立患者信息对象
    const patientInfo = computed(() => ({
        nickname: data.value.patient_info?.nickname?.trim() || '未知患者',
        mobile: data.value.patient_info?.mobile?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '--',
        id: data.value.patient_info?.id || ''
    }))

    const loadData = async (appointmentId) => {
      try {
        const res = await getMedicalDetail(appointmentId, {
          signal: abortController.signal
        })
        
        // 深度合并保障数据结构
        data.value = Object.assign(
          {},
          {
            diagnosis: '',
            treatment: '',
            prescription: [],
            attachments: [],
            appointment_time: null,
            patient_info: { nickname: '未知患者', mobile: '--' }
          },
          res.data || {}
        )

        // 独立处理患者信息
        patientInfo.value = {
          nickname: res.data?.patient_info?.nickname || '未知患者',
          mobile: res.data?.patient_info?.mobile || '--'
        }

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('加载失败:', error)
          patientInfo.value = {
            nickname: '数据加载失败',
            mobile: '请稍后重试'
          }
        }
      } finally {
        loading.value = false
      }
    }

    onBeforeUnmount(() => {
      abortController.abort()
    })

    return {
      dayjs,
      data,
      patientInfo,
      loading,
      loadData
    }
  },

  mounted() {
    this.loadData(this.$route.params.appointmentId)
  }
})
</script>

<style lang="scss" scoped>
.content-box {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
  }
}

.section {
  margin-bottom: 30px;
  
  h3 {
    color: #666;
    margin-bottom: 10px;
  }
}
</style>