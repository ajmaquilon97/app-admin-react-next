# Cambios solicitados al Backend — Integración de Auth

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / ASP.NET Core Identity)
> **Contexto:** el frontend ya está integrado contra los endpoints del swagger. Esta
> lista fija el **contrato exacto que el frontend espera**. Donde el backend difiera,
> pedimos que se ajuste a lo aquí descrito (o lo conversemos si hay impedimento).

---

## 1. Claims del access token (JWT) — **BLOQUEANTE**

El frontend **decodifica** el access token y lee estos claims con **estos nombres y
valores exactos**. El swagger no documenta el contenido del JWT, así que necesitamos
confirmación explícita:

| Claim | Tipo | Valor esperado |
| --- | --- | --- |
| `sub` | string | Id del usuario (GUID) |
| `name` | string | Nombre del usuario |
| `email` | string | Correo |
| `role` | string | **Exactamente `"admin"` o `"staff"`** |
| `iat` | number | Epoch en segundos |
| `exp` | number | Epoch en segundos. Access = **15 min** |

**Acción requerida:** mapear el rol interno a `"admin" | "staff"` y emitirlo en el claim
`role`. Hoy ustedes modelan `tipoUsuarioId` (catálogo: 1=Administrador, 2=Propietario,
3=Cliente); necesitamos la traducción a esos dos valores. **Si el claim no sale así, el
control de acceso del frontend no funciona.**

---

## 2. Endpoints de auth — nombres de campo y respuestas

El frontend envía/espera **exactamente** estos cuerpos. Confirmar que coinciden:

### `POST /api/auth/login`
```jsonc
{ "email": "...", "password": "..." }
```
- `200 OK` → `{ "accessToken": string, "refreshToken": string }`
- `401` → credenciales inválidas (mensaje genérico).

### `POST /api/auth/register` (registro web, Fase 1) — **actualizado, ver §9**
```jsonc
{
  "nombre": "...",
  "apellido": "...",
  "email": "...",
  "username": "...",      // derivado del email (parte antes de @)
  "password": "..."
  // sin tipoUsuarioId — el backend siempre asigna 2 (Propietario) en este endpoint
}
```
- `201 Created` → `{ "id": string, "accessToken": string, "refreshToken": string }`
- `409 Conflict` si el correo/username ya existe **como cuenta Propietario** (el mismo
  correo puede existir como Cliente en la app mobile — espacios de identidad separados).

Reemplaza al `POST /api/usuarios` original (que exigía `tipoUsuarioId` manual) — confirmado
por backend junto con el §9/§10.

### `POST /api/auth/refresh`
```jsonc
{ "refreshToken": string }
```
- `200 OK` → `{ "accessToken": string, "refreshToken": string }` (par rotado)
- `401` si inválido/expirado/revocado.

### `POST /api/auth/logout`
```jsonc
{ "refreshToken": string }
```
- Debe **revocar el refresh por el valor del body** (no por el Bearer del access).
- `204 No Content`.

---

## 3. Google OAuth — URL de redirección al frontend — **BLOQUEANTE**

El frontend implementó la vuelta del OAuth en esta ruta **fija**:

```
{FRONTEND_URL}/auth/google/callback?code=<onetimeCode>
```

- **Dev:** `http://localhost:3000/auth/google/callback`
- **Amplify (actual):** `https://develop.d2s2m1gyjncdnl.amplifyapp.com/auth/google/callback`
- **Prod:** (les pasaremos la URL de producción)

**Acción requerida:**
1. Que el callback del backend (`/api/auth/google/callback`) redirija a esa URL con el
   **código de un solo uso** en `?code=` (y `?error=` si el usuario canceló).
   ⚠️ **Nunca** los tokens en la URL.
2. Registrar esa URL del frontend en `appsettings`/config y en la consola de Google Cloud
   como redirect URI autorizado (si aplica a su flujo).

### `POST /api/auth/google/exchange`
```jsonc
{ "code": "<onetimeCode>" }
```
- `200 OK` → `{ "accessToken": string, "refreshToken": string }`
- `401` si el código es inválido/expirado/ya usado.

