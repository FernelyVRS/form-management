export type Field = {
  label: string
  tipo: string
  orden: number
  core?: boolean
  id: string
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
  options: Option[]
  dynamicOptions?: boolean
}

export type SelectDependentField = Field & {
  dependiente: string,
  dependentOptions: DependentOptions
}

export type ComposedField = {
  id: string
  label: string,
  tipo: string,
  orden: number,
  core: boolean,
  preguntasHijas: (NumberField | TextField | SelectField | SelectDependentField)[],
  options: []
}

// export type CheckBoxField = Field

export type FieldConEntity = Field & {
  entidad: string
}

export type Pregunta = NumberField | TextField | SelectField | SelectDependentField | ComposedField

export type PreguntaWithSectionId = Pregunta & { sectionId: string }

export type Option = {
  description: string,
  value: string
}

export type DependentOptions = {
  [key: string]: Option[]
}

export type FieldWithEntity = Field & {
  entidad: string
}



