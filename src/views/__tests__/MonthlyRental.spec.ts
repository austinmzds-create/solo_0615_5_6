import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import MonthlyRental from '@/views/MonthlyRental.vue'
import {
  clearAllParkingData,
  saveMonthlyRentals,
  type MonthlyRental as MonthlyRentalType
} from '@/mock/parking'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/monthly-rental', component: MonthlyRental }
  ]
})

describe('MonthlyRental.vue - 月租车到期提醒', () => {
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

  const createRental = (
    id: string,
    licensePlate: string,
    endDate: string,
    status: 'active' | 'expired' | 'pending' = 'active'
  ): MonthlyRentalType => ({
    id,
    licensePlate,
    ownerName: '测试用户',
    phone: '13800138000',
    vehicleType: 'sedan',
    spotId: `S${id.padStart(6, '0')}`,
    spotNumber: `A${id.padStart(3, '0')}`,
    startDate: '2026-05-18',
    endDate,
    amount: 500,
    status
  })

  it('显示已过期车辆的"已过期 X 天"标记', async () => {
    const rentals = [
      createRental('001', '京A00001', '2026-06-15', 'expired'),
      createRental('002', '京A00002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(MonthlyRental, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('已过期')
    expect(html).toContain('3 天')
  })

  it('显示3天后到期车辆的"剩余 X 天"标记', async () => {
    const rentals = [
      createRental('001', '京A00001', '2026-06-21', 'active'),
      createRental('002', '京A00002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(MonthlyRental, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('剩余')
    expect(html).toContain('3 天')
  })

  it('回归场景：1辆已过期 + 1辆3天后到期，分别显示对应标记', async () => {
    const rentals = [
      createRental('001', '京A00001', '2026-06-15', 'expired'),
      createRental('002', '京A00002', '2026-06-21', 'active'),
      createRental('003', '京A00003', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(MonthlyRental, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('已过期 3 天')
    expect(html).toContain('剩余 3 天')
  })

  it('已过期车辆行有过期样式类名', async () => {
    const rentals = [
      createRental('001', '京A00001', '2026-06-15', 'expired'),
      createRental('002', '京A00002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(MonthlyRental, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const tableRows = wrapper.findAll('.el-table__row')
    const hasExpiredRow = tableRows.some(row => row.classes().includes('row-expired'))
    expect(hasExpiredRow).toBe(true)
  })

  it('即将到期车辆行有即将到期样式类名', async () => {
    const rentals = [
      createRental('001', '京A00001', '2026-06-21', 'active'),
      createRental('002', '京A00002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(MonthlyRental, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const tableRows = wrapper.findAll('.el-table__row')
    const hasExpiringRow = tableRows.some(row => row.classes().includes('row-expiring'))
    expect(hasExpiringRow).toBe(true)
  })
})
