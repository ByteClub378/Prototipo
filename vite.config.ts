import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento o frontend roda na porta 5173 e a API na 3000.
    // O cliente usa URLs relativas por padrão, então elas precisam ser
    // encaminhadas para o backend em vez de cair no servidor do Vite.
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
})
