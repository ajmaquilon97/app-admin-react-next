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
`role`. Hoy ustedes modelan `tipoUsuarioId` (1 = Anfitrión); necesitamos la traducción a
esos dos valores. **Si el claim no sale así, el control de acceso del frontend no funciona.**

---

## 2. Endpoints de auth — nombres de campo y respuestas

El frontend envía/espera **exactamente** estos cuerpos. Confirmar que coinciden:

### `POST /api/auth/login`
```jsonc
{ "email": "...", "password": "..." }
```
- `200 OK` → `{ "accessToken": string, "refreshToken": string }`
- `401` → credenciales inválidas (mensaje genérico).

### `POST /api/usuarios` (registro, Fase 1)
```jsonc
{
  "nombre": "...",
  "email": "...",
  "username": "...",      // derivado del email (parte antes de @)
  "password": "...",
  "tipoUsuarioId": 1      // siempre 1 por ahora
}
```
- `201 Created` → `{ "id": string, "accessToken": string, "refreshToken": string }`
- `409 Conflict` si el correo/username ya existe.

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

## Checklist de confirmación

- [ ] Claim `role` = `"admin"` | `"staff"` en el access token (§1)
- [ ] Campos `email` / `password` en login y registro (§2)
- [ ] `POST /api/usuarios` devuelve `{ id, accessToken, refreshToken }` con `201` (§2)
- [ ] `logout` revoca por `refreshToken` del body → `204` (§2)
- [ ] Callback de Google redirige a `{FRONTEND_URL}/auth/google/callback?code=...` (§3)
- [ ] `google/exchange` devuelve el par de tokens (§3)
- [ ] Errores con shape `{ message, errors? }` (§4)
- [ ] CORS para `http://localhost:3000` (§5)
- [ ] URL base real del backend entregada (§6)
