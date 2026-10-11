## Why

The forms list currently performs ad hoc data loading and can present a failed API request as a valid empty list. Establishing one small vertical slice with explicit configuration, TanStack Query ownership, and distinct request states provides a reliable pattern for later frontend migrations without rewriting the application.

## What Changes

- Load the forms list through a feature-owned TanStack Query hook instead of page-level imperative fetching.
- Centralize the API base URL and shared HTTP error handling used by the forms list.
- Validate or explicitly map the forms-list response at the API boundary before exposing it to UI components.
- Present loading, request failure, empty, and populated states as distinct outcomes.
- Provide a user-triggered retry after a failed list request.
- Split list presentation from route-level data orchestration where this improves component responsibility.
- Add focused verification for the list data flow and its visible states.

## Capabilities

### New Capabilities
- `form-list-retrieval`: Reliable retrieval and presentation of the forms list, including explicit loading, error, retry, empty, and success behavior.

### Modified Capabilities

None.

## Impact

- Affects the frontend forms list page, forms API service boundary, TanStack Query hooks, application API configuration, and focused frontend tests.
- Uses the existing backend forms-list endpoint without changing its route or behavior.
- Uses existing dependencies, including TanStack Query and the current validation/tooling stack; no new runtime dependency is expected.
- Does not change form creation, form detail, version management, builder state, or JSON schema editing.
