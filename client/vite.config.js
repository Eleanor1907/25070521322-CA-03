import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The React app calls "/api/..." on its own address (localhost:5173) and Vite
    // forwards those requests to the Express backend. Because the browser only ever
    // talks to one address, nothing can block the requests (no CORS problems, no
    // ad-blocker or browser "localhost access" blocking, no IPv6/IPv4 mix-ups).
    proxy: {
      '/api': {
        target: process.env.FLEXI_API_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
