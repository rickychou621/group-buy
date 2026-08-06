// ===== sessionStorage 儲存層（重整後清除）=====

import type { Group, Member } from './types'

const GROUPS_KEY = 'gb_groups'
const MEMBERS_KEY = 'gb_members'
const ADMIN_KEY = 'gb_admin'
const MY_MEMBERS_KEY = 'gb_my_members'

export function loadGroups(): Group[] {
  try {
    const raw = sessionStorage.getItem(GROUPS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGroups(groups: Group[]): void {
  sessionStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function loadMembers(): Member[] {
  try {
    const raw = sessionStorage.getItem(MEMBERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMembers(members: Member[]): void {
  sessionStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function loadAdminStatus(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true'
}

export function saveAdminStatus(isAdmin: boolean): void {
  sessionStorage.setItem(ADMIN_KEY, String(isAdmin))
}

export function saveMyMemberId(id: string): void {
  try {
    const raw = localStorage.getItem(MY_MEMBERS_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    if (!list.includes(id)) {
      list.push(id)
      localStorage.setItem(MY_MEMBERS_KEY, JSON.stringify(list))
    }
  } catch {}
}

export function isMyMember(id: string): boolean {
  try {
    const raw = localStorage.getItem(MY_MEMBERS_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    return list.includes(id)
  } catch {
    return false
  }
}
