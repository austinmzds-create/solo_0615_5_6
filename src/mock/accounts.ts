export type UserRole = 'admin' | 'operator'

export interface MockUser {
  username: string
  password: string
  name: string
  role: UserRole
  roleLabel: string
}

export const mockUsers: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    roleLabel: '管理员'
  },
  {
    username: 'operator',
    password: 'operator123',
    name: '值班员小王',
    role: 'operator',
    roleLabel: '操作员'
  }
]
