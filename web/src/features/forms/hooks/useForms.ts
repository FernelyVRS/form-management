import { useQuery } from "@tanstack/react-query"
import { getForms } from "@/features/forms/api/formsApi"

export const formKeys = {
    all: ['forms'] as const,
    list: () => [...formKeys.all, 'list'] as const,
}

export function useFormsQuery() {
    return useQuery({
        queryKey: formKeys.list(),
        queryFn: ({ signal }) => getForms(signal),
        retry: 1,
    })
}
