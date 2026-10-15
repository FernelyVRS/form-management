# Form HTTP Contract Specification

## Purpose

Define the public HTTP contract of the basic form endpoints (`GET /forms`, `POST /forms`, `GET /forms/{formId}`): direct response bodies without envelope, English wire keys unified with the version lifecycle endpoints, ProblemDetails error bodies with stable codes, explicit nullability, UTC timestamps on the wire, and the frontend boundary schemas that validate and translate this contract into the internal model.

## Requirements

### Requirement: Direct response bodies
The basic form endpoints SHALL return the resource directly as the JSON top-level value, without an envelope such as `{ data: ... }`.

#### Scenario: Form list returns a bare array
- **WHEN** a client requests `GET /forms`
- **THEN** the response body is a JSON array as the top-level value

#### Scenario: Form creation returns a bare object
- **WHEN** a client requests `POST /forms` with a valid body
- **THEN** the `201` response body is a JSON object as the top-level value with no wrapper key

#### Scenario: Form detail returns a bare object
- **WHEN** a client requests `GET /forms/{formId}` for an existing form
- **THEN** the `200` response body is a JSON object as the top-level value with no wrapper key

### Requirement: Form list wire contract
`GET /forms` SHALL return `200` with an array of objects whose keys are exactly `id`, `name`, `description`, `createdAt`, `updatedAt`, `totalVersions`, `latestVersion`, and `latestVersionId`.

#### Scenario: List item matches the contract
- **WHEN** a client parses a list response
- **THEN** each item exposes `id` and `latestVersionId` as UUID strings, `name` as a string, `description` and `updatedAt` as string-or-null, `createdAt` as a string, and `totalVersions` and `latestVersion` as integers

#### Scenario: Every form has at least one version
- **WHEN** a client reads any list item
- **THEN** `totalVersions` is at least `1` and `latestVersion` is at least `1`

#### Scenario: List ordering is preserved
- **WHEN** the endpoint returns multiple forms
- **THEN** the response uses the endpoint's existing order (most recently created first)

### Requirement: Form creation wire contract
`POST /forms` SHALL accept a JSON body with `name` (required, non-empty string) and optional `description`, and on success SHALL return `201` with body keys exactly `formId`, `versionId`, and `number`, plus a `Location` header pointing to `/forms/{formId}`.

#### Scenario: Successful creation
- **WHEN** a client posts `{ "name": "Encuesta", "description": "opcional" }`
- **THEN** the response is `201` with body `{ "formId": "<uuid>", "versionId": "<uuid>", "number": 1 }` and `Location` header `/forms/{formId}`

#### Scenario: Creation without description
- **WHEN** a client posts `{ "name": "Encuesta" }`
- **THEN** the response is `201` and the created form's `description` resolves to `null` when read through the contract

#### Scenario: Missing name is rejected
- **WHEN** a client posts a body without `name`
- **THEN** the response is `400` with an error body whose `code` is `invalid_request`

#### Scenario: Empty name is rejected
- **WHEN** a client posts `{ "name": "" }`
- **THEN** the response is `400` with an error body whose `code` is `invalid_request`

#### Scenario: Malformed JSON is rejected
- **WHEN** a client posts a syntactically invalid JSON body
- **THEN** the response is `400` with an error body whose `code` is `invalid_request`

### Requirement: Form detail wire contract
`GET /forms/{formId}` SHALL return `200` with body keys exactly `id`, `name`, `description`, `createdAt`, `updatedAt`, and `versions`, where each version exposes exactly `id`, `number`, `status`, `rowVersion`, `createdAt`, and `updatedAt`, ordered by ascending `number`.

#### Scenario: Detail matches the contract
- **WHEN** a client parses a detail response for an existing form
- **THEN** `id` is a UUID string, `name` is a string, `description` and `updatedAt` are string-or-null, and `versions` is an array of version objects matching the defined keys

#### Scenario: Versions are ordered by number
- **WHEN** a form has versions with numbers 1, 2, and 3
- **THEN** the `versions` array lists them in ascending `number` order

#### Scenario: Unknown form id returns 404 with body
- **WHEN** a client requests `GET /forms/{formId}` with an id that does not exist
- **THEN** the response is `404` with an error body whose `code` is `form_not_found`

### Requirement: Version fields reference the version-status contract
Version objects inside the detail response SHALL expose `status` with the canonical values `Draft`, `Published`, or `Archived` as defined by `version-status-contract`, and `rowVersion` as a non-empty base64-encoded concurrency token.

#### Scenario: Status uses canonical values
- **WHEN** a version has status `Published`
- **THEN** the detail response reports `"status": "Published"` exactly

#### Scenario: RowVersion is transferable
- **WHEN** a client reads `rowVersion` from the detail response
- **THEN** it is a non-empty base64 string that the client can echo back to lifecycle commands

### Requirement: Error bodies use ProblemDetails with a stable code
Error responses (`400`, `404`) SHALL be ProblemDetails objects carrying the HTTP status, a `title` equal to the stable error code, and a `code` extension with that same value. Codes in scope are `invalid_request` and `form_not_found`.

#### Scenario: 404 body carries the code
- **WHEN** `GET /forms/{formId}` targets an unknown id
- **THEN** the response body contains `"code": "form_not_found"` and the matching HTTP status `404`

#### Scenario: 400 body carries the code
- **WHEN** `POST /forms` receives an invalid body
- **THEN** the response body contains `"code": "invalid_request"` and the matching HTTP status `400`

### Requirement: Timestamps are UTC on the wire
`createdAt` and `updatedAt` values produced by these endpoints SHALL be serialized as RFC 3339 UTC timestamps (ending in `Z`).

#### Scenario: Newly created form reports UTC timestamps
- **WHEN** a client creates a form and immediately reads it
- **THEN** `createdAt` ends with `Z` and represents UTC

### Requirement: Nullability is explicit
`description` and `updatedAt` SHALL be nullable in every response that includes them; `updatedAt: null` means the form has never been updated after creation.

#### Scenario: Form without description
- **WHEN** a form was created without `description`
- **THEN** list and detail responses report `"description": null`

#### Scenario: Never-updated form
- **WHEN** a form has never been updated
- **THEN** detail responses report `"updatedAt": null` while `createdAt` is present

### Requirement: Frontend validates the English wire contract at its boundary
The frontend SHALL parse basic-endpoint responses with boundary schemas that expect the English wire keys and SHALL translate them into the internal frontend model, without exposing wire keys to presentation components.

#### Scenario: Valid English-key response parses
- **WHEN** the endpoint returns a response matching the English wire contract
- **THEN** the boundary schema accepts it and the UI receives the mapped internal model

#### Scenario: Legacy Spanish-key response fails closed
- **WHEN** a response still carries legacy Spanish keys such as `nombre` or `estado` at these endpoints
- **THEN** the boundary schema rejects it and the request is treated as failed rather than rendering partial data

#### Scenario: Create response maps number to the internal model
- **WHEN** `POST /forms` returns `{ "formId": "...", "versionId": "...", "number": 1 }`
- **THEN** the frontend maps it to its internal creation result and navigates using `formId` and `versionId`
