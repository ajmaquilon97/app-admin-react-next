# Ajustes Solicitados — Módulo de Dashboard

> **De:** Frontend  
> **Para:** Backend  
> **Fecha:** 2026-07-07  
> **Contexto:** La pantalla `/dashboard` muestra KPIs, gráfico de actividad mensual, próximas reservas y tabla de últimas reservas. Actualmente todo está mockeado. Para conectarlo con datos reales se necesitan los ajustes descritos a continuación.

---

## 1. Endpoint de listado de reservas por propietario (CRÍTICO)

Actualmente `GET /api/reservas/{id}` solo devuelve una reserva por ID. No existe un endpoint de listado. Esto bloquea la tabla y el panel de próximas reservas.

```
GET /api/reservas
Authorization: Bearer <access_token>
```

### Query params

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `propietarioId` | `string` | No | Filtra por propietario de los espacios. Si se omite, devuelve las del usuario autenticado. |
| `fechaDesde` | `string` (date-time ISO) | No | Reservas con `fechaInicio >= fechaDesde` |
| `fechaHasta` | `string` (date-time ISO) | No | Reservas con `fechaInicio <= fechaHasta` |
| `estado` | `string` | No | Filtra por estado (`confirmada`, `pendiente_pago`, `finalizada`, `cancelada`) |
| `page` | `integer` | No | Número de página (base 0). Default: `0`. |
| `size` | `integer` | No | Elementos por página. Default: `20`. |

### Response 200

```json
{
  "content": [
    {
      "id": 1,
      "espacioId": 3,
      "espacioTitulo": "Cancha Sintética #1",
      "usuarioId": "abc-123",
      "usuarioNombre": "Diego Pérez",
      "usuarioCorreo": "diego@email.com",
      "fechaInicio": "2026-07-07T14:00:00Z",
      "fechaFin": "2026-07-07T16:00:00Z",
      "totalHoras": 2,
      "monto": 70.00,
      "estado": "confirmada",
      "fechaCreacion": "2026-07-01T10:00:00Z"
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "number": 0
}
```

---

## 2. Campos adicionales en `ReservaResponse`

Agregar a todas las respuestas que devuelven `ReservaResponse` (incluyendo el nuevo listado y `GET /api/reservas/{id}`):

| Campo | Tipo | Descripción |
|---|---|---|
| `usuarioCorreo` | `string` (nullable) | Correo del cliente que hizo la reserva |
| `monto` | `number` (decimal, nullable) | Total cobrado por la reserva |

---

## 3. Enum de estados de reserva

Confirmar los valores exactos del campo `estado` en `ReservaResponse`. El frontend necesita mapearlos a etiquetas y colores:

| Valor esperado | Etiqueta en UI | Color |
|---|---|---|
| `confirmada` | Confirmada | Verde |
| `pendiente_pago` | Pend. Pago | Amarillo |
| `finalizada` | Finalizada | Gris |
| `cancelada` | Cancelada | Rojo |

> Si los valores son diferentes (ej. `CONFIRMED`, `pending-payment`), indicar la lista exacta para ajustar el mapeo en frontend.

---

## 4. Endpoint de estadísticas del dashboard (NUEVO)

Para los KPIs y el gráfico de barras se necesita un endpoint de resumen agregado. Evita que el frontend haga N llamadas y calcule en cliente.

```
GET /api/dashboard/stats
Authorization: Bearer <access_token>
```

### Response 200

```json
{
  "totalEspacios": 4,
  "reservasHoy": 3,
  "pendientesPago": 1,
  "ingresosMes": 1250.00,
  "reservasPorMes": [
    { "mes": "2026-02", "total": 8 },
    { "mes": "2026-03", "total": 14 },
    { "mes": "2026-04", "total": 11 },
    { "mes": "2026-05", "total": 19 },
    { "mes": "2026-06", "total": 22 },
    { "mes": "2026-07", "total": 6 }
  ]
}
```

> `mes` en formato `YYYY-MM`. El array siempre devuelve los últimos 6 meses, del más antiguo al más reciente.  
> `ingresosMes` es la suma de `monto` de reservas confirmadas/finalizadas del mes en curso.

---

## 5. Checklist de confirmación

- [ ] `GET /api/reservas` (listado) implementado con filtros `fechaDesde`, `fechaHasta`, `estado`, paginación
- [ ] `ReservaResponse` incluye `usuarioCorreo` y `monto`
- [ ] Enum de `estado` confirmado con valores exactos
- [ ] `GET /api/dashboard/stats` implementado
- [ ] Swagger actualizado con los nuevos endpoints y campos
