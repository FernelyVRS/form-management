import { expect, test, type Page } from '@playwright/test';

const api = 'http://localhost:5165';

const version = (
  numeroVersion: number,
  estado: 'Draft' | 'Published' | 'Archived',
  id = `v-${estado.toLowerCase()}`,
) => ({
  id,
  numeroVersion,
  estado,
  rowVersion: 'AAAAAAAAAAE=',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
});

const detail = (versiones: ReturnType<typeof version>[], overrides: Record<string, unknown> = {}) => ({
  id: 'form-1',
  nombre: 'Formulario Alpha',
  descripcion: 'Descripción del formulario',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  versiones,
  ...overrides,
});

const lifecycleResponse = (overrides: Record<string, unknown> = {}) => ({
  formId: 'form-1',
  versionId: 'v-new',
  number: 4,
  status: 'Draft',
  derivedFromVersionId: 'v-published',
  rowVersion: 'AAAAAAAAAAE=',
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: null,
  archivedVersionId: null,
  ...overrides,
});

const mockDetail = (page: Page, body: unknown) =>
  page.route(`${api}/forms/form-1`, route => route.fulfill({ json: body }));

test('opens the version modal from the header and lists only Published and Archived sources', async ({ page }) => {
  await mockDetail(page, detail([version(1, 'Published'), version(2, 'Archived')]));

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Nueva versión' }).click();

  await expect(page.getByRole('dialog')).toContainText('Crear Nueva Versión');
  await page.getByLabel('Versión base *').click();
  await expect(page.getByRole('option', { name: 'Versión 1 (publicada)' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Versión 2 (archivada)' })).toBeVisible();
  await expect(page.getByRole('option', { name: /borrador/ })).toHaveCount(0);
});

test('opens the modal from a Published card and excludes the Draft source', async ({ page }) => {
  await mockDetail(page, detail([version(1, 'Draft'), version(2, 'Published')]));

  await page.goto('/forms/form-1');
  await expect(page.getByRole('button', { name: 'Continuar borrador' })).toBeVisible();

  await page.getByRole('button', { name: 'Crear versión' }).click();

  await page.getByLabel('Versión base *').click();
  await expect(page.getByRole('option', { name: 'Versión 2 (publicada)' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Versión 1 (borrador)' })).toHaveCount(0);
});

test('cancelling the publish confirmation sends no request', async ({ page }) => {
  let publishRequests = 0;
  await mockDetail(page, detail([version(1, 'Draft', 'v-draft'), version(2, 'Published')]));

  await page.route(`${api}/forms/form-1/versions/v-draft/publish`, async route => {
    publishRequests += 1;
    await route.fulfill({ json: lifecycleResponse({ versionId: 'v-draft', status: 'Published' }) });
  });

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();

  await expect(page.getByRole('dialog')).toContainText('Publicar versión');
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(publishRequests).toBe(0);
});

test('publishing sends a single request while pending and updates the publication summary', async ({ page }) => {
  let publishRequests = 0;
  let currentDetail: unknown = detail([version(1, 'Draft', 'v-draft')]);

  await page.route(`${api}/forms/form-1`, route => route.fulfill({ json: currentDetail }));
  await page.route(`${api}/forms/form-1/versions/v-draft/publish`, async route => {
    publishRequests += 1;
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({
      json: lifecycleResponse({ versionId: 'v-draft', status: 'Published', archivedVersionId: null }),
    });
  });

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  currentDetail = detail([version(1, 'Published', 'v-draft')]);
  await page.getByRole('button', { name: 'Confirmar publicación' }).click();

  await expect(page.getByRole('button', { name: 'Publicando…' })).toBeDisabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('v1')).toBeVisible();
  expect(publishRequests).toBe(1);
});

test('conflict recovery shows an actionable message and refreshes authoritative state', async ({ page }) => {
  let detailRequests = 0;
  let publishRequests = 0;

  await page.route(`${api}/forms/form-1`, route => {
    detailRequests += 1;
    route.fulfill({ json: detail([version(1, 'Draft', 'v-draft'), version(2, 'Published')]) });
  });
  await page.route(`${api}/forms/form-1/versions/v-draft/publish`, route => {
    publishRequests += 1;
    route.fulfill({
      status: 409,
      json: { title: 'Conflict', status: 409, code: 'version_conflict' },
    });
  });

  await page.goto('/forms/form-1');
  const requestsAfterLoad = detailRequests;

  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar publicación' }).click();

  await expect(page.getByRole('dialog')).toContainText('cambió desde otra sesión');
  expect(publishRequests).toBe(1);
  await expect.poll(() => detailRequests).toBeGreaterThan(requestsAfterLoad);
});

test('continue-draft navigates to the draft builder', async ({ page }) => {
  await mockDetail(page, detail([version(1, 'Draft', 'v-draft'), version(2, 'Published')]));
  await page.route(`${api}/forms/form-1/versions/v-draft/schema`, route =>
    route.fulfill({
      json: {
        formId: 'form-1',
        versionId: 'v-draft',
        number: 1,
        status: 'Draft',
        schema: { schemaVersion: 1, sections: [] },
        rowVersion: 'AAAAAAAAAAE=',
        updatedAt: null,
      },
    }),
  );

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Continuar borrador' }).click();

  await expect(page).toHaveURL(/\/forms\/form-1\/versions\/v-draft\/builder$/);
});

test('clone error preserves the form name input', async ({ page }) => {
  await mockDetail(page, detail([version(1, 'Published')]));

  await page.route(`${api}/forms/from-version`, route =>
    route.fulfill({
      status: 404,
      json: { title: 'Not Found', status: 404, code: 'form_not_found' },
    }),
  );

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Clonar formulario' }).click();

  await page.getByLabel('Nombre *').fill('Copia con error');
  await page.getByRole('dialog').getByRole('button', { name: 'Clonar formulario', exact: true }).click();

  await expect(page.getByRole('dialog')).toContainText('ya no existe');
  await expect(page.getByLabel('Nombre *')).toHaveValue('Copia con error');
});

test('clone success navigates to the new form using response identifiers', async ({ page }) => {
  await mockDetail(page, detail([version(1, 'Published')]));

  await page.route(`${api}/forms/from-version`, route =>
    route.fulfill({ json: lifecycleResponse({ formId: 'form-new', versionId: 'v-clone', number: 1 }) }),
  );
  await page.route(`${api}/forms/form-new`, route =>
    route.fulfill({ json: detail([version(1, 'Draft', 'v-clone')], { id: 'form-new', nombre: 'Copia con error' }) }),
  );

  await page.goto('/forms/form-1');
  await page.getByRole('button', { name: 'Clonar formulario' }).click();

  await page.getByLabel('Nombre *').fill('Copia con error');
  await page.getByRole('dialog').getByRole('button', { name: 'Clonar formulario', exact: true }).click();

  await expect(page).toHaveURL(/\/forms\/form-new$/);
  await expect(page.getByText('Copia con error')).toBeVisible();
});
