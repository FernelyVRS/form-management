import { Seccion } from "./seccion";

export type VersionEstado = 'borrador' | 'publicada';

export type Version = {
  id: string;
  numero: number;
  estado: VersionEstado;
  createdAt: string;
  updatedAt: string;
};

export type VersionWithEstructura = Version & {
  estructura: Seccion[];
};

export type Form = {
  id: string;
  nombre: string;
  descripcion?: string;
  totalVersiones: number;
  ultimaVersion: number;
  ultimaVersionId: string;
  createdAt: string;
  updatedAt: string;
};

export type FormWithVersions = {
  id: string;
  nombre: string;
  descripcion?: string;
  versiones: Version[];
  createdAt: string;
  updatedAt: string;
};

export type FormCreated = {
  formId: string;
  versionId: string;
  numeroVersion: number;
}

export type CreateFormInput = {
  nombre: string;
  descripcion?: string;
};

export type CreateFormFromVersionInput = {
  nombre: string;
  descripcion?: string;
  formularioOrigenId: string;
  versionOrigenId: string;
};

export type CreateVersionInput = {
  formularioId: string;
  versionOrigenId: string;
};
