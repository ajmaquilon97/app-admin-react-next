# Especificación de Configuración del Anfitrión — Backend

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Objetivo:** exponer los endpoints necesarios para la pantalla "Configuración" del
> panel de anfitrión (`/configuracion`), donde el anfitrión edita su perfil, los datos
> de su negocio, y cómo se aceptan las reservas de cada uno de sus espacios.
> **Contexto:** el frontend ya tiene la UI construida y funcionando con datos mock
> (`src/modules/configuracion/`, antes `src/lib/configuracion-mock.ts` — ya eliminado)
> para poder avanzar en paralelo. Esta spec traduce esa UI a un contrato concreto para
> reemplazar el mock por los endpoints reales, sin cambiar la interfaz pública del
> módulo (`ConfiguracionService`, mismo patrón que se hizo con `FinancieroService`).
>
> **Estado: las 3 secciones confirmadas y conectadas al backend real** (ver §0).

---

## 0. Las tres secciones y su estado actual

| Pestaña | Qué edita | Estado |
| --- | --- | --- |
| **Perfil** | Nombre, apellido, teléfono, foto de perfil, documento de identidad | ✅ Confirmado y conectado. `GET`/`PUT /api/usuarios/{id}` ya exponen `fotoPerfilUrl` (además de `nombre`, `apellido`, `numeroCedula`, `fechaNacimiento`, `rutaFotoCedula`, y `provinciaId`/`ciudadId` — ver `docs/backend-cambios-solicitados.md §11`). `telefono` sigue sin fuente en `UsuarioResponse` — no incluido en este alcance. |
| **Negocio** | Nombre del negocio, RUC, categoría, dirección, ciudad, provincia, teléfono, descripción, logo | ✅ Confirmado y conectado. `GET`/`PUT /api/negocios/me` (upsert), ver `docs/backend-negocio-spec.md`. `ciudad`/`provincia` como texto libre **no están** en `NegocioRequest` — pendiente si se quieren persistir. |
| **Reservas** | Modo de confirmación de reservas, **por espacio** | ✅ Confirmado y conectado (§3.1 — alcance mínimo). `modoConfirmacion` ya existe en `EspacioRequest`/`EspacioResponse`. El estado `solicitada` + endpoints de aprobar/rechazar solicitud (§3.2) **no** están implementados — alcance no abordado todavía, consistente con la recomendación de esta spec de dejarlo para después. |

---

## 1. Perfil del anfitrión

### 1.1 Qué falta en el modelo `Usuario`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `fotoPerfilUrl` | string, nullable | **Nuevo.** Avatar del usuario — distinto de `rutaFotoCedula` (que es la foto del documento de identidad, no una foto de perfil). |
| `telefono` | string | Confirmar si ya existe en el modelo (se usa en `checkAvailability` con `phoneNumber`, pero no se ha visto expuesto en un GET). Debe ser editable desde esta pantalla. |
| `rutaFotoCedula` | string | Ya existe (Fase 2 onboarding) — esta pantalla debe poder **actualizarlo**, no solo capturarlo una vez. |

### 1.2 Endpoints

**`GET /api/usuarios/{id}`** — nuevo (o confirmar si ya existe con otro shape). Necesario
para precargar el formulario; hoy solo existe `GET /api/usuarios/me/onboarding-status`,
que da progreso booleano, no los datos.

```jsonc
// 200 OK
{
  "id": "guid",
  "nombre": "...",
  "apellido": "...",
  "email": "...",
  "telefono": "...",
  "fotoPerfilUrl": "https://...",       // nullable
  "rutaFotoCedula": "https://..."       // nullable
}
```

**`PUT /api/usuarios/{id}`** — ya existe, reutilizar. Debe aceptar también `fotoPerfilUrl`
si se agrega el campo:

```jsonc
{
  "nombre": "...",
  "apellido": "...",
  "telefono": "...",
  "fotoPerfilUrl": "https://...",
  "rutaFotoCedula": "https://..."
}
```

El frontend sube la imagen a S3 primero (`/api/upload/presign`, ya implementado) y manda
la URL resultante — el backend no recibe binarios acá.

---

## 2. Negocio

Entidad nueva, 1:1 con el `Usuario` (anfitrión). No existe hoy ni en el modelo ni en
ningún endpoint.

### 2.1 Modelo propuesto

```csharp
public class Negocio
{
    public Guid    Id              { get; set; }
    public Guid    UsuarioId       { get; set; }   // FK, único (1:1)
    public string  NombreNegocio   { get; set; } = default!;
    public string  Ruc             { get; set; } = default!;
    public string  Categoria       { get; set; } = default!;
    public string  Direccion       { get; set; } = default!;
    public string  Ciudad          { get; set; } = default!;
    public string  Provincia       { get; set; } = default!;
    public string  TelefonoNegocio { get; set; } = default!;
    public string  Descripcion     { get; set; } = default!;
    public string? LogoUrl         { get; set; }
    public DateTime CreatedAt      { get; set; }
    public DateTime? UpdatedAt     { get; set; }
}
```

