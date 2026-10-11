## 1. Contract And Configuration

- [x] 1.1 Inspect the live forms-list response and confirm the exact fields and nullability required by the list UI without changing the backend endpoint.
- [x] 1.2 Add centralized `VITE_API_URL` resolution with the documented local HTTP origin in development and a production-safe missing-value failure.
- [x] 1.3 Document the frontend API environment variable in the relevant example or development documentation.

## 2. HTTP And Forms API Boundary

- [x] 2.1 Add a minimal shared JSON request helper that forwards `AbortSignal` and normalizes non-success responses as a typed API error.
- [x] 2.2 Add the forms-list response schema and mapping at the forms feature API boundary using the verified direct-array contract.
- [x] 2.3 Implement the forms-list API function with the centralized origin and request helper, then remove only the superseded list request export when it has no consumers.

## 3. TanStack Query Integration

- [x] 3.1 Define a stable forms-list query key and migrate the existing forms hook from mock retrieval to the forms API function.
- [x] 3.2 Forward the query cancellation signal and configure a small explicit automatic retry policy while retaining manual refetch support.
- [x] 3.3 Confirm forms-list server data is not copied into Zustand or initialized from the application-level form-structure mock.

## 4. Forms List UI

- [x] 4.1 Refactor `FormListPage` to consume the query hook and render distinct loading, error, empty-success, and populated-success states.
- [x] 4.2 Add a retry action to the error state and ensure a successful retry replaces the error with the correct success state.
- [x] 4.3 Preserve the existing list filtering and form-detail navigation behavior, extracting list presentation only where it creates a clear component boundary.
- [x] 4.4 Confirm list retrieval neither parses nor mutates form `SchemaJson`, including schemas containing `dependencia` or dynamic `map` data.

## 5. Verification

- [x] 5.1 Add deterministic coverage for valid, invalid, empty, and failed forms-list responses and the manual retry flow using the existing frontend test tooling.
- [x] 5.2 Verify filtering and form-detail navigation after a populated response.
- [x] 5.3 Run frontend lint and production build, resolving regressions introduced by this change without altering unrelated warnings or worktree changes.
- [x] 5.4 Run the relevant Playwright tests and record any test-infrastructure limitation that prevents execution.