---

## 4. Formato de errores — uniforme

Todos los errores deben responder con este shape (lo usamos para mostrar el mensaje):
```jsonc
{ "message": string, "errors"?: { "<campo>": string[] } }
```
Si algún endpoint devuelve texto plano u otro formato, el usuario verá mensajes genéricos.

---

## 5. CORS

Habilitar CORS para los siguientes orígenes del frontend:
- **Dev:** `http://localhost:3000`
- **Amplify (actual):** `https://develop.d2s2m1gyjncdnl.amplifyapp.com`

---

## 6. Infraestructura (Azure)

- Confirmar que las sesiones **no dependen** de la cookie de afinidad `ARRAffinity`
  (el refresh/exchange pueden ejecutarse contra distinta instancia).
- URL base del backend configurada en el front: `https://obsidiantechlab-001-site1.htempurl.com`

---

---

## 7. Campo `imagenPortada` en `POST /api/espacios` — **PENDIENTE**

El frontend sube la imagen directamente a S3 y obtiene una URL pública. Necesitamos que
`EspacioRequest` acepte un campo adicional para almacenarla:

```jsonc
// POST /api/espacios — body actualizado
{
  "titulo": "...",
  "descripcion": "...",
  "propietarioId": "...",
  "tipoEspacioId": 1,
  "ciudad": "...",
  "provincia": "...",
  "linkUbicacion": "https://maps.google.com/...",
  "referencia": "...",
  "validarAforo": false,
  "maxCapacidad": 20,
  "imagenPortada": "https://agora-espacios.s3.amazonaws.com/espacios/abc.jpg",  // ← NUEVO, nullable
  "imagenesGaleria": [                                                           // ← NUEVO, array, máx. 7
    "https://agora-espacios.s3.amazonaws.com/espacios/img1.jpg",
    "https://agora-espacios.s3.amazonaws.com/espacios/img2.jpg"
  ]
}
```

Y que `EspacioResponse` los devuelva también:
```jsonc
{
  "id": 1,
  ...
  "imagenPortada": "https://...",    // nullable
  "imagenesGaleria": ["https://..."] // array, puede estar vacío
}
```

**Acciones requeridas:**
1. Agregar columna `ImagenPortada` (varchar(500), nullable) a la tabla de espacios.
2. Agregar tabla `EspacioImagen` con: `Id`, `EspacioId` (FK), `Url` (varchar(500)), `Orden` (int) — relación 1:N, máx. 7 registros por espacio.
3. Exponer ambos campos en `EspacioRequest` y `EspacioResponse`.

---

## 8. Campo `numeroRuc` en `PUT /api/usuarios/{id}` — **SUPERADO POR §12**

El paso de perfil del onboarding pide cédula (identidad personal) y, para poder
facturar electrónicamente las reservas de cada anfitrión
(`docs/backend-facturacion-electronica-sri-spec.md`), también se necesitaba un RUC.

Backend había resuelto esto agregando datos fiscales genéricos directamente a
`CompletarPerfilRequest`/`Usuario` (`tipoIdentificacion`, `numeroIdentificacion`,
`razonSocial`, `direccion` — ver `docs/swagger-api-login.json`):

```jsonc
// PUT /api/usuarios/{id} — contrato actual del backend (sin cambios todavía)
{
  "tipoUsuarioId": 2,
  "numeroCedula": "1207627168",
  "fechaNacimiento": "1980-07-19",
  "rutaFotoCedula": "",
  "tipoIdentificacion": "04",
  "numeroIdentificacion": "1207627168001",
  "razonSocial": "...",
  "direccion": "..."
}
```

**Este modelo queda superado por el §12**: esos 4 campos son datos del **negocio** del
anfitrión, no de su perfil personal, y deben vivir en una entidad `Negocio` separada con
sus propias APIs — no en `Usuario`. El frontend ya adelantó este cambio: dejó de enviar
`tipoIdentificacion`/`numeroIdentificacion`/`razonSocial`/`direccion` en el `PUT
/api/usuarios/{id}` (tanto desde el onboarding como desde Configuración > Perfil). Hoy
esos datos se capturan en Configuración > Negocio, pero **solo contra un mock local**
(`src/lib/configuracion-mock.ts`) — no se persisten en ningún backend real hasta que
exista la API descrita en el §12.

