import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Group, GroupStatus, Member, MemberItem, Product } from './types'
import { genId, isMyMember, saveMyMemberId } from './storage'
import { db, auth } from './firebase'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const ADMIN_EMAIL = 'ludang621@gmail.com' // 這是你目前綁定的管理員信箱

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
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  isMyMember: (id: string) => boolean
  createGroup: (data: CreateGroupInput) => Promise<Group>
  updateGroup: (id: string, data: CreateGroupInput) => Promise<void>
  updateGroupStatus: (id: string, status: GroupStatus) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  getGroup: (id: string) => Group | undefined
  getMembersByGroup: (groupId: string) => Member[]
  createMember: (data: CreateMemberInput) => Promise<Member>
  updateMember: (id: string, data: Partial<Omit<Member, 'id' | 'groupId' | 'createdAt'>>) => Promise<void>
  togglePaid: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
}

const GroupBuyContext = createContext<GroupBuyContextValue | null>(null)

export function GroupBuyProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  // Firebase Realtime Listeners & Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    })
    const unsubscribeGroups = onSnapshot(query(collection(db, 'groups')), (snapshot) => {
      const gList: Group[] = []
      snapshot.forEach(doc => {
        gList.push(doc.data() as Group)
      })
      // 依建立時間排序（新的在前）
      gList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setGroups(gList)
      setIsLoadingGroups(false)
    })

    const unsubscribeMembers = onSnapshot(query(collection(db, 'members')), (snapshot) => {
      const mList: Member[] = []
      snapshot.forEach(doc => {
        mList.push(doc.data() as Member)
      })
      setMembers(mList)
      setIsLoadingMembers(false)
    })

    return () => {
      unsubscribeGroups()
      unsubscribeMembers()
      unsubscribeAuth()
    }
  }, [])

  const isLoading = isLoadingGroups || isLoadingMembers

  const login = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert(`此帳號沒有管理員權限！\n登入信箱：${result.user.email}\n預期信箱：${ADMIN_EMAIL}`)
        await signOut(auth)
      } else {
        alert(`登入成功！歡迎管理員：${result.user.email}`)
      }
    } catch (error) {
      console.error("Login failed", error)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const createGroup = useCallback(async (data: CreateGroupInput): Promise<Group> => {
    const id = genId('G')
    const g: Group = {
      id,
      title: data.title,
      description: data.description ?? '',
      deadline: data.deadline,
      status: 'OPEN',
      products: data.products.map((p) => ({ ...p, note: p.note ?? '', id: genId('P') })),
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'groups', id), g)
    return g
  }, [])

  const updateGroup = useCallback(async (id: string, data: CreateGroupInput) => {
    const currentGroup = groups.find(g => g.id === id)
    if (!currentGroup) return
    const updatedProducts = data.products.map((p) => {
      const ex = currentGroup.products.find((ep) => ep.name === p.name)
      return { ...p, note: p.note ?? '', id: ex?.id ?? genId('P') }
    })
    await updateDoc(doc(db, 'groups', id), {
      title: data.title,
      description: data.description ?? '',
      deadline: data.deadline,
      products: updatedProducts
    })
  }, [groups])

  const updateGroupStatus = useCallback(async (id: string, status: GroupStatus) => {
    await updateDoc(doc(db, 'groups', id), { status })
  }, [])

  const deleteGroup = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'groups', id))
    const groupMembers = members.filter((m) => m.groupId === id)
    for (const m of groupMembers) {
      await deleteDoc(doc(db, 'members', m.id))
    }
  }, [members])

  const getGroup = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups],
  )

  const getMembersByGroup = useCallback(
    (groupId: string) => members.filter((m) => m.groupId === groupId),
    [members],
  )

  const createMember = useCallback(async (data: CreateMemberInput): Promise<Member> => {
    const id = genId('M')
    const m: Member = {
      id,
      groupId: data.groupId,
      name: data.name,
      items: data.items,
      paid: false,
      note: data.note ?? '',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'members', id), m)
    saveMyMemberId(m.id)
    return m
  }, [])

  const updateMember = useCallback(
    async (id: string, data: Partial<Omit<Member, 'id' | 'groupId' | 'createdAt'>>) => {
      const cleanData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? '']))
      await updateDoc(doc(db, 'members', id), cleanData)
    },
    [],
  )

  const togglePaid = useCallback(async (id: string) => {
    const currentMember = members.find(m => m.id === id)
    if (currentMember) {
      await updateDoc(doc(db, 'members', id), { paid: !currentMember.paid })
    }
  }, [members])

  const deleteMember = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'members', id))
  }, [])

  return (
    <GroupBuyContext.Provider
      value={{
        groups, members, isAdmin, isLoading, login, logout, isMyMember,
        createGroup, updateGroup, updateGroupStatus, deleteGroup, getGroup,
        getMembersByGroup, createMember, updateMember, togglePaid, deleteMember,
      }}
    >
      {children}
    </GroupBuyContext.Provider>
  )
}

export function useGroupBuy() {
  const context = useContext(GroupBuyContext)
  if (!context) {
    throw new Error('useGroupBuy must be used within a GroupBuyProvider')
  }
  return context
}
