// ===== 工具函式 =====

import type { Group, Member, Product } from './types'

export function calcMemberTotal(member: Member, products: Product[]): number {
  return member.items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId)
    return p ? sum + p.price * item.quantity : sum
  }, 0)
}

export function calcGroupStats(group: Group, members: Member[]) {
  const totalAmount = members.reduce(
    (s, m) => s + calcMemberTotal(m, group.products),
    0,
  )
  const paidAmount = members
    .filter((m) => m.paid)
    .reduce((s, m) => s + calcMemberTotal(m, group.products), 0)

  return {
    memberCount: members.length,
    totalAmount,
    paidAmount,
    unpaidAmount: totalAmount - paidAmount,
  }
}

export function fmtAmount(amount: number): string {
  return `$${amount.toLocaleString('zh-TW')}`
}

export function fmtDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function statusLabel(status: Group['status']): string {
  const map: Record<Group['status'], string> = {
    OPEN: '進行中',
    CLOSED: '已截止',
    DELIVERED: '已出貨',
  }
  return map[status]
}

export function statusColor(
  status: Group['status'],
): 'success' | 'warning' | 'default' {
  const map: Record<Group['status'], 'success' | 'warning' | 'default'> = {
    OPEN: 'success',
    CLOSED: 'warning',
    DELIVERED: 'default',
  }
  return map[status]
}

export function isExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}
