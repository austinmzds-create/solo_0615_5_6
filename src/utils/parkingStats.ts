import type { ParkingSpot, EntryExitRecord } from '../mock/parking'

export interface ParkingStats {
  todayEntries: number
  todayExits: number
  availableSpots: number
  totalSpots: number
  occupiedSpots: number
  maintenanceSpots: number
  notExitedVehicles: number
}

export function getTodayDateString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

export function calculateParkingStats(
  spots: ParkingSpot[],
  records: EntryExitRecord[]
): ParkingStats {
  const todayStr = getTodayDateString()

  const todayRecords = records.filter((r) => r.timestamp.startsWith(todayStr))
  const todayEntries = todayRecords.filter((r) => r.type === 'entry').length
  const todayExits = todayRecords.filter((r) => r.type === 'exit').length

  const availableSpots = spots.filter((s) => s.status === 'available').length
  const totalSpots = spots.length
  const occupiedSpots = spots.filter((s) => s.status === 'occupied').length
  const maintenanceSpots = spots.filter((s) => s.status === 'maintenance').length
  const notExitedVehicles = occupiedSpots

  return {
    todayEntries,
    todayExits,
    availableSpots,
    totalSpots,
    occupiedSpots,
    maintenanceSpots,
    notExitedVehicles
  }
}

export function checkDuplicateEntry(
  spots: ParkingSpot[],
  licensePlate: string
): boolean {
  return spots.some((s) => s.licensePlate === licensePlate && s.status === 'occupied')
}
