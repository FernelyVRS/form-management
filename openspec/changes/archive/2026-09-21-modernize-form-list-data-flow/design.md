## Context

`FormListPage` currently owns request execution, response state, and list presentation. The application already provides TanStack Query, but the forms hook reads mock data rather than the backend, while the page performs the real request imperatively. API origin configuration is also embedded in the forms service, and request failures can be rendered as a normal empty list.

This change establishes the first production API vertical slice under the existing forms feature. It must coexist with the current detail, creation, version, and builder flows until those flows are migrated separately.

## Goals / Non-Goals

**Goals:**

- Make TanStack Query the owner of forms-list server state.
- Put API origin and HTTP failure normalization behind one small shared boundary.
- Validate the current forms-list response before UI consumption.
- Give the route explicit loading, error, empty, and populated rendering paths.
- Create a repeatable feature pattern without moving unrelated forms code.
- Preserve current list navigation and filtering behavior.

**Non-Goals:**

- Migrating form detail, creation, versions, or builder requests.
- Changing backend routes or response payloads.
- Moving server data into Zustand.
- Introducing a repository layer, generated client, or new runtime dependency.
- Generalizing every existing request before a second consumer needs the abstraction.

## Decisions

### Use a feature query hook as the page boundary

`FormListPage` will consume a forms-owned query hook backed by a stable forms query key. The hook will call the feature API function and expose TanStack Query's pending, error, success, and refetch behavior.

This is preferred over retaining `useEffect` because TanStack Query is already installed and configured for server-state lifecycle. Zustand is not appropriate because the list is remote state rather than an editable client draft.

### Keep transport and domain responsibilities small and separate

A shared API client will provide base URL resolution, JSON handling, abort-signal forwarding, and a normalized `ApiError`. A forms API module will own only the forms-list route and response contract. The query hook will own caching policy, while the page will own visible composition.

This is preferred over extending the current monolithic service because subsequent migrations need a stable transport boundary. The client will remain intentionally small rather than becoming a generic repository framework.

### Configure the API origin through one environment module

The API origin will be read from `VITE_API_URL`. Local development may use the repository's current HTTP API origin as a documented development default, but production must not silently fall back to localhost. The module will normalize a trailing slash so endpoint construction is deterministic.

This is preferred over importing `import.meta.env` throughout the feature or preserving a hardcoded URL in the service.

### Validate the backend response at the feature boundary

The forms API module will validate the current direct-array response using the validation dependency already present in the project, then expose typed application data. Invalid payloads will become request errors rather than partially rendered cards.

The change will model the backend's current response only; it will not accept both direct arrays and legacy envelope shapes without evidence that both contracts are in use.

### Keep visible request outcomes distinct

The page will render loading, request failure, empty success, and populated success separately. A request failure will include a retry action that triggers the query again. Existing list filtering remains local presentation state and applies only to successfully loaded data.

This prevents infrastructure failures from being interpreted as an empty database.

### Verify the slice at its stable boundaries

Verification will cover response validation/query behavior at the narrowest practical boundary and visible list states through the project's existing frontend test tooling. Tests will use deterministic responses rather than depending on mutable shared database records when validating error and empty states.

No new unit-test runner will be added solely for this pilot. If the existing tooling cannot exercise a pure boundary economically, the required behavior will be covered through Playwright request interception and the production build/typecheck.

## Risks / Trade-offs

- [Risk] The old service and the new API module coexist temporarily. -> Limit the new module to the list endpoint and remove only the superseded list function.
- [Risk] A strict response schema reveals backend drift that was previously ignored. -> Report it as a normalized error and keep the schema aligned to the verified current endpoint.
- [Risk] A development fallback can leak into a production deployment. -> Allow the fallback only in development and require `VITE_API_URL` in production.
- [Risk] Automatic retries delay the visible error state. -> Use a small explicit query retry policy and always retain manual retry.
- [Risk] Existing uncommitted work touches `FormListPage` and the forms service. -> Re-read both files before implementation and preserve unrelated changes.

## Migration Plan

1. Add centralized environment and HTTP error handling without changing current callers.
2. Add the forms-list response contract, API function, query key, and query hook.
3. Switch `FormListPage` to the query hook and explicit request-state components.
4. Remove only the old forms-list request path after confirming no remaining consumers.
5. Add focused verification and run lint, build, and relevant browser tests.

Rollback consists of restoring the previous page caller and list service function; no persisted data or backend contract changes are involved.

## Open Questions

None required before implementation. The implementation must verify the live forms-list payload before finalizing the response schema.
