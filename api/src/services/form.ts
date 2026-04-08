import type { Seccion } from "@/types/seccion";
import type { Form, Version, VersionWithEstructura, CreateFormInput, CreateFormFromVersionInput, CreateVersionInput, FormCreated, FormWithVersions } from "@/types/form";

const API_URL = "https://localhost:7284"

export const getForms = async (): Promise<Form[]> => {
    const res = await fetch(`${API_URL}/forms`);
    if (!res.ok) throw new Error('Failed to fetch forms');

    const json = await res.json();
    return json;
};

export const getFormByIdWithVersions = async (id: string): Promise<FormWithVersions> => {
    const res = await fetch(`${API_URL}/forms/${id}`);
    if (!res.ok) throw new Error('Failed to fetch form');

    const json = await res.json();
    return json;
};

export const getVersionEstructura = async (formId: string, versionId: string): Promise<Seccion[]> => {
    const res = await fetch(`${API_URL}/forms/${formId}/versions/${versionId}/estructura`);
    if (!res.ok) throw new Error('Failed to fetch version estructura');

    const json = await res.json();
    return json.data;
};

export const createForm = async (input: CreateFormInput): Promise<FormCreated> => {
    const response = await fetch(`${API_URL}/forms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        throw new Error('Failed to create form');
    }

    const json = await response.json();
    return json.data;
};

export const createFormFromVersion = async (input: CreateFormFromVersionInput): Promise<FormCreated> => {
    const response = await fetch(`${API_URL}/forms/from-version`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        throw new Error('Failed to create form from version');
    }

    const json = await response.json();
    return json.data;
};

export const createVersion = async (input: CreateVersionInput): Promise<Version> => {
    const response = await fetch(`${API_URL}/forms/${input.formularioId}/versions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionOrigenId: input.versionOrigenId })
    });

    if (!response.ok) {
        throw new Error('Failed to create version');
    }

    const json = await response.json();
    return json.data;
};

export const publishVersion = async (formId: string, versionId: string): Promise<Version> => {
    const response = await fetch(`${API_URL}/forms/${formId}/versions/${versionId}/publish`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to publish version');
    }

    const json = await response.json();
    return json.data;
};

export const updateFormStructure = async (formId: string, versionId: string, estructura: Seccion[]): Promise<VersionWithEstructura> => {
    const response = await fetch(`${API_URL}/forms/${formId}/versions/${versionId}/estructura`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estructura })
    });

    if (!response.ok) {
        throw new Error('Failed to update form structure');
    }

    const json = await response.json();
    return json.data;
};
