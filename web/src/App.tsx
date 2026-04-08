import './styles/App.css'
import { useFetchForm } from '@/features/forms/hooks/useForms'
import { useFormStructureStore } from './store/formStructure'
import { useEffect } from 'react'
import { RouterProvider } from "react-router";
import { router } from './router'

function App() {
  const { data, isSuccess } = useFetchForm()
  const { setFormStructure } = useFormStructureStore()

  useEffect(() => {
    if (data && isSuccess) {
      setFormStructure(data)
    }
  }, [data, isSuccess, setFormStructure])

  return (
    <RouterProvider router={router} />
  )
}

export default App
