export type Field = {
  label: string
  tipo: string
  orden: number
  core: boolean
  id?: string
  variable?: string
}

export type NumberField = Field & {
  min?: number
  max?: number
  range?: number
}

export type TextField = Field & {
  maxLength: number
}

export type SelectField = Field & {
  optiones: []
}

export type SelectDependedField = Field & {
  dependiente: string,
  optiones: {}
}

export type ComposeField = {
  label: string,
  tipo: string,
  orden: number,
  core: boolean,
  preguntasHijas?: [],
  optiones?: []
}

export type Pregunta = NumberField | TextField | SelectField | SelectDependedField | ComposeField



