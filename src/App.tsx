// ===== 主 App =====
import { useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { GroupBuyProvider, useGroupBuy } from './GroupBuyContext'
import GroupListPage from './components/GroupListPage'
import GroupDetailPage from './components/GroupDetailPage'

type Page = { name: 'list' } | { name: 'detail'; groupId: string }

function MainContent() {
  const { isLoading } = useGroupBuy()
  const [page, setPage] = useState<Page>({ name: 'list' })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {page.name === 'list' && (
        <GroupListPage
          onSelectGroup={(id) => setPage({ name: 'detail', groupId: id })}
        />
      )}
      {page.name === 'detail' && (
        <GroupDetailPage
          groupId={page.groupId}
          onBack={() => setPage({ name: 'list' })}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <GroupBuyProvider>
      {/* 手機感外框：桌機寬度時顯示白色卡片在中間 */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          bgcolor: { xs: 'background.default', md: '#e8e0f0' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 480 },
            minHeight: '100vh',
            bgcolor: 'background.default',
            boxShadow: { md: '0 0 60px rgba(103,80,164,0.2)' },
            position: 'relative',
          }}
        >
          <MainContent />
        </Box>
      </Box>
    </GroupBuyProvider>
  )
}