---

## 9. `tipoUsuarioId` en el registro vía Google + aislamiento por aplicación — **BLOQUEANTE**

En el registro por formulario, el frontend envía explícitamente `tipoUsuarioId: 2`
(Propietario) en `POST /api/usuarios` (§2). En el flujo de Google, en cambio,
el frontend **no crea el usuario**: solo redirige a `/api/auth/google` y luego canjea el
código en `POST /api/auth/google/exchange` (§3), que devuelve directamente el par de
tokens. El frontend no tiene forma de mandar `tipoUsuarioId` en ese flujo porque no existe
un paso intermedio con body propio.

Además, esta plataforma web **no es la única aplicación** que va a autenticar contra este
backend con Google: existe (o va a existir) una app mobile independiente, con su **propio
Client ID de Google** (cada plataforma requiere uno distinto de todas formas — ver nota
de arquitectura más abajo). Los requisitos son:

1. **`tipoUsuarioId` distinto por aplicación.** Un alta vía Google desde esta web debe
   quedar con `tipoUsuarioId = 2` (Propietario, igual que el registro local). Un alta vía
   Google desde la app mobile debe quedar con el `tipoUsuarioId` que corresponda (según
   catálogo: 3 = Cliente parece el candidato natural — a confirmar con backend).
2. **Cuentas completamente independientes entre web y mobile**, aunque sea la **misma
   cuenta de Google** (mismo email/`sub` de Google) la que inicie sesión en ambas. Es
   decir: si alguien ya tiene cuenta creada desde la web y luego abre la app mobile con
   la misma cuenta de Google, el backend **no debe loguearlo en la cuenta web existente**
   — debe tratarlo como una alta nueva y separada para mobile (con su propio `Usuario.Id`,
   su propio `tipoUsuarioId`, etc.). Un usuario de mobile nunca debe poder loguearse en la
   web ni viceversa.

**Cómo distinguir el origen sin depender de un flag que el cliente pueda falsificar:**
el `client_id` de Google que firma/valida el `id_token` en el intercambio **ya identifica
de forma confiable la aplicación de origen** (web vs. mobile), porque cada plataforma usa
un Client ID distinto en Google Cloud Console. El backend debería:
- Recibir/validar contra **ambos** Client IDs (uno por app) en el exchange.
- Usar **qué Client ID validó el token** — no el email por sí solo — como clave para
  buscar/crear el `Usuario`, de modo que la identidad de Google quede *scopeada por app*
  (ej. clave compuesta `(GoogleSub, ClientId/App)` en vez de solo `Email`).

**Acción requerida:**
1. Confirmar que el exchange puede aceptar/diferenciar los dos Client IDs (web y mobile).
   Nota de flujo: como ningún cliente tiene credenciales propias de Google, la elección de
   `client_id`/`redirect_uri` ocurre al **iniciar** el OAuth (`GET /api/auth/google`), no en
   el exchange — se resuelve con dos endpoints de arranque (uno por app) o uno solo con un
   parámetro de contexto. El exchange (`POST /api/auth/google/exchange`) puede seguir siendo
   único, porque el código de un solo uso que genera el backend ya "recuerda" de qué app vino.
2. Definir el `tipoUsuarioId` que corresponde a las altas de la app mobile.
3. Confirmar que la búsqueda de usuario existente al hacer login con Google queda
   scopeada por app (no solo por email), para que web y mobile generen registros
   `Usuario` independientes aunque compartan la misma cuenta de Google.
4. Confirmar qué `tipoUsuarioId` asigna hoy el alta automática de usuarios vía Google
   desde esta web, si aún no se ajustó a lo anterior.

---

## 10. Aislamiento de identidad entre aplicaciones (modelo general, no solo Google) — **BLOQUEANTE**

Hoy el backend modela **una sola tabla `Usuario`** compartida entre esta web de
anfitriones y la futura app mobile de usuarios finales, con **el email como
identificador único global** — tanto para login por Google (§9) como para login por
formulario (`POST /api/auth/login`, §2).

