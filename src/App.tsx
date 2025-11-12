import './styles/App.css'
import { useFetchForm } from './hooks/useForms'
import { useFormStructureStore } from './store/formStructure'
import { useEffect } from 'react'
import { RouterProvider } from "react-router";
import { router } from './router'

function App() {
  // const { mutate, isSuccess } = usePostForm()
  const { data, isSuccess } = useFetchForm()
  const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)
  const jsonFormStructure = useFormStructureStore(store => store.formStructure)


  // useEffect(() => {
  //   if (!jsonFormStructure) {
  //     // mutate()
  //   }
  //   fetchJsonFormStructure
  //   console.log('new ---> ')
  // }, [isLoading, jsonFormStructure])

  useEffect(() => {
    if (data && isSuccess) {
      setJsonFormStructure(data)
    }
  }, [isSuccess])

  return (
    //
    <RouterProvider router={router} />
  )
}

export default App
