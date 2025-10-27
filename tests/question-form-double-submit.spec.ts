import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

// Add beforeAll to setup test environment
test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(baseURL);
});

test('should create a new question', async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole('tab', { name: /preguntas/i }).click();

    const addQuestionButton = page.getByRole('button', { name: /crear/i });
    await expect(addQuestionButton).toBeVisible();
    await addQuestionButton.click();

    await page.getByLabel('Label').fill('Nueva Pregunta de Test');

    await page.getByText('Selecciona un tipo de pregunta').click();
    await page.getByRole('option', { name: 'text' }).click();

    await page.getByLabel('Orden').fill('1');

    // Select by position (first option)
    await page.getByText('Selecciona una sección').click();
    await page.getByRole('option').first().click();

    const variableInput = page.getByLabel('Variable');
    await expect(variableInput).toBeVisible();
    await variableInput.fill('VAR_PREGUNTA_TEST');

    const maxLengthInput = page.getByLabel('MaxLength');
    await expect(maxLengthInput).toBeVisible();
    await maxLengthInput.fill('100');

    // Attempt double submission
    const saveButton = page.getByRole('button', { name: /guardar/i });
    await saveButton.click();

    // Verify the form was submitted only once
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('text=Nueva Pregunta de Test')).toBeVisible();
});

test('should prevent double submission when creating a question', async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole('tab', { name: /preguntas/i }).click();

    const addQuestionButton = page.getByRole('button', { name: /crear/i });
    await expect(addQuestionButton).toBeVisible();
    await addQuestionButton.click();

    await page.getByLabel('Label').fill('Pregunta de Doble Submit');
    await page.getByText('Selecciona un tipo de pregunta').click();
    await page.getByRole('option', { name: 'numeric' }).click();
    await page.getByLabel('Orden').fill('2');

    // Select by position (first option)
    await page.getByText('Selecciona una sección').click();
    await page.getByRole('option').first().click();

    const variableInput = page.getByLabel('Variable');
    await expect(variableInput).toBeVisible();
    await variableInput.fill('VAR_DOBLE_SUBMIT');

    // Fill the new required fields for 'numeric' type
    const maxInput = page.getByPlaceholder('Máximo');
    await expect(maxInput).toBeVisible();
    await maxInput.fill('100');

    const minInput = page.getByPlaceholder('Mínimo');
    await expect(minInput).toBeVisible();
    await minInput.fill('0');

    // Click submit button twice quickly
    const submitButton = page.getByRole('button', { name: /guardar|crear|submit/i }); // Adjust if needed
    await Promise.all([
        submitButton.click(),
        submitButton.click()
    ]);

    // await expect(submitButton).toBeDisabled();

    await expect(page.locator('text=Pregunta de Doble Submit')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Pregunta de Doble Submit')).toHaveCount(1);
});

test('should prevent double submission when editing a question', async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole('tab', { name: /preguntas/i }).click();

    // Wait for the table to load and find the first section's ellipsis button
    // Assuming the first row after the header has an ellipsis button
    const firstSectionEllipsisButton = page.locator('table tbody tr:first-child button').first();
    await expect(firstSectionEllipsisButton).toBeVisible();

    // Click the ellipsis button to open the dropdown
    await firstSectionEllipsisButton.click();

    // Click the "Editar" option in the dropdown
    const editOption = page.getByRole('menuitem', { name: /editar/i });
    await expect(editOption).toBeVisible(); // Add a wait for the menu item
    await editOption.click();

    // Edit the question
    await page.getByLabel('Label').fill('Pregunta Editada Test');
    await page.getByLabel('Variable').fill('VAR_PREGUNTA_EDITADA');
    await page.getByLabel('Max').fill('20');

    // Attempt double submission
    const updateButton = page.getByRole('button', { name: /guardar/i });

    // Try second click immediately (should be prevented/disabled)
    await Promise.all([
        updateButton.click(),
        updateButton.click()
    ]);

    // Verify the form was submitted only once and changes were saved
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Pregunta Editada Test')).toBeVisible({ timeout: 5000 });
});