Esto tiene un problema de producto: si alguien ya tiene cuenta como **anfitrión** (creada
en la web, por Google o por formulario) y luego abre la **app mobile** de usuarios
finales, **no debe entrar automáticamente** a esa cuenta solo porque el email coincide.
Debe ser tratado como si no tuviera cuenta en esa app, y verse forzado a **crear una
cuenta nueva y explícita ahí** (por Google o por formulario) — completamente
independiente de su cuenta de anfitrión, aunque comparta el mismo correo. Lo mismo aplica
en sentido inverso (usuario final de mobile no debe auto-loguearse como anfitrión en la
web).

Esto generaliza lo pedido en el §9 (que hoy solo cubre el flujo Google) a **todos los
métodos de autenticación**, incluyendo correo/contraseña.

**Acción requerida:**

1. **Cambiar la clave de unicidad de `Usuario`.** Dejar de usar `unique(Email)` y pasar a
   una unicidad **compuesta por email + aplicación/tipo de usuario** (ej.
   `unique(Email, TipoUsuarioId)`, o `unique(Email, AplicacionId)` si prefieren modelar
   "aplicación" como concepto propio separado del rol). Esto permite que el mismo correo
   tenga **dos filas `Usuario` independientes**: una como anfitrión, otra como usuario
   final — cada una con su propio `Id`, su propia contraseña/hash, su propio
   `tipoUsuarioId`, etc.
2. **Login y registro por formulario deben resolverse por app, no solo por email.** Al
   igual que en Google, el backend no debe confiar en un campo que el cliente pueda mandar
   libremente (ej. un `"app": "mobile"` en el body) para decidir en qué scope buscar el
   usuario — eso lo puede falsificar cualquier cliente y permitiría a un usuario final
   intentar loguearse contra cuentas de anfitrión (o viceversa) solo cambiando ese campo.
   El scope de app debe salir de **algo controlado del lado servidor**: por ejemplo, que
   cada aplicación golpee una ruta o API key propia (`POST /api/usuarios` /
   `POST /api/auth/login` para la web de anfitriones vs. rutas equivalentes dedicadas a la
   app mobile, ej. `POST /api/usuarios-finales` / `POST /api/auth/login-finales`, o un
   API key de servidor distinto por app si prefieren no duplicar rutas).
3. **Confirmar el comportamiento esperado en cada combinación:**
   - Anfitrión (web) intenta loguearse en mobile con el mismo email/Google → debe fallar
     como "no existe cuenta", no autenticar la cuenta de anfitrión.
   - Anfitrión (web) intenta *registrarse* en mobile con el mismo email → debe permitirse,
     creando una fila `Usuario` nueva e independiente (mismo email, distinto `Id`).
   - Mismo comportamiento en sentido inverso (usuario final → intento de acceso/alta como
     anfitrión).
4. Confirmar si conviene modelar esto con una tabla `Aplicacion` explícita
   (`Id`, `Nombre` = "Web-Anfitriones" | "Mobile-UsuariosFinales") referenciada desde
   `Usuario`, en vez de inferir la app indirectamente desde `tipoUsuarioId` — esto evita
   ambigüedad si en el futuro un mismo `tipoUsuarioId` pudiera existir en más de una app.

---

## 11. `provinciaId`/`ciudadId` en `PUT /api/usuarios/{id}` — **REVERTIDO, ver `backend-negocio-spec.md §5`**

> Backend implementó este pedido tal cual (confirmado en el swagger). Con el uso real
> resultó ser el lugar equivocado: la ubicación no tiene relevancia en el perfil
> personal. `docs/backend-negocio-spec.md §5` pide **revertir esto** — quitar
> `provinciaId`/`ciudadId` de `Usuario` y agregarlos a `Negocio` en su lugar, confirmado
> contra una respuesta real de `GET /api/negocios/me` que no los tiene. Se deja el
> pedido original abajo como referencia histórica.

