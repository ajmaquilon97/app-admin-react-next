# Cupo Compartido y Control de Aforo — Especificación técnica de API

Confirmación al equipo Frontend: el requerimiento de **"Cupo Compartido"** (espacios que venden
entradas por aforo diario en vez de franjas horarias exclusivas — ej. piscinas) está implementado,
compilado y probado end-to-end contra la base de datos real. Este documento describe el contrato
final de cada endpoint nuevo o modificado.

---

## 0. Resumen de lo implementado

| # | Cambio | Estado |
|---|---|---|
| 1 | `TiposEspacios.ModalidadReserva` (`"franja_exclusiva"` \| `"cupo_compartido"`) — entidad, migración y seed | ✅ |
| 2 | `Tarifario.EntradaActiva` / `EntradaPrecio` — entidad y migración | ✅ |
| 3 | `GET /api/tipos-espacios` expone `modalidadReserva` | ✅ |
| 4 | Regla de activación de espacio (`POST /api/espacios/{id}/activar`) acepta `EntradaActiva` como modalidad de tarifa válida | ✅ |
| 5 | `GET /api/espacios/{espacioId}/tarifas` y `PUT .../tarifas` exponen `entradaActiva`/`entradaPrecio` (Opción 1) | ✅ |
| 6 | `GET /api/aforo` — resumen de aforo por rango de días | ✅ |
| 7 | `GET /api/aforo/dia` — resumen de un día + detalle de tickets/reservas | ✅ |
| 8 | `ReservaRequest` incluye `pax` | ✅ |
| 9 | Validación transaccional de aforo en `POST /api/reservas` y `POST /api/mobile/reservas` → `409 Conflict` si se excede `MaxCapacidad` | ✅ |
| 10 | `GET /api/mobile/espacios` y `GET /api/mobile/espacios/{id}/disponibilidad` exponen `modalidadReserva` | ✅ |
| 11 | `GET /api/aforo` y `GET /api/aforo/dia` ya no exigen ser el dueño del espacio — cualquier usuario autenticado puede consultarlos | ✅ |
| 12 | `GET /api/aforo/dia`: `tickets` viene vacío `[]` para quien no sea el dueño (privacidad de otros compradores) | ✅ |

La migración de base de datos (`20260805014354_AddModalidadReservaAndEntradaPricing`) ya está
aplicada. No hubo cambios de esquema adicionales en la ronda de ajustes para Mobile (§1/§4 de más
abajo son solo cambios de DTO/autorización). El proyecto compila sin errores (`dotnet build` → 0
errores).

---

## 1. Catálogo de Tipos de Espacio — `modalidadReserva`

`GET /api/tipos-espacios` ahora incluye el campo `modalidadReserva` en cada elemento del catálogo.
No requiere autenticación ni parámetros.

**Valores posibles**: `"franja_exclusiva"` (Canchas, Salones) o `"cupo_compartido"` (Piscinas).

**Respuesta — `200 OK`**
```json
[
  { "id": 1, "codigo": "CAN", "nombre": "Canchas deportivas", "modalidadReserva": "franja_exclusiva" },
  { "id": 2, "codigo": "SAL", "nombre": "Salones de evento",  "modalidadReserva": "franja_exclusiva" },
  { "id": 3, "codigo": "PIS", "nombre": "Piscinas",           "modalidadReserva": "cupo_compartido" }
]
```

El frontend debe usar `modalidadReserva` (no el `nombre`/`codigo`) para decidir si un espacio se
gestiona por franja horaria exclusiva (flujo actual: `fechaInicio`/`fechaFin`, sin aforo) o por
cupo compartido (flujo nuevo: `pax` + aforo diario, ver §4 y §5).

### 1.1 `modalidadReserva` también en los endpoints de Mobile

Para que la app Mobile no dependa de un segundo llamado a `GET /api/tipos-espacios` solo para saber
la modalidad de cada espacio, `modalidadReserva` también se agregó directamente a:

- `GET /api/mobile/espacios` (listado) — campo `modalidadReserva` en cada elemento, junto a
  `tipoEspacioId`/`tipoEspacioNombre`.
- `GET /api/mobile/espacios/{espacioId}/disponibilidad?fecha=...` (detalle/disponibilidad de un
  espacio) — mismo campo `modalidadReserva` en la raíz de la respuesta.

