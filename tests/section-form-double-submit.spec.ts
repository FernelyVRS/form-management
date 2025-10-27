import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173'; // Define the base URL here

test.describe.serial('Section Form Double Submission', () => {
    test.setTimeout(60000);

    test('should create a new section', async ({ page }) => {
        await page.goto(baseURL);

        // Click on the "Secciones" tab
        await page.getByRole('tab', { name: /secciones/i }).click();

        // Wait for the "Crear" button to be attached and visible
        const addSectionButton = page.getByRole('button', { name: /crear/i });
        await expect(addSectionButton).toBeVisible();

        // Open the section creation dialog
        await addSectionButton.click();

        // Fill out the form fields
        await page.fill('input[name="titulo"]', 'Nueva Sección');
        await page.fill('input[name="entidad"]', 'Test Entidad');
        await page.fill('input[name="restriccion"]', 'Test Restriccion');
        await page.fill('input[name="orden"]', '1');

        // Click the submit button
        const submitButton = page.getByRole('button', { name: /guardar|crear/i });
        await submitButton.click();

        // Check that the new section appears
        const sectionRows = page.locator('text=Nueva Sección');
        await expect(sectionRows).toHaveCount(1);
    });

    test('should not allow double submission when creating a section', async ({ page }) => {
        await page.goto(baseURL);

        // Click on the "Secciones" tab
        await page.getByRole('tab', { name: /secciones/i }).click();

        // Wait for the "Crear" button to be attached and visible
        const addSectionButton = page.getByRole('button', { name: /crear/i });
        await expect(addSectionButton).toBeVisible();

        // Open the section creation dialog
        await addSectionButton.click();

        // Fill out the form fields
        await page.fill('input[name="titulo"]', 'Sección Doble');
        await page.fill('input[name="entidad"]', 'Doble Entidad');
        await page.fill('input[name="restriccion"]', 'Doble Restriccion');
        await page.fill('input[name="orden"]', '3');

        // Try to click the submit button twice quickly
        const submitButton = page.getByRole('button', { name: /guardar|crear/i });
        await Promise.all([
            submitButton.click(),
            submitButton.click()
        ]);

        // Check that only one section was created
        const sectionRows = page.locator('text=Sección Doble');
        await expect(sectionRows).toHaveCount(1);
    });

    test('should not allow double submission when editing a section', async ({ page }) => {
        await page.goto(baseURL);

        // Click on the "Secciones" tab
        await page.getByRole('tab', { name: /secciones/i }).click();

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

        // Wait for the edit dialog to open and fill out all form fields
        const editDialogTitleInput = page.locator('input[name="titulo"]');
        await expect(editDialogTitleInput).toBeVisible();
        await editDialogTitleInput.fill('Edited Section Title');
        await page.fill('input[name="entidad"]', 'Edited Entidad');
        await page.fill('input[name="restriccion"]', 'Edited Restriccion');
        await page.fill('input[name="orden"]', '99');


        // Try to click the submit button twice quickly in the edit dialog
        const submitButton = page.getByRole('button', { name: /guardar|crear/i });
        await Promise.all([
            submitButton.click(),
            submitButton.click()
        ]);

        // Check that the section was updated only once
        const editedSectionRows = page.locator('text=Edited Section Title');
        await expect(editedSectionRows).toHaveCount(1);

        // Optionally, verify other fields if needed
        // const editedEntidad = page.locator('text=Edited Entidad');
        // await expect(editedEntidad).toHaveCount(1);
    });
});
