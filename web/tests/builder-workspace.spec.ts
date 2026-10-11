import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const schema = JSON.parse(readFileSync(new URL('../../contracts/form-schema/v1/examples/test-form.json', import.meta.url), 'utf8'));
const pageRoute = '/forms/workspace/versions/draft/builder';
const api = 'http://localhost:5165/forms/workspace/versions/draft/schema';
const response = (document: unknown, token = 'AAAAAAAAAAE=') => ({ formId: 'workspace', versionId: 'draft', number: 1,
  status: 'Draft', schema: document, rowVersion: token, updatedAt: null });

async function setup(page: Page, onSave?: (document: unknown) => void) {
  await page.route('http://localhost:5165/forms/workspace', handler => handler.fulfill({ json: {
    id: 'workspace', nombre: 'Formulario de prueba v1', descripcion: null, createdAt: '2026-10-01T12:00:00Z', updatedAt: null,
    versiones: [{ id: 'draft', numeroVersion: 1, estado: 'Draft', rowVersion: 'AAAAAAAAAAE=', createdAt: '2026-10-01T12:00:00Z', updatedAt: null }],
  } }));
  await page.route(api, async handler => {
    if (handler.request().method() === 'PUT') {
      const document = handler.request().postDataJSON().schema;
      onSave?.(document);
      await handler.fulfill({ json: response(document, 'AAAAAAAAAAI=') });
    } else await handler.fulfill({ json: response(schema) });
  });
  await page.goto(pageRoute);
  await expect(page.getByRole('heading', { name: 'Formulario de prueba v1 · v1' })).toBeVisible();
}

test('outline selection is bookmarked and protects unapplied properties', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Seleccionar Nombre', exact: true }).click();
  const properties = page.getByRole('region', { name: 'Propiedades del elemento' });
  await expect(properties.getByLabel('Etiqueta', { exact: true })).toHaveValue('Nombre');
  await properties.getByLabel('Etiqueta', { exact: true }).fill('Nombre modificado');
  await expect(page.getByRole('status', { name: 'Estado de guardado' })).toContainText('Propiedades sin aplicar');
  await page.getByRole('button', { name: 'Seleccionar Edad', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Propiedades sin aplicar' })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(properties.getByLabel('Etiqueta', { exact: true })).toHaveValue('Nombre modificado');
  await page.getByRole('button', { name: 'Seleccionar Edad', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar propiedades', exact: true }).click();
  await expect(properties.getByLabel('Etiqueta', { exact: true })).toHaveValue('Edad');
  await expect(page).toHaveURL(/node=age/);
  expect(JSON.parse(await page.getByTestId('schema-json').textContent() ?? '{}').sections[0].items[0].label).toBe('Nombre');
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page).toHaveURL(/tab=json/);
  await expect(page.getByTestId('schema-json')).toBeVisible();
});

test('dependent options can be edited visually and saved without writing JSON', async ({ page }) => {
  let saved: unknown;
  await setup(page, document => { saved = document; });
  await page.getByRole('button', { name: 'Editar Ciudad', exact: true }).click();
  const paraguay = page.getByRole('group', { name: 'Opciones para Paraguay', exact: true });
  await paraguay.getByLabel('Etiqueta 1', { exact: true }).fill('Asunción centro');
  await paraguay.getByLabel('Valor 1', { exact: true }).fill('asuncion_centro');
  await expect(page.getByLabel('Mapa de opciones (JSON)')).toBeHidden();
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Estado de guardado' })).toContainText('Guardado correctamente');
  const document = saved as { sections: { items: { map?: { py: { label: string; value: string }[] } }[] }[] };
  expect(document.sections[0].items[3].map?.py[0]).toEqual({ label: 'Asunción centro', value: 'asuncion_centro' });
});

test('mobile dialog preserves desktop editor values across breakpoint changes', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Editar Nombre', exact: true }).click();
  await page.getByLabel('Etiqueta', { exact: true }).fill('Nombre pendiente');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('dialog', { name: 'Editar campo', exact: true })).toBeVisible();
  await expect(page.getByLabel('Etiqueta', { exact: true })).toHaveValue('Nombre pendiente');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir editando', exact: true }).click();
  await expect(page.getByLabel('Etiqueta', { exact: true })).toHaveValue('Nombre pendiente');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar propiedades', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('workspace supports search, compact layout, keyboard and responsive captures', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setup(page);
  const search = page.getByRole('textbox', { name: 'Buscar en la estructura' });
  await search.fill('ciudad');
  await expect(page.getByRole('button', { name: 'Seleccionar Nombre', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Seleccionar Ciudad', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Propiedades del elemento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aplicar al borrador' })).toBeInViewport();
  const fieldBox = await page.locator('[data-node-id="name"]').boundingBox();
  expect(fieldBox?.height).toBeLessThan(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.BUILDER_CAPTURE_DIR) await page.screenshot({ path: path.join(process.env.BUILDER_CAPTURE_DIR, 'builder-workspace-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await search.clear();
  await page.getByRole('button', { name: 'Editar Nombre', exact: true }).click();
  await page.getByLabel('Etiqueta', { exact: true }).fill('Nombre actualizado');
  await page.getByRole('button', { name: 'Aplicar al borrador' }).click();
  await page.keyboard.press('Control+s');
  await expect(page.getByRole('status', { name: 'Estado de guardado' })).toContainText('Guardado correctamente');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.BUILDER_CAPTURE_DIR) await page.screenshot({ path: path.join(process.env.BUILDER_CAPTURE_DIR, 'builder-workspace-mobile.png'), fullPage: true });
});

test('mobile read-only structure opens an inspector without editing controls', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageRoute.replace('/builder', '/view'));
  await page.getByRole('button', { name: 'Inspeccionar Nombre', exact: true }).click();
  const inspector = page.getByRole('dialog', { name: 'Propiedades del elemento', exact: true });
  await expect(inspector.getByRole('heading', { name: 'Nombre', exact: true })).toBeVisible();
  await expect(inspector.getByText('Variable externa', { exact: true })).toBeVisible();
  await expect(inspector.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(inspector).toHaveCount(0);
});