El step 3 del onboarding (perfil) le pide al anfitrión su provincia y ciudad de
residencia, usando el catálogo real de `GET /api/catalogos/ubicaciones`
(`ProvinciaResponse[]`, ya consumido desde
[catalogos-api.ts](../src/lib/catalogos-api.ts) — antes esta lista estaba mockeada en el
frontend). El problema: **`CompletarPerfilRequest` no tiene ningún campo para
provincia/ciudad**, así que hoy el usuario selecciona su ubicación en el formulario pero
ese dato **se descarta silenciosamente** — no viaja en el `PUT /api/usuarios/{id}` ni se
persiste en ningún lado.

```jsonc
// PUT /api/usuarios/{id} — campos que faltan agregar
{
  // ...campos existentes de CompletarPerfilRequest...
  "provinciaId": 5,   // ← NUEVO, FK al catálogo de GET /api/catalogos/ubicaciones
  "ciudadId": 12       // ← NUEVO, FK a la ciudad dentro de esa provincia
}
```

Mismo patrón de IDs que ya usa `EspacioRequest` (que también tiene `ProvinciaId`/`CiudadId`
opcionales) — preferimos mandar los IDs del catálogo en vez de los nombres como texto
libre, para no duplicar lógica de validación/normalización en el backend.

**Acción requerida:**
1. Agregar `ProvinciaId` (int, nullable) y `CiudadId` (int, nullable) a `Usuario`.
2. Agregar `provinciaId`/`ciudadId` a `CompletarPerfilRequest` (recordar que hoy tiene
   `"additionalProperties": false` — sin este cambio el backend ignora/rechaza el campo).
3. Validar que `ciudadId` pertenezca efectivamente a `provinciaId` (misma validación que
   ya deben tener para `EspacioRequest`).
4. Exponer ambos en `UsuarioResponse` para poder prellenar el formulario al reabrir el
   perfil (Configuración > Perfil, onboarding al reanudar, etc.).

---

## 12. Separar `Negocio` de `Usuario` — API propia — **NUEVO, BLOQUEANTE**

Hoy el backend modela los datos fiscales/comerciales (`tipoIdentificacion`,
`numeroIdentificacion`/RUC, `razonSocial`, `direccion` — §8) directamente sobre
`Usuario`, en `CompletarPerfilRequest`/`PUT /api/usuarios/{id}`. Conceptualmente esto
mezcla dos cosas distintas:

- **Perfil personal** del anfitrión: nombre, apellido, cédula, fecha de nacimiento, foto
  de documento — esto sí es 1:1 con `Usuario`.
- **Negocio** del anfitrión: RUC, razón social, dirección fiscal, y (a futuro) categoría,
  nombre comercial, teléfono del negocio, logo, etc. — esto es una entidad aparte, que en
  el modelo de espacios/reservas ya se referencia indirectamente (facturación SRI por
  reserva). Un mismo usuario podría eventualmente tener más de un negocio, o el negocio
  podría necesitar su propio ciclo de vida (activarlo, verificarlo, etc.) independiente
  del perfil personal.

El frontend ya separó esto de su lado: Configuración tiene un tab **Perfil** (datos
personales, contra `PUT /api/usuarios/{id}` real) y un tab **Negocio** (RUC, razón
social, dirección, categoría, etc. — hoy contra un mock local, ver §8) — pero sin una
API de Negocio real, esos datos simplemente no se guardan en ningún lado.

**Acción requerida:**
1. Crear una entidad `Negocio` (tabla propia) con al menos: `Id`, `UsuarioId` (FK,
   propietario), `NombreNegocio`, `TipoIdentificacion` (catálogo SRI, default "04" RUC),
   `NumeroIdentificacion` (el RUC), `RazonSocial`, `Direccion`, y opcionalmente
   `Categoria`, `TelefonoNegocio`, `Descripcion`, `LogoUrl` (mismos campos que ya
   maneja el frontend en `NegocioTab`).
2. Exponer APIs dedicadas, análogas al patrón de `Usuario`:
   - `POST /api/negocios` — crear el negocio del usuario autenticado (probablemente
     solo un negocio por usuario por ahora; a definir si se permite más de uno).
   - `GET /api/negocios/me` (o `/api/negocios/{id}`) — obtener el negocio del usuario
     autenticado, para prellenar el formulario.
   - `PUT /api/negocios/{id}` — actualizar los datos del negocio.
