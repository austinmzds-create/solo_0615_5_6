import { calculateParkingStats, checkDuplicateEntry } from '../utils/parkingStats'

export type ParkingSpotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'
export type ParkingSpotType = 'standard' | 'compact' | 'disabled' | 'ev' | 'vip'
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'motorcycle'
export type RecordType = 'entry' | 'exit'
export type RentalStatus = 'active' | 'expired' | 'pending'
export type ExpiryStatus = 'normal' | 'expiring' | 'expired'

export interface ParkingSpot {
  id: string
  spotNumber: string
  area: string
  type: ParkingSpotType
  status: ParkingSpotStatus
  licensePlate?: string
  entryTime?: string
  monthlyRentalId?: string
}

export interface EntryExitRecord {
  id: string
  licensePlate: string
  vehicleType: VehicleType
  type: RecordType
  timestamp: string
  spotId?: string
  spotNumber?: string
  monthlyRentalId?: string
  isMonthlyRental: boolean
}

export interface MonthlyRental {
  id: string
  licensePlate: string
  ownerName: string
  phone: string
  vehicleType: VehicleType
  spotId: string
  spotNumber: string
  startDate: string
  endDate: string
  amount: number
  status: RentalStatus
}

const SPOT_STORAGE_KEY = 'parking_spots'
const RECORD_STORAGE_KEY = 'parking_records'
const RENTAL_STORAGE_KEY = 'parking_rentals'

const AREAS = ['A区', 'B区', 'C区', 'D区']
const SPOT_TYPES: ParkingSpotType[] = ['standard', 'standard', 'standard', 'standard', 'compact', 'disabled', 'ev', 'vip']

function generateSpotId(area: string, num: number): string {
  return `${area.charAt(0)}${num.toString().padStart(3, '0')}`
}

function generateInitialSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = []
  let id = 1
  AREAS.forEach((area) => {
    for (let i = 1; i <= 25; i++) {
      const type = SPOT_TYPES[Math.floor(Math.random() * SPOT_TYPES.length)]
      const status: ParkingSpotStatus = i <= 18 ? 'occupied' : 'available'
      const spot: ParkingSpot = {
        id: `S${id.toString().padStart(4, '0')}`,
        spotNumber: generateSpotId(area, i),
        area,
        type,
        status
      }
      if (status === 'occupied') {
        spot.licensePlate = `京A${Math.floor(10000 + Math.random() * 89999)}`
        const hour = 6 + Math.floor(Math.random() * 6)
        const minute = Math.floor(Math.random() * 60)
        spot.entryTime = `2026-06-18 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      spots.push(spot)
      id++
    }
  })
  spots[20].status = 'maintenance'
  spots[50].status = 'maintenance'
  return spots
}

function generateInitialRecords(): EntryExitRecord[] {
  const records: EntryExitRecord[] = []
  const today = '2026-06-18'

  for (let i = 0; i < 35; i++) {
    const hour = 6 + Math.floor(Math.random() * 12)
    const minute = Math.floor(Math.random() * 60)
    records.push({
      id: `R${(i + 1).toString().padStart(6, '0')}`,
      licensePlate: `京A${Math.floor(10000 + Math.random() * 89999)}`,
      vehicleType: 'sedan',
      type: 'entry',
      timestamp: `${today} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      isMonthlyRental: Math.random() > 0.6
    })
  }

  for (let i = 0; i < 22; i++) {
    const hour = 9 + Math.floor(Math.random() * 9)
    const minute = Math.floor(Math.random() * 60)
    records.push({
      id: `R${(i + 36).toString().padStart(6, '0')}`,
      licensePlate: `京A${Math.floor(10000 + Math.random() * 89999)}`,
      vehicleType: 'sedan',
      type: 'exit',
      timestamp: `${today} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      isMonthlyRental: Math.random() > 0.65
    })
  }

  records.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  let id = 1
  records.forEach((r) => {
    r.id = `R${id.toString().padStart(6, '0')}`
    id++
  })

  return records
}

function generateInitialRentals(): MonthlyRental[] {
  const names = ['张伟', '李娜', '王磊', '赵敏', '陈浩', '刘洋', '孙婷', '周杰', '吴芳', '郑宇', '冯强', '陈静', '杨帆', '许丽', '黄磊']
  const rentals: MonthlyRental[] = []
  const spots = generateInitialSpots()
  const today = new Date()

  for (let i = 0; i < 15; i++) {
    const spot = spots[i * 6 + 2]
    let startDate: Date
    let endDate: Date
    let status: RentalStatus = 'active'

    if (i < 3) {
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 1)
      endDate = new Date(today)
      endDate.setDate(endDate.getDate() - (i + 1))
      status = 'expired'
    } else if (i < 7) {
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 1)
      endDate = new Date(today)
      endDate.setDate(endDate.getDate() + (i - 2))
      status = 'active'
    } else {
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - i * 3)
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      status = 'active'
    }

    rentals.push({
      id: `M${(i + 1).toString().padStart(4, '0')}`,
      licensePlate: `京A${Math.floor(10000 + Math.random() * 89999)}`,
      ownerName: names[i],
      phone: `139${Math.floor(10000000 + Math.random() * 89999999)}`,
      vehicleType: 'sedan',
      spotId: spot.id,
      spotNumber: spot.spotNumber,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      amount: 500,
      status
    })
  }

  return rentals
}

export function getExpiryStatus(rental: MonthlyRental): ExpiryStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(rental.endDate)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'expiring'
  return 'normal'
}

export function getDaysRemaining(rental: MonthlyRental): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(rental.endDate)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getRenewalStats(): { expiringCount: number; expiredCount: number; totalPending: number } {
  const rentals = getMonthlyRentals()
  let expiringCount = 0
  let expiredCount = 0
  rentals.forEach((r) => {
    const s = getExpiryStatus(r)
    if (s === 'expiring') expiringCount++
    if (s === 'expired') expiredCount++
  })
  return { expiringCount, expiredCount, totalPending: expiringCount + expiredCount }
}

export function getParkingSpots(): ParkingSpot[] {
  const stored = localStorage.getItem(SPOT_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as ParkingSpot[]
    } catch {
      // ignore
    }
  }
  const spots = generateInitialSpots()
  saveParkingSpots(spots)
  return spots
}

export function saveParkingSpots(spots: ParkingSpot[]): void {
  localStorage.setItem(SPOT_STORAGE_KEY, JSON.stringify(spots))
}

export function getEntryExitRecords(): EntryExitRecord[] {
  const stored = localStorage.getItem(RECORD_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as EntryExitRecord[]
    } catch {
      // ignore
    }
  }
  const records = generateInitialRecords()
  saveEntryExitRecords(records)
  return records
}

export function saveEntryExitRecords(records: EntryExitRecord[]): void {
  localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records))
}

export function getMonthlyRentals(): MonthlyRental[] {
  const stored = localStorage.getItem(RENTAL_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as MonthlyRental[]
    } catch {
      // ignore
    }
  }
  const rentals = generateInitialRentals()
  saveMonthlyRentals(rentals)
  return rentals
}

export function saveMonthlyRentals(rentals: MonthlyRental[]): void {
  localStorage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(rentals))
}

export function clearAllParkingData(): void {
  localStorage.removeItem(SPOT_STORAGE_KEY)
  localStorage.removeItem(RECORD_STORAGE_KEY)
  localStorage.removeItem(RENTAL_STORAGE_KEY)
}

export function getNextId(prefix: string, list: { id: string }[]): string {
  if (list.length === 0) return `${prefix}000001`
  const maxNum = list.reduce((max, item) => {
    const num = parseInt(item.id.replace(prefix, ''), 10)
    return num > max ? num : max
  }, 0)
  return `${prefix}${(maxNum + 1).toString().padStart(6, '0')}`
}

export function addEntryRecord(licensePlate: string, vehicleType: VehicleType, isMonthlyRental: boolean, monthlyRentalId?: string): { record: EntryExitRecord; spot: ParkingSpot | null; error?: string } {
  const spots = getParkingSpots()
  const records = getEntryExitRecords()
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const existingSpot = checkDuplicateEntry(spots, licensePlate)
  if (existingSpot) {
    return { record: null as unknown as EntryExitRecord, spot: null, error: '该车牌车辆已在场内，请勿重复入场' }
  }

  const availableSpot = spots.find((s) => s.status === 'available')
  if (!availableSpot) {
    return { record: null as unknown as EntryExitRecord, spot: null, error: '车位已满，无法入场' }
  }

  availableSpot.status = 'occupied'
  availableSpot.licensePlate = licensePlate
  availableSpot.entryTime = timestamp
  if (isMonthlyRental && monthlyRentalId) {
    availableSpot.monthlyRentalId = monthlyRentalId
  }

  const record: EntryExitRecord = {
    id: getNextId('R', records),
    licensePlate,
    vehicleType,
    type: 'entry',
    timestamp,
    spotId: availableSpot.id,
    spotNumber: availableSpot.spotNumber,
    isMonthlyRental,
    monthlyRentalId
  }

  records.push(record)
  saveParkingSpots(spots)
  saveEntryExitRecords(records)
  return { record, spot: availableSpot }
}

export function addExitRecord(licensePlate: string): { record: EntryExitRecord; spot: ParkingSpot | null } | null {
  const spots = getParkingSpots()
  const records = getEntryExitRecords()
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const spot = spots.find((s) => s.licensePlate === licensePlate && s.status === 'occupied')
  if (!spot) return null

  const isMonthly = !!spot.monthlyRentalId

  const record: EntryExitRecord = {
    id: getNextId('R', records),
    licensePlate,
    vehicleType: 'sedan',
    type: 'exit',
    timestamp,
    spotId: spot.id,
    spotNumber: spot.spotNumber,
    isMonthlyRental: isMonthly,
    monthlyRentalId: spot.monthlyRentalId
  }

  if (!isMonthly) {
    spot.status = 'available'
    spot.licensePlate = undefined
    spot.entryTime = undefined
  }

  records.push(record)
  saveParkingSpots(spots)
  saveEntryExitRecords(records)
  return { record, spot }
}

export function addMonthlyRental(rental: Omit<MonthlyRental, 'id'>): { rental: MonthlyRental; spot: ParkingSpot | null } | null {
  const spots = getParkingSpots()
  const rentals = getMonthlyRentals()

  const spot = spots.find((s) => s.id === rental.spotId)
  if (!spot) return null
  if (spot.status !== 'available') return null

  const newRental: MonthlyRental = {
    ...rental,
    id: getNextId('M', rentals)
  }

  spot.status = 'occupied'
  spot.licensePlate = rental.licensePlate
  spot.monthlyRentalId = newRental.id
  const now = new Date()
  spot.entryTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  rentals.push(newRental)
  saveParkingSpots(spots)
  saveMonthlyRentals(rentals)
  return { rental: newRental, spot }
}

export function getTodayStats(): { todayEntries: number; todayExits: number; availableSpots: number; totalSpots: number; occupiedSpots: number; maintenanceSpots: number; notExitedVehicles: number } {
  const spots = getParkingSpots()
  const records = getEntryExitRecords()
  return calculateParkingStats(spots, records)
}

export function getAreaStats(): { area: string; total: number; available: number; occupied: number; maintenance: number }[] {
  const spots = getParkingSpots()
  return AREAS.map((area) => {
    const areaSpots = spots.filter((s) => s.area === area)
    return {
      area,
      total: areaSpots.length,
      available: areaSpots.filter((s) => s.status === 'available').length,
      occupied: areaSpots.filter((s) => s.status === 'occupied').length,
      maintenance: areaSpots.filter((s) => s.status === 'maintenance').length
    }
  })
}

export const spotTypeLabels: Record<ParkingSpotType, string> = {
  standard: '标准车位',
  compact: '小型车位',
  disabled: '无障碍车位',
  ev: '充电桩车位',
  vip: 'VIP车位'
}

export const spotStatusLabels: Record<ParkingSpotStatus, string> = {
  available: '空闲',
  occupied: '已占用',
  reserved: '已预约',
  maintenance: '维护中'
}

export const spotStatusColors: Record<ParkingSpotStatus, string> = {
  available: '#67c23a',
  occupied: '#f56c6c',
  reserved: '#e6a23c',
  maintenance: '#909399'
}

export const vehicleTypeLabels: Record<VehicleType, string> = {
  sedan: '轿车',
  suv: 'SUV',
  truck: '货车',
  motorcycle: '摩托车'
}

export const recordTypeLabels: Record<RecordType, string> = {
  entry: '入场',
  exit: '离场'
}

export const rentalStatusLabels: Record<RentalStatus, string> = {
  active: '生效中',
  expired: '已过期',
  pending: '待生效'
}

export const expiryStatusLabels: Record<ExpiryStatus, string> = {
  normal: '正常',
  expiring: '即将到期',
  expired: '已过期'
}

export const AREAS_LIST = AREAS
