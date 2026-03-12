<template>
  <div class="case-attachment">
    <el-upload
      multiple
      :limit="5"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      :on-remove="handleRemove"
      :file-list="value"
      :auto-upload="false"
      drag
      action="#"
      class="uploader"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持扩展名：.pdf .doc .docx .jpg .png，单文件不超过20MB
        </div>
      </template>
    </el-upload>

    <div v-if="value.length > 0" class="file-list">
      <div v-for="(file, index) in value" :key="index" class="file-item">
        <el-icon class="file-icon"><document /></el-icon>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { Document, UploadFilled } from '@element-plus/icons-vue'

export default {
  components: { Document, UploadFilled },
  props: ['modelValue'],
  emits: ['update:modelValue'],
  methods: {
    formatSize(size) {
      if (size > 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(1) + 'MB'
      }
      return (size / 1024).toFixed(1) + 'KB'
    },
    handleExceed() {
      this.$message.warning('最多上传5个文件')
    },
    beforeUpload(file) {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        .includes(file.type)
      const isLt20M = file.size / 1024 / 1024 < 20

      if (!isValidType) {
        this.$message.error('不支持的文件格式!')
        return false
      }
      if (!isLt20M) {
        this.$message.error('文件大小不能超过20MB!')
        return false
      }
      
      this.value = [...this.value, file]
      return false // 手动上传
    },
    handleRemove(file, fileList) {
      this.value = fileList
    }
  },
  computed: {
    value: {
      get() { return this.modelValue },
      set(val) { this.$emit('update:modelValue', val) }
    }
  }
}
</script>

<style scoped lang="scss">
.uploader {
  margin: 16px 0;
}

.file-list {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  
  .file-item {
    display: flex;
    align-items: center;
    padding: 8px;
    transition: background 0.3s;
    
    &:hover {
      background: #f5f7fa;
    }
    
    .file-icon {
      margin-right: 8px;
      color: #409eff;
    }
    
    .file-name {
      flex: 1;
      @include text-ellipsis;
    }
    
    .file-size {
      color: #909399;
      margin-left: 12px;
    }
  }
}
</style>