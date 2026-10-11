# Form List Retrieval Specification

## Purpose

Define how the frontend retrieves, validates, presents, retries, filters, and navigates the forms list.

## Requirements

### Requirement: Forms are retrieved from the configured API
The frontend SHALL retrieve the forms list from the existing forms-list endpoint using the centrally configured API origin, and SHALL treat the response as server state managed by TanStack Query.

#### Scenario: Forms request succeeds
- **WHEN** the forms-list endpoint returns a valid non-empty response
- **THEN** the frontend displays the returned forms

#### Scenario: API origin is configured
- **WHEN** the forms-list request is created
- **THEN** its URL uses the API origin resolved by the central frontend configuration

### Requirement: Forms-list responses are validated
The frontend SHALL validate or explicitly map the forms-list response at the API boundary before exposing it to list presentation components.

#### Scenario: Response matches the contract
- **WHEN** the endpoint returns a response matching the forms-list contract
- **THEN** the validated forms are made available to the query consumer

#### Scenario: Response violates the contract
- **WHEN** the endpoint returns a response that does not match the forms-list contract
- **THEN** the request is treated as failed and invalid records are not rendered

### Requirement: Request outcomes are visually distinct
The forms list SHALL represent loading, failed, empty, and populated request outcomes as distinct user-interface states.

#### Scenario: Request is pending
- **WHEN** no successful forms response is available and the request is pending
- **THEN** the page displays a loading state rather than an empty-list message

#### Scenario: Request fails
- **WHEN** the forms-list request fails
- **THEN** the page displays an error state rather than an empty-list message

#### Scenario: Successful response is empty
- **WHEN** the forms-list request succeeds with no forms
- **THEN** the page displays the empty-list state

#### Scenario: Successful response contains forms
- **WHEN** the forms-list request succeeds with one or more forms
- **THEN** the page displays the forms using the existing list navigation behavior

### Requirement: Failed retrieval can be retried
The forms-list error state SHALL provide an action that starts a new retrieval attempt without requiring a full-page reload.

#### Scenario: User retries a failed request
- **WHEN** the user activates retry after a forms-list failure
- **THEN** the frontend starts a new forms-list request and reflects its current request state

#### Scenario: Retried request succeeds
- **WHEN** a retry returns a valid response
- **THEN** the error state is replaced by the appropriate empty or populated success state

### Requirement: Existing list interaction remains available
The forms list SHALL preserve its existing client-side filtering and navigation behavior after successful retrieval.

#### Scenario: User filters loaded forms
- **WHEN** the user enters a list filter after forms have loaded
- **THEN** the page displays only forms matching the existing filter rules

#### Scenario: User opens a form
- **WHEN** the user activates an available form from the populated list
- **THEN** the frontend navigates using the existing form-detail route behavior
