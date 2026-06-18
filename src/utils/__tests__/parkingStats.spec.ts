import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateParkingStats,
  checkDuplicateEntry,
  getTodayDateString,
  type ParkingStats
} from '../../utils/parkingStats'
import {
  clearAllParkingData,
  getTodayStats,
  addEntryRecord,
  addExitRecord,
  getParkingSpots,
  getEntryExitRecords,
  saveParkingSpots,
  saveEntryExitRecords,
  type ParkingSpot,
  type EntryExitRecord
} from '../../mock/parking'

describe('parkingStats - 统计一致性验证', () => {
  const baseDate = new Date('2026-06-18T10:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseDate)
    clearAllParkingData()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAllParkingData()
  })

  const createTestSpots = (): ParkingSpot[] => {
    const spots: ParkingSpot[] = []
    for (let i = 1; i <= 10; i++) {
      spots.push({
        id: `S${i.toString().padStart(4, '0')}`,
        spotNumber: `A${i.toString().padStart(3, '0')}`,
        area: 'A区',
        type: 'standard',
        status: i <= 3 ? 'occupied' : 'available',
        licensePlate: i <= 3 ? `京A0000${i}` : undefined,
        entryTime: i <= 3 ? '2026-06-18 08:00' : undefined
      })
    }
    return spots
  }

  const createTestRecords = (): EntryExitRecord[] => {
    const records: EntryExitRecord[] = []
    for (let i = 1; i <= 5; i++) {
      records.push({
        id: `R${i.toString().padStart(6, '0')}`,
        licensePlate: `京A0000${i}`,
        vehicleType: 'sedan',
        type: 'entry',
        timestamp: `2026-06-18 0${7 + i}:00`,
        isMonthlyRental: false
      })
    }
    for (let i = 1; i <= 2; i++) {
      records.push({
        id: `R${(i + 5).toString().padStart(6, '0')}`,
        licensePlate: `京A0000${i}`,
        vehicleType: 'sedan',
        type: 'exit',
        timestamp: `2026-06-18 0${9 + i}:00`,
        isMonthlyRental: false
      })
    }
    return records
  }

  it('calculateParkingStats 纯函数计算正确', () => {
    const spots = createTestSpots()
    const records = createTestRecords()

    const stats = calculateParkingStats(spots, records)

    expect(stats.totalSpots).toBe(10)
    expect(stats.occupiedSpots).toBe(3)
    expect(stats.availableSpots).toBe(7)
    expect(stats.maintenanceSpots).toBe(0)
    expect(stats.todayEntries).toBe(5)
    expect(stats.todayExits).toBe(2)
    expect(stats.notExitedVehicles).toBe(3)
  })

  it('getTodayStats 与 calculateParkingStats 结果一致', () => {
    const spots = createTestSpots()
    const records = createTestRecords()
    saveParkingSpots(spots)
    saveEntryExitRecords(records)

    const statsFromMock = getTodayStats()
    const statsFromUtils = calculateParkingStats(spots, records)

    expect(statsFromMock.todayEntries).toBe(statsFromUtils.todayEntries)
    expect(statsFromMock.todayExits).toBe(statsFromUtils.todayExits)
    expect(statsFromMock.availableSpots).toBe(statsFromUtils.availableSpots)
    expect(statsFromMock.totalSpots).toBe(statsFromUtils.totalSpots)
    expect(statsFromMock.occupiedSpots).toBe(statsFromUtils.occupiedSpots)
    expect(statsFromMock.maintenanceSpots).toBe(statsFromUtils.maintenanceSpots)
  })

  it('入场后统计数据正确更新', () => {
    const spots = createTestSpots()
    const records = createTestRecords()
    saveParkingSpots(spots)
    saveEntryExitRecords(records)

    const statsBefore = getTodayStats()
    expect(statsBefore.todayEntries).toBe(5)
    expect(statsBefore.occupiedSpots).toBe(3)
    expect(statsBefore.availableSpots).toBe(7)

    const result = addEntryRecord('京B99999', 'sedan', false)
    expect(result.spot).not.toBeNull()

    const statsAfter = getTodayStats()
    expect(statsAfter.todayEntries).toBe(6)
    expect(statsAfter.occupiedSpots).toBe(4)
    expect(statsAfter.availableSpots).toBe(6)
    expect(statsAfter.notExitedVehicles).toBe(4)

    const currentSpots = getParkingSpots()
    const currentRecords = getEntryExitRecords()
    const statsFromUtils = calculateParkingStats(currentSpots, currentRecords)

    expect(statsAfter.todayEntries).toBe(statsFromUtils.todayEntries)
    expect(statsAfter.occupiedSpots).toBe(statsFromUtils.occupiedSpots)
    expect(statsAfter.availableSpots).toBe(statsFromUtils.availableSpots)
  })

  it('离场后统计数据正确更新', () => {
    const spots = createTestSpots()
    const records = createTestRecords()
    saveParkingSpots(spots)
    saveEntryExitRecords(records)

    const statsBefore = getTodayStats()
    expect(statsBefore.todayExits).toBe(2)
    expect(statsBefore.occupiedSpots).toBe(3)
    expect(statsBefore.availableSpots).toBe(7)

    const result = addExitRecord('京A00003')
    expect(result).not.toBeNull()

    const statsAfter = getTodayStats()
    expect(statsAfter.todayExits).toBe(3)
    expect(statsAfter.occupiedSpots).toBe(2)
    expect(statsAfter.availableSpots).toBe(8)
    expect(statsAfter.notExitedVehicles).toBe(2)

    const currentSpots = getParkingSpots()
    const currentRecords = getEntryExitRecords()
    const statsFromUtils = calculateParkingStats(currentSpots, currentRecords)

    expect(statsAfter.todayExits).toBe(statsFromUtils.todayExits)
    expect(statsAfter.occupiedSpots).toBe(statsFromUtils.occupiedSpots)
    expect(statsAfter.availableSpots).toBe(statsFromUtils.availableSpots)
  })

  it('重复入场拦截正常工作', () => {
    const spots = createTestSpots()

    const isDuplicate = checkDuplicateEntry(spots, '京A00001')
    expect(isDuplicate).toBe(true)

    const isNotDuplicate = checkDuplicateEntry(spots, '京B99999')
    expect(isNotDuplicate).toBe(false)
  })

  it('addEntryRecord 保留重复入场拦截', () => {
    const spots = createTestSpots()
    const records = createTestRecords()
    saveParkingSpots(spots)
    saveEntryExitRecords(records)

    const result = addEntryRecord('京A00001', 'sedan', false)
    expect(result.spot).toBeNull()
    expect(result.error).toBe('该车牌车辆已在场内，请勿重复入场')

    const statsAfter = getTodayStats()
    expect(statsAfter.todayEntries).toBe(5)
    expect(statsAfter.occupiedSpots).toBe(3)
  })

  it('刷新后统计数据保持一致', () => {
    const spots = createTestSpots()
    const records = createTestRecords()
    saveParkingSpots(spots)
    saveEntryExitRecords(records)

    addEntryRecord('京B11111', 'sedan', false)
    addEntryRecord('京B22222', 'sedan', false)
    addExitRecord('京A00002')

    const stats1 = getTodayStats()

    const stats2 = getTodayStats()

    expect(stats1.todayEntries).toBe(stats2.todayEntries)
    expect(stats1.todayExits).toBe(stats2.todayExits)
    expect(stats1.availableSpots).toBe(stats2.availableSpots)
    expect(stats1.occupiedSpots).toBe(stats2.occupiedSpots)
    expect(stats1.notExitedVehicles).toBe(stats2.notExitedVehicles)
  })

  it('未离场车辆数 = 占用车位数量', () => {
    const spots = createTestSpots()
    const records = createTestRecords()

    const stats = calculateParkingStats(spots, records)

    expect(stats.notExitedVehicles).toBe(stats.occupiedSpots)
  })

  it('今日进出统计与记录一致', () => {
    const spots = createTestSpots()
    const records = createTestRecords()

    const stats = calculateParkingStats(spots, records)
    const todayStr = getTodayDateString()

    const todayEntries = records.filter(
      (r) => r.type === 'entry' && r.timestamp.startsWith(todayStr)
    ).length
    const todayExits = records.filter(
      (r) => r.type === 'exit' && r.timestamp.startsWith(todayStr)
    ).length

    expect(stats.todayEntries).toBe(todayEntries)
    expect(stats.todayExits).toBe(todayExits)
  })
})
