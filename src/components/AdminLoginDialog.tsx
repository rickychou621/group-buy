// ===== 管理員登入對話框 =====
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material'
import { useGroupBuy } from '../GroupBuyContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AdminLoginDialog({ open, onClose }: Props) {
  const { login } = useGroupBuy()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await login()
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>管理員登入</DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 3 }}>
          請使用指定的 Google 帳號登入，以啟用管理員特殊權限。
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleLogin}
          disabled={loading}
          sx={{ py: 1, px: 3, fontSize: '1rem', borderRadius: 2 }}
        >
          {loading ? '登入中...' : '使用 Google 帳號登入'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
