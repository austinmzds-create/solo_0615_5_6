import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/',
      component: () => import('../views/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'parking-overview',
          name: 'ParkingOverview',
          component: () => import('../views/ParkingOverview.vue')
        },
        {
          path: 'entry-exit',
          name: 'EntryExit',
          component: () => import('../views/EntryExitRecords.vue')
        },
        {
          path: 'monthly-rental',
          name: 'MonthlyRental',
          component: () => import('../views/MonthlyRental.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isLoggedIn()) {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else {
    if (to.path === '/login' && isLoggedIn()) {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
