# Códigos QR e Invitaciones — Especificación técnica de API

Control de aforo por entradas QR: cuando un espacio tiene `ValidarAforo` activo, cada reserva
pagada genera un lote de entradas QR en blanco, que luego se reparten nominalmente a invitados
por correo y se validan escaneando en la puerta.

> **Nota de nomenclatura**: en el modelo de datos existe una tabla legacy `RES_Invitaciones`
> (clase `Invitaciones`, plural) que **no tiene ningún endpoint ni lógica activa** — ningún
> controlador ni servicio la lee o escribe. Todo lo documentado acá corresponde exclusivamente al
> módulo real, tabla `RES_InvitacionesQr` (clase `Invitacion`, singular). Ignorar la tabla plural.

---

## 1. Flujo End-to-End

### Fase 1 — Generación (automática, sin endpoint)

No existe ningún endpoint que el frontend deba llamar para generar entradas QR. La generación es
un efecto secundario interno, disparado cuando se aprueba el pago de una reserva por Datafast:

1. El backend confirma el pago (`Reservas.EstadoPago = Pagado`, `Reservas.Estado = Confirmada`).
2. Si `Espacio.ValidarAforo == true` y `Espacio.MaxCapacidad > 0`, se crean exactamente
   `Espacio.MaxCapacidad` filas `Invitacion` "en blanco":
   - `TokenQr`: un GUID aleatorio de 32 caracteres hex sin guiones (`Guid.NewGuid().ToString("N")`).
   - `Enviada = false`, `Usada = false`, `NombreInvitado`/`CorreoInvitado = null`.
3. Si `ValidarAforo == false` (o `MaxCapacidad <= 0`), **no se genera ninguna entrada** para esa
   reserva — el frontend no debe asumir que siempre existen entradas QR después de un pago.
4. Esta generación está aislada de la respuesta de pago: si falla (excepción interna), el pago
   igual se confirma con éxito y el error solo queda registrado en logs del servidor. En ese caso
   la reserva queda pagada pero sin ningún ticket disponible para asignar — el frontend debería
   tolerar un `GetDisponibles`/`asignar` que devuelva 0 disponibles incluso en una reserva
   confirmada.

**El frontend nunca recibe `TokenQr` directamente por API en ningún momento del flujo** — solo
llega al invitado dentro de la imagen QR embebida en el correo (Fase 2). No hay endpoint para
recuperar/reimprimir el código de un invitado ya asignado.

### Fase 2 — Asignación / distribución al invitado

Unicamente el cliente que hizo la reserva llama a
`POST /api/reservas/{id}/invitaciones/asignar` con la lista de invitados `{ nombre, correo }`.

- El backend toma las entradas todavía sin asignar (`Enviada == false`) de esa reserva, en el
  orden en que se generaron, y las empareja **posicionalmente** con la lista recibida (el primer
  invitado de la lista recibe la primera entrada disponible, y así sucesivamente).
- Por cada entrada asignada: `Enviada = true`, se guarda `NombreInvitado`/`CorreoInvitado`, y se
  encola el envío de un correo con el código QR embebido como imagen PNG (300×300, base64 inline
  en un `<img src="data:image/png;base64,...">`), sin esperar la entrega real.
- El endpoint es **incremental y repetible**: se puede llamar varias veces con menos invitados que
  `MaxCapacidad`; cada llamada consume más del pool restante. Cuando ya no quedan entradas
  disponibles, cualquier intento adicional devuelve `409`.
- **No existe endpoint para desasignar, reasignar, corregir el correo o reenviar una entrada ya
  asignada.** Si un invitado escribió mal su correo, hoy no hay forma de corregirlo vía API.

### Fase 3 — Escaneo y validación en puerta

El personal autorizado (ver §3, reglas de seguridad) escanea el QR físico o digital del invitado,
extrae el `tokenQr` codificado y llama a `POST /api/invitaciones/{tokenQr}/validar`.

- **Primer escaneo de un token válido**: marca `Usada = true`, guarda `FechaUso` (UTC) y responde
  `200 OK` con el estado actualizado de la entrada. Este es el único momento en que `Usada` cambia
  de `false` a `true` — es una transición de un solo sentido, no reversible por API.
- **Token ya usado**: no se vuelve a mutar nada; responde `409 Conflict` con el estado actual de la
  entrada, para que la app de puerta pueda mostrar a quién pertenecía y cuándo se usó.
- **Token inexistente**: `404 Not Found`.
- **Token válido pero el que escanea no es el dueño del espacio de esa reserva**: `403 Forbidden`.

---

## 2. Endpoints Detallados

### 2.1 `POST /api/reservas/{id}/invitaciones/asignar`

Asigna y distribuye entradas QR disponibles de una reserva a una lista de invitados.

**Headers**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | `int` | ID de la reserva. |

