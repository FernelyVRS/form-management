import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const complete = JSON.parse(readFileSync(new URL('../../contracts/form-schema/v1/examples/complete.json', import.meta.url), 'utf8'));
const route = '/forms/form/versions/version/builder';
const api = 'http://localhost:5165/forms/form/versions/version/schema';
const response = (schema: unknown, status = 'Draft', rowVersion = 'AAAAAAAAAAE=') => ({ formId: 'form', versionId: 'version', number: 1, status, schema, rowVersion, updatedAt: null });

async function createSection(page: Page) {
  await page.getByRole('button', { name: 'Crear sección', exact: true }).click();
  await page.getByLabel('ID técnico').fill('section');
  await page.getByLabel('Título', { exact: true }).fill('Sección nueva');
  await page.getByLabel('Entidad').fill('Hogar');
  await page.getByLabel('Descripción', { exact: true }).fill('Descripción de sección');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
}

test('creates a section, group, constrained field; saves once and reads it back', async ({ page }) => {
  let schema: unknown = { schemaVersion: 1, sections: [] };
  let puts = 0;
  await page.route(api, async handler => {
    if (handler.request().method() === 'PUT') {
      const body = handler.request().postDataJSON();
      expect(Object.keys(body).sort()).toEqual(['rowVersion', 'schema']);
      expect(body.rowVersion).toBe('AAAAAAAAAAE=');
      schema = body.schema; puts += 1;
      await handler.fulfill({ json: response(schema, 'Draft', 'AAAAAAAAAAI=') });
    } else await handler.fulfill({ json: response(schema, 'Draft', puts ? 'AAAAAAAAAAI=' : 'AAAAAAAAAAE=') });
  });
  await page.goto(route);
  await expect(page.getByText('Sin secciones', { exact: true })).toBeVisible();
  await createSection(page);
  await expect(page.locator('[data-node-id="section"]').getByText('Descripción de sección', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Crear grupo en Sección nueva', exact: true }).click();
  await page.getByLabel('ID técnico').fill('group');
  await page.getByLabel('Etiqueta', { exact: true }).fill('Grupo nuevo');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Crear campo en Grupo nuevo', exact: true }).click();
  await page.getByLabel('ID técnico').fill('field');
  await page.getByLabel('Etiqueta', { exact: true }).fill('Campo nuevo');
  await page.getByLabel('Variable externa').fill('CampoNuevo');
  await page.getByLabel('Descripción', { exact: true }).fill('Ayuda del campo');
  await page.getByLabel('Longitud máxima').fill('30');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  expect(puts).toBe(0);
  await page.getByRole('button', { name: 'Ayuda sobre Campo nuevo' }).focus();
  await expect(page.getByRole('tooltip')).toContainText('Ayuda del campo');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Ayuda sobre Campo nuevo' }).click();
  await expect(page.getByRole('tooltip')).toContainText('Ayuda del campo');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Guardado correctamente', { exact: true })).toBeVisible();
  expect(puts).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Editar Campo nuevo', exact: true })).toBeVisible();
  expect(schema).toMatchObject({ schemaVersion: 1, sections: [{ title: 'Sección nueva', description: 'Descripción de sección', items: [
    { type: 'group', items: [{ variable: 'CampoNuevo', description: 'Ayuda del campo', validation: { maxLength: 30 }, order: 1 }] },
  ] }] });
});

test('preserves core fields, moves fields, edits dependencies and normalizes order', async ({ page }) => {
  let saved: unknown;
  await page.route(api, async handler => {
    if (handler.request().method() === 'PUT') { saved = handler.request().postDataJSON().schema; await handler.fulfill({ json: response(saved, 'Draft', 'AAAAAAAAAAI=') }); }
    else await handler.fulfill({ json: response(complete) });
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Eliminar Nombres', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar eliminación' }).click();
  await expect(page.getByRole('alert')).toContainText('esencial');
  await expect(page.getByRole('button', { name: 'Editar Nombres', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar Nombres', exact: true }).click();
  await expect(page.getByLabel('Variable externa')).toHaveAttribute('readonly', '');
  await page.getByLabel('Contenedor').selectOption('servicios_basicos');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Editar Grado', exact: true }).click();
  await page.getByText('JSON avanzado del mapa', { exact: true }).click();
  await page.getByLabel('Mapa de opciones (JSON)').fill('{"999":[]}');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await expect(page.getByRole('region', { name: 'Propiedades del elemento' }).getByRole('alert')).toContainText('opciones del origen');
  await page.getByLabel('Mapa de opciones (JSON)').fill('{"1":[{"label":"Primero actualizado","value":"1"}]}');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Subir Nombres', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Guardado correctamente', { exact: true })).toBeVisible();
  const submitted = saved as { sections: { items: Record<string, unknown>[] }[] };
  expect(submitted.sections[0].items[0]).toMatchObject({ map: { '1': [{ label: 'Primero actualizado', value: '1' }] } });
  expect(submitted.sections[1].items).toMatchObject([{ order: 1 }, { id: 'nombre', order: 2, variable: 'Nombre', core: true }, { order: 3 }]);
});

test('conflict preserves dirty content and reload/discard is explicit', async ({ page }) => {
  await page.route(api, handler => handler.fulfill(handler.request().method() === 'PUT'
    ? { status: 409, json: { code: 'schema_conflict' } } : { json: response({ schemaVersion: 1, sections: [] }) }));
  await page.goto(route);
  await createSection(page);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Conflicto de guardado');
  await expect(page.getByRole('button', { name: 'Editar Sección nueva', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Recargar', exact: true }).click();
  await page.getByRole('button', { name: 'Conservar cambios' }).click();
  await expect(page.getByRole('button', { name: 'Editar Sección nueva', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recargar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar y recargar' }).click();
  await expect(page.getByText('Sin secciones', { exact: true })).toBeVisible();
});

test('dirty navigation can be cancelled or explicitly confirmed', async ({ page }) => {
  await page.route(api, handler => handler.fulfill({ json: response({ schemaVersion: 1, sections: [] }) }));
  await page.goto(route);
  await createSection(page);
  await page.getByRole('link', { name: 'Volver al formulario' }).click();
  await expect(page.getByRole('dialog')).toContainText('Cambios sin guardar');
  await page.getByRole('button', { name: 'Permanecer' }).click();
  await expect(page).toHaveURL(new RegExp(route + '(?:\\?.*)?$'));
  await page.getByRole('link', { name: 'Volver al formulario' }).click();
  await page.getByRole('button', { name: 'Descartar y salir' }).click();
  await expect(page).toHaveURL(/\/forms\/form$/);
});

test('invalid load is visible and retry recovers without a mock fallback', async ({ page }) => {
  let valid = false;
  await page.route(api, handler => handler.fulfill({ json: valid ? response(complete) : response([]) }));
  await page.goto(route);
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar la estructura');
  valid = true;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('button', { name: 'Editar Datos personales', exact: true })).toBeVisible();
});

test('published builder and view routes never expose editing actions', async ({ page }) => {
  await page.route(api, handler => handler.fulfill({ json: response(complete, 'Published') }));
  await page.goto(route);
  await expect(page.getByRole('alert')).toContainText('Solo lectura');
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Editar / })).toHaveCount(0);
  await page.goto(route.replace('/builder', '/view'));
  await expect(page.getByRole('alert')).toContainText('Solo lectura');
  await expect(page.getByRole('button', { name: 'Inspeccionar Datos personales', exact: true })).toBeVisible();
});

test('number constraints and static select rows are edited without accidental submission', async ({ page }) => {
  let puts = 0;
  await page.route(api, handler => { if (handler.request().method() === 'PUT') puts++; return handler.fulfill({ json: response({ schemaVersion: 1, sections: [] }) }); });
  await page.goto(route);
  await createSection(page);
  await page.getByRole('button', { name: 'Crear campo en Sección nueva', exact: true }).click();
  await page.getByLabel('ID técnico').fill('number');
  await page.getByLabel('Etiqueta', { exact: true }).fill('Número nuevo');
  await page.getByLabel('Variable externa').fill('NumeroNuevo');
  await page.getByLabel('Componente', { exact: true }).selectOption('number');
  await page.getByLabel('Mínimo', { exact: true }).fill('10');
  await page.getByLabel('Máximo', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await expect(page.getByRole('region', { name: 'Propiedades del elemento' }).getByRole('alert')).toContainText('mínimo');
  await page.getByLabel('Máximo', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Crear campo en Sección nueva', exact: true }).click();
  await page.getByLabel('ID técnico').fill('select');
  await page.getByLabel('Etiqueta', { exact: true }).fill('Selección nueva');
  await page.getByLabel('Variable externa').fill('SeleccionNueva');
  await page.getByLabel('Componente', { exact: true }).selectOption('select');
  await page.getByRole('button', { name: 'Agregar opción' }).click();
  await page.getByLabel('Etiqueta opción 1', { exact: true }).fill('Sí');
  await page.getByLabel('Valor opción 1', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Agregar opción' }).click();
  await page.getByRole('button', { name: 'Eliminar opción 2', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Propiedades del elemento' })).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Eliminar Número nuevo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar eliminación' }).click();
  await expect(page.getByText('Número nuevo', { exact: true })).toHaveCount(0);
  const schema = JSON.parse(await page.getByTestId('schema-json').textContent() ?? '{}');
  expect(schema.sections[0].items).toMatchObject([{ component: 'select', order: 1, options: [{ label: 'Sí', value: '1' }] }]);
  expect(puts).toBe(0);
});

test('network and server validation errors preserve draft and pending disables editing', async ({ page }) => {
  let attempts = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(api, async handler => {
    if (handler.request().method() !== 'PUT') { await handler.fulfill({ json: response({ schemaVersion: 1, sections: [] }) }); return; }
    attempts++;
    if (attempts === 1) { await pending; await handler.abort('failed'); }
    else if (attempts === 2) await handler.fulfill({ status: 422, json: { code: 'invalid_schema', issues: [{ path: '/sections/0', message: 'Validación servidor' }] } });
    else await handler.fulfill({ json: response(handler.request().postDataJSON().schema, 'Draft', 'AAAAAAAAAAI=') });
  });
  await page.goto(route);
  await createSection(page);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardando…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Crear sección', exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole('alert')).toContainText('No se pudo conectar con la API');
  await expect(page.getByRole('button', { name: 'Editar Sección nueva', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('/sections/0: Validación servidor');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Guardado correctamente', { exact: true })).toBeVisible();
  expect(attempts).toBe(3);
});

test('pointer drag reorders sections locally without sending PUT', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  let puts = 0;
  await page.route(api, handler => { if (handler.request().method() === 'PUT') puts++; return handler.fulfill({ json: response({ schemaVersion: 1, sections: [
    { id: 'first', type: 'section', title: 'Primera', entity: 'Hogar', order: 1, items: [] },
    { id: 'second', type: 'section', title: 'Segunda', entity: 'Hogar', order: 2, items: [] },
  ] }) }); });
  await page.goto(route);
  const handle = page.getByRole('button', { name: 'Arrastrar Segunda', exact: true });
  await expect(handle).toBeVisible();
  const source = (await handle.boundingBox())!;
  const target = (await page.getByTestId('drop-root-0').boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2 - 15, { steps: 5 });
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect.poll(async () => JSON.parse(await page.getByTestId('schema-json').textContent() ?? '{}').sections[0].id).toBe('second');
  expect(puts).toBe(0);
});

test('detail maps backend version numbers and opens Draft in the canonical builder', async ({ page }) => {
  await page.route('http://localhost:5165/forms/form', handler => handler.fulfill({ json: {
    id: 'form', nombre: 'Formulario detalle', descripcion: null, createdAt: '2026-10-01T12:00:00Z', updatedAt: null,
    versiones: [{ id: 'version', numeroVersion: 3, estado: 'Draft', rowVersion: 'AAAAAAAAAAE=', createdAt: '2026-10-01T12:00:00Z', updatedAt: null }],
  } }));
  await page.route(api, handler => handler.fulfill({ json: { ...response({ schemaVersion: 1, sections: [] }), number: 3 } }));
  await page.goto('/forms/form');
  await expect(page.getByText('Versión 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(route + '$'));
  await expect(page.getByRole('heading', { name: 'Formulario detalle · v3' })).toBeVisible();
});

test('direct creation response navigates to the new empty builder', async ({ page }) => {
  await page.route('http://localhost:5165/forms', handler => handler.fulfill({ status: 201, json: { formId: 'form', versionId: 'version', numeroVersion: 1 } }));
  await page.route(api, handler => handler.fulfill({ json: response({ schemaVersion: 1, sections: [] }) }));
  await page.goto('/forms/create');
  await page.getByLabel('Nombre *', { exact: true }).fill('Nuevo formulario');
  await page.getByRole('button', { name: 'Crear Formulario', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(route + '$'));
  await expect(page.getByText('Sin secciones', { exact: true })).toBeVisible();
});

test('live existing version is read without altering development data', async ({ page, request }) => {
  test.skip(!process.env.FORM_SCHEMA_LIVE_SMOKE, 'Opt in to read-only smoke test against the local API.');
  const formsResponse = await request.get('http://localhost:5165/forms');
  expect(formsResponse.ok()).toBe(true);
  const forms = await formsResponse.json();
  expect(forms.length).toBeGreaterThan(0);
  const { id, ultimaVersionId } = forms[0];
  const schemaResponse = await request.get(`http://localhost:5165/forms/${id}/versions/${ultimaVersionId}/schema`);
  expect(schemaResponse.ok()).toBe(true);
  const current = await schemaResponse.json();
  await page.goto(`/forms/${id}/versions/${ultimaVersionId}/builder`);
  await expect(page.getByRole('heading', { name: `${forms[0].nombre} · v${current.number}` })).toBeVisible();
  expect(JSON.parse(await page.getByTestId('schema-json').textContent() ?? '{}')).toEqual(current.schema);
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
});
