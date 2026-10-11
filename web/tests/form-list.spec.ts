import { expect, test } from '@playwright/test';

const form = {
  id: 'form-1',
  nombre: 'Formulario Alpha',
  descripcion: 'Primer formulario',
  createdAt: '2026-09-20T12:00:00',
  updatedAt: null,
  totalVersiones: 1,
  ultimaVersion: 1,
  ultimaVersionId: 'version-1',
};

test('shows loading, loaded forms, filtering, and detail navigation', async ({ page }) => {
  await page.route('http://localhost:5165/forms', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      json: [form, { ...form, id: 'form-2', nombre: 'Formulario Beta' }],
    });
  });

  await page.goto('/forms');
  await expect(page.getByRole('status')).toContainText('Cargando formularios');
  await expect(page.getByText('Formulario Alpha')).toBeVisible();
  await expect(page.getByText('Formulario Beta')).toBeVisible();

  await page.getByPlaceholder('Buscar formularios...').fill('Beta');
  await expect(page.getByText('Formulario Alpha')).toBeHidden();
  await expect(page.getByText('Formulario Beta')).toBeVisible();

  await page.getByPlaceholder('Buscar formularios...').clear();
  await page.getByText('Formulario Alpha').click();
  await expect(page).toHaveURL(/\/forms\/form-1$/);
});

test('shows the empty state only after a successful empty response', async ({ page }) => {
  await page.route('http://localhost:5165/forms', (route) => route.fulfill({ json: [] }));

  await page.goto('/forms');

  await expect(page.getByText('No hay formularios todavía')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('rejects an invalid forms response', async ({ page }) => {
  await page.route('http://localhost:5165/forms', (route) => route.fulfill({ json: [{ id: 'incomplete' }] }));

  await page.goto('/forms');

  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar los formularios');
  await expect(page.getByText('No hay formularios todavía')).toHaveCount(0);
});

test('retries a failed request without reloading the page', async ({ page }) => {
  let attempts = 0;

  await page.route('http://localhost:5165/forms', async (route) => {
    attempts += 1;

    if (attempts <= 2) {
      await route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      return;
    }

    await route.fulfill({ json: [form] });
  });

  await page.goto('/forms');
  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar los formularios');

  await page.getByRole('button', { name: 'Reintentar' }).click();

  await expect(page.getByText('Formulario Alpha')).toBeVisible();
  expect(attempts).toBe(3);
});
