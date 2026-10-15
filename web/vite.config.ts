import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          const pkg = (name: string) => id.includes(`/node_modules/${name}/`)
          if (pkg('react') || pkg('react-dom') || pkg('scheduler')) return 'vendor-react'
          if (pkg('@tanstack')) return 'vendor-query'
          if (pkg('@radix-ui') || pkg('radix-ui')) return 'vendor-radix'
          if (pkg('lucide-react')) return 'vendor-icons'
          if (pkg('zod')) return 'vendor-zod'
          if (pkg('react-router')) return 'vendor-router'
          return 'vendor'
        },
      },
    },
  },
})