**Pregunta abierta:** ¿`Categoria` es texto libre o debería salir de un catálogo (similar
a `TipoEspacio`)? El mock actual lo trata como texto libre; si negocio quiere reportes por
categoría de negocio, conviene catalogarlo desde ya.

### 2.2 Endpoints

**`GET /api/negocios/me`**
```jsonc
// 200 OK
{
  "nombreNegocio": "...",
  "ruc": "...",
  "categoria": "...",
  "direccion": "...",
  "ciudad": "...",
  "provincia": "...",
  "telefonoNegocio": "...",
  "descripcion": "...",
  "logoUrl": "https://..."
}
// 404 si el anfitrión todavía no completó esta información
```

**`PUT /api/negocios/me`** — crea si no existe, actualiza si ya existe (upsert). Mismo
body que el GET. `200 OK` con el recurso actualizado.

---

## 3. Configuración de reservas por espacio

Esta es la parte con más impacto: define **cómo nace una reserva** cuando un usuario
final reserva un espacio. Hoy (según `src/modules/bookings/types/index.ts` y
`src/lib/reservas/api.ts`) el flujo de estados es:

```
BookingStatus: pendiente | confirmada | reagendada | cancelada | finalizada
PaymentStatus: pendiente | pagado_parcialmente | pagado | reembolsado
POST /api/reservas/{id}/confirmar   ← ya existe
POST /api/reservas/{id}/cancelar    ← ya existe
```

El anfitrión necesita elegir, **por cada espacio**, uno de estos tres modos:

| Modo (frontend) | Comportamiento esperado |
| --- | --- |
| `inmediata` | El usuario paga al reservar → la reserva nace **`confirmada`** y `pagado` directamente. Sin acción del anfitrión. |
| `pago_confirmacion_manual` | El usuario paga al reservar → la reserva nace **`pendiente`** / `pagado`, y el anfitrión la pasa a `confirmada` con el endpoint **ya existente** `POST /api/reservas/{id}/confirmar`. **No requiere cambios de backend más allá de este flag.** |
| `solicitud_aprobacion` | El usuario solicita el espacio **sin pagar todavía** → la reserva nace en un estado nuevo (`solicitada`, ver §3.2) → el anfitrión debe **aprobarla** antes de que se habilite el pago → una vez pagado, pasa a `confirmada` (puede reutilizar el flujo de `pago_confirmacion_manual` desde ahí, o confirmarse automáticamente al pagar — a definir con producto). |

### 3.1 Campo nuevo en `Espacio`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `modoConfirmacion` | enum: `inmediata` \| `pago_confirmacion_manual` \| `solicitud_aprobacion` | Default `inmediata` para espacios existentes (no romper el comportamiento actual). |

Agregar a `EspacioRequest`/`EspacioResponse` (`src/lib/spaces-api.ts` en el frontend), igual
que se hizo con `imagenPortada`/`imagenesGaleria` (ver `docs/backend-cambios-solicitados.md §7`).

### 3.2 Nuevo estado `solicitada` en `Reserva` — solo si se implementa el modo 3

Si se decide implementar `solicitud_aprobacion` de punta a punta (creación de la reserva
por el usuario final, no solo esta pantalla de configuración), se necesita:

- Extender `EstadoReservaApi` con `solicitada` (previo a `pendiente`).
- La app de cliente final, al crear la reserva, debe consultar `modoConfirmacion` del
  espacio y decidir el estado inicial (`solicitada` vs `pendiente` vs `confirmada`) y si
  se habilita el cobro de inmediato o no. **Esto vive fuera de este repo** (es la app de
  reservas del cliente final) — se documenta acá porque es la razón de ser de esta
  configuración, pero no es parte del alcance de esta spec.
- Nuevos endpoints para el anfitrión:
  - **`POST /api/reservas/{id}/aprobar-solicitud`** → `solicitada` → `pendiente` (habilita
    el pago).
  - **`POST /api/reservas/{id}/rechazar-solicitud`** → `solicitada` → `cancelada`, con
    motivo (mismo shape que `cancelar`, ver `cancelarReserva` en `src/lib/reservas/api.ts`).

**Alcance recomendado para una primera entrega:** implementar únicamente §3.1 (el campo
`modoConfirmacion` y sus endpoints de lectura/escritura, ver §3.3) para que esta pantalla
de configuración funcione end-to-end. El modo `solicitud_aprobacion` puede guardarse como
preferencia desde ya aunque el flujo de creación de reservas todavía no lo respete —
igual que la pantalla de Perfil/Negocio se entrega antes de que todo lo dependa. Definir
con producto cuándo se aborda §3.2.

