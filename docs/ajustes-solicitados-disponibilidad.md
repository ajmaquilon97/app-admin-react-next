# Ajustes solicitados al Backend — Módulo Disponibilidad / Agenda

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / ASP.NET Core)
> **Fecha:** 2026-07-05
> **Contexto:** el frontend implementó el módulo de Agenda con servicios simulados. Esta
> lista define el **contrato exacto de APIs** que se necesitan para conectarlo al backend real.
> Todos los endpoints requieren autenticación Bearer (access token JWT), salvo que se indique lo contrario.

---

## 1. Consultar disponibilidad

```
GET /api/availability
```

### Query params

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fechaInicio` | string (YYYY-MM-DD) | ✅ | Primer día del rango |
| `fechaFin` | string (YYYY-MM-DD) | ✅ | Último día del rango |
| `espacioId` | string | ❌ | Si se omite, devuelve bloques de todos los espacios del anfitrión |

### Response `200 OK`

```jsonc
[
  {
    "id": "string",
    "espacioId": "string",
    "espacioNombre": "string",
    "date": "2026-07-07",       // YYYY-MM-DD
    "hour": 8,                  // entero 8..18 — representa el slot HH:00-HH+1:00
    "status": "available",      // ver tabla de estados más abajo
    "clientName": "Carlos M.",  // presente solo si status = "reserved"
    "notes": "string"           // presente solo si status = "blocked" | "maintenance"
  }
]
```

### Tabla de estados válidos

| Valor | Significado |
|-------|-------------|
| `available` | Horario disponible para reservar |
| `reserved` | Ocupado por una reserva confirmada |
| `blocked` | Bloqueado manualmente por el anfitrión |
| `maintenance` | Bloqueado por mantenimiento |
| `closed` | Cerrado según el horario general o una excepción |

> ⚠️ Los bloques con `status = "reserved"` son **de solo lectura** desde este módulo.
> Su creación y cancelación se gestiona exclusivamente desde el módulo de Reservas.

---

## 2. Indicadores de ocupación

```
GET /api/availability/statistics
```

### Query params

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fechaInicio` | string (YYYY-MM-DD) | ✅ | Inicio del rango |
| `fechaFin` | string (YYYY-MM-DD) | ✅ | Fin del rango |
| `espacioId` | string | ❌ | Si se omite, agrega estadísticas de todos los espacios |

### Response `200 OK`

```jsonc
{
  "horasDisponibles": 142,
  "horasReservadas": 86,
  "horasBloqueadas": 12,
  "ocupacion": 64          // porcentaje entero 0-100
}
```

---

## 3. Crear bloqueo

```
POST /api/availability/block
```

### Body

```jsonc
{
  "espacioId": "string",
  "date": "2026-07-10",      // YYYY-MM-DD
  "hourStart": 9,            // entero 8..18
  "hourEnd": 10,             // entero, debe ser > hourStart
  "notes": "string"          // opcional — motivo del bloqueo
}
```

### Responses

| Código | Descripción |
|--------|-------------|
| `201 Created` | Bloqueo creado. Devuelve el objeto `Block` completo (mismo shape que el GET) |
| `400 Bad Request` | Datos inválidos (hora fin ≤ hora inicio, espacio inexistente, etc.) |
| `409 Conflict` | El slot ya está ocupado por una reserva confirmada |

### Response `201`

```jsonc
{
  "id": "string",
  "espacioId": "string",
  "espacioNombre": "string",
  "date": "2026-07-10",
  "hour": 9,
  "status": "blocked",
  "notes": "string"
}
```

> **Nota:** si `hourEnd > hourStart + 1` (bloqueo de múltiples horas), el backend debe
> crear un bloque por cada hora individual o devolver un array de bloques creados.
> El frontend procesará ambas opciones si se indica cuál se elige.

---

## 4. Liberar bloqueo

```
DELETE /api/availability/block/{id}
```

### Responses

