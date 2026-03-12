<template>
  <div class="time-slot-card" :class="{ disabled: !schedule.available }">
    <div class="status-row">
      <el-switch
        v-model="schedule.available"
        @change="emitToggleStatus"
      />
      <span class="status-text">{{ schedule.available ? '可预约' : '已关闭' }}</span>
    </div>
    
    <div class="stats-row">
      <el-input-number
        v-model="schedule.max_patients"
        :min="1"
        :max="20"
        @change="emitUpdateMax"
      />
      <span class="stat-item">最大: {{ schedule.max_patients }}</span>
      <span class="stat-item">已约: {{ schedule.booked_patients }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  schedule: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update-max', 'toggle-status'])

const emitUpdateMax = () => {
  emit('update-max', {
    id: props.schedule.id,
    max: props.schedule.max_patients
  })
}

const emitToggleStatus = () => {
  emit('toggle-status', props.schedule.id)
}
</script>

<style scoped>
.time-slot-card {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.disabled {
  background: #fef0f0;
  opacity: 0.7;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.stat-item {
  margin-left: 15px;
  color: #666;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>