**Body** — array JSON (no un objeto envolvente), un elemento por entrada a asignar:
```json
[
  { "nombre": "Ana Torres", "correo": "ana.torres@example.com" },
  { "nombre": "Luis Pérez", "correo": "luis.perez@example.com" }
]
```
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `nombre` | `string` | Sí | `[Required]` |
| `correo` | `string` | Sí | `[Required]`, formato de email válido |

**Respuesta exitosa — `200 OK`**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservaId": 152,
    "nombreInvitado": "Ana Torres",
    "correoInvitado": "ana.torres@example.com",
    "enviada": true,
    "usada": false,
    "fechaUso": null
  },
  {
    "id": "9b2e1d3a-1234-4a5b-8c9d-abcdef123456",
    "reservaId": 152,
    "nombreInvitado": "Luis Pérez",
    "correoInvitado": "luis.perez@example.com",
    "enviada": true,
    "usada": false,
    "fechaUso": null
  }
]
```
Nota: **`tokenQr` nunca viaja en esta respuesta.** El campo no existe en `InvitacionResponse`; el
único lugar donde el token llega al invitado es el correo (Fase 2).

**Respuestas de error**

| Código | Cuándo | Body |
|---|---|---|
| `400 Bad Request` | `nombre`/`correo` faltante o `correo` con formato inválido en algún ítem del array | `{ "message": "Los datos proporcionados no son válidos.", "errors": { "correo": ["The Correo field is required."] } }` |
| `401 Unauthorized` | Falta el header `Authorization` o el token es inválido/expiró | Respuesta estándar de autenticación JWT (sin cuerpo específico del endpoint) |
| `403 Forbidden` | El usuario autenticado no es el `usuarioId` de la reserva | *(sin cuerpo)* |
| `404 Not Found` | No existe una reserva con ese `id` | `{ "message": "No existe una reserva con ese ID." }` |
| `409 Conflict` | Se pidieron más invitados de los que quedan entradas disponibles | `{ "message": "Solo quedan {N} entrada(s) disponible(s) para asignar (se solicitaron {M})." }` |

> **Nota sobre `400`**: los mensajes de validación de `[Required]`/`[EmailAddress]` no fueron
> personalizados, por lo que el texto individual de cada error viene en **inglés** (mensaje default
> de .NET DataAnnotations), aunque el resto del payload (`message`) esté en español. Es una
> inconsistencia conocida del backend, no un bug del contrato — el frontend no debería mostrar esos
> textos de `errors[...]` directamente al usuario final sin traducirlos/mapearlos.

---

### 2.2 `POST /api/invitaciones/{tokenQr}/validar`

Valida (escanea) una entrada QR en la puerta.

**Headers**
```
Authorization: Bearer <accessToken>
```

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `tokenQr` | `string` | Token de 32 caracteres hex codificado en el QR escaneado. |

**Body**: ninguno.

**Respuesta exitosa — `200 OK`** (entrada validada por primera vez):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reservaId": 152,
  "nombreInvitado": "Ana Torres",
  "correoInvitado": "ana.torres@example.com",
  "enviada": true,
  "usada": true,
  "fechaUso": "2026-08-03T21:45:12.3450000Z"
}
```

**Respuestas de error**

| Código | Cuándo | Body |
|---|---|---|
| `401 Unauthorized` | Falta el header `Authorization` o el token JWT es inválido/expiró | Respuesta estándar de autenticación JWT |
| `403 Forbidden` | El usuario autenticado no es el `PropietarioId` del espacio de la reserva dueña del token | *(sin cuerpo)* |
| `404 Not Found` | No existe ninguna `Invitacion` con ese `tokenQr` | `{ "message": "No existe una invitación con ese token." }` |
| `409 Conflict` | La entrada ya había sido escaneada antes | `{ "message": "Esta entrada ya fue utilizada.", "invitacion": { "id": "...", "reservaId": 152, "nombreInvitado": "Ana Torres", "correoInvitado": "ana.torres@example.com", "enviada": true, "usada": true, "fechaUso": "2026-08-03T20:10:00.0000000Z" } }` |

> **Deviación del shape estándar de error**: el `409` de este endpoint incluye una clave adicional
> `invitacion` junto a `message` (a diferencia del resto del proyecto, que usa siempre `{ message
> }` solo). Es intencional — permite que la app de puerta muestre el nombre del invitado y la hora
> en que se usó, incluso en el caso de "ya escaneado". El frontend debe parsear esta clave extra
> específicamente para este endpoint.

---

## 3. Reglas de Negocio y Seguridad

### 3.1 "Encriptado" del QR — aclaración importante

El `TokenQr` **no está firmado ni cifrado**. Es un GUID aleatorio de 32 caracteres hex
(`Guid.NewGuid().ToString("N")`, ej. `3fa85f6457174562b3fc2c963f66afa`), sin checksum, sin HMAC, y
sin ningún dato de negocio codificado dentro (no lleva el ID de reserva, espacio, ni fecha). La
seguridad del sistema descansa en dos cosas:

