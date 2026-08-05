import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 部署到 GitHub Pages 時，把 'group-buy' 換成你的 repo 名稱
  base: '/group-buy/',
  server: {
    port: 5174,
    open: true,
  },
})
