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

El contrato activo es el documento inglés v1 definido en [`contracts/form-schema/v1/`](contracts/form-schema/v1/README.md). API y builder utilizan v1, con edición local y Guardar explícito. El mock legado se conserva en `web/src/mocks/legacy/formStructure.json`, sin imports de runtime. El renderer de respuestas todavía está pendiente; `/view` inspecciona la estructura sin edición.

---

## 10. 🧱 Estructura General

```json
{
  "schemaVersion": 1,
  "sections": [
    {
      "id": "servicios_basicos",
      "type": "section",
      "title": "Servicios Básicos",
      "description": "Información del hogar.",
      "entity": "Hogar",
      "order": 1,
      "items": []
    }
  ]
}
```

---

## 11. 🧩 Tipos de Elementos

### Section

- Agrupa preguntas
- Representa una entidad

### Group

- Agrupador visual/lógico
- Usa `label`, `description` opcional, `order` e `items` con fields únicamente.
- Hereda la entidad de su sección; no permite grupos recursivos.

### Field

- Representa un input

---

## 12. 🧾 Estructura de Field

```json
{
  "id": "calle",
  "variable": "Calle",
  "type": "field",
  "component": "text",
  "label": "Calle",
  "description": "Nombre de la calle.",
  "order": 1,
  "core": true,
  "validation": { "maxLength": 30 }
}
```

---

## 13. 🔑 Conceptos Clave

### `id`

- Identificador técnico interno
- Usado en frontend
- snake_case y único en todo el documento.

### `variable`

- Nombre usado en el sistema externo
- **No debe cambiar**
- PascalCase, obligatorio y único en todo el documento.

### `core`

- Indica que el campo es esencial
- No debe eliminarse en versiones derivadas
- Boolean obligatorio; protección contra eliminación implementada en la futura capa de escritura.

---

## 14. 🔗 Dependencias

Las dependencias se definen mediante:

```json
{
  "dependency": { "field": "NivelGradoMasAltoAp" },
  "map": { "1": [{ "label": "Primero", "value": "1" }] }
}
```

---

## 15. 🔄 Opciones Dinámicas

Las opciones pueden depender del valor de otro campo:

```json
{
  "map": {
    "1": [{ "label": "Primero", "value": "1" }],
    "2": [{ "label": "Segundo", "value": "2" }]
  }
}
```

### Comportamiento:

- El valor del campo origen determina las opciones disponibles del dependiente.
- `dependency.field` referencia `variable` de otro select, incluso en grupos o posiciones posteriores.
- Se permiten dependencias encadenadas, pero no ciclos ni referencias inexistentes.
- Un valor sin entrada en `map` produce una lista vacía.
- Un select tiene `options` o `dependency` + `map`, nunca ambos.
- No se usa lógica hardcode en frontend

---

## 16. 🧠 Decisiones de Diseño

### ✅ Incluido en el JSON

- Estructura del formulario
- Tipos de campos
- Opciones
- Dependencias simples
- Descripciones opcionales en secciones, grupos y fields.
- Validaciones simples en `validation`: text `maxLength`; number `min` y `max`.

### ❌ NO incluido en el JSON

- Validaciones complejas
- Reglas de negocio
- Lógica entre múltiples campos
- `required` de respuesta, `range`, `visibility` y grupos recursivos.

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

- `order` debe ser único y consecutivo desde 1 dentro del nivel.
- Keys técnicas y discriminadores en inglés; textos visibles e identificadores externos no se traducen.
- Opciones `{ label, value }` con valores string únicos por lista.
- Propiedades desconocidas y documentos legacy se rechazan en los validadores v1.
- No duplicar responsabilidades entre propiedades
- No usar tipos ambiguos como:
  - `dependiente`
  - `composed`

- Mantener consistencia en nombres

---

## 19. ❓ Open Questions

- Extensiones futuras de validaciones más allá de min/max/maxLength.
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
