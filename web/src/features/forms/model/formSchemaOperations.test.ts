import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { applySchemaCommand, locations } from './formSchemaOperations';
import { parseFormSchema } from './formSchemaValidation';

const fixture = () => parseFormSchema(JSON.parse(readFileSync(new URL('../../../../../contracts/form-schema/v1/examples/complete.json', import.meta.url), 'utf8')));
const empty = { schemaVersion: 1 as const, sections: [] };

it('edits a grouped field in place without deleting it or mutating the original', () => {
  const original = fixture();
  const field = locations(original).find(item => item.node.id === 'nombre')!;
  const node = field.node;
  if (node.type !== 'field') throw new Error('Missing fixture');
  const result = applySchemaCommand(original, { type: 'put', parentId: field.parentId, node: { ...node, label: 'Nuevo nombre' } }, original);
  expect(locations(result).find(item => item.node.id === 'nombre')?.node).toMatchObject({ label: 'Nuevo nombre', order: 1 });
  expect(locations(original).find(item => item.node.id === 'nombre')?.node).toMatchObject({ label: 'Nombres' });
});

it('moves core fields intact between containers and normalizes both orders', () => {
  const original = fixture();
  const result = applySchemaCommand(original, { type: 'move', id: 'nombre', parentId: 'servicios_basicos', index: 0 }, original);
  expect(locations(result).find(item => item.node.id === 'nombre')).toMatchObject({ parentId: 'servicios_basicos', index: 0, node: { variable: 'Nombre', core: true, order: 1 } });
  expect(locations(result).find(item => item.node.id === 'apellido')?.node.order).toBe(1);
});

it('rejects core deletion, variable changes and group nesting', () => {
  const original = fixture();
  expect(() => applySchemaCommand(original, { type: 'remove', id: 'nombre' }, original)).toThrow('esencial');
  const field = locations(original).find(item => item.node.id === 'nombre')!;
  const node = field.node;
  if (node.type !== 'field') throw new Error('Missing fixture');
  expect(() => applySchemaCommand(original, { type: 'put', parentId: field.parentId, node: { ...node, variable: 'Renamed' } }, original)).toThrow('variable');
  expect(() => applySchemaCommand(original, { type: 'move', id: 'datos_personales', parentId: 'datos_personales', index: 0 }, original)).toThrow();
});

it('rejects dangling dependencies even without a persisted core baseline', () => {
  const original = fixture();
  expect(() => applySchemaCommand(original, { type: 'remove', id: 'nivel_educativo' }, empty)).toThrow();
});

it('reorders groups/sections without changing descendant values', () => {
  const original = fixture();
  const reordered = applySchemaCommand(original, { type: 'move', id: 'servicios_basicos', parentId: null, index: 0 }, original);
  expect(reordered.sections.map(section => [section.id, section.order])).toEqual([['servicios_basicos', 1], ['miembros_hogar', 2]]);
  expect(locations(reordered).find(item => item.node.id === 'grado')?.node).toEqual(locations(original).find(item => item.node.id === 'grado')?.node);
});