Ejemplo (`GET /api/mobile/espacios`, un elemento del arreglo):
```json
{
  "id": 28,
  "titulo": "Piscina Central",
  "tipoEspacioId": 3,
  "tipoEspacioNombre": "Piscinas",
  "modalidadReserva": "cupo_compartido",
  "maxCapacidad": 8,
  "tarifaHoy": { "modalidad": "Hora", "precio": 5.00, "unidad": "hora", "esPromocion": false }
}
```
Ejemplo (`GET /api/mobile/espacios/28/disponibilidad?fecha=2026-08-15`):
```json
{
  "espacioId": 28,
  "fecha": "2026-08-15",
  "modalidadReserva": "cupo_compartido",
  "tarifa": { "modalidad": "Hora", "precio": 5.00, "unidad": "hora", "esPromocion": false },
  "horas": [ { "hora": 0, "estado": "available" } /* ...24 elementos... */ ]
}
```

---

## 2. Tarifario — Opción 1: `entradaActiva` / `entradaPrecio`

Se implementó la **Opción 1**: el tarifario de un espacio de cupo compartido usa dos campos nuevos,
paralelos a los ya existentes de `hora`/`jornada`/`evento`, en vez de reutilizar `hora` con otro
significado.

> **Para el Frontend**: en un espacio con `modalidadReserva == "cupo_compartido"`, el formulario de
> tarifas debe leer/escribir **`entradaActiva`/`entradaPrecio`**, no `horaActiva`/`horaPrecio`. Los
> campos `hora`/`jornada`/`evento` siguen existiendo en el mismo objeto pero son conceptualmente
> para espacios de franja exclusiva; usarlos en un espacio de cupo compartido no tiene efecto sobre
> el aforo ni sobre la validación de `POST /api/espacios/{id}/activar` sobre `entrada`.

### 2.1 `GET /api/espacios/{espacioId}/tarifas`

**Headers**: `Authorization: Bearer <accessToken>` (obligatorio; solo el dueño del espacio).

**Respuesta — `200 OK`**
```json
{
  "espacioId": 25,
  "horaActiva": false,
  "horaPrecio": null,
  "jornadaActiva": false,
  "jornadaPrecio": null,
  "eventoActiva": false,
  "eventoPrecio": null,
  "entradaActiva": true,
  "entradaPrecio": 8.50,
  "tarifasPorDia": [
    { "dia": 0, "activo": true, "precio": 8.50 },
    { "dia": 1, "activo": true, "precio": 8.50 },
    { "dia": 2, "activo": true, "precio": 8.50 },
    { "dia": 3, "activo": true, "precio": 8.50 },
    { "dia": 4, "activo": true, "precio": 8.50 },
    { "dia": 5, "activo": true, "precio": 8.50 },
    { "dia": 6, "activo": true, "precio": 8.50 }
  ]
}
```
Si el espacio todavía no tiene tarifario, el backend crea uno con valores por defecto (todas las
modalidades, incluida `entrada`, en `false`) automáticamente en este mismo GET.

### 2.2 `PUT /api/espacios/{espacioId}/tarifas`

**Body** (ejemplo mínimo para una piscina, sin usar `hora`/`jornada`/`evento`):
```json
{
  "horaActiva": false,
  "horaPrecio": null,
  "jornadaActiva": false,
  "jornadaPrecio": null,
  "eventoActiva": false,
  "eventoPrecio": null,
  "entradaActiva": true,
  "entradaPrecio": 8.50,
  "tarifasPorDia": [
    { "dia": 0, "activo": true, "precio": 8.50 },
    { "dia": 1, "activo": true, "precio": 8.50 },
    { "dia": 2, "activo": true, "precio": 8.50 },
    { "dia": 3, "activo": true, "precio": 8.50 },
    { "dia": 4, "activo": true, "precio": 8.50 },
    { "dia": 5, "activo": true, "precio": 8.50 },
    { "dia": 6, "activo": true, "precio": 8.50 }
  ]
}
```

**Validación** (`400 Bad Request` si falla): si `entradaActiva == true`, `entradaPrecio` es
obligatorio y debe ser `> 0` — misma regla que ya aplicaba a `hora`/`jornada`/`evento`.
`tarifasPorDia` sigue siendo obligatorio con exactamente 7 elementos (0=Lunes a 6=Domingo), sin
importar la modalidad del espacio.

**Respuesta — `200 OK`**: mismo shape que el GET (§2.1), reflejando los valores recién guardados.

---

## 3. Regla de activación de espacio actualizada

`POST /api/espacios/{espacioId}/activar` ya exigía que el espacio tuviera al menos una modalidad de
tarifa activa con precio válido para poder pasar de `"inactivo"` a `"activo"`. Esa validación ahora
también acepta `entrada`:

