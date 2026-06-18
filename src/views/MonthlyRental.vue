<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getMonthlyRentals,
  saveMonthlyRentals,
  addMonthlyRental,
  getParkingSpots,
  vehicleTypeLabels,
  rentalStatusLabels,
  spotTypeLabels,
  AREAS_LIST,
  getExpiryStatus,
  getDaysRemaining,
  expiryStatusLabels,
  type MonthlyRental,
  type RentalStatus,
  type VehicleType,
  type ParkingSpot,
  type ExpiryStatus
} from '../mock/parking'

const rentals = ref<MonthlyRental[]>([])
const filterPlate = ref('')
const filterOwner = ref('')
const filterStatus = ref<RentalStatus | ''>('')

const addDialogVisible = ref(false)
const detailVisible = ref(false)
const currentRental = ref<MonthlyRental | null>(null)
const addFormRef = ref<FormInstance>()

const addForm = ref({
  licensePlate: '',
  ownerName: '',
  phone: '',
  vehicleType: 'sedan' as VehicleType,
  spotId: '',
  startDate: '',
  endDate: '',
  amount: 500,
  status: 'active' as RentalStatus
})

const addRules: FormRules = {
  licensePlate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  ownerName: [{ required: true, message: '请输入车主姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  spotId: [{ required: true, message: '请选择车位', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

onMounted(() => {
  refreshData()
})

const refreshData = () => {
  rentals.value = getMonthlyRentals()
}

const availableSpots = computed(() => {
  const spots = getParkingSpots()
  return spots.filter((s) => s.status === 'available')
})

const spotDisplayLabel = (spot: ParkingSpot) => {
  return `${spot.spotNumber}（${spot.area} - ${spotTypeLabels[spot.type]}）`
}

const filteredRentals = computed(() => {
  let result = rentals.value
  if (filterPlate.value) {
    result = result.filter((r) => r.licensePlate.includes(filterPlate.value.trim()))
  }
  if (filterOwner.value) {
    result = result.filter((r) => r.ownerName.includes(filterOwner.value.trim()))
  }
  if (filterStatus.value) {
    result = result.filter((r) => r.status === filterStatus.value)
  }
  return result
})

const handleSearch = () => {}

const handleReset = () => {
  filterPlate.value = ''
  filterOwner.value = ''
  filterStatus.value = ''
}

const statusTagType = (status: RentalStatus) => {
  const map: Record<RentalStatus, '' | 'success' | 'danger' | 'warning'> = {
    active: 'success',
    expired: 'danger',
    pending: 'warning'
  }
  return map[status]
}

const expiryTagType = (status: ExpiryStatus) => {
  const map: Record<ExpiryStatus, '' | 'success' | 'danger' | 'warning' | 'info'> = {
    normal: 'success',
    expiring: 'warning',
    expired: 'danger'
  }
  return map[status]
}

const rowClassName = ({ row }: { row: MonthlyRental }) => {
  const s = getExpiryStatus(row)
  if (s === 'expired') return 'row-expired'
  if (s === 'expiring') return 'row-expiring'
  return ''
}

const expiryText = (rental: MonthlyRental) => {
  const s = getExpiryStatus(rental)
  const days = getDaysRemaining(rental)
  if (s === 'expired') return `已过期 ${Math.abs(days)} 天`
  if (s === 'expiring') return days === 0 ? '今天到期' : `剩余 ${days} 天`
  return expiryStatusLabels[s]
}

const handleView = (row: MonthlyRental) => {
  currentRental.value = { ...row }
  detailVisible.value = true
}

const handleAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate((valid) => {
    if (!valid) return

    const result = addMonthlyRental({
      licensePlate: addForm.value.licensePlate,
      ownerName: addForm.value.ownerName,
      phone: addForm.value.phone,
      vehicleType: addForm.value.vehicleType,
      spotId: addForm.value.spotId,
      spotNumber: '',
      startDate: addForm.value.startDate,
      endDate: addForm.value.endDate,
      amount: addForm.value.amount,
      status: addForm.value.status
    })

    if (!result) {
      ElMessage.error('添加失败，车位可能已被占用或不存在')
      return
    }

    const spots = getParkingSpots()
    const spot = spots.find((s) => s.id === addForm.value.spotId)
    ElMessage.success(`月租车添加成功，已绑定车位 ${spot?.spotNumber || ''}`)
    addDialogVisible.value = false
    resetAddForm()
    refreshData()
  })
}

const resetAddForm = () => {
  addForm.value = {
    licensePlate: '',
    ownerName: '',
    phone: '',
    vehicleType: 'sedan',
    spotId: '',
    startDate: '',
    endDate: '',
    amount: 500,
    status: 'active'
  }
}

const handleRenew = (row: MonthlyRental) => {
  const rental = rentals.value.find((r) => r.id === row.id)
  if (!rental) return

  const startDate = new Date(rental.endDate)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)

  rental.startDate = startDate.toISOString().split('T')[0]
  rental.endDate = endDate.toISOString().split('T')[0]
  rental.status = 'active'

  saveMonthlyRentals(rentals.value)
  ElMessage.success(`月租车 ${rental.licensePlate} 已续期至 ${rental.endDate}`)
  refreshData()
}
</script>

<template>
  <div class="monthly-rental-page">
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="车牌号">
          <el-input v-model="filterPlate" placeholder="输入车牌号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="车主姓名">
          <el-input v-model="filterOwner" placeholder="输入姓名" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 130px">
            <el-option v-for="(label, key) in rentalStatusLabels" :key="key" :label="label" :value="key" />
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
          <span class="table-title">月租车列表</span>
          <el-button type="primary" :icon="Plus" @click="addDialogVisible = true; resetAddForm()">新增月租车</el-button>
        </div>
      </template>

      <el-table :data="filteredRentals" stripe border style="width: 100%" :row-class-name="rowClassName">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="licensePlate" label="车牌号" width="130">
          <template #default="{ row }">
            <span style="font-family: 'Menlo', monospace; font-weight: 600">{{ row.licensePlate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ownerName" label="车主姓名" width="100" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column label="车辆类型" width="90">
          <template #default="{ row }">
            {{ vehicleTypeLabels[row.vehicleType] }}
          </template>
        </el-table-column>
        <el-table-column prop="spotNumber" label="车位编号" width="100" />
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            {{ row.startDate }} 至 {{ row.endDate }}
          </template>
        </el-table-column>
        <el-table-column label="到期提醒" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="expiryTagType(getExpiryStatus(row))" size="small" effect="dark">
              {{ expiryText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="90" align="right">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ rentalStatusLabels[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 'expired' || row.status === 'active'" link type="warning" @click="handleRenew(row)">
              续期
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增月租车" width="560px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="车牌号" prop="licensePlate">
          <el-input v-model="addForm.licensePlate" placeholder="例：京A12345" />
        </el-form-item>
        <el-form-item label="车主姓名" prop="ownerName">
          <el-input v-model="addForm.ownerName" placeholder="请输入车主姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="addForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicleType">
          <el-select v-model="addForm.vehicleType" style="width: 100%">
            <el-option v-for="(label, key) in vehicleTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定车位" prop="spotId">
          <el-select v-model="addForm.spotId" placeholder="请选择空闲车位" style="width: 100%">
            <el-option
              v-for="spot in availableSpots"
              :key="spot.id"
              :label="spotDisplayLabel(spot)"
              :value="spot.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="addForm.startDate" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="addForm.endDate" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月租金额" prop="amount">
          <el-input-number v-model="addForm.amount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="月租车详情" width="520px" destroy-on-close>
      <template v-if="currentRental">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="编号">{{ currentRental.id }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">
            <span style="font-family: 'Menlo', monospace; font-weight: 600">{{ currentRental.licensePlate }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="车主姓名">{{ currentRental.ownerName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRental.phone }}</el-descriptions-item>
          <el-descriptions-item label="车辆类型">{{ vehicleTypeLabels[currentRental.vehicleType] }}</el-descriptions-item>
          <el-descriptions-item label="车位编号">{{ currentRental.spotNumber }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentRental.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentRental.endDate }}</el-descriptions-item>
          <el-descriptions-item label="月租金额">¥{{ currentRental.amount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentRental.status)" size="small">
              {{ rentalStatusLabels[currentRental.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="到期提醒" :span="2">
            <el-tag :type="expiryTagType(getExpiryStatus(currentRental))" size="small" effect="dark">
              {{ expiryText(currentRental) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.monthly-rental-page {
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

.table-title {
  font-size: 16px;
  font-weight: 600;
}

.el-table {
  margin-top: 12px;
}

:deep(.row-expired) {
  background-color: #fef0f0 !important;
}

:deep(.row-expired:hover > td) {
  background-color: #fde2e2 !important;
}

:deep(.row-expiring) {
  background-color: #fdf6ec !important;
}

:deep(.row-expiring:hover > td) {
  background-color: #faecd8 !important;
}
</style>
