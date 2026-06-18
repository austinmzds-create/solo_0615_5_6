import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import Dashboard from '@/views/Dashboard.vue'
import {
  clearAllParkingData,
  saveMonthlyRentals,
  type MonthlyRental
} from '@/mock/parking'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/monthly-rental', component: { template: '<div>monthly</div>' } }
  ]
})

describe('Dashboard.vue - 首页待续费数量', () => {
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
    endDate: string,
    status: 'active' | 'expired' | 'pending' = 'active'
  ): MonthlyRental => ({
    id,
    licensePlate: `京A${id}`,
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

  it('回归场景：1辆已过期 + 1辆3天后到期，待续费总数为 2', async () => {
    const rentals = [
      createRental('001', '2026-06-15', 'expired'),
      createRental('002', '2026-06-21', 'active'),
      createRental('003', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('待续费')

    const renewalCard = wrapper.find('.stat-renewal')
    expect(renewalCard.exists()).toBe(true)

    const statValue = renewalCard.find('.stat-value')
    expect(statValue.text()).toBe('2')
  })

  it('显示已过期和即将到期的分项数量', async () => {
    const rentals = [
      createRental('001', '2026-06-10', 'expired'),
      createRental('002', '2026-06-15', 'expired'),
      createRental('003', '2026-06-20', 'active'),
      createRental('004', '2026-06-21', 'active'),
      createRental('005', '2026-06-22', 'active'),
      createRental('006', '2026-07-01', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('即将到期 3')
    expect(html).toContain('已过期 2')
  })

  it('没有待续费车辆时不显示待续费卡片', async () => {
    const rentals = [
      createRental('001', '2026-07-15', 'active'),
      createRental('002', '2026-08-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const renewalCard = wrapper.find('.stat-renewal')
    expect(renewalCard.exists()).toBe(false)
  })

  it('只有已过期车辆时显示待续费卡片', async () => {
    const rentals = [
      createRental('001', '2026-06-15', 'expired'),
      createRental('002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const renewalCard = wrapper.find('.stat-renewal')
    expect(renewalCard.exists()).toBe(true)
    const statValue = renewalCard.find('.stat-value')
    expect(statValue.text()).toBe('1')
  })

  it('只有即将到期车辆时显示待续费卡片', async () => {
    const rentals = [
      createRental('001', '2026-06-21', 'active'),
      createRental('002', '2026-07-15', 'active')
    ]
    saveMonthlyRentals(rentals)

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [ElementPlus, router]
      }
    })

    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const renewalCard = wrapper.find('.stat-renewal')
    expect(renewalCard.exists()).toBe(true)
    const statValue = renewalCard.find('.stat-value')
    expect(statValue.text()).toBe('1')
  })
})
