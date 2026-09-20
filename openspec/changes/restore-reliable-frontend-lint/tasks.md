## 1. Lint Scope

- [x] 1.1 Add a narrowly scoped ESLint ignore for generated `dist/` output while keeping source, tests, and project configuration in scope.

## 2. Source Error Corrections

- [x] 2.1 Correct the `prefer-const` violation in `CreateSection` and remove the active `debugger` from `DeleteSection` without changing section behavior.
- [x] 2.2 Type the `EditSection` form submission with the existing section contract and remove the unused destructured binding in `FormPage` without suppressing rules.

## 3. Verification

- [x] 3.1 Run focused and full frontend lint commands, confirm zero errors, confirm `dist/` is absent from diagnostics, and record the remaining warning baseline.
- [x] 3.2 Run the frontend production build and confirm TypeScript and Vite complete successfully.
