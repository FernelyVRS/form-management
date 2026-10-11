import { z } from 'zod';

const id = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
const variable = z.string().regex(/^[A-Z][A-Za-z0-9]*$/);
const order = z.number().int().positive();
const option = z.object({ label: z.string().min(1), value: z.string().min(1) }).strict();
const options = z.array(option);
const baseField = {
  id,
  type: z.literal('field'),
  variable,
  label: z.string().min(1),
  description: z.string().optional(),
  order,
  core: z.boolean(),
};

const textField = z.object({
  ...baseField,
  component: z.literal('text'),
  validation: z.object({ maxLength: z.number().int().positive().optional() }).strict().optional(),
}).strict();

const numberField = z.object({
  ...baseField,
  component: z.literal('number'),
  validation: z.object({
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
  }).strict().optional(),
}).strict();

const staticSelect = z.object({
  ...baseField,
  component: z.literal('select'),
  options,
}).strict();

const dependentSelect = z.object({
  ...baseField,
  component: z.literal('select'),
  dependency: z.object({ field: variable }).strict(),
  map: z.record(options),
}).strict();

export const fieldNodeSchema = z.union([textField, numberField, staticSelect, dependentSelect]);

export const groupNodeSchema = z.object({
  id,
  type: z.literal('group'),
  label: z.string().min(1),
  description: z.string().optional(),
  order,
  items: z.array(fieldNodeSchema),
}).strict();

export const sectionNodeSchema = z.object({
  id,
  type: z.literal('section'),
  title: z.string().min(1),
  description: z.string().optional(),
  entity: z.string().min(1),
  order,
  items: z.array(z.union([groupNodeSchema, fieldNodeSchema])),
}).strict();

export const formSchemaDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  sections: z.array(sectionNodeSchema),
}).strict();
