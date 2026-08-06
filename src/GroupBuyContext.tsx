import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Group, GroupStatus, Member, MemberItem, Product } from './types'
import { genId, loadGroups, loadMembers, saveGroups, saveMembers, loadAdminStatus, saveAdminStatus, isMyMember, saveMyMemberId } from './storage'

// ---------- 輸入型別 ----------

export interface CreateGroupInput {
  title: string
  description?: string
  deadline: string
  products: Omit<Product, 'id'>[]
}

export interface CreateMemberInput {
  groupId: string
  name: string
  items: MemberItem[]
  note?: string
}

// ---------- Context 型別 ----------

interface GroupBuyContextValue {
  groups: Group[]
  members: Member[]
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
  isMyMember: (id: string) => boolean
  createGroup: (data: CreateGroupInput) => Group
  updateGroup: (id: string, data: CreateGroupInput) => void
  updateGroupStatus: (id: string, status: GroupStatus) => void
  deleteGroup: (id: string) => void
  getGroup: (id: string) => Group | undefined
  getMembersByGroup: (groupId: string) => Member[]
  createMember: (data: CreateMemberInput) => Member
  updateMember: (id: string, data: Partial<Omit<Member, 'id' | 'groupId' | 'createdAt'>>) => void
  togglePaid: (id: string) => void
  deleteMember: (id: string) => void
}

const GroupBuyContext = createContext<GroupBuyContextValue | null>(null)

export function GroupBuyProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups())
  const [members, setMembers] = useState<Member[]>(() => loadMembers())
  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadAdminStatus())

  useEffect(() => { saveGroups(groups) }, [groups])
  useEffect(() => { saveMembers(members) }, [members])
  useEffect(() => { saveAdminStatus(isAdmin) }, [isAdmin])

  const login = useCallback((password: string) => {
    if (password === 'admin') {
      setIsAdmin(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => setIsAdmin(false), [])

  const createGroup = useCallback((data: CreateGroupInput): Group => {
    const g: Group = {
      id: genId('G'),
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      status: 'OPEN',
      products: data.products.map((p) => ({ ...p, id: genId('P') })),
      createdAt: new Date().toISOString(),
    }
    setGroups((prev) => [g, ...prev])
    return g
  }, [])

  const updateGroup = useCallback((id: string, data: CreateGroupInput) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== id
          ? g
          : {
              ...g,
              title: data.title,
              description: data.description,
              deadline: data.deadline,
              products: data.products.map((p) => {
                const ex = g.products.find((ep) => ep.name === p.name)
                return { ...p, id: ex?.id ?? genId('P') }
              }),
            },
      ),
    )
  }, [])

  const updateGroupStatus = useCallback((id: string, status: GroupStatus) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)))
  }, [])

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setMembers((prev) => prev.filter((m) => m.groupId !== id))
  }, [])

  const getGroup = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups],
  )

  const getMembersByGroup = useCallback(
    (groupId: string) => members.filter((m) => m.groupId === groupId),
    [members],
  )

  const createMember = useCallback((data: CreateMemberInput): Member => {
    const m: Member = {
      id: genId('M'),
      groupId: data.groupId,
      name: data.name,
      items: data.items,
      paid: false,
      note: data.note,
      createdAt: new Date().toISOString(),
    }
    setMembers((prev) => [...prev, m])
    saveMyMemberId(m.id)
    return m
  }, [])

  const updateMember = useCallback(
    (id: string, data: Partial<Omit<Member, 'id' | 'groupId' | 'createdAt'>>) => {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)))
    },
    [],
  )

  const togglePaid = useCallback((id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, paid: !m.paid } : m)))
  }, [])

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return (
    <GroupBuyContext.Provider
      value={{
        groups, members, isAdmin, login, logout, isMyMember,
        createGroup, updateGroup, updateGroupStatus, deleteGroup, getGroup,
        getMembersByGroup, createMember, updateMember, togglePaid, deleteMember,
      }}
    >
      {children}
    </GroupBuyContext.Provider>
  )
}

export function useGroupBuy() {
  const ctx = useContext(GroupBuyContext)
  if (!ctx) throw new Error('useGroupBuy must be used within GroupBuyProvider')
  return ctx
}
