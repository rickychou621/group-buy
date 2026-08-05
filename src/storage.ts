// ===== sessionStorage 儲存層（重整後清除）=====

import type { Group, Member } from './types'

const GROUPS_KEY = 'gb_groups'
const MEMBERS_KEY = 'gb_members'

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
