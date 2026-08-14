# Ajustes Solicitados — Módulo de Espacios

> **De:** Frontend  
> **Para:** Backend  
> **Fecha:** 2026-07-06  
> **Contexto:** La pantalla "Mis Espacios" (`/espacios`) muestra una tarjeta por espacio con estado operativo, precio y calificación. Actualmente `EspacioResponse` no incluye estos campos; se solicita su incorporación para poder conectar la UI con datos reales.

---

## 1. Campos adicionales en `EspacioResponse`

Añadir los siguientes campos al esquema de respuesta de `GET /api/espacios/mis-espacios` y `GET /api/espacios/{id}`:

```json
{
  "estado": "activo | inactivo | revision",
  "precioPorHora": 35.00,
  "precioPorDia": null,
  "calificacion": 4.8,
  "totalResenas": 24
}
```

### Descripción de cada campo

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `estado` | `string` (enum) | No | Estado operativo del espacio. Valores: `activo`, `inactivo`, `revision`. |
| `precioPorHora` | `number` (decimal) | Sí | Precio de arrendamiento por hora. `null` si el espacio no se alquila por hora. |
| `precioPorDia` | `number` (decimal) | Sí | Precio de arrendamiento por día. `null` si el espacio no se alquila por día. |
| `calificacion` | `number` (decimal, 1–5) | Sí | Promedio de calificaciones recibidas. `null` si aún no tiene reseñas. |
| `totalResenas` | `integer` | Sí | Cantidad de reseñas recibidas. `null` si no tiene. |

### Enum `estado`

| Valor | Significado en UI |
|---|---|
| `activo` | Espacio publicado y recibiendo reservas. Muestra barra de ocupación. |
| `inactivo` | Espacio pausado manualmente. Muestra aviso "Reservas pausadas". |
| `revision` | Espacio pendiente de verificación por Agora. Muestra aviso "Nuestro equipo está verificando". |

---

## 2. Endpoints afectados

### `GET /api/espacios/mis-espacios`

```
GET /api/espacios/mis-espacios
Authorization: Bearer <access_token>
```

**Response 200** — incluir los nuevos campos en cada objeto del array:

```json
[
  {
    "id": 1,
    "titulo": "Cancha Sintética #1",
    "descripcion": "...",
    "propietarioId": "...",
    "propietarioNombre": "...",
    "tipoEspacioId": 1,
    "tipoEspacioNombre": "Canchas Deportivas",
    "ciudad": "Quito",
    "provincia": "Pichincha",
    "linkUbicacion": "https://maps.google.com/...",
    "referencia": "Sede Principal Norte",
    "validarAforo": true,
    "maxCapacidad": 14,
    "imagenPortada": "https://bucket.s3.amazonaws.com/...",
    "imagenesGaleria": ["https://..."],
    "fechaCreacion": "2026-01-15T10:00:00Z",
    "estado": "activo",
    "precioPorHora": 35.00,
    "precioPorDia": null,
    "calificacion": 4.8,
    "totalResenas": 24
  }
]
```

---

### `GET /api/espacios/{id}` _(si existe)_

Mismo ajuste: incluir `estado`, `precioPorHora`, `precioPorDia`, `calificacion`, `totalResenas` en la respuesta.

---

## 3. Endpoint de cambio de estado (nuevo)

Para que el anfitrión pueda activar/desactivar su espacio desde la UI se necesita:

```
PATCH /api/espacios/{id}/estado
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "estado": "activo | inactivo"
}
```

**Responses:**

| Código | Descripción |
|---|---|
| `200` | Estado actualizado. Retorna el `EspacioResponse` completo actualizado. |
| `400` | Estado inválido o transición no permitida (p. ej. intentar activar un espacio en `revision`). |
| `403` | El usuario autenticado no es el propietario del espacio. |
| `404` | Espacio no encontrado. |

> **Nota:** Un espacio en estado `revision` no puede ser activado por el anfitrión — solo por un administrador de Agora. El backend debe rechazar esa transición con 400.

---

## 4. Endpoint de precio (nuevo o en crear/editar)

Si el precio se gestiona en la creación/edición del espacio, confirmar si `EspacioRequest` (POST/PUT `/api/espacios`) debe incluir también:

```json
{
  "precioPorHora": 35.00,
  "precioPorDia": null
}
```

Si ya existe un endpoint separado para precio, indicar la ruta.

---

## 5. Checklist de confirmación

- [ ] `EspacioResponse` incluye `estado`, `precioPorHora`, `precioPorDia`, `calificacion`, `totalResenas`
- [ ] `GET /api/espacios/mis-espacios` retorna los nuevos campos
- [ ] `PATCH /api/espacios/{id}/estado` implementado con validación de transición
- [ ] `EspacioRequest` (crear/editar) incluye `precioPorHora` y `precioPorDia`
- [ ] Swagger (`/swagger`) actualizado con los nuevos campos y endpoint
