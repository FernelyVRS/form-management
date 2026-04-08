import type { FormWithVersions, Version } from '@/types/form';
import { create } from 'zustand';

type FormMetadataState = {
  forms: FormWithVersions[];
  currentForm: FormWithVersions | null;
  currentVersion: Version | null;

  setForms: (forms: FormWithVersions[]) => void;
  setCurrentForm: (form: FormWithVersions | null) => void;
  setCurrentVersion: (version: Version | null) => void;
  addForm: (form: FormWithVersions) => void;
  updateForm: (formId: string, updates: Partial<FormWithVersions>) => void;
  addVersion: (formId: string, version: Version) => void;
  updateVersion: (formId: string, versionId: string, updates: Partial<Version>) => void;
};

export const useFormMetadataStore = create<FormMetadataState>((set) => ({
  forms: [],
  currentForm: null,
  currentVersion: null,

  setForms: (forms) => set({ forms }),

  setCurrentForm: (form) => set({ currentForm: form }),

  setCurrentVersion: (version) => set({ currentVersion: version }),

  addForm: (form) => set((state) => ({
    forms: [...state.forms, form]
  })),

  updateForm: (formId, updates) => set((state) => ({
    forms: state.forms.map(f =>
      f.id === formId ? { ...f, ...updates } : f
    ),
    currentForm: state.currentForm?.id === formId
      ? { ...state.currentForm, ...updates }
      : state.currentForm
  })),

  addVersion: (formId, version) => set((state) => ({
    forms: state.forms.map(f =>
      f.id === formId
        ? { ...f, versiones: [...f.versiones, version] }
        : f
    ),
    currentForm: state.currentForm?.id === formId
      ? { ...state.currentForm, versiones: [...state.currentForm.versiones, version] }
      : state.currentForm
  })),

  updateVersion: (formId, versionId, updates) => set((state) => ({
    forms: state.forms.map(f =>
      f.id === formId
        ? {
            ...f,
            versiones: f.versiones.map((v: Version) =>
              v.id === versionId ? { ...v, ...updates } : v
            )
          }
        : f
    ),
    currentForm: state.currentForm?.id === formId
      ? {
          ...state.currentForm,
          versiones: state.currentForm.versiones.map((v: Version) =>
            v.id === versionId ? { ...v, ...updates } : v
          )
        }
      : state.currentForm,
    currentVersion: state.currentVersion?.id === versionId
      ? { ...state.currentVersion, ...updates }
      : state.currentVersion
  }))
}));
