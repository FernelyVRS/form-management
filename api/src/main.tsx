import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

const queryclient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryclient}>
    <App />
  </QueryClientProvider>
)
