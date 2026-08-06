// ===== 下單清單結算對話框 =====
import { useMemo } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { Group, Member } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  group: Group
  members: Member[]
}

export default function OrderSummaryDialog({ open, onClose, group, members }: Props) {
  // 結算邏輯
  const summary = useMemo(() => {
    const counts: Record<string, number> = {}
    
    // 初始化商品數量
    group.products.forEach(p => counts[p.id] = 0)

    // 累加成員數量
    members.forEach(m => {
      m.items.forEach(item => {
        if (counts[item.productId] !== undefined) {
          counts[item.productId] += item.quantity
        }
      })
    })

    let totalAmount = 0
    const list = group.products.map(p => {
      const qty = counts[p.id] || 0
      const amount = qty * p.price
      totalAmount += amount
      return { ...p, totalQuantity: qty, totalAmount: amount }
    }).filter(p => p.totalQuantity > 0) // 僅顯示有被訂購的

    return { list, totalAmount }
  }, [group, members])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>總下單清單</DialogTitle>
      <Divider />
      <DialogContent>
        {summary.list.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            目前還沒有人選購任何商品
          </Typography>
        ) : (
          <Stack spacing={2}>
            {summary.list.map((item) => (
              <Box 
                key={item.id} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    單價 ${item.price} / {item.unit}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1rem' }}>
                    {item.totalQuantity} {item.unit}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                    共 ${item.totalAmount}
                  </Typography>
                </Box>
              </Box>
            ))}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2, 
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 2 
            }}>
              <Typography sx={{ fontWeight: 600 }}>總計金額</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}>
                ${summary.totalAmount}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth>關閉</Button>
      </DialogActions>
    </Dialog>
  )
}