1. **Inadivinabilidad**: 128 bits de entropía del GUID hacen inviable adivinar un token por fuerza
   bruta.
2. **Unicidad en base de datos**: índice único sobre `TokenQr` — no pueden existir dos entradas con
   el mismo token.

La imagen QR que recibe el invitado por correo codifica literalmente el string del token — nada
más. No hay ningún paso de desencriptado en el backend al validar: es un lookup exacto por
igualdad de string.

### 3.2 Expiración — no existe

**No hay ningún mecanismo de expiración temporal para las entradas QR.** No existe campo
`FechaExpiracion` en el modelo, y `POST /api/invitaciones/{tokenQr}/validar` no compara la fecha
actual contra `Reserva.FechaInicio`/`FechaFin` ni contra ninguna otra referencia temporal. En la
práctica esto significa:

- Un QR generado para una reserva puede escanearse exitosamente **en cualquier momento**: antes de
  la fecha del evento, durante, o mucho después de que haya terminado.
- La única forma en que una entrada deja de ser válida es que **ya haya sido usada**
  (`Usada == true`) — es invalidación por uso, no por tiempo.

Si el frontend/producto necesita restringir el escaneo a una ventana horaria alrededor del evento,
esa validación **no existe hoy en el backend** y tendría que agregarse o controlarse del lado del
cliente (con el riesgo de que sea fácilmente evadible, al no estar aplicada en el servidor).

### 3.3 Casos borde

| Caso | Comportamiento actual |
|---|---|
| QR ya escaneado | `409 Conflict` con el estado actual de la entrada (no se re-mutan `Usada`/`FechaUso`; queda el timestamp del primer escaneo). |
| Token inexistente / mal escrito | `404 Not Found`. |
| Reserva **cancelada** después de haberse generado/asignado las entradas | **El QR sigue siendo válido y escaneable.** `ValidarAsync` no consulta `Reserva.Estado` ni `Reserva.EstadoPago` en ningún momento — una entrada de una reserva cancelada o reembolsada puede validarse con éxito igual que una activa. Si el producto requiere bloquear el acceso tras una cancelación, es un gap a resolver en backend, no algo que el frontend pueda mitigar por su cuenta. |
| Usuario sin permiso escanea un QR de otro espacio/negocio | `403 Forbidden` — se compara el `sub` del JWT contra `Reserva.Espacio.PropietarioId`; un dueño de otro espacio nunca puede validar tokens ajenos. |
| Se intenta asignar más invitados que entradas disponibles | `409 Conflict` con el conteo exacto de disponibles vs. solicitados en el mensaje. |
| Espacio sin `ValidarAforo` activo | No se genera ninguna entrada QR para sus reservas — ambos endpoints (`asignar`/`validar`) simplemente no tendrán datos con los que operar (0 disponibles / 404 en cualquier token). |

### 3.4 Autorización — quién puede hacer qué

- **Asignar** (`POST /api/reservas/{id}/invitaciones/asignar`): el Cliente que hizo la reserva (`Reserva.UsuarioId ==
  sub`). Cualquier otro usuario autenticado recibe `403`.
- **Validar/escanear** (`POST /api/invitaciones/{tokenQr}/validar`): **exclusivamente** el
  Anfitrión dueño del espacio (`Espacio.PropietarioId == sub`). El cliente que hizo la reserva **no
  puede** escanear sus propias entradas ni las de nadie más.
- No hay verificación por el claim `role` (`admin`/`staff`/`cliente`) en ningún endpoint de este
  módulo — la autorización es 100% por propiedad (`PropietarioId`/`UsuarioId`), no por rol.
- **No existe un tipo de cuenta "personal de puerta"** separado del login del Anfitrión. Hoy, solo
  la cuenta dueña del espacio puede escanear — no hay forma de delegar el escaneo a un empleado con
  una cuenta propia y permisos acotados a un solo espacio. Si el producto necesita eso, es una
  funcionalidad a construir, no algo ya soportado por la API actual.
- Multi-tenant: la separación entre negocios está correctamente garantizada — un dueño de un
  espacio nunca puede validar ni ver entradas de otro espacio que no le pertenezca, porque cada
  token resuelve determinísticamente a una única `Invitacion` → `Reserva` → `Espacio`, y esa cadena
  siempre se compara contra el `sub` del JWT.

### 3.5 Confiabilidad del envío de correo

El envío del correo con el QR es **asíncrono y no persistente**: se encola en memoria
(`System.Threading.Channels`) y un proceso en background lo despacha. Si el servidor se reinicia
con correos pendientes en la cola, **esos correos se pierden sin reintento posterior**. Esto
significa que `enviada: true` en la respuesta de `asignar` indica que el sistema *intentó* enviar
el correo, **no que el invitado efectivamente lo haya recibido**. El frontend no debería usar
`enviada` como confirmación de entrega — solo como confirmación de que la entrada fue asignada.
