<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getParkingSpots,
  saveParkingSpots,
  spotTypeLabels,
  spotStatusLabels,
  spotStatusColors,
  vehicleTypeLabels,
  AREAS_LIST,
  type ParkingSpot,
  type ParkingSpotStatus,
  type ParkingSpotType
} from '../mock/parking'

const spots = ref<ParkingSpot[]>([])
const filterArea = ref('')
const filterStatus = ref<ParkingSpotStatus | ''>('')
const filterType = ref<ParkingSpotType | ''>('')
const detailVisible = ref(false)
const currentSpot = ref<ParkingSpot | null>(null)

onMounted(() => {
  spots.value = getParkingSpots()
})

const filteredSpots = computed(() => {
  let result = spots.value
  if (filterArea.value) {
    result = result.filter((s) => s.area === filterArea.value)
  }
  if (filterStatus.value) {
    result = result.filter((s) => s.status === filterStatus.value)
  }
  if (filterType.value) {
    result = result.filter((s) => s.type === filterType.value)
  }
  return result
})

const areaGroups = computed(() => {
  const groups: Record<string, ParkingSpot[]> = {}
  const data = filterArea.value ? { [filterArea.value]: filteredSpots.value } : AREAS_LIST.reduce((acc, area) => {
    acc[area] = filteredSpots.value.filter((s) => s.area === area)
    return acc
  }, {} as Record<string, ParkingSpot[]>)

  Object.assign(groups, data)
  return groups
})

const statusCounts = computed(() => {
  const counts: Record<string, { available: number; occupied: number; maintenance: number; reserved: number }> = {}
  Object.entries(areaGroups.value).forEach(([area, areaSpots]) => {
    counts[area] = {
      available: areaSpots.filter((s) => s.status === 'available').length,
      occupied: areaSpots.filter((s) => s.status === 'occupied').length,
      maintenance: areaSpots.filter((s) => s.status === 'maintenance').length,
      reserved: areaSpots.filter((s) => s.status === 'reserved').length
    }
  })
  return counts
})

const handleReset = () => {
  filterArea.value = ''
  filterStatus.value = ''
  filterType.value = ''
}

const handleView = (spot: ParkingSpot) => {
  currentSpot.value = { ...spot }
  detailVisible.value = true
}

const getSpotColor = (status: ParkingSpotStatus): string => {
  return spotStatusColors[status] || '#909399'
}

const refreshData = () => {
  spots.value = getParkingSpots()
}
</script>

<template>
  <div class="parking-overview">
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="区域">
          <el-select v-model="filterArea" placeholder="全部区域" clearable style="width: 140px">
            <el-option v-for="area in AREAS_LIST" :key="area" :label="area" :value="area" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 140px">
            <el-option v-for="(label, key) in spotStatusLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterType" placeholder="全部类型" clearable style="width: 140px">
            <el-option v-for="(label, key) in spotTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="refreshData">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-for="(areaSpots, area) in areaGroups" :key="area" class="area-section">
      <el-card shadow="hover">
        <template #header>
          <div class="area-card-header">
            <span class="area-title">{{ area }}</span>
            <div class="area-status-summary">
              <el-tag type="success" size="small">空闲 {{ statusCounts[area]?.available || 0 }}</el-tag>
              <el-tag type="danger" size="small">占用 {{ statusCounts[area]?.occupied || 0 }}</el-tag>
              <el-tag type="info" size="small">维护 {{ statusCounts[area]?.maintenance || 0 }}</el-tag>
            </div>
          </div>
        </template>

        <div class="spots-grid">
          <div
            v-for="spot in areaSpots"
            :key="spot.id"
            class="spot-item"
            :style="{ borderColor: getSpotColor(spot.status), background: spot.status === 'available' ? '#f0f9eb' : spot.status === 'occupied' ? '#fef0f0' : spot.status === 'maintenance' ? '#f4f4f5' : '#fdf6ec' }"
            @click="handleView(spot)"
          >
            <div class="spot-number">{{ spot.spotNumber }}</div>
            <div class="spot-type">{{ spotTypeLabels[spot.type] }}</div>
            <div v-if="spot.licensePlate" class="spot-plate">{{ spot.licensePlate }}</div>
            <div v-else class="spot-status-label" :style="{ color: getSpotColor(spot.status) }">
              {{ spotStatusLabels[spot.status] }}
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-if="filteredSpots.length === 0" description="没有匹配的车位" />

    <el-dialog v-model="detailVisible" title="车位详情" width="480px" destroy-on-close>
      <template v-if="currentSpot">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="车位编号">{{ currentSpot.spotNumber }}</el-descriptions-item>
          <el-descriptions-item label="所属区域">{{ currentSpot.area }}</el-descriptions-item>
          <el-descriptions-item label="车位类型">{{ spotTypeLabels[currentSpot.type] }}</el-descriptions-item>
          <el-descriptions-item label="车位状态">
            <el-tag :color="getSpotColor(currentSpot.status)" effect="dark" size="small" style="border: none">
              {{ spotStatusLabels[currentSpot.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSpot.licensePlate" label="车牌号" :span="2">
            <span style="font-family: 'Menlo', monospace; font-weight: 600">{{ currentSpot.licensePlate }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSpot.entryTime" label="入场时间" :span="2">
            {{ currentSpot.entryTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSpot.monthlyRentalId" label="月租编号" :span="2">
            {{ currentSpot.monthlyRentalId }}
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
.parking-overview {
  max-width: 1400px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.area-section {
  margin-bottom: 16px;
}

.area-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.area-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.area-status-summary {
  display: flex;
  gap: 8px;
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.spot-item {
  border: 2px solid;
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.spot-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spot-number {
  font-weight: 700;
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.spot-type {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.spot-plate {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #f56c6c;
}

.spot-status-label {
  font-size: 12px;
  font-weight: 500;
}
</style>
