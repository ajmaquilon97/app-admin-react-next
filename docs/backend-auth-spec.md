# Especificación de Autenticación — Backend (ASP.NET Core Identity)

> **Para:** equipo de Backend (.NET)
> **De:** equipo de Frontend (Next.js)
> **Objetivo:** evolucionar `POST /api/usuarios` y agregar los endpoints faltantes
> para soportar **registro local (correo + contraseña)** y **login con Google**
> conviviendo en el mismo modelo de usuario, usando **ASP.NET Core Identity**.

---

## 0. Flujo completo y frontera de responsabilidad

> **Regla de oro:** el **backend autentica y emite TOKENS**; **Next construye y guarda la
> SESIÓN** (cookie `httpOnly` cifrada). El navegador **nunca** habla directo con el backend:
> siempre pasa por Next. El contrato del backend termina en "devuelvo `{ accessToken, refreshToken }`".

### Registro local
```
Navegador → Next (Server Action register)
   → POST /api/usuarios   { nombre, correo, username, contraseña, tipoUsuarioId }
   ← 201 { id, accessToken, refreshToken }
   → Next cifra el par en la cookie httpOnly  ⇒ SESIÓN creada
   → redirect /onboarding
        → PUT /api/usuarios/{id}   { apellido, numeroCedula, fechaNacimiento }
```

### Login local
```
Navegador → Next (Server Action login)
   → POST /api/auth/login   { correo, contraseña }
   ← 200 { accessToken, refreshToken }
   → cookie httpOnly  ⇒ SESIÓN  → redirect /dashboard
```

### Login con Google (OAuth dirigido por backend)
```
Navegador → Next → GET /api/auth/google
   → Google (consentimiento) → GET /api/auth/google/callback?code=...
   → backend: intercambia code, upsert usuario, emite par de tokens
   → redirige a Next con un CÓDIGO de un solo uso   (⚠️ NUNCA tokens en la URL)
   → Next canjea el código  ⇒ cookie httpOnly  ⇒ SESIÓN  → /onboarding o /dashboard
```

### Petición autenticada (request-time)
```
Navegador --(cookie httpOnly)--> Next --(Authorization: Bearer <access>)--> Backend
   • El backend identifica al usuario leyendo los claims del access token.
   • Si el access expiró, el proxy de Next lo rota con /api/auth/refresh ANTES de llamar.
```

### Renovación / cierre
```
/api/auth/refresh → rota el par (Next actualiza la cookie).
/api/auth/logout  → revoca el refresh en BD + Next borra la cookie.
```

---

## 1. Decisión de arquitectura

Separar **identidad** (quién es el usuario: nombre, cédula, rol…) de los **métodos
de autenticación** (cómo prueba su identidad: contraseña, Google…). Un usuario tiene
**una** identidad y **uno o más** métodos.

Esto es justo lo que ASP.NET Core Identity ya modela:

| Concepto | Tabla de Identity |
| --- | --- |
| Identidad / perfil | `AspNetUsers` (extendida con nuestros campos) |
| Credencial local (contraseña) | columna `PasswordHash` en `AspNetUsers` (**nullable**) |
| Credencial externa (Google) | `AspNetUserLogins` (1 fila por proveedor) |

> **No reinventar.** Usar `UserManager<Usuario>` para crear usuarios, hashear
> contraseñas y registrar logins externos. No escribir hashing a mano.

---

## 2. Modelo de datos

### 2.1 Entidad `Usuario` (extiende `IdentityUser`)

```csharp
public class Usuario : IdentityUser            // hereda Id, UserName, Email, PasswordHash, EmailConfirmed...
{
    public string  Nombre            { get; set; } = default!;
    public string? Apellido          { get; set; }   // nullable: se completa en onboarding
    public DateOnly? FechaNacimiento { get; set; }   // nullable: se completa en onboarding
    public string? NumeroCedula      { get; set; }   // nullable: se completa en onboarding
    public string? RutaFotoCedula    { get; set; }   // verificación diferida (vacío por ahora)
    public int     TipoUsuarioId     { get; set; }   // 1 = Anfitrión/Propietario (default)
}
```

- `PasswordHash` lo gestiona Identity: **NULL** para cuentas solo-Google.
- `Email` / `UserName` los gestiona Identity. `UserName` = parte del correo antes de `@`
  (ej. `juanjo5@gmail.com` → `juanjo5`); Identity ya maneja unicidad y normalización.
- Los campos del onboarding (`Apellido`, `FechaNacimiento`, `NumeroCedula`) son
  **nullable** porque el registro ocurre **antes** del onboarding (ver §5).

### 2.2 Tabla de refresh tokens (revocables)

Identity no trae refresh tokens. Agregar una tabla propia:

```csharp
public class RefreshToken
{
    public Guid     Id          { get; set; }
    public string   UsuarioId   { get; set; } = default!;
    public string   TokenHash   { get; set; } = default!;  // SHA-256 del token, NUNCA el valor en claro
    public DateTime ExpiresAt   { get; set; }
    public DateTime? RevokedAt  { get; set; }
    public string?  ReplacedBy  { get; set; }              // para rotación / detección de reuso
}
```

---

## 3. Manejo de contraseñas

1. El cliente **siempre** envía la contraseña en **texto plano sobre HTTPS** (correcto;
   TLS la protege). El frontend **no** la hashea.
2. El backend la hashea con `UserManager.CreateAsync(usuario, contraseña)` (Identity usa
   PBKDF2 por defecto; configurable a Argon2id si se desea) y guarda **solo el hash**.
3. **Nunca** almacenar ni loguear la contraseña en claro. El campo `contraseña` del
   request es **solo de entrada**.
4. Login: `UserManager.CheckPasswordAsync` compara el hash. Un hash no se revierte.

---

## 4. Cuentas con Google (sin contraseña)

Con Google **no existe contraseña que guardar**. Google entrega un **ID Token** (JWT
firmado por Google) con `email` (ya verificado), `sub` (id único de Google), `name`.

Para una cuenta Google:
1. Crear el `Usuario` **sin contraseña** → `PasswordHash` queda NULL.
2. Registrar el login externo:
   ```csharp
   await userManager.AddLoginAsync(usuario, new UserLoginInfo("Google", googleSub, "Google"));
   ```
3. Marcar `EmailConfirmed = true` (Google ya verificó el correo).
4. ❌ **No** generar una contraseña falsa ni enviar `"contraseña": ""` para hashear.
   Eso crearía un hash válido de cadena vacía → agujero de seguridad.

Un usuario Google que luego quiera contraseña: `UserManager.AddPasswordAsync(usuario, nuevaPass)`.
Ahí conviven ambos métodos sobre el **mismo** usuario.

---

## 5. Registro en dos fases (decisión de UX)

El registro (correo + contraseña) ocurre **antes** que el onboarding (cédula, fecha,
apellido). Por eso:

| Fase | Cuándo | Endpoint | Campos |
| --- | --- | --- | --- |
| **1. Crear cuenta** | al registrarse | `POST /api/usuarios` | `nombre`, `correo`, `username`, `contraseña`, `tipoUsuarioId` |
| **2. Completar perfil** | al terminar el onboarding | `PUT /api/usuarios/{id}` | `apellido`, `numeroCedula`, `fechaNacimiento` |

Así la contraseña se usa **una sola vez** en la Fase 1 (server-to-server) y se descarta;
**no** viaja por el navegador entre pasos.

> **Cambio clave respecto al endpoint actual:** `apellido`, `numeroCedula` y
> `fechaNacimiento` deben ser **opcionales** en `POST /api/usuarios` (se completan en el PUT).

---

## 6. Política de vinculación por correo

Si alguien registrado **local** con `x@gmail.com` luego entra con **Google** usando el
mismo correo:

- **Vincular** (mismo usuario, agregar login externo) **solo si** el correo de Google
  viene verificado (siempre lo viene) **y** la cuenta local ya tenía `EmailConfirmed = true`.
- Si la cuenta local **no** estaba verificada → **no** auto-vincular (riesgo de secuestro).
- Implementación: `UserManager.FindByEmailAsync` → si existe y cumple, `AddLoginAsync`.

---

## 7. Endpoints requeridos

Todos en JSON, respuestas `camelCase`. Errores con formato:
`{ "message": string, "errors"?: { "<campo>": string[] } }`.

### 7.1 `POST /api/usuarios` — Registro local (Fase 1)

```jsonc
// Request
{
  "nombre": "Juan Jose",
  "correo": "juanjo5@gmail.com",
  "username": "juanjo5",          // derivado del correo en el frontend
  "contraseña": "juanjo1233",     // solo entrada → se hashea
  "tipoUsuarioId": 1
}
```
- `201 Created` → `{ "id": string, "accessToken": string, "refreshToken": string }`
  (auto-login tras registrar).
- `409 Conflict` si el correo/username ya existe → `{ "message": "Ya existe una cuenta con este correo." }`
- `400` validación.

### 7.2 `PUT /api/usuarios/{id}` — Completar perfil (Fase 2)

```jsonc
// Request
{
  "apellido": "Flores Aramburu",
  "numeroCedula": "1207627168",
  "fechaNacimiento": "1980-07-19",
  "rutaFotoCedula": ""            // vacío por ahora (verificación diferida)
}
```
- Requiere usuario autenticado (Bearer access token); solo el dueño puede actualizar su perfil.
- `200 OK` → usuario actualizado (DTO, sin hash ni datos sensibles).

### 7.3 `POST /api/auth/login` — Login local

