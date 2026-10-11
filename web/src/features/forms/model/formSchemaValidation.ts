import { formSchemaDocumentSchema } from './formSchemaSchemas';
import type { DependentSelectNode, FieldNode, FieldOption, FormSchemaDocument } from './formSchema';

export type SchemaIssue = { path: string; code: string; message: string };
const escapePathKey = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');

export class FormSchemaError extends Error {
  constructor(public readonly issues: SchemaIssue[]) {
    super('Invalid form schema');
    this.name = 'FormSchemaError';
  }
}

export function validateFormSchema(input: unknown):
  | { success: true; data: FormSchemaDocument }
  | { success: false; issues: SchemaIssue[] } {
  const parsed = formSchemaDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map(issue => ({
        path: '/' + issue.path.map(key => escapePathKey(String(key))).join('/'), code: 'invalid_shape', message: issue.message,
      })),
    };
  }

  const issues: SchemaIssue[] = [];
  const ids = new Set<string>();
  const fields = new Map<string, { field: FieldNode; path: string }>();
  const dependents: { field: DependentSelectNode; path: string }[] = [];
  const add = (path: string, code: string) => issues.push({ path, code, message: code });
  const checkId = (node: { id: string }, path: string) => {
    if (ids.has(node.id)) add(`${path}/id`, 'duplicate_id');
    ids.add(node.id);
  };
  const checkOrder = (nodes: { order: number }[], path: string) => {
    const orders = new Set(nodes.map(node => node.order));
    nodes.forEach((node, index) => {
      if (orders.size !== nodes.length || node.order > nodes.length) {
        add(`${path}/${index}/order`, 'invalid_order');
      }
    });
  };
  const checkOptions = (list: FieldOption[], path: string) => {
    const values = new Set<string>();
    list.forEach((item, index) => {
      if (values.has(item.value)) add(`${path}/${index}/value`, 'duplicate_option');
      values.add(item.value);
    });
  };
  const visitField = (field: FieldNode, path: string) => {
    checkId(field, path);
    if (fields.has(field.variable)) add(`${path}/variable`, 'duplicate_variable');
    fields.set(field.variable, { field, path });
    if (field.component === 'number' && field.validation?.min !== undefined &&
      field.validation.max !== undefined && field.validation.min > field.validation.max) {
      add(`${path}/validation`, 'invalid_bounds');
    }
    if (field.component === 'select') {
      if ('options' in field) checkOptions(field.options, `${path}/options`);
      else {
        dependents.push({ field, path });
        Object.entries(field.map).forEach(([key, list]) => checkOptions(list, `${path}/map/${escapePathKey(key)}`));
      }
    }
  };

  const document = parsed.data;
  checkOrder(document.sections, '/sections');
  document.sections.forEach((section, index) => {
    const path = `/sections/${index}`;
    checkId(section, path);
    checkOrder(section.items, `${path}/items`);
    section.items.forEach((item, itemIndex) => {
      const itemPath = `${path}/items/${itemIndex}`;
      if (item.type === 'field') visitField(item, itemPath);
      else {
        checkId(item, itemPath);
        checkOrder(item.items, `${itemPath}/items`);
        item.items.forEach((field, fieldIndex) => visitField(field, `${itemPath}/items/${fieldIndex}`));
      }
    });
  });

  dependents.forEach(({ field, path }) => {
    const source = fields.get(field.dependency.field)?.field;
    if (!source || source.component !== 'select') {
      add(`${path}/dependency/field`, 'invalid_dependency');
      return;
    }
    const possibleValues = new Set(('options' in source ? source.options : Object.values(source.map).flat())
      .map(option => option.value));
    Object.keys(field.map).forEach(key => {
      if (!possibleValues.has(key)) add(`${path}/map/${escapePathKey(key)}`, 'invalid_map_key');
    });
  });

  // Each node has at most one outgoing edge. Iterative traversal avoids recursion on long chains.
  const completed = new Set<string>();
  dependents.forEach(({ field, path }) => {
    const chain = new Set<string>();
    let current: FieldNode | undefined = field;
    while (current?.component === 'select' && 'dependency' in current && !completed.has(current.variable)) {
      if (chain.has(current.variable)) {
        add(`${path}/dependency/field`, 'dependency_cycle');
        break;
      }
      chain.add(current.variable);
      current = fields.get(current.dependency.field)?.field;
    }
    chain.forEach(variable => completed.add(variable));
  });

  return issues.length ? { success: false, issues } : { success: true, data: document };
}

export function parseFormSchema(input: unknown): FormSchemaDocument {
  const result = validateFormSchema(input);
  if (!result.success) throw new FormSchemaError(result.issues);
  return result.data;
}

export function serializeFormSchema(input: unknown): string {
  return JSON.stringify(parseFormSchema(input));
}
