import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5174';

test.describe.serial('Question Management Tests', () => {
    test.setTimeout(60000);

    // Hook to create a test section before running question tests
    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(baseURL);

        // Create a test section
        await page.getByRole('tab', { name: /secciones/i }).click();
        await page.getByRole('button', { name: /crear/i }).click();
        await page.fill('input[name="titulo"]', 'Test Section Automated');
        await page.fill('input[name="entidad"]', 'Test Entity');
        await page.fill('input[name="restriccion"]', 'Test Restriction');
        await page.fill('input[name="orden"]', '1');
        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify section was created
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Test Section Automated')).toBeVisible();
        await page.close();
    });

    test('should create a text type question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Fill common fields
        await page.getByLabel('Label').fill('Text Question Test');
        await page.getByText('Selecciona un tipo de pregunta').click();
        await page.getByRole('option', { name: 'text' }).click();
        await page.getByLabel('Orden').fill('1');

        // Select section
        await page.getByText('Selecciona una sección').click();
        await page.waitForSelector('[role="listbox"]'); // Wait for dropdown to load
        await page.locator('[role="listbox"] [role="option"]').getByText('Test Section Automated').click();

        // Fill text-specific fields
        await page.getByLabel('Variable').fill('textVar');
        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify question was created
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Text Question Test')).toBeVisible();
    });

    test('should create a select type question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Fill common fields
        await page.getByLabel('Label').fill('Select Question Test');
        await page.getByText('Selecciona un tipo de pregunta').click();
        await page.getByRole('option', { name: 'select' }).click();
        await page.getByLabel('Orden').fill('2');

        // Select section
        await page.getByText('Selecciona una sección').click();
        await page.waitForSelector('[role="listbox"]'); // Wait for dropdown to load
        await page.locator('[role="listbox"] [role="option"]').getByText('Test Section Automated').click();

        // Fill select-specific fields
        await page.getByLabel('Variable').fill('selectVar');

        // Add select options
        await page.getByRole('button', { name: /agregar opción/i }).click();
        await page.fill('input[name="options.0.label"]', 'Option 1');
        await page.fill('input[name="options.0.value"]', '1');

        await page.getByRole('button', { name: /agregar opción/i }).click();
        await page.fill('input[name="options.1.label"]', 'Option 2');
        await page.fill('input[name="options.1.value"]', '2');

        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify question was created
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Select Question Test')).toBeVisible();
    });

    test('should create a number type question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Fill common fields
        await page.getByLabel('Label').fill('Number Question Test');
        await page.getByText('Selecciona un tipo de pregunta').click();
        await page.getByRole('option', { name: 'number' }).click();
        await page.getByLabel('Orden').fill('3');

        // Select section
        await page.getByText('Selecciona una sección').click();
        await page.waitForSelector('[role="listbox"]'); // Wait for dropdown to load
        await page.locator('[role="listbox"] [role="option"]').getByText('Test Section Automated').click();

        // Fill number-specific fields
        await page.getByLabel('Variable').fill('numberVar');
        await page.getByLabel('Valor mínimo').fill('0');
        await page.getByLabel('Valor máximo').fill('100');

        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify question was created
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Number Question Test')).toBeVisible();
    });

    test('should edit a text question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Find and click the edit button for the text question
        const textQuestionRow = page.locator('tr', { has: page.locator('text=Text Question Test') });
        await textQuestionRow.locator('button[aria-label="Open menu"]').click();
        await page.getByRole('menuitem', { name: /editar/i }).click();

        // Edit the question
        await page.getByLabel('Label').fill('Text Question Edited');
        await page.getByLabel('Variable').fill('textVarEdited');
        await page.getByLabel('Orden').fill('4');

        await page.getByRole('button', { name: /guardar|actualizar/i }).click();

        // Verify changes
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Text Question Edited')).toBeVisible();
    });

    test('should edit a select question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Find and click the edit button for the select question
        const selectQuestionRow = page.locator('tr', { has: page.locator('text=Select Question Test') });
        await selectQuestionRow.locator('button[aria-label="Open menu"]').click();
        await page.getByRole('menuitem', { name: /editar/i }).click();

        // Edit the question
        await page.getByLabel('Label').fill('Select Question Edited');
        await page.getByLabel('Variable').fill('selectVarEdited');

        // Edit existing options
        await page.fill('input[name="options.0.label"]', 'Option 1 Edited');
        await page.fill('input[name="options.0.value"]', '1-edit');
        await page.fill('input[name="options.1.label"]', 'Option 2 Edited');
        await page.fill('input[name="options.1.value"]', '2-edit');

        // Add a new option
        await page.getByRole('button', { name: /agregar opción/i }).click();
        await page.fill('input[name="options.2.label"]', 'Option 3');
        await page.fill('input[name="options.2.value"]', '3');

        await page.getByRole('button', { name: /guardar|actualizar/i }).click();

        // Verify changes
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Select Question Edited')).toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Try to submit empty form
        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify validation messages
        await expect(page.locator('text=El label es requerido')).toBeVisible();
        await expect(page.locator('text=El tipo es requerido')).toBeVisible();
        await expect(page.locator('text=La sección es requerida')).toBeVisible();
    });

    test('should validate select type options', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Fill common fields
        await page.getByLabel('Label').fill('Select Validation Test');
        await page.getByText('Selecciona un tipo de pregunta').click();
        await page.getByRole('option', { name: 'select' }).click();
        await page.getByLabel('Orden').fill('5');

        // Select section
        await page.getByText('Selecciona una sección').click();
        await page.getByRole('option', { name: /Test Section Automated/i }).click();

        // Add empty option
        await page.getByRole('button', { name: /agregar opción/i }).click();

        // Try to submit form with empty options
        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify validation messages for options
        await expect(page.locator('text=El label de la opción es requerido')).toBeVisible();
        await expect(page.locator('text=El valor de la opción es requerido')).toBeVisible();
    });

    test('should validate number type limits', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Open create question form
        await page.getByRole('button', { name: /crear/i }).click();

        // Fill common fields
        await page.getByLabel('Label').fill('Number Validation Test');
        await page.getByText('Selecciona un tipo de pregunta').click();
        await page.getByRole('option', { name: 'number' }).click();
        await page.getByLabel('Orden').fill('6');

        // Select section
        await page.getByText('Selecciona una sección').click();
        await page.getByRole('option', { name: /Test Section Automated/i }).click();

        // Set invalid range (max < min)
        await page.getByLabel('Valor mínimo').fill('100');
        await page.getByLabel('Valor máximo').fill('50');

        // Try to submit form
        await page.getByRole('button', { name: /guardar|crear/i }).click();

        // Verify validation message
        await expect(page.locator('text=El valor máximo debe ser mayor que el valor mínimo')).toBeVisible();
    });

    test('should edit a number question', async ({ page }) => {
        await page.goto(baseURL);
        await page.getByRole('tab', { name: /preguntas/i }).click();

        // Find and click the edit button for the number question
        const numberQuestionRow = page.locator('tr', { has: page.locator('text=Number Question Test') });
        await numberQuestionRow.locator('button[aria-label="Open menu"]').click();
        await page.getByRole('menuitem', { name: /editar/i }).click();

        // Edit the question
        await page.getByLabel('Label').fill('Number Question Edited');
        await page.getByLabel('Variable').fill('numberVarEdited');
        await page.getByLabel('Valor mínimo').fill('-10');
        await page.getByLabel('Valor máximo').fill('200');

        await page.getByRole('button', { name: /guardar|actualizar/i }).click();

        // Verify changes
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.locator('text=Number Question Edited')).toBeVisible();
    });
});