```jsonc
{ "correo": "juanjo5@gmail.com", "contraseña": "juanjo1233" }
```
- `200 OK` → `{ "accessToken": string, "refreshToken": string }`
- `401` credenciales inválidas (mensaje genérico, sin revelar qué falló).

### 7.4 `POST /api/auth/refresh` — Rotar tokens

```jsonc
{ "refreshToken": string }
```
- Valida contra la tabla `RefreshToken` (comparando `TokenHash`), **rota** (invalida el
  viejo, emite par nuevo). Si detecta reuso de un token ya rotado → revoca toda la familia.
- `200 OK` → nuevo par. `401` si inválido/expirado/revocado.

### 7.5 `POST /api/auth/logout` — Revocar refresh

```jsonc
{ "refreshToken": string }
```
- Marca el refresh como revocado en BD. `204 No Content`.

### 7.6 Google OAuth (flujo dirigido por backend)

- `GET /api/auth/google` → redirige a la pantalla de consentimiento de Google.
- `GET /api/auth/google/callback?code=...` → el backend:
  1. Intercambia el `code` por el ID Token de Google.
  2. Lee `email` (verificado), `sub`, `name`.
  3. **Upsert**: si existe por login externo o por correo (según §6) lo usa; si no, crea
     `Usuario` sin contraseña + `AddLoginAsync("Google", sub)` + `EmailConfirmed = true` +
     `TipoUsuarioId = 1`.
  4. Emite el par de tokens y **redirige al frontend** con un **código de un solo uso**
     de corta vida (⚠️ **no** poner los tokens en la URL); Next lo canjea y crea su sesión.

---

## 8. Contrato del JWT (access token)

El frontend **decodifica** los claims del access token (la integridad la da la cookie
cifrada del lado Next). Claims **obligatorios** (nombres exactos):

| Claim | Valor |
| --- | --- |
| `sub` | id del usuario |
| `name` | nombre |
| `email` | correo |
| `role` | `"admin"` \| `"staff"` (mapeado desde `TipoUsuarioId`/roles de Identity) |
| `iat`, `exp` | estándar (epoch segundos) |

- **Access token:** vida corta = **15 minutos**.
- **Refresh token:** vida larga = **7 días**, revocable (tabla `RefreshToken`, hasheado).
- Firma: HS256 con secreto en configuración (o RS256 si prefieren JWKS).

---

## 9. Mapeo de campos (payload actual → modelo)

| Payload original | Destino | Nota |
| --- | --- | --- |
| `nombre` | `Usuario.Nombre` | Fase 1 |
| `correo` | `IdentityUser.Email` | Fase 1, único |
| `username` | `IdentityUser.UserName` | derivado del correo (antes de `@`) |
| `contraseña` | → `PasswordHash` (hasheado) | Fase 1, solo entrada |
| `tipoUsuarioId` | `Usuario.TipoUsuarioId` | `1` = Anfitrión/Propietario (default) |
| `apellido` | `Usuario.Apellido` | **Fase 2** (PUT), nullable |
| `numeroCedula` | `Usuario.NumeroCedula` | **Fase 2** (PUT), nullable |
| `fechaNacimiento` | `Usuario.FechaNacimiento` | **Fase 2** (PUT), nullable |
| `rutaFotoCedula` | `Usuario.RutaFotoCedula` | vacío (verificación diferida) |

---

## 10. Requisitos de seguridad (checklist)

- [ ] Contraseña hasheada con Identity (PBKDF2/Argon2id). **Nunca** en claro en BD ni logs.
- [ ] `PasswordHash` nullable; cuentas Google sin contraseña.
- [ ] Refresh tokens **hasheados** en BD, con expiración, revocación y rotación + detección de reuso.
- [ ] `EmailConfirmed = true` automático para registros vía Google.
- [ ] Vinculación por correo solo con ambos correos verificados (§6).
- [ ] Handoff de Google → Next con código de un solo uso, **nunca** tokens en la URL.
- [ ] CORS habilitado para el origen del frontend (dev: `http://localhost:3000`) con credenciales.
- [ ] Rate limiting en `/api/auth/login` y `POST /api/usuarios` (anti fuerza bruta).
- [ ] Quitar dependencia de la cookie `ARRAffinity` (la inyecta Azure automáticamente).
- [ ] Secretos (firma JWT, client id/secret de Google) en configuración, nunca en el repo.

---

## 11. Resumen de lo que cambia vs. el estado actual

1. `POST /api/usuarios`: hacer **opcionales** `apellido`, `numeroCedula`, `fechaNacimiento`;
   devolver `{ id, accessToken, refreshToken }` en vez de texto plano.
2. Agregar `PUT /api/usuarios/{id}` para completar el perfil.
3. Agregar `POST /api/auth/login`, `/refresh`, `/logout`.
4. Agregar Google OAuth (`/api/auth/google` + callback) con upsert.
5. Migrar el modelo a `Usuario : IdentityUser` + tabla `RefreshToken`.
