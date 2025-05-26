import { Seccion } from "@/types/seccion";

const API_URL = "https://localhost:7284"

export const getFormById = async (id: number) => {
    return await fetch(`${API_URL}/getformbyid/${id}`)
        .then(async res => {
            if (!res.ok) throw new Error('Hubo un error')
            console.log(res.status)
            return await res.json()
        })
        .then(res => JSON.parse(res.data))
};

export const postFormStructure = async (formStructure: Seccion[]) => {
    // debugger
    const response = await fetch(`${API_URL}/createform`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formStructure)
    })

    if (!response.ok) {
        throw new Error('Fallo el post form')
    }

    return formStructure
};