```
tieneModalidadActiva =
    (horaActiva    && horaPrecio    > 0) ||
    (jornadaActiva && jornadaPrecio > 0) ||
    (eventoActiva  && eventoPrecio  > 0) ||
    (entradaActiva && entradaPrecio > 0)   // ← nuevo
```

Es decir: una piscina puede activarse configurando **únicamente** `entradaActiva`/`entradaPrecio`
en `PUT .../tarifas` (§2.2), sin necesidad de configurar `hora`. Esto fue verificado en vivo: un
espacio de cupo compartido con solo `entradaActiva: true, entradaPrecio: 8.50` pasó de `"inactivo"`
a `"activo"` correctamente.

Si ninguna modalidad (incluida `entrada`) está activa con precio válido, la respuesta sigue siendo
`409 Conflict`:
```json
{ "message": "El espacio no tiene ninguna modalidad de tarifa activa. Configura al menos una en Tarifas antes de activar." }
```

---

## 4. Nuevos endpoints de Aforo

Base: `[Authorize]` — requieren `Authorization: Bearer <accessToken>` válido (cliente, propietario
o admin; cualquier tipo de cuenta sirve).

> **Actualización de acceso (a pedido de Frontend Mobile)**: estos dos endpoints **ya no exigen
> ser el dueño del espacio**. Cualquier usuario autenticado puede consultarlos — es lo que permite
> que la app Mobile muestre disponibilidad de aforo a un cliente antes de que reserve. La única
> restricción de propiedad que queda es sobre el **detalle de `tickets`** en `GET /api/aforo/dia`
> (§4.2): eso sigue siendo privado del dueño.

| Dato | ¿Quién lo ve? |
|---|---|
| `capacidadTotal` / `vendida` / `disponible` (§4.1 y §4.2) | Cualquier usuario autenticado. |
| `tickets[]` (nombre del cliente y hora de compra de cada reserva, §4.2) | **Solo el dueño del espacio.** Para cualquier otro usuario llega como `[]`, sin importar cuántas reservas haya ese día. |

### 4.1 `GET /api/aforo` — resumen por rango de días

**Query params**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `espacioId` | `int` | Sí | ID del espacio. |
| `fechaInicio` | `string` (`yyyy-MM-dd`) | Sí | Primer día del rango, inclusive. |
| `fechaFin` | `string` (`yyyy-MM-dd`) | Sí | Último día del rango, inclusive. |

**Ejemplo de request**
```
GET /api/aforo?espacioId=25&fechaInicio=2026-08-09&fechaFin=2026-08-11
Authorization: Bearer <accessToken>
```

