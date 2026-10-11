import type { FieldNode, FormItem, FormSchemaDocument, GroupNode, SectionNode } from './formSchema';
import { parseFormSchema } from './formSchemaValidation';

export type SchemaNode = SectionNode | FormItem;
export type NodeLocation = { node: SchemaNode; parentId: string | null; index: number };

export function locations(document: FormSchemaDocument): NodeLocation[] {
  return document.sections.flatMap((section, index) => [
    { node: section, parentId: null, index },
    ...section.items.flatMap((item, itemIndex) => [
      { node: item, parentId: section.id, index: itemIndex },
      ...(item.type === 'group' ? item.items.map((field, fieldIndex) => ({ node: field, parentId: item.id, index: fieldIndex })) : []),
    ]),
  ]);
}

export function normalizeSchema(document: FormSchemaDocument): FormSchemaDocument {
  return { schemaVersion: 1, sections: document.sections.map((section, index) => ({ ...section, order: index + 1,
    items: section.items.map((item, itemIndex) => item.type === 'field' ? { ...item, order: itemIndex + 1 } :
      { ...item, order: itemIndex + 1, items: item.items.map((field, fieldIndex) => ({ ...field, order: fieldIndex + 1 })) }),
  })) };
}

export function protectBaseline(document: FormSchemaDocument, baseline: FormSchemaDocument): void {
  const fields = new Map(locations(document).filter(item => item.node.type === 'field').map(item => [item.node.id, item.node as FieldNode]));
  for (const { node } of locations(baseline)) {
    if (node.type !== 'field') continue;
    const retained = fields.get(node.id);
    if (retained && retained.variable !== node.variable) throw new Error(`La variable ${node.variable} no puede cambiar.`);
    if (node.core && (!retained || !retained.core)) throw new Error(`El campo esencial ${node.label} debe conservarse.`);
  }
}

function container(document: FormSchemaDocument, parentId: string | null): SchemaNode[] {
  if (parentId === null) return document.sections;
  const parent = locations(document).find(item => item.node.id === parentId)?.node;
  if (!parent || parent.type === 'field') throw new Error('Contenedor no encontrado.');
  return parent.items;
}

function insert(document: FormSchemaDocument, node: SchemaNode, parentId: string | null, index: number) {
  const parent = parentId === null ? null : locations(document).find(item => item.node.id === parentId)?.node;
  if (node.type === 'section' ? parentId !== null : parentId === null || !parent || parent.type === 'field')
    throw new Error('Destino incompatible con el elemento.');
  if (node.type === 'group' && parent?.type !== 'section') throw new Error('Un grupo solo puede estar dentro de una sección.');
  const list = container(document, parentId);
  list.splice(Math.max(0, Math.min(index, list.length)), 0, node);
}

export type SchemaCommand =
  | { type: 'put'; node: SchemaNode; parentId: string | null }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; parentId: string | null; index: number };

export function applySchemaCommand(document: FormSchemaDocument, command: SchemaCommand, baseline: FormSchemaDocument): FormSchemaDocument {
  // normalize creates fresh containers; only those local arrays are mutated.
  const draft = normalizeSchema(document);
  const id = command.type === 'put' ? command.node.id : command.id;
  const original = locations(draft).find(item => item.node.id === id);
  if (command.type === 'remove') {
    if (!original) throw new Error('Elemento no encontrado.');
    container(draft, original.parentId).splice(original.index, 1);
  } else if (command.type === 'move') {
    if (!original) throw new Error('Elemento no encontrado.');
    if (id === command.parentId) throw new Error('No puedes mover un elemento dentro de sí mismo.');
    container(draft, original.parentId).splice(original.index, 1);
    insert(draft, original.node, command.parentId, command.index);
  } else {
    if (original && original.node.type !== command.node.type) throw new Error('No se puede cambiar la clase del elemento.');
    if (original) container(draft, original.parentId).splice(original.index, 1);
    insert(draft, command.node, command.parentId,
      original?.parentId === command.parentId ? original.index : container(draft, command.parentId).length);
  }
  const result = parseFormSchema(normalizeSchema(draft));
  protectBaseline(result, baseline);
  return result;
}

export function orderedSchema(document: FormSchemaDocument): FormSchemaDocument {
  return normalizeSchema({ ...document, sections: [...document.sections].sort((a, b) => a.order - b.order).map(section => ({
    ...section, items: [...section.items].sort((a, b) => a.order - b.order).map(item => item.type === 'field' ? item : {
      ...item, items: [...item.items].sort((a, b) => a.order - b.order),
    } as GroupNode),
  })) });
}
