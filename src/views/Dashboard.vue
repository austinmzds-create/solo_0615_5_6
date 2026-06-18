<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTodayStats,
  getAreaStats,
  getEntryExitRecords,
  getRenewalStats,
  recordTypeLabels,
  vehicleTypeLabels,
  spotStatusLabels,
  spotStatusColors,
  type EntryExitRecord
} from '../mock/parking'

const router = useRouter()

const stats = ref(getTodayStats())
const areaStats = ref(getAreaStats())
const recentRecords = ref<EntryExitRecord[]>([])
const renewalStats = ref(getRenewalStats())

onMounted(() => {
  refreshData()
})

const refreshData = () => {
  stats.value = getTodayStats()
  areaStats.value = getAreaStats()
  renewalStats.value = getRenewalStats()
  const records = getEntryExitRecords()
  recentRecords.value = records.slice(-10).reverse()
}

const entryRate = computed(() => {
  if (stats.value.totalSpots === 0) return 0
  return Math.round((stats.value.occupiedSpots / stats.value.totalSpots) * 100)
})

const goToEntryExit = () => {
  router.push('/entry-exit')
}

const goToParkingOverview = () => {
  router.push('/parking-overview')
}

const goToMonthlyRental = () => {
  router.push('/monthly-rental')
}
</script>

<template>
  <div class="dashboard">
    <div class="stat-cards">
      <el-card shadow="hover" class="stat-card stat-entry" @click="goToEntryExit" style="cursor: pointer">
        <div class="stat-icon">🚗</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayEntries }}</div>
          <div class="stat-label">今日入场</div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card stat-exit" @click="goToEntryExit" style="cursor: pointer">
        <div class="stat-icon">🚙</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayExits }}</div>
          <div class="stat-label">今日离场</div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card stat-available" @click="goToParkingOverview" style="cursor: pointer">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.availableSpots }}</div>
          <div class="stat-label">空余车位</div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card stat-occupied" @click="goToParkingOverview" style="cursor: pointer">
        <div class="stat-icon">🔴</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.occupiedSpots }}</div>
          <div class="stat-label">已占用车位</div>
        </div>
      </el-card>

      <el-card
        v-if="renewalStats.totalPending > 0"
        shadow="hover"
        class="stat-card stat-renewal"
        @click="goToMonthlyRental"
        style="cursor: pointer"
      >
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ renewalStats.totalPending }}</div>
          <div class="stat-label">
            待续费
            <span v-if="renewalStats.expiringCount > 0" class="sub-label">(即将到期 {{ renewalStats.expiringCount }})</span>
            <span v-if="renewalStats.expiredCount > 0" class="sub-label sub-danger">(已过期 {{ renewalStats.expiredCount }})</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="hover" class="area-card">
          <template #header>
            <div class="card-header">
              <span>各区域车位概览</span>
              <el-button text type="primary" @click="goToParkingOverview">查看详情</el-button>
            </div>
          </template>
          <div class="area-list">
            <div v-for="area in areaStats" :key="area.area" class="area-item">
              <div class="area-header">
                <span class="area-name">{{ area.area }}</span>
                <span class="area-total">共 {{ area.total }} 个车位</span>
              </div>
              <div class="area-bar">
                <div class="bar-available" :style="{ width: (area.available / area.total * 100) + '%' }"></div>
                <div class="bar-occupied" :style="{ width: (area.occupied / area.total * 100) + '%' }"></div>
                <div class="bar-maintenance" :style="{ width: (area.maintenance / area.total * 100) + '%' }"></div>
              </div>
              <div class="area-detail">
                <span class="detail-item" style="color: #67c23a">空闲 {{ area.available }}</span>
                <span class="detail-item" style="color: #f56c6c">占用 {{ area.occupied }}</span>
                <span class="detail-item" style="color: #909399">维护 {{ area.maintenance }}</span>
              </div>
            </div>
          </div>
          <div class="occupancy-summary">
            <span>总车位 {{ stats.totalSpots }} 个，占用率 {{ entryRate }}%</span>
            <el-progress :percentage="entryRate" :color="entryRate > 80 ? '#f56c6c' : entryRate > 60 ? '#e6a23c' : '#67c23a'" :stroke-width="10" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="hover" class="record-card">
          <template #header>
            <div class="card-header">
              <span>最近进出记录</span>
              <el-button text type="primary" @click="goToEntryExit">查看全部</el-button>
            </div>
          </template>
          <div class="recent-records">
            <div v-for="record in recentRecords" :key="record.id" class="record-item">
              <div class="record-left">
                <el-tag :type="record.type === 'entry' ? 'success' : 'warning'" size="small" effect="dark">
                  {{ recordTypeLabels[record.type] }}
                </el-tag>
                <span class="record-plate">{{ record.licensePlate }}</span>
              </div>
              <div class="record-right">
                <span v-if="record.spotNumber" class="record-spot">{{ record.spotNumber }}</span>
                <span class="record-time">{{ record.timestamp.split(' ')[1] }}</span>
              </div>
            </div>
            <el-empty v-if="recentRecords.length === 0" description="暂无记录" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-entry .stat-value { color: #409eff; }
.stat-exit .stat-value { color: #e6a23c; }
.stat-available .stat-value { color: #67c23a; }
.stat-occupied .stat-value { color: #f56c6c; }
.stat-renewal .stat-value { color: #f56c6c; }

.stat-renewal {
  background: linear-gradient(135deg, #fef0f0 0%, #fdf6ec 100%);
  border: 1px solid #f56c6c;
}

.sub-label {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.sub-danger {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.area-card, .record-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.area-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.area-item {
  padding: 8px 0;
}

.area-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.area-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.area-total {
  font-size: 13px;
  color: #909399;
}

.area-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #ebeef5;
}

.bar-available { background: #67c23a; transition: width 0.3s; }
.bar-occupied { background: #f56c6c; transition: width 0.3s; }
.bar-maintenance { background: #909399; transition: width 0.3s; }

.area-detail {
  display: flex;
  gap: 16px;
  margin-top: 6px;
}

.detail-item {
  font-size: 12px;
}

.occupancy-summary {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.occupancy-summary span {
  font-size: 13px;
  color: #606266;
  display: block;
  margin-bottom: 8px;
}

.recent-records {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.record-plate {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
  font-family: 'Menlo', 'Monaco', monospace;
}

.record-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-spot {
  font-size: 12px;
  color: #909399;
  background: #f2f3f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.record-time {
  font-size: 13px;
  color: #909399;
}
</style>