3. Quitar `tipoIdentificacion`/`numeroIdentificacion`/`razonSocial`/`direccion` de
   `CompletarPerfilRequest`/`Usuario` una vez exista la entidad `Negocio` (o, si prefieren
   una migración gradual, dejarlos deprecados en `Usuario` mientras ambos caminos
   convivan, pero comunicarnos la fecha de corte).
4. Definir si la referencia es 1:1 (`Usuario` → `Negocio`) o si un `Usuario` puede tener
   varios `Negocio` (ej. alguien que administra espacios de más de una empresa) — el
   frontend hoy asume 1:1.

---

## Checklist de confirmación

- [ ] Claim `role` = `"admin"` | `"staff"` en el access token (§1)
- [ ] Campos `email` / `password` en login y registro (§2)
- [x] `POST /api/auth/register` devuelve `{ id, accessToken, refreshToken }` con `201`
      (reemplaza a `POST /api/usuarios`) (§2)
- [ ] `logout` revoca por `refreshToken` del body → `204` (§2)
- [ ] Callback de Google redirige a `{FRONTEND_URL}/auth/google/callback?code=...` (§3)
- [ ] `google/exchange` devuelve el par de tokens (§3)
- [ ] Errores con shape `{ message, errors? }` (§4)
- [ ] CORS para `http://localhost:3000` (§5)
- [ ] URL base real del backend entregada (§6)
- [x] ~~Datos fiscales en `CompletarPerfilRequest`~~ — superado, resuelto vía §12
      (entidad `Negocio` separada, confirmado)
- [x] `tipoUsuarioId = 2` confirmado para registro web — vía `POST /api/auth/register`
      dedicado (no vía Google branching por client_id como se planteó originalmente) (§9)
- [x] `tipoUsuarioId` definido para altas mobile = 3 (Cliente) — vía
      `POST /api/mobile/auth/register` y `POST /api/mobile/auth/google` dedicados (§9)
- [x] Aislamiento de Google resuelto **por namespace de ruta**, no por Client ID
      compartido en un mismo endpoint: `/api/auth/*` (web) vs `/api/mobile/auth/*`
      (mobile) son rutas completamente separadas, cada una fuerza su propio
      `tipoUsuarioId` — logra el mismo objetivo del §9 con un mecanismo más simple (§9)
- [x] Búsqueda/alta de usuario scopeada por app, no solo por email — confirmado
      explícitamente: *"Web y Mobile son espacios de identidad separados"*, mismo correo
      puede repetirse entre una cuenta Propietario y una Cliente (§10)
- [x] Login/registro por formulario scopeado por app vía ruta propia
      (`/api/auth/*` vs `/api/mobile/auth/*`), no por campo enviado por el cliente (§10)
- [x] Confirmado: cuenta de anfitrión y cuenta de cliente mobile con el mismo correo son
      independientes (§10)
- [ ] No confirmado si `Aplicacion` se modela como tabla explícita o se infiere de la ruta
      de registro — detalle de implementación no visible desde el contrato de API,
      no bloqueante (§10)
- [x] `provinciaId`/`ciudadId` agregados a `CompletarPerfilRequest` y `UsuarioResponse`,
      con validación de que la ciudad pertenezca a la provincia (§11)
- [x] `fotoPerfilUrl` agregado a `CompletarPerfilRequest`/`UsuarioResponse` (no pedido
      explícitamente en el doc, pero resuelve el gap de `backend-configuracion-anfitrion-spec.md §1`)
- [x] Entidad `Negocio` creada — vía `GET`/`PUT /api/negocios/me` (patrón upsert, en vez
      de `POST` + `PUT /{id}` como se sugirió en el §12; mismo resultado) (§12)
- [x] Datos fiscales retirados de `Usuario`/`CompletarPerfilRequest` — confirmado en el
      swagger actualizado, ya no aparecen en el schema (§12)
