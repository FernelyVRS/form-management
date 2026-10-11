import { AlignLeft, Hash, Layers3, LayoutList, ListChecks, GitBranch } from 'lucide-react';
import type { FormSchemaDocument } from '../../model/formSchema';
import { locations, type SchemaNode } from '../../model/formSchemaOperations';

export const nodeTitle = (node: SchemaNode) => node.type === 'section' ? node.title : node.label;
export const nodeLabel = (node: SchemaNode) => node.type === 'section' ? 'Sección' : node.type === 'group' ? 'Grupo' :
  node.component === 'text' ? 'Texto' : node.component === 'number' ? 'Número' : 'dependency' in node ? 'Selección dependiente' : 'Selección';
export const nodeIcon = (node: SchemaNode) => node.type === 'section' ? LayoutList : node.type === 'group' ? Layers3 :
  node.component === 'text' ? AlignLeft : node.component === 'number' ? Hash : 'dependency' in node ? GitBranch : ListChecks;
export const fieldCount = (schema: FormSchemaDocument) => locations(schema).filter(item => item.node.type === 'field').length;