| Código | Descripción |
|--------|-------------|
| `204 No Content` | Bloqueo eliminado correctamente |
| `404 Not Found` | El bloqueo no existe |
| `403 Forbidden` | El slot es una reserva confirmada — no se puede liberar desde aquí |

---

## 5. Horario general

### Consultar

```
GET /api/availability/schedule
```

### Response `200 OK`

```jsonc
{
  "apertura": "08:00",               // formato HH:mm
  "cierre": "22:00",                 // formato HH:mm
  "diasActivos": [0, 1, 2, 3, 4, 5, 6]  // 0 = Lunes, 6 = Domingo
}
```

### Actualizar

```
PUT /api/availability/schedule
```

**Body:** mismo shape que el GET.

**Response `200 OK`:** objeto actualizado.

> **Recomendación futura:** agregar un campo opcional `espacioId` desde el inicio para
> soportar horarios distintos por espacio sin romper el contrato. Hoy el frontend lo
> maneja a nivel global.

---

## 6. Excepciones (feriados, mantenimientos, cierres puntuales)

### Listar

```
GET /api/availability/exceptions
```

**Response `200 OK`:**

```jsonc
[
  {
    "id": "string",
    "titulo": "Feriado Nacional (Navidad)",
    "fecha": "2026-12-25",       // YYYY-MM-DD
    "horaInicio": null,          // null = todo el día; "HH:mm" si es parcial
    "horaFin": null,
    "tipo": "feriado"            // feriado | mantenimiento | cierre
  }
]
```

### Crear

```
POST /api/availability/exceptions
```

**Body:** objeto sin `id`.
**Response `201 Created`:** objeto completo con `id` generado.

### Editar

```
PUT /api/availability/exceptions/{id}
```

**Body:** objeto sin `id`.
**Response `200 OK`:** objeto actualizado.

### Eliminar

```
DELETE /api/availability/exceptions/{id}
```

**Response `204 No Content`.**

---

## 7. Formato de errores

Todos los errores deben responder con el shape estándar ya definido en el proyecto:

```jsonc
{ "message": "string", "errors"?: { "<campo>": ["string"] } }
```

---

## 8. Consideraciones generales

1. **Autenticación:** todos los endpoints requieren `Authorization: Bearer <accessToken>`.
   El anfitrión solo debe ver y modificar los espacios que le pertenecen — el backend
   debe filtrar por `propietarioId` derivado del claim `sub` del JWT.

2. **Slots vs. rangos:** el frontend trabaja con **slots de 1 hora**. Si el backend
   prefiere manejar rangos (hourStart / hourEnd), se puede adaptar, pero debe definirse
   antes de la integración.

3. **Espacios del anfitrión:** el endpoint `GET /api/availability` debe devolver solo
   bloques de espacios pertenecientes al anfitrión autenticado, no de todos los espacios
   del sistema.

4. **CORS:** los orígenes ya registrados en el backend (`http://localhost:3000` y
   `https://develop.d2s2m1gyjncdnl.amplifyapp.com`) cubren también estos nuevos endpoints.

---

## Checklist de confirmación

- [ ] `GET /api/availability` — bloques por rango de fechas con filtro opcional de espacio
- [ ] `GET /api/availability/statistics` — indicadores agregados por rango
- [ ] `POST /api/availability/block` — crear bloqueo (single o multi-hora)
- [ ] `DELETE /api/availability/block/{id}` — liberar bloqueo
- [ ] `GET /api/availability/schedule` — consultar horario general
- [ ] `PUT /api/availability/schedule` — actualizar horario general
- [ ] `GET /api/availability/exceptions` — listar excepciones
- [ ] `POST /api/availability/exceptions` — crear excepción
- [ ] `PUT /api/availability/exceptions/{id}` — editar excepción
- [ ] `DELETE /api/availability/exceptions/{id}` — eliminar excepción
- [ ] Filtrado por `propietarioId` en todos los endpoints de lectura
- [ ] Errores con shape `{ message, errors? }` en todos los endpoints
