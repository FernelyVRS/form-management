import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { parseFormSchema, serializeFormSchema, validateFormSchema } from './formSchemaValidation';

const contractRoot = fileURLToPath(new URL('../../../../../contracts/form-schema/v1/', import.meta.url));
const readJson = (file: string): unknown => JSON.parse(readFileSync(`${contractRoot}${file}`, 'utf8'));
type Change = { path: string; value?: unknown; remove?: boolean };
type Fixture = { name: string; file?: string; structural: boolean; valid: boolean; changes?: Change[] };
const fixtures = readJson('fixtures.json') as Fixture[];
const validator = new Ajv2020({ strict: true }).compile(readJson('form-schema.schema.json') as object);

function materialize(fixture: Fixture): unknown {
  let document = readJson(fixture.file ?? 'examples/complete.json');
  for (const change of fixture.changes ?? []) {
    if (!change.path) { document = change.value; continue; }
    const keys = change.path.slice(1).split('/');
    let parent = document as Record<string, unknown>;
    for (const key of keys.slice(0, -1)) parent = parent[key] as Record<string, unknown>;
    const key = keys[keys.length - 1];
    if (change.remove) delete parent[key];
    else parent[key] = change.value;
  }
  return document;
}

describe('shared form schema v1 contract', () => {
  it.each(fixtures)('$name', fixture => {
    const document = materialize(fixture);
    expect(validator(document), JSON.stringify(validator.errors)).toBe(fixture.structural);
    const result = validateFormSchema(document);
    expect(result.success).toBe(fixture.valid);
    if (result.success) {
      expect(parseFormSchema(JSON.parse(serializeFormSchema(result.data)))).toEqual(document);
    } else {
      expect(result.issues.length).toBeGreaterThan(0);
      result.issues.forEach(issue => {
        expect(issue.path.startsWith('/')).toBe(true);
        expect(issue.code.length).toBeGreaterThan(0);
      });
      expect(() => serializeFormSchema(document)).toThrow();
    }
  });

  it('rejects non-JSON finite number values', () => {
    const document = materialize({ name: 'infinity', structural: false, valid: false,
      changes: [{ path: '/sections/0/items/1/items/2/validation/max', value: Infinity }] });
    expect(validateFormSchema(document).success).toBe(false);
  });
});
