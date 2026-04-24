---

````md
# 📄 Form Management – Project Context + PRD

---

## 1. 🧭 Overview

**Form Management** es un sistema interno para la gestión de formularios dinámicos altamente configurables mediante esquemas JSON versionados.

El sistema permite:

- Crear formularios sin hardcode
- Versionar formularios correctamente
- Adaptar formularios según contexto (ubicación, dispositivo, etc.)
- Reducir tiempos de desarrollo y errores

El resultado final de los formularios será consumido por otro sistema.

---

## 2. 🎯 Problem Statement

Actualmente los formularios:

- Son extensos y complejos
- Cambian según:
  - Dispositivo
  - Ubicación
  - Reglas específicas
- Se modifican directamente en código (hardcoded)

### Problemas:

- ⏱️ Alto tiempo de implementación
- 🧪 Difícil validación de cambios
- ❌ Alta probabilidad de errores
- 🔁 Baja reutilización
- 📉 Baja escalabilidad

---

## 3. 👤 Users

### 1. Cliente / Stakeholder

- Define los formularios
- No necesariamente técnico

### 2. Equipo de desarrollo

- Implementa y mantiene estructura
- Define variables e integración

---

## 4. 🏗️ Stack Técnico

### Backend

- C#
- .NET 9
- Minimal APIs + Carter
- Arquitectura: Vertical Slice

### Frontend

- React + Vite + TypeScript
- React Hook Form
- Zustand
- React Query
- React Router
- ShadCN + Tailwind
- Testing: Playwright

### Base de Datos

- SQL Server

---

## 5. 📦 Modelo de Datos

### Form

- Id
- Name
- Description
- IsActive
- CreatedAt / UpdatedAt

### FormVersion

- Id
- FormId
- VersionNumber
- Status
- SchemaJson
- DerivedFromVersionId
- CreatedAt / UpdatedAt

---

## 6. ⚙️ Core Features

- Creación de formularios
- Versionamiento
- Definición de estructura mediante JSON
- Derivación de versiones
- Configuración modular (secciones/preguntas)

---

## 7. 🚧 Estado Actual

### Backend

- Entidades definidas
- Conexión a base de datos
- Endpoints básicos:
  - Crear formulario
  - Obtener formularios
  - Obtener versiones

### Frontend

- FormListPage
- FormDetailPage
- CreateFormPage

---

## 8. 🎯 Objetivo Actual

- Definir estructura final del JSON
- Crear nuevos endpoints
- Evolucionar vistas existentes

---

## 9. 🧠 Diseño del Schema JSON

El sistema se basa en un JSON que representa completamente la estructura del formulario.

---

## 10. 🧱 Estructura General

```json
[
  {
    "id": "string",
    "type": "section",
    "titulo": "string",
    "entidad": "string",
    "orden": number,
    "items": []
  }
]
```

---

## 11. 🧩 Tipos de Elementos

### Section

- Agrupa preguntas
- Representa una entidad

### Group

- Agrupador visual/lógico

### Field

- Representa un input

---

## 12. 🧾 Estructura de Field

```json
{
  "id": "string",
  "variable": "string",
  "type": "field",
  "component": "text | number | select",
  "label": "string",
  "orden": number,
  "options": [],
  "core": boolean
}
```

---

## 13. 🔑 Conceptos Clave

### `id`

- Identificador técnico interno
- Usado en frontend

### `variable`

- Nombre usado en el sistema externo
- **No debe cambiar**

### `core`

- Indica que el campo es esencial
- No debe eliminarse en versiones derivadas

---

## 14. 🔗 Dependencias

Las dependencias se definen mediante:

```json
"dependencia": {
  "campo": "NombreVariable"
}
```

---

## 15. 🔄 Opciones Dinámicas

Las opciones pueden depender del valor de otro campo:

```json
"map": {
  "1": [...],
  "2": [...]
}
```

### Comportamiento:

- El valor del campo dependiente determina las opciones disponibles
- No se usa lógica hardcode en frontend

---

## 16. 🧠 Decisiones de Diseño

### ✅ Incluido en el JSON

- Estructura del formulario
- Tipos de campos
- Opciones
- Dependencias simples

### ❌ NO incluido en el JSON

- Validaciones complejas
- Reglas de negocio
- Lógica entre múltiples campos

Estas serán manejadas en el futuro mediante otro JSON o sistema.

---

## 17. 📤 Resultado Final del Formulario

El resultado sigue la estructura:

```json
{
	"Entidad": {
		"Variable": "valor"
	}
}
```

### Ejemplo:

```json
{
	"Hogar": {
		"CantidadHombres": 2,
		"CantidadMujeres": 3
	}
}
```

---

## 18. ⚠️ Reglas Importantes

- `orden` debe ser único dentro del nivel
- No duplicar responsabilidades entre propiedades
- No usar tipos ambiguos como:
  - `dependiente`
  - `composed`

- Mantener consistencia en nombres

---

## 19. ❓ Open Questions

- Estructura final del JSON de validaciones
- Manejo de lógica compleja entre campos
- Estrategia de render dinámico completa
- Soporte para listas (ej: múltiples miembros)

---

## 20. 🚀 Próximos Pasos

### Backend

- Crear endpoint para versiones
- Clonar versiones
- Manejar estados (draft, published)

### Frontend

- Renderer dinámico desde JSON
- Manejo de dependencias
- Editor de formularios (futuro)

---

## 21. 🤖 Reglas para Generación de Código

### Backend

- Seguir Vertical Slice
- Usar Minimal APIs
- DTOs explícitos

### Frontend

- React Hook Form para formularios
- React Query para data fetching
- Componentes desacoplados

---

## 22. 🧠 Principios de Diseño

- Simplicidad sobre sobre-ingeniería
- JSON como fuente de verdad
- Desacoplar lógica del código
- Evitar hardcoding
- Diseñar para cambios frecuentes

--

```

```
