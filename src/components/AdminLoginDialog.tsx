// ===== 管理員登入對話框 =====
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { useGroupBuy } from '../GroupBuyContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AdminLoginDialog({ open, onClose }: Props) {
  const { login } = useGroupBuy()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (login(password)) {
      onClose()
      setPassword('')
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>管理員登入</DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
          請輸入管理員密碼以啟用特殊權限（預設密碼：admin）
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          type="password"
          label="密碼"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(false)
          }}
          error={error}
          helperText={error ? '密碼錯誤' : ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin()
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button onClick={handleLogin} variant="contained">登入</Button>
      </DialogActions>
    </Dialog>
  )
}
