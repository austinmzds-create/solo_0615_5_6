<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getEntryExitRecords,
  addEntryRecord,
  addExitRecord,
  getMonthlyRentals,
  recordTypeLabels,
  vehicleTypeLabels,
  type EntryExitRecord,
  type VehicleType
} from '../mock/parking'

const records = ref<EntryExitRecord[]>([])
const activeTab = ref<'all' | 'entry' | 'exit'>('all')
const filterPlate = ref('')
const filterDate = ref('')
const filterMonthly = ref<'' | 'yes' | 'no'>('')

const entryDialogVisible = ref(false)
const exitDialogVisible = ref(false)
const entryFormRef = ref<FormInstance>()
const exitFormRef = ref<FormInstance>()

const entryForm = ref({
  licensePlate: '',
  vehicleType: 'sedan' as VehicleType,
  isMonthlyRental: false
})

const exitForm = ref({
  licensePlate: ''
})

const entryRules: FormRules = {
  licensePlate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '请选择车辆类型', trigger: 'change' }]
}

const exitRules: FormRules = {
  licensePlate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

onMounted(() => {
  refreshData()
})

const refreshData = () => {
  records.value = getEntryExitRecords()
}

const monthlyRentalsMap = computed(() => {
  const rentals = getMonthlyRentals()
  const map: Record<string, string> = {}
  rentals.forEach((r) => {
    if (r.status === 'active') {
      map[r.licensePlate] = r.id
    }
  })
  return map
})

const filteredRecords = computed(() => {
  let result = records.value

  if (activeTab.value === 'entry') {
    result = result.filter((r) => r.type === 'entry')
  } else if (activeTab.value === 'exit') {
    result = result.filter((r) => r.type === 'exit')
  }

  if (filterPlate.value) {
    result = result.filter((r) => r.licensePlate.includes(filterPlate.value.trim()))
  }
  if (filterDate.value) {
    result = result.filter((r) => r.timestamp.startsWith(filterDate.value))
  }
  if (filterMonthly.value === 'yes') {
    result = result.filter((r) => r.isMonthlyRental)
  } else if (filterMonthly.value === 'no') {
    result = result.filter((r) => !r.isMonthlyRental)
  }

  return result.slice().reverse()
})

const tabCounts = computed(() => {
  const all = records.value.length
  const entries = records.value.filter((r) => r.type === 'entry').length
  const exits = records.value.filter((r) => r.type === 'exit').length
  return { all, entries, exits }
})

const handleSearch = () => {}

const handleReset = () => {
  filterPlate.value = ''
  filterDate.value = ''
  filterMonthly.value = ''
}

const handleAddEntry = async () => {
  if (!entryFormRef.value) return
  await entryFormRef.value.validate((valid) => {
    if (!valid) return

    const rentalId = entryForm.value.isMonthlyRental
      ? monthlyRentalsMap.value[entryForm.value.licensePlate]
      : undefined

    const result = addEntryRecord(
      entryForm.value.licensePlate,
      entryForm.value.vehicleType,
      entryForm.value.isMonthlyRental,
      rentalId
    )

    if (!result.spot) {
      ElMessage.error('车位已满，无法入场')
      return
    }

    ElMessage.success(`车辆 ${entryForm.value.licensePlate} 已入场，分配车位 ${result.spot?.spotNumber}`)
    entryDialogVisible.value = false
    entryForm.value = { licensePlate: '', vehicleType: 'sedan', isMonthlyRental: false }
    refreshData()
  })
}

const handleAddExit = async () => {
  if (!exitFormRef.value) return
  await exitFormRef.value.validate((valid) => {
    if (!valid) return

    const result = addExitRecord(exitForm.value.licensePlate)
    if (!result) {
      ElMessage.error(`未找到车牌 ${exitForm.value.licensePlate} 的在场车辆`)
      return
    }

    const spotInfo = result.spot ? `，释放车位 ${result.spot.spotNumber}` : ''
    ElMessage.success(`车辆 ${exitForm.value.licensePlate} 已离场${spotInfo}`)
    exitDialogVisible.value = false
    exitForm.value = { licensePlate: '' }
    refreshData()
  })
}
</script>

<template>
  <div class="entry-exit-page">
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="车牌号">
          <el-input v-model="filterPlate" placeholder="输入车牌号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 160px" />
        </el-form-item>
        <el-form-item label="月租车">
          <el-select v-model="filterMonthly" placeholder="全部" clearable style="width: 120px">
            <el-option label="月租车" value="yes" />
            <el-option label="临时车" value="no" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header">
          <el-tabs v-model="activeTab" class="record-tabs">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="入场" name="entry" />
            <el-tab-pane label="离场" name="exit" />
          </el-tabs>
          <div class="action-buttons">
            <el-button type="success" :icon="Plus" @click="entryDialogVisible = true">车辆入场</el-button>
            <el-button type="warning" :icon="Plus" @click="exitDialogVisible = true">车辆离场</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRecords" stripe border style="width: 100%">
        <el-table-column prop="id" label="记录编号" width="120" />
        <el-table-column prop="licensePlate" label="车牌号" width="130">
          <template #default="{ row }">
            <span style="font-family: 'Menlo', monospace; font-weight: 600">{{ row.licensePlate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'entry' ? 'success' : 'warning'" size="small" effect="dark">
              {{ recordTypeLabels[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="车辆类型" width="100">
          <template #default="{ row }">
            {{ vehicleTypeLabels[row.vehicleType] }}
          </template>
        </el-table-column>
        <el-table-column prop="spotNumber" label="车位编号" width="100" />
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column label="月租车" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isMonthlyRental" type="primary" size="small">月租</el-tag>
            <el-tag v-else type="info" size="small">临时</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="monthlyRentalId" label="月租编号" min-width="120" />
      </el-table>
    </el-card>

    <el-dialog v-model="entryDialogVisible" title="车辆入场登记" width="500px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="entryFormRef" :model="entryForm" :rules="entryRules" label-width="100px">
        <el-form-item label="车牌号" prop="licensePlate">
          <el-input v-model="entryForm.licensePlate" placeholder="例：京A12345" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicleType">
          <el-select v-model="entryForm.vehicleType" style="width: 100%">
            <el-option v-for="(label, key) in vehicleTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="月租车">
          <el-switch v-model="entryForm.isMonthlyRental" />
          <span style="margin-left: 8px; font-size: 12px; color: #909399">
            {{ entryForm.isMonthlyRental ? '系统将自动匹配月租信息' : '作为临时车辆入场' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="entryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddEntry">确认入场</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exitDialogVisible" title="车辆离场登记" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="exitFormRef" :model="exitForm" :rules="exitRules" label-width="100px">
        <el-form-item label="车牌号" prop="licensePlate">
          <el-input v-model="exitForm.licensePlate" placeholder="输入离场车辆车牌号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddExit">确认离场</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.entry-exit-page {
  max-width: 1400px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.table-card :deep(.el-card__body) {
  padding-top: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-tabs {
  flex: 1;
}

.record-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.el-table {
  margin-top: 12px;
}
</style>