### 3.3 Endpoints (configuración, no el flujo de aprobación en sí)

**`GET /api/espacios/mis-espacios/configuracion-reservas`** (o agregar `modoConfirmacion`
directamente a la respuesta ya existente de `GET /api/espacios` — **preferido**, evita un
endpoint nuevo):

```jsonc
// dentro de cada EspacioResponse
{
  "id": 1,
  "titulo": "Cancha Sintética 1",
  ...
  "modoConfirmacion": "inmediata"
}
```

**`PUT /api/espacios/{id}/configuracion-reservas`** — o, más simple, aceptar
`modoConfirmacion` en el `PUT /api/espacios/{id}` ya existente (`updateEspacio`).

```jsonc
// PUT /api/espacios/{id}
{ "modoConfirmacion": "pago_confirmacion_manual" }
```
`200 OK` con el `EspacioResponse` actualizado.

**Recomendación:** reutilizar el CRUD de `Espacio` ya existente en vez de crear endpoints
paralelos — es un campo más del espacio, no un recurso aparte.

---

## 4. Resumen de endpoints requeridos

| Método | Ruta | Estado |
| --- | --- | --- |
| `GET` | `/api/usuarios/{id}` | Nuevo (o confirmar existente) |
| `PUT` | `/api/usuarios/{id}` | Ya existe — agregar `fotoPerfilUrl` |
| `GET` | `/api/negocios/me` | Nuevo |
| `PUT` | `/api/negocios/me` | Nuevo (upsert) |
| `GET` | `/api/espacios` (mis-espacios) | Ya existe — agregar `modoConfirmacion` a la respuesta |
| `PUT` | `/api/espacios/{id}` | Ya existe — aceptar `modoConfirmacion` en el body |
| `POST` | `/api/reservas/{id}/aprobar-solicitud` | Nuevo — **solo si se implementa §3.2** |
| `POST` | `/api/reservas/{id}/rechazar-solicitud` | Nuevo — **solo si se implementa §3.2** |

Formato uniforme con el resto de la API: JSON `camelCase`, errores `{ "message": string, "errors"?: {...} }`.

---

## 5. Preguntas abiertas para producto/backend

1. ¿`GET /api/usuarios/{id}` ya existe con otro nombre/shape, o hay que crearlo desde cero?
2. ¿La `Categoria` del negocio es texto libre o un catálogo?
3. Para `solicitud_aprobacion`: cuando el anfitrión aprueba la solicitud, ¿el pago se
   habilita para que el usuario pague después (queda `pendiente`), o se cobra
   automáticamente con un método ya guardado y pasa directo a `confirmada`?
4. ¿Cuándo se aborda la implementación de creación de reservas respetando
   `modoConfirmacion` en la app de cliente final? Es lo que le da efecto real a esta
   configuración — sin eso, el anfitrión puede *guardar* su preferencia pero no *ver*
   el efecto.

---

## 6. Checklist de implementación

- [x] Campo `fotoPerfilUrl` en `Usuario` — confirmado.
- [x] `GET /api/usuarios/{id}` devuelve perfil completo para precargar el formulario —
      confirmado.
- [x] `PUT /api/usuarios/{id}` acepta `fotoPerfilUrl` además de los campos existentes —
      confirmado.
- [x] Entidad `Negocio` (1:1 con `Usuario`) + `GET`/`PUT /api/negocios/me` (upsert) —
      confirmado (ver `docs/backend-negocio-spec.md`).
- [x] Campo `modoConfirmacion` en `Espacio`, expuesto en `GET`/`PUT` de espacios —
      confirmado (`string`, nullable — no se pudo confirmar si el backend aplica
      `"inmediata"` como default real en la base de datos para espacios existentes con
      el valor en `null`; el frontend lo trata como `"inmediata"` si viene vacío).
- [ ] No abordado con producto el alcance de §3.2 (estado `solicitada` + endpoints de
      aprobar/rechazar) — sigue sin ser bloqueante, no se implementó.
- [x] Reemplazado `src/lib/configuracion-mock.ts` por las llamadas reales — el archivo
      se eliminó, ya no queda ningún mock en el módulo de Configuración.

**Gap nuevo detectado (fuera del alcance original de esta spec):** el `EspacioRequest`/
`EspacioResponse` real usa `provinciaId`/`ciudadId` (FK a catálogo) + `provinciaNombre`/
`ciudadNombre`, pero el frontend (`src/lib/spaces-api.ts`) todavía modela `ciudad`/
`provincia` como texto libre — no se tocó en esta tanda de cambios porque no formaba
parte de lo confirmado por backend hoy, pero es un desajuste real a resolver cuando se
toque el módulo de Espacios.
