import { useFetchForm } from '@/hooks/useForms'
import { Seccion } from '@/types/seccion'
import { create } from 'zustand'


type state = {
    formStructure: Seccion[],
    setFormStructure: (FormStructure: Seccion[]) => void,
    fetchFormStructure: (id: number) => void
}

export const useFormStructureStore = create<state>((set) => {
    console.log()
    return {
        formStructure: [],
        setFormStructure: (formStructure) => set({ formStructure }),
        fetchFormStructure: async (id: number) => {
            await useFetchForm(id)
        },
    }
})