**Respuesta — `200 OK`**: un arreglo con un elemento por cada día del rango (incluye días sin
ninguna reserva, con `vendida: 0`).
```json
[
  { "fecha": "2026-08-09", "capacidadTotal": 5, "vendida": 0, "disponible": 5 },
  { "fecha": "2026-08-10", "capacidadTotal": 5, "vendida": 5, "disponible": 0 },
  { "fecha": "2026-08-11", "capacidadTotal": 5, "vendida": 0, "disponible": 5 }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `fecha` | `string` (`yyyy-MM-dd`) | Día del rango. |
| `capacidadTotal` | `int` | `Espacio.MaxCapacidad`. |
| `vendida` | `int` | Suma de `Pax` de las reservas activas (`Estado != Cancelada`) cuya `FechaInicio` cae ese día. |
| `disponible` | `int` | `capacidadTotal - vendida`. Puede no llegar a 0 exacto si `MaxCapacidad` se redujo después de vender cupos (no hay clamp a 0). |

**Errores**

| Código | Cuándo | Body |
|---|---|---|
| `400 Bad Request` | `fechaFin` anterior a `fechaInicio` | `{ "message": "fechaFin no puede ser anterior a fechaInicio." }` |
| `404 Not Found` | No existe un espacio con ese `espacioId` | `{ "message": "No existe un espacio con ese ID." }` |

No devuelve `403`: ya no hay restricción de propiedad en este endpoint (ver nota de acceso arriba).

### 4.2 `GET /api/aforo/dia` — resumen y detalle de un solo día

**Query params**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `espacioId` | `int` | Sí | ID del espacio. |
| `fecha` | `string` (`yyyy-MM-dd`) | Sí | Día a consultar. |

**Ejemplo de request**
```
GET /api/aforo/dia?espacioId=25&fecha=2026-08-10
Authorization: Bearer <accessToken>
```

**Respuesta — `200 OK` (usuario autenticado es el DUEÑO del espacio)**
```json
{
  "fecha": "2026-08-10",
  "capacidadTotal": 5,
  "vendida": 5,
  "disponible": 0,
  "tickets": [
    {
      "reservaId": 41,
      "nombreCliente": "Test Aforo",
      "pax": 3,
      "horaCompra": "2026-08-05T02:03:11.9908922"
    },
    {
      "reservaId": 42,
      "nombreCliente": "Test Aforo",
      "pax": 2,
      "horaCompra": "2026-08-05T02:03:26.1564434"
    }
  ]
}
```

**Respuesta — `200 OK` (usuario autenticado NO es el dueño — ej. un cliente Mobile)**
```json
{
  "fecha": "2026-08-10",
  "capacidadTotal": 5,
  "vendida": 5,
  "disponible": 0,
  "tickets": []
}
```
Mismo `capacidadTotal`/`vendida`/`disponible` en ambos casos — la única diferencia es `tickets`.
Esto fue verificado en vivo con dos usuarios distintos: el dueño vio los 2 tickets con nombre y
hora de compra; un segundo usuario autenticado (no dueño) recibió `200 OK` con los mismos números
de aforo pero `tickets: []`.

| Campo | Tipo | Descripción |
|---|---|---|
| `fecha` / `capacidadTotal` / `vendida` / `disponible` | — | Igual que en §4.1, para ese único día. Visibles para cualquier usuario autenticado. |
| `tickets` | `array` | Solo poblado si el usuario autenticado es el dueño del espacio (ver tabla de acceso arriba); si no, siempre `[]`. Cuando viene poblado: una entrada por cada reserva activa (`Estado != Cancelada`) de ese espacio ese día, ordenadas por `horaCompra` ascendente. |
| `tickets[].reservaId` | `int` | ID de la reserva (`Reservas.Id`). |
| `tickets[].nombreCliente` | `string` | `Usuario.Nombre + " " + Usuario.Apellido` (recortado). |
| `tickets[].pax` | `int` | Cupos consumidos por esa reserva. |
| `tickets[].horaCompra` | `string` (ISO 8601) | `Reservas.FechaCreacion` — momento en que se creó la reserva, no la hora de uso del cupo. |

**Errores**

| Código | Cuándo | Body |
|---|---|---|
| `404 Not Found` | No existe un espacio con ese `espacioId` | `{ "message": "No existe un espacio con ese ID." }` |

No valida rango de fechas porque solo recibe un día. No devuelve `403` (ver nota de acceso arriba).

---

## 5. `409 Conflict` por aforo excedido al crear una reserva

### 5.1 Dónde aplica

La validación corre en **ambos** endpoints de creación de reserva:
- `POST /api/reservas` (host crea la reserva)
- `POST /api/mobile/reservas` (cliente autenticado crea su propia reserva)

Solo se activa si `Espacio.TipoEspacio.ModalidadReserva == "cupo_compartido"`. Para espacios de
`"franja_exclusiva"` (Canchas, Salones) el comportamiento **no cambió**: `pax` se guarda en la
reserva pero no se valida contra ningún límite.

### 5.2 Qué campo nuevo debe enviar el Frontend

`ReservaRequest` (body de ambos endpoints) ahora incluye `pax`:
```json
{
  "espacioId": 25,
  "usuarioId": "8e659309-838a-4ac6-bb02-14d82a2b585c",
  "fechaInicio": "2026-08-10T10:00:00",
  "fechaFin": "2026-08-10T12:00:00",
  "totalHoras": 2,
  "pax": 3,
  "facturacion": null
}
```
> **Convención obligatoria para cupo compartido**: `fechaInicio` y `fechaFin` deben caer en el
> **mismo día calendario**. El backend calcula el aforo por el día de `fechaInicio`; una reserva que
> cruce medianoche no se valida ni se contabiliza correctamente en el día de `fechaFin`.

### 5.3 Regla de validación

Al crear la reserva, si el espacio es de cupo compartido, el backend:
1. Suma el `pax` de todas las reservas **activas** (`Estado != Cancelada`) de ese `espacioId` cuya
   `FechaInicio` cae en el mismo día que la nueva reserva.
2. Le suma el `pax` de la solicitud entrante.
3. Si el total supera `Espacio.MaxCapacidad`, **aborta la operación completa** (no se crea la
   reserva) y responde:

**`409 Conflict`**
```json
{ "message": "Se excedió el aforo disponible para el 2026-08-10: capacidad 5, vendidas 5, solicitadas 1." }
```
El mensaje incluye la fecha, la capacidad total, lo ya vendido antes de este intento, y lo
solicitado en este intento — suficiente para que el frontend muestre un mensaje útil sin tener que
volver a consultar `GET /api/aforo/dia`.

Si el total no supera la capacidad, la reserva se crea normalmente y la respuesta es la misma
`ReservaResponse` de siempre (`200 OK`), con el campo `pax` reflejado.

> **Cálculo del monto (`pago.subtotal`) en cupo_compartido**: a diferencia de franja exclusiva
> (`subtotal = tarifaHora × totalHoras`), en un espacio de cupo compartido el backend calcula
> `subtotal = Tarifario.EntradaPrecio × pax` — se cobra por cupo, no por hora. `totalHoras` se
> guarda igual en la reserva pero no participa del cálculo. Si el espacio no tiene
> `entradaActiva`/`entradaPrecio` configurado, la creación de la reserva responde `409 Conflict`
> con `{ "message": "El espacio no tiene una tarifa de entrada configurada." }`. `comision`/`total`
> se calculan igual que siempre a partir de ese `subtotal`.

### 5.4 Seguridad ante solicitudes concurrentes (por qué es "transaccional")

El requerimiento pedía explícitamente que la validación fuera segura ante dos compras simultáneas
que individualmente parezcan válidas pero que juntas exceden el aforo (ej. capacidad 5, dos
usuarios piden 3 cupos cada uno al mismo tiempo). Esto se resolvió así:

- El conteo de `pax` vendido + la inserción de la nueva reserva ocurren dentro de **una misma
  transacción de base de datos con nivel de aislamiento `Serializable`** (SQL Server).
- Bajo `Serializable`, si dos requests concurrentes leen el mismo conjunto de reservas del día, la
  base de datos serializa el acceso: una transacción se completa primero (lee, valida, inserta,
  hace commit) y la segunda, al recalcular la suma ya con la primera confirmada, ve el número
  actualizado y es rechazada si ya no hay cupo — nunca pueden "pisarse" y sobrevender.
- Esto fue verificado en vivo: se dispararon dos requests simultáneos de `pax: 3` contra un espacio
  con `MaxCapacidad: 5` (donde cada uno individualmente cabría, pero juntos no). Resultado real:
  una reserva se creó (`200 OK`), la otra recibió `409 Conflict` con el mensaje de aforo excedido
  citando el estado ya actualizado (`"vendidas 3"`) — cero sobreventa.
- Si la validación falla, la transacción se revierte por completo (`ROLLBACK`): no queda ninguna
  fila parcial ni un código de reserva "quemado" en la base.

### 5.5 Cancelaciones

Cancelar una reserva (`DELETE /api/reservas/{id}` o `POST /api/reservas/{id}/cancelar`) cambia su
`Estado` a `Cancelada`, lo que la excluye inmediatamente de la suma de `vendida` en `GET /api/aforo`,
`GET /api/aforo/dia` y en la validación de la §5.3 — el cupo liberado queda disponible para una
nueva reserva de inmediato. Esto también fue verificado en vivo.

---

## 6. Notas adicionales para el Frontend

- **Nada de esto requiere una migración de base de datos adicional de aquí en adelante** salvo que
  se agreguen más campos — todo lo listado en este documento ya está aplicado en la base de datos
  compartida de desarrollo.
- El campo `pax` en `ReservaRequest` es de tipo `int` sin validación de mínimo en el backend hoy
  (`pax: 0` es aceptado y no genera error). Si el producto requiere que una reserva de cupo
  compartido tenga al menos 1 persona, esa validación de UX debería reforzarse en el frontend
  mientras no se agregue en el backend.
- `GET /api/tipos-espacios`, `GET /api/aforo` y `GET /api/aforo/dia` usan `camelCase` en JSON
  (comportamiento estándar del serializador de .NET en este proyecto), igual que el resto de la API.
- Todos los endpoints de este documento fueron probados manualmente contra la base de datos real
  del ambiente de desarrollo (creación de espacio, configuración de tarifas, activación, reservas
  dentro y fuera de aforo, cancelación, y el escenario de concurrencia de la §5.4) antes de esta
  entrega.
- El ajuste de acceso de §4 (endpoints abiertos a cualquier usuario autenticado, `tickets` privado
  del dueño) también se verificó en vivo con dos cuentas distintas — una dueña del espacio y otra
  sin relación con él — confirmando `200 OK` con números reales para ambas y `tickets` vacío solo
  para la segunda.
