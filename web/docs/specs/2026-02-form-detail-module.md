# Spec: Form Detail Module

## Contexto

Actualmente existe la lista de formularios (`/forms`).

Se necesita una pantalla intermedia que funcione como centro de control del formulario antes de entrar al editor.

Ruta:
`/forms/:formId`

Esta pantalla debe permitir:

- Ver información general del formulario
- Visualizar todas sus versiones
- Crear nueva versión
- Editar versión Draft
- Ver versiones publicadas
- (Opcional) Publicar versión Draft

---

## Objetivo

Centralizar la gestión de versiones del formulario en una sola pantalla clara y segura.

Evitar:

- Edición accidental de versiones publicadas
- Creación múltiple de Drafts
- Navegación confusa entre editor y versiones

---

## Reglas de Negocio

1. Todo Form debe tener al menos una versión.
2. Solo puede existir UNA versión Draft por formulario.
3. Versiones Published no pueden editarse.
4. Crear nueva versión clona la última versión existente.
5. Publicar una versión:
   - Cambia su estado a Published
   - Debe impedir que otras versiones Draft queden activas.
6. Si existe una versión Draft:
   - El botón "Nueva versión" debe estar deshabilitado.

---

## UX

### Layout

Header:

- Nombre del Form
- Descripción
- Botón: Nueva Versión
- Botón: Editar Draft (si existe)

Tabla de versiones:

Columnas:

- Version Number
- Status (badge visual)
- Created At
- Updated At
- Acciones

Acciones dinámicas:

- Draft → Edit / Publish
- Published → View
- Archived → View

---

### Navegación

Editar Draft:
`/forms/:formId/versions/:versionId/edit`

Ver versión:
`/forms/:formId/versions/:versionId/view`

Crear versión:

- POST `/forms/{formId}/versions`
- Redirect automático al editor

---

## Estados de UI

- Loading: Skeleton visible
- Error: Mensaje + botón Retry
- Empty state (edge): No versions (solo posible si error de datos)

---

## Edge Cases

- El formulario no existe (404)
- El usuario navega manualmente a una versión que no pertenece al Form
- Error al crear nueva versión
- El Draft fue eliminado en otra sesión
- El usuario intenta abrir editor de versión Published por URL directa

---

## Fuera de alcance

- Builder (Editor de secciones y preguntas)
- Sistema de permisos avanzado (roles)
- Historial de cambios
- Autosave
- Auditoría

---

## Impacto Técnico

Frontend:

- Nueva pantalla: FormDetailPage
- Servicio API: getFormDetail, createVersion, publishVersion
- Manejo de estado de versiones

Backend:

- Endpoint GET /forms/{formId}
- Endpoint POST /forms/{formId}/versions
- Endpoint POST /forms/{formId}/versions/{versionId}/publish

---

## Estado

Approved
