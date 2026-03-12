<template>
  <div class="prescription-form">
    <div class="action-bar">
      <el-button 
        type="primary" 
        size="small" 
        @click="addItem"
        icon="el-icon-plus"
      >
        添加药品
      </el-button>
    </div>

    <el-table :data="value" border style="width: 100%">
      <!-- 药品名称列 -->
      <el-table-column label="药品名称" width="220">
        <template #default="{ $index }">
          <el-input
            v-model="value[$index].name"
            placeholder="输入药品名称"
          />
        </template>
      </el-table-column>

      <!-- 剂量列 -->
      <el-table-column label="规格/剂量" width="180">
        <template #default="{ $index }">
          <el-input
            v-model="value[$index].dose"
            placeholder="如：0.5g/片"
          />
        </template>
      </el-table-column>

      <!-- 用法列 -->
      <el-table-column label="用法用量">
        <template #default="{ $index }">
          <el-input
            v-model="value[$index].usage"
            placeholder="如：每日3次，每次2片"
          />
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="80">
        <template #default="{ $index }">
          <el-button
            type="danger"
            icon="el-icon-delete"
            circle
            @click="removeItem($index)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  methods: {
    addItem() {
      // 确保操作的是数组副本
      const newValue = [...this.value]  // [!code ++]
      newValue.push({  // [!code ++]
        name: '',
        dose: '',
        usage: ''
      })
      this.value = newValue  // [!code ++]
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
.action-bar {
  margin-bottom: 12px;
}

::v-deep .el-table {
  .el-input__inner {
    border: 1px solid #dcdfe6 !important;
    padding: 0 8px !important;
    height: 32px;
    border-radius: 4px;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: #409eff !important;
      box-shadow: 0 0 4px rgba(64, 158, 255, 0.3);
    }
  }
  
  td {
    padding: 4px 0 !important;
  }
}
</style>