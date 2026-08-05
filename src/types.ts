// ===== 型別定義 =====

export type GroupStatus = 'OPEN' | 'CLOSED' | 'DELIVERED'

export interface Product {
  id: string
  name: string
  unit: string
  price: number
  note?: string
}

export interface Group {
  id: string
  title: string
  description?: string
  deadline: string // ISO date string
  status: GroupStatus
  products: Product[]
  createdAt: string
}

export interface MemberItem {
  productId: string
  quantity: number
}

export interface Member {
  id: string
  groupId: string
  name: string
  items: MemberItem[]
  paid: boolean
  note?: string
  createdAt: string
}
