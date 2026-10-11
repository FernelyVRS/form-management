import type { z } from 'zod';
import type { fieldNodeSchema, formSchemaDocumentSchema, groupNodeSchema, sectionNodeSchema } from './formSchemaSchemas';

export type FormSchemaDocument = z.infer<typeof formSchemaDocumentSchema>;
export type SectionNode = z.infer<typeof sectionNodeSchema>;
export type GroupNode = z.infer<typeof groupNodeSchema>;
export type FieldNode = z.infer<typeof fieldNodeSchema>;
export type TextFieldNode = Extract<FieldNode, { component: 'text' }>;
export type NumberFieldNode = Extract<FieldNode, { component: 'number' }>;
export type SelectFieldNode = Extract<FieldNode, { component: 'select' }>;
export type DependentSelectNode = Extract<SelectFieldNode, { dependency: unknown }>;
export type FormItem = GroupNode | FieldNode;
export type FieldOption = { label: string; value: string };
export type FieldDependency = { field: string };
