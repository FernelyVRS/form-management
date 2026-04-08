import { Seccion } from '@/types/seccion'
import { create } from 'zustand'

type state = {
    formStructure: Seccion[],
    setFormStructure: (formStructure: Seccion[]) => void
}

export const useFormStructureStore = create<state>((set) => ({
    formStructure: [],
    setFormStructure: (formStructure) => set({ formStructure })
}))