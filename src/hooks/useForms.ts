import { getFormById, postFormStructure } from "@/services/form"
import { useFormStructureStore } from "@/store/formStructure"
import { useMutation, useQuery } from "@tanstack/react-query"
import formStructure from '@/mocks/formStructure.json'
import { Seccion } from "@/types/seccion"

export function usePostForm() {
    const setFormStructure = useFormStructureStore(store => store.setFormStructure)
    const form = formStructure

    return useMutation({
        mutationFn: async () => await postFormStructure(form),
        onSuccess: (createdFormStructure: Seccion[]) => {
            setFormStructure(createdFormStructure)
        }
    })
}

export function useFetchForm(id: number = 1) {
    const query = useQuery<Seccion[], Error>({
        queryKey: ['form'],
        queryFn: async () => {
            // const data: Seccion[] = await getFormById(id);
            const data: Seccion[] = formStructure as Seccion[];
            return data;
        },
        gcTime: 0, // optional, avoids caching
        retry: false,
    });

    return query;
}