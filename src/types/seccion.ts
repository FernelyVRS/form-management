import { ComposeField, NumberField, SelectDependedField, SelectField, TextField } from "./fields"

export type Seccion = {
  titulo: string,
  orden: number,
  restriccion: string,
  entidad: string,
  preguntas: NumberField[] | TextField[] | SelectField[] | SelectDependedField[] | ComposeField[]
}

export type SeccionSinPreguntas = Omit<Seccion, "preguntas">
