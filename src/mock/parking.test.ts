import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getExpiryStatus,
  getDaysRemaining,
  getRenewalStats,
  getMonthlyRentals,
  saveMonthlyRentals,
  clearAllParkingData,
  type MonthlyRental
} from './parking'

describe('parking - 月租车到期提醒', () => {
  const baseDate = new Date('2026-06-18T00:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseDate)
    clearAllParkingData()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAllParkingData()
  })

  const createRental = (endDate: string, status = 'active' as const): MonthlyRental => ({
    id: 'M000001',
    licensePlate: '京A12345',
    ownerName: '测试用户',
    phone: '13800138000',
    vehicleType: 'sedan',
    spotId: 'S000001',
    spotNumber: 'A001',
    startDate: '2026-05-18',
    endDate,
    amount: 500,
    status
  })

  describe('getExpiryStatus', () => {
    it('已过期车辆返回 expired', () => {
      const rental = createRental('2026-06-17')
      expect(getExpiryStatus(rental)).toBe('expired')
    })

    it('今天到期车辆返回 expiring', () => {
      const rental = createRental('2026-06-18')
      expect(getExpiryStatus(rental)).toBe('expiring')
    })

    it('3天后到期车辆返回 expiring', () => {
      const rental = createRental('2026-06-21')
      expect(getExpiryStatus(rental)).toBe('expiring')
    })

    it('7天后到期车辆返回 expiring', () => {
      const rental = createRental('2026-06-25')
      expect(getExpiryStatus(rental)).toBe('expiring')
    })

    it('8天后到期车辆返回 normal', () => {
      const rental = createRental('2026-06-26')
      expect(getExpiryStatus(rental)).toBe('normal')
    })

    it('很久以后到期返回 normal', () => {
      const rental = createRental('2026-12-31')
      expect(getExpiryStatus(rental)).toBe('normal')
    })
  })

  describe('getDaysRemaining', () => {
    it('已过期1天返回 -1', () => {
      const rental = createRental('2026-06-17')
      expect(getDaysRemaining(rental)).toBe(-1)
    })

    it('今天到期返回 0', () => {
      const rental = createRental('2026-06-18')
      expect(getDaysRemaining(rental)).toBe(0)
    })

    it('3天后到期返回 3', () => {
      const rental = createRental('2026-06-21')
      expect(getDaysRemaining(rental)).toBe(3)
    })

    it('10天后到期返回 10', () => {
      const rental = createRental('2026-06-28')
      expect(getDaysRemaining(rental)).toBe(10)
    })
  })

  describe('getRenewalStats - 回归测试场景', () => {
    it('1辆已过期 + 1辆3天后到期，待续费总数为 2', () => {
      const expiredRental = createRental('2026-06-15', 'expired')
      const expiringRental = createRental('2026-06-21', 'active')
      const normalRental = createRental('2026-07-15', 'active')

      saveMonthlyRentals([expiredRental, expiringRental, normalRental])

      const stats = getRenewalStats()
      expect(stats.expiredCount).toBe(1)
      expect(stats.expiringCount).toBe(1)
      expect(stats.totalPending).toBe(2)
    })

    it('多辆已过期和即将到期车辆统计正确', () => {
      const rentals: MonthlyRental[] = [
        createRental('2026-06-10', 'expired'),
        createRental('2026-06-15', 'expired'),
        createRental('2026-06-20', 'active'),
        createRental('2026-06-21', 'active'),
        createRental('2026-06-22', 'active'),
        createRental('2026-07-01', 'active'),
        createRental('2026-08-01', 'active')
      ]

      saveMonthlyRentals(rentals)

      const stats = getRenewalStats()
      expect(stats.expiredCount).toBe(2)
      expect(stats.expiringCount).toBe(3)
      expect(stats.totalPending).toBe(5)
    })

    it('没有待续费车辆时总数为 0', () => {
      const rentals: MonthlyRental[] = [
        createRental('2026-07-01', 'active'),
        createRental('2026-08-01', 'active'),
        createRental('2026-09-01', 'active')
      ]

      saveMonthlyRentals(rentals)

      const stats = getRenewalStats()
      expect(stats.expiredCount).toBe(0)
      expect(stats.expiringCount).toBe(0)
      expect(stats.totalPending).toBe(0)
    })
  })
})
