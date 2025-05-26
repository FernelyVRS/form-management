import { Pregunta } from "./fields"

export type Seccion = {
  id: string,
  titulo: string,
  orden: number,
  restriccion: string,
  entidad: string,
  preguntas: Pregunta[]
}

export type SeccionSinPreguntas = Omit<Seccion, "preguntas">
