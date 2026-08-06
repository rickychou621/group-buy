// ===== 團購列表頁（MUI v9 相容）=====
import { useState } from 'react'
import {
  Box,
  Chip,
  Divider,
  Fab,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { GroupStatus } from '../types'
import { useGroupBuy } from '../GroupBuyContext'
import { calcGroupStats, fmtAmount, fmtDate, isExpired, statusColor, statusLabel } from '../utils'
import GroupFormDialog from './GroupFormDialog'
import logoUrl from '../assets/logo.jpg'

interface Props {
  onSelectGroup: (id: string) => void
}

const FILTERS: { label: string; value: GroupStatus | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '進行中', value: 'OPEN' },
  { label: '已截止', value: 'CLOSED' },
  { label: '已出貨', value: 'DELIVERED' },
]

export default function GroupListPage({ onSelectGroup }: Props) {
  const { groups, members } = useGroupBuy()
  const [filter, setFilter] = useState<GroupStatus | 'ALL'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = groups.filter((g) => filter === 'ALL' || g.status === filter)

  return (
    <Box sx={{ pb: 10 }}>
      {/* 頂部標題漸層 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #F3B123 0%, #FFD54F 100%)',
          px: 2.5,
          pt: 3.5,
          pb: 3,
          color: '#fff',
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.8, color: 'inherit' }}>團購管理</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box
            component="img"
            src={logoUrl}
            sx={{ width: 28, height: 28, borderRadius: 1 }}
          />
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'inherit' }}>
            我的團購
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.85rem', mt: 0.5, opacity: 0.75, color: 'inherit' }}>
          共 {groups.length} 個活動
        </Typography>
      </Box>

      {/* 篩選列 */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
          sx={{ gap: 0.75, flexWrap: 'wrap' }}
        >
          {FILTERS.map((f) => (
            <ToggleButton
              key={f.value}
              value={f.value}
              sx={{
                borderRadius: '20px !important',
                border: '1.5px solid',
                borderColor: 'divider',
                px: 1.5,
                py: 0.4,
                fontSize: '0.78rem',
                fontWeight: 500,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  borderColor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* 空狀態 */}
      {filtered.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, color: 'text.disabled' }}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 72, mb: 2 }} />
          <Typography sx={{ fontSize: '0.875rem', color: 'inherit' }}>還沒有團購活動</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'inherit' }}>點擊右下角 + 新增吧！</Typography>
        </Box>
      )}

      {/* 卡片列表 */}
      <Stack divider={<Divider />}>
        {filtered.map((group) => {
          const groupMembers = members.filter((m) => m.groupId === group.id)
          const stats = calcGroupStats(group, groupMembers)
          const expired = group.status === 'OPEN' && isExpired(group.deadline)
          const paidRatio =
            stats.totalAmount > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0

          return (
            <Box
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              sx={{
                px: 2,
                py: 2,
                bgcolor: 'background.paper',
                cursor: 'pointer',
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                transition: 'background-color 0.15s',
                '&:active': { bgcolor: 'action.selected' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* 標題 + 狀態 */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700, flex: '1 1 auto' }} noWrap>
                    {group.title}
                  </Typography>
                  <Chip
                    label={statusLabel(group.status)}
                    color={statusColor(group.status)}
                    size="small"
                    variant={group.status === 'OPEN' ? 'filled' : 'outlined'}
                    sx={{ flexShrink: 0 }}
                  />
                </Box>

                {/* 截止日 */}
                <Typography sx={{ fontSize: '0.75rem', color: expired ? 'error.main' : 'text.secondary' }}>
                  截止：{fmtDate(group.deadline)}{expired && ' ⚠ 逾期'}
                </Typography>

                {/* 統計 */}
                <Box sx={{ display: 'flex', gap: 2.5, mt: 1 }}>
                  {[
                    { label: '成員', value: `${stats.memberCount} 人` },
                    { label: '總額', value: fmtAmount(stats.totalAmount) },
                    {
                      label: '已付',
                      value: fmtAmount(stats.paidAmount),
                      highlight: paidRatio === 100 && stats.totalAmount > 0,
                    },
                  ].map((s) => (
                    <Box key={s.label}>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', display: 'block' }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: s.highlight ? 'success.main' : 'text.primary' }}>
                        {s.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* 商品 Chip */}
                {group.products.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {group.products.map((p) => (
                      <Chip
                        key={p.id}
                        label={p.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.68rem', height: 20 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <ChevronRightIcon sx={{ color: 'text.disabled', mt: 0.5, flexShrink: 0 }} />
            </Box>
          )
        })}
      </Stack>

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="新增團購"
        onClick={() => setCreateOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: 6 }}
      >
        <AddIcon />
      </Fab>

      <GroupFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  )
}
