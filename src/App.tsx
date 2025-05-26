import './App.css'
import { useFetchForm } from './hooks/useForms'
import { useFormStructureStore } from './store/formStructure'
import Forms from './pages/Forms'
import { useEffect } from 'react'

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
    <>
      {
        jsonFormStructure.length ? <Forms /> : <div>Loading...</div>
      }
    </>
  )
}

export default App
