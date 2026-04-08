import { useFormStructureStore } from "@/store/formStructure"
import { useMutation, useQuery } from "@tanstack/react-query"
import formStructure from '@/mocks/formStructure.json'
import type { Seccion } from "@/types/seccion"

export function usePostForm() {
    const setFormStructure = useFormStructureStore(store => store.setFormStructure)
    const form = formStructure

    return useMutation({
        mutationFn: async () => {
            return form as Seccion[];
        },
        onSuccess: (createdFormStructure: Seccion[]) => {
            setFormStructure(createdFormStructure)
        }
    })
}

export function useFetchForm(id: number = 1) {
    return useQuery<Seccion[], Error>({
        queryKey: ['form', id],
        queryFn: async () => {
            const data: Seccion[] = formStructure as Seccion[];
            return data;
        },
        retry: false,
    });
}