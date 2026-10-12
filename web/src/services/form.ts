import type { FormCreated } from "@/types/form";
import { apiUrl } from "@/config/env";
import { z } from "zod";
import { cloneForm } from "@/features/forms/api/formLifecycleApi";

export { getForms } from "@/features/forms/api/formsApi";

export const createForm = async (input: { nombre: string; descripcion?: string }): Promise<FormCreated> => {
    const response = await fetch(`${apiUrl}/forms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: input.nombre, description: input.descripcion ?? null })
    });

    if (!response.ok) {
        throw new Error('Failed to create form');
    }

    const json = await response.json();
    const parsed = z.object({ formId: z.string().min(1), versionId: z.string().min(1), number: z.number().int().positive() }).parse(json);
    return { formId: parsed.formId, versionId: parsed.versionId, numeroVersion: parsed.number };
};

export const createFormFromVersion = async (input: {
    nombre: string;
    descripcion?: string;
    formularioOrigenId: string;
    versionOrigenId: string;
}): Promise<FormCreated> => {
    const created = await cloneForm({
        name: input.nombre,
        description: input.descripcion ?? null,
        sourceFormId: input.formularioOrigenId,
        sourceVersionId: input.versionOrigenId,
    });
    return { formId: created.formId, versionId: created.versionId, numeroVersion: created.number };
};
