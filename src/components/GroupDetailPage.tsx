// ===== 團購詳情 + 成員管理（MUI v9 相容）=====
import { useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import type { Member } from '../types'
import { useGroupBuy } from '../GroupBuyContext'
import {
  calcGroupStats,
  calcMemberTotal,
  fmtAmount,
  fmtDate,
  isExpired,
  statusColor,
  statusLabel,
} from '../utils'
import MemberFormDialog from './MemberFormDialog'
import GroupFormDialog from './GroupFormDialog'
import OrderSummaryDialog from './OrderSummaryDialog'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'

interface Props {
  groupId: string
  onBack: () => void
}

export default function GroupDetailPage({ groupId, onBack }: Props) {
  const { getGroup, members, updateGroupStatus, deleteGroup, togglePaid, deleteMember, isAdmin, isMyMember } =
    useGroupBuy()

  const group = getGroup(groupId)
  const groupMembers = members.filter((m) => m.groupId === groupId)

  const [memberFormOpen, setMemberFormOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | undefined>()
  const [groupEditOpen, setGroupEditOpen] = useState(false)
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false)
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState(false)
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<string | null>(null)
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null)
  const [memberMenuTarget, setMemberMenuTarget] = useState<{ el: HTMLElement; member: Member } | null>(null)
  const [showAllProducts, setShowAllProducts] = useState(false)

  if (!group) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">找不到此團購</Alert>
      </Box>
    )
  }

  const stats = calcGroupStats(group, groupMembers)
  const paidRatio = stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0
  const expired = group.status === 'OPEN' && isExpired(group.deadline)

  type TransFrom = 'OPEN' | 'CLOSED'
  type TransTo = 'CLOSED' | 'OPEN' | 'DELIVERED'
  const STATUS_TRANSITIONS: { from: TransFrom; to: TransTo; label: string }[] = [
    { from: 'OPEN', to: 'CLOSED', label: '標記截止' },
    { from: 'CLOSED', to: 'OPEN', label: '重新開放' },
    { from: 'CLOSED', to: 'DELIVERED', label: '標記已出貨' },
  ]
  const transition = STATUS_TRANSITIONS.find((t) => t.from === group.status)

  const handleDeleteGroup = () => {
    deleteGroup(groupId)
    onBack()
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* 頂部導覽 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, ml: 0.5, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: '1rem', fontWeight: 700 }}>
            {group.title}
          </Typography>
          {isAdmin && (
            <Chip 
              icon={<AdminPanelSettingsIcon />}
              label="管理員" 
              size="small" 
              color="primary"
              sx={{ ml: 1, height: 22, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: '1rem' } }} 
            />
          )}
        </Box>
        <IconButton size="small" onClick={(e) => setGroupMenuAnchor(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* 操作選單 */}
      <Menu anchorEl={groupMenuAnchor} open={Boolean(groupMenuAnchor)} onClose={() => setGroupMenuAnchor(null)}>
        <MenuItem onClick={() => { setGroupMenuAnchor(null); setGroupEditOpen(true) }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          編輯團購資訊
        </MenuItem>
        {isAdmin && transition && (
          <MenuItem onClick={() => { setGroupMenuAnchor(null); updateGroupStatus(groupId, transition.to) }}>
            {transition.label}
          </MenuItem>
        )}
        {isAdmin && <Divider />}
        {isAdmin && (
          <MenuItem sx={{ color: 'error.main' }} onClick={() => { setGroupMenuAnchor(null); setDeleteGroupConfirm(true) }}>
            <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            刪除此團購
          </MenuItem>
        )}
      </Menu>

      {/* 統計區 */}
      <Box sx={{ px: 2.5, py: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Chip label={statusLabel(group.status)} color={statusColor(group.status)} size="small" />
          <Chip
            label={`截止：${fmtDate(group.deadline)}${expired ? ' ⚠' : ''}`}
            size="small"
            variant="outlined"
            color={expired ? 'error' : 'default'}
          />
        </Box>

        {group.description && (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1.5 }}>
            {group.description}
          </Typography>
        )}

        {/* 統計卡片 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
          {[
            { label: '成員', value: `${stats.memberCount} 人`, alert: false },
            { label: '總金額', value: fmtAmount(stats.totalAmount), alert: false },
            { label: '未付款', value: fmtAmount(stats.unpaidAmount), alert: stats.unpaidAmount > 0 },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: item.alert ? 'error.main' : 'text.primary' }}>
                {item.value}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* 付款進度條 */}
        {stats.totalAmount > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>付款進度</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(paidRatio)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={paidRatio}
              color={paidRatio === 100 ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* 商品清單 */}
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>商品清單</Typography>
          {groupMembers.length > 0 && (
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<FormatListBulletedIcon />}
              onClick={() => setOrderSummaryOpen(true)}
              sx={{ py: 0.2, px: 1 }}
            >
              總計
            </Button>
          )}
        </Box>
        <Stack spacing={0.75}>
          {(showAllProducts ? group.products : group.products.slice(0, 5)).map((p) => (
            <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.875rem' }}>
                {p.name}
                {p.note && (
                  <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 0.5 }}>
                    ({p.note})
                  </Box>
                )}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {fmtAmount(p.price)} / {p.unit}
              </Typography>
            </Box>
          ))}
          {group.products.length > 5 && (
            <Button
              size="small"
              onClick={() => setShowAllProducts(!showAllProducts)}
              sx={{ color: 'text.secondary', py: 0.5, mt: 1 }}
            >
              {showAllProducts ? '收合' : `顯示更多 (${group.products.length - 5})`}
            </Button>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* 成員列表 */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
              參團名單（{groupMembers.length} 人）
            </Typography>
            {isAdmin && groupMembers.length > 0 && (
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                點擊圓圈標記付款
              </Typography>
            )}
          </Box>
        </Box>

        {groupMembers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <Typography sx={{ fontSize: '0.875rem', color: 'inherit' }}>目前還沒有人參團</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'inherit' }}>點擊右下角「我要參團」加入</Typography>
          </Box>
        )}

        <Stack divider={<Divider />}>
          {groupMembers.map((member) => {
            const total = calcMemberTotal(member, group.products)
            return (
              <Box key={member.id} sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* 付款狀態切換 */}
                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={() => togglePaid(member.id)}
                    color={member.paid ? 'success' : 'default'}
                    sx={{ flexShrink: 0 }}
                  >
                    {member.paid ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                  </IconButton>
                )}

                {/* 頭像 */}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: member.paid ? 'success.light' : 'primary.light',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {member.name[0]}
                </Avatar>

                {/* 詳情 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{member.name}</Typography>
                    {member.paid && (
                      <Chip label="已付" size="small" color="success" variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                  <Typography noWrap sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {member.items
                      .map((i) => {
                        const p = group.products.find((p) => p.id === i.productId)
                        return p ? `${p.name} x${i.quantity}` : ''
                      })
                      .filter(Boolean)
                      .join('、') || '無購買項目'}
                  </Typography>
                  {member.note && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                      備註：{member.note}
                    </Typography>
                  )}
                </Box>

                {/* 金額 */}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: member.paid ? 'success.main' : 'text.primary', flexShrink: 0 }}>
                  {fmtAmount(total)}
                </Typography>

                {/* 選單 */}
                {(isAdmin || isMyMember(member.id)) ? (
                  <IconButton size="small" onClick={(e) => setMemberMenuTarget({ el: e.currentTarget, member })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Box sx={{ width: 26 }} /> /* 佔位符 */
                )}
              </Box>
            )
          })}
        </Stack>
      </Box>

      {/* 成員操作選單 */}
      <Menu
        anchorEl={memberMenuTarget?.el}
        open={Boolean(memberMenuTarget)}
        onClose={() => setMemberMenuTarget(null)}
      >
        <MenuItem onClick={() => {
          setEditMember(memberMenuTarget!.member)
          setMemberMenuTarget(null)
          setMemberFormOpen(true)
        }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />編輯
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => {
          setDeleteMemberTarget(memberMenuTarget!.member.id)
          setMemberMenuTarget(null)
        }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />刪除
        </MenuItem>
      </Menu>

      {/* FAB */}
      {(isAdmin || group.status === 'OPEN') && (
        <Fab
          variant="extended"
          color="primary"
          aria-label="我要參團"
          onClick={() => { setEditMember(undefined); setMemberFormOpen(true) }}
          sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: 6 }}
        >
          <PersonAddAltIcon sx={{ mr: 1 }} />
          我要參團
        </Fab>
      )}

      {/* Dialogs */}
      <MemberFormDialog
        open={memberFormOpen}
        onClose={() => { setMemberFormOpen(false); setEditMember(undefined) }}
        group={group}
        editMember={editMember}
      />
      <GroupFormDialog 
        open={groupEditOpen} 
        onClose={() => setGroupEditOpen(false)} 
        editGroup={group} 
        members={groupMembers} 
      />
      <OrderSummaryDialog 
        open={orderSummaryOpen} 
        onClose={() => setOrderSummaryOpen(false)} 
        group={group} 
        members={groupMembers} 
      />

      <Dialog open={deleteGroupConfirm} onClose={() => setDeleteGroupConfirm(false)}>
        <DialogTitle>刪除團購</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定刪除「{group.title}」？此操作將刪除所有成員資料，無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGroupConfirm(false)} color="inherit">取消</Button>
          <Button color="error" variant="contained" onClick={handleDeleteGroup}>刪除</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteMemberTarget)} onClose={() => setDeleteMemberTarget(null)}>
        <DialogTitle>移除成員</DialogTitle>
        <DialogContent>
          <DialogContentText>確定要移除此成員嗎？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteMemberTarget(null)} color="inherit">取消</Button>
          <Button color="error" variant="contained" onClick={() => {
            if (deleteMemberTarget) deleteMember(deleteMemberTarget)
            setDeleteMemberTarget(null)
          }}>
            移除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
