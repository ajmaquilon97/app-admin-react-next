# Separación Perfil / Negocio — Backend

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Objetivo:** separar los datos fiscales/comerciales del anfitrión (RUC, razón social,
> dirección) del perfil personal (`Usuario`), moviéndolos a una entidad `Negocio` propia
> con sus propias APIs.
> **Nota de duplicidad:** `docs/backend-configuracion-anfitrion-spec.md` §2 ya propone una
> entidad `Negocio` (1:1 con `Usuario`, patrón upsert `GET`/`PUT /api/negocios/me`). Este
> documento es un pedido más puntual sobre el mismo tema, disparado porque el backend real
> (ver `docs/swagger-api-login.json`) terminó modelando esos campos fiscales directamente
> sobre `Usuario`/`CompletarPerfilRequest` en vez de en una entidad separada. **Backend
> debería resolver ambos documentos con un solo diseño** — no tratarlos como dos pedidos
> independientes. Si hay conflicto de forma entre los dos (ver §3), gana el patrón upsert
> de `backend-configuracion-anfitrion-spec.md` por ser más simple, salvo que backend
> prefiera lo contrario.

---

## 1. Qué pasó

`PUT /api/usuarios/{id}` (`CompletarPerfilRequest`) hoy acepta estos 4 campos, pensados
originalmente para poder facturar electrónicamente las reservas de cada anfitrión
(`docs/backend-facturacion-electronica-sri-spec.md`):

```jsonc
// CompletarPerfilRequest — contrato real actual (swagger-api-login.json)
{
  "tipoIdentificacion": "04",       // catálogo SRI: "04" RUC, "05" cédula, ...
  "numeroIdentificacion": "1207627168001",
  "razonSocial": "MAQUILON CEPEDA ANGEL JESUS",
  "direccion": "..."
}
```

Estos son datos del **negocio** del anfitrión, no de su persona — mezclarlos en `Usuario`
impide, por ejemplo, que un mismo usuario tenga un negocio con razón social distinta a su
propio nombre, o que el negocio tenga su propio ciclo de vida (verificación, activación,
etc.) independiente del perfil.

## 2. Qué ya hizo el frontend

Sin esperar el cambio de backend, el frontend ya separó esto de su lado:

- **Configuración > Perfil** (`src/modules/configuracion/components/PerfilTab.tsx`): solo
  nombre, apellido, correo, teléfono, foto, documento de identidad, cédula, fecha de
  nacimiento. **Ya no envía** `tipoIdentificacion`/`numeroIdentificacion`/`razonSocial`/
  `direccion` en el `PUT /api/usuarios/{id}` (`src/actions/configuracion.ts`).
- **Configuración > Negocio** (`NegocioTab.tsx`): nombre del negocio, RUC, **razón social**
  (campo nuevo), categoría, dirección, ciudad, provincia, teléfono, descripción, logo.
  Sigue funcionando **solo contra un mock local** (`src/lib/configuracion-mock.ts`) — nada
  de esto se persiste todavía en un backend real.
- **Onboarding, step 3 (perfil)** (`OnboardingWizard.tsx`): ya no pide RUC, razón social ni
  dirección — solo cédula, fecha de nacimiento, provincia y ciudad (ver
  `docs/backend-cambios-solicitados.md §11` sobre provincia/ciudad, pendiente aparte).

Es decir: **el dato ya no se guarda en ningún lado** hasta que exista la API de Negocio.
Antes al menos se persistía (mal ubicado) en `Usuario`; ahora directamente no se persiste.
Priorizamos el modelo correcto sobre mantener la persistencia temporal en el lugar
equivocado.

## 3. Qué necesitamos de backend

### 3.1 Entidad `Negocio`

```csharp
public class Negocio
{
    public Guid    Id                  { get; set; }
    public Guid    UsuarioId           { get; set; }   // FK, propietario
    public string  NombreNegocio       { get; set; } = default!;
    public string  TipoIdentificacion  { get; set; } = "04"; // catálogo SRI, default RUC
    public string  NumeroIdentificacion{ get; set; } = default!; // el RUC
    public string  RazonSocial         { get; set; } = default!;
    public string  Direccion           { get; set; } = default!;
    public string? Categoria           { get; set; }
    public string? TelefonoNegocio     { get; set; }
    public string? Descripcion         { get; set; }
    public string? LogoUrl             { get; set; }
    public DateTime CreatedAt          { get; set; }
    public DateTime? UpdatedAt         { get; set; }
}
```

**Nota:** este modelo agrega `TipoIdentificacion`/`NumeroIdentificacion` (que no estaban en
la propuesta de `backend-configuracion-anfitrion-spec.md §2.1`) para conservar el catálogo
SRI que ya existe hoy en `Usuario` — así no se pierde esa semántica al migrar el dato.

### 3.2 Endpoints (recomendado: patrón upsert, igual que la otra spec)

- **`GET /api/negocios/me`** — negocio del usuario autenticado. `404` si todavía no lo creó.
- **`PUT /api/negocios/me`** — crea si no existe, actualiza si ya existe (upsert). Mismo
  body que el `GET`. `200 OK` con el recurso resultante.

Si backend prefiere el patrón REST clásico (`POST /api/negocios` para crear +
`PUT /api/negocios/{id}` para actualizar) en vez del upsert, también nos sirve — lo
importante es que quede **un solo patrón acordado**, no que cada spec proponga uno distinto.

### 3.3 Migración de los campos fiscales fuera de `Usuario`

1. Una vez exista `Negocio`, quitar `tipoIdentificacion`/`numeroIdentificacion`/
   `razonSocial`/`direccion` de `CompletarPerfilRequest` (o dejarlos deprecados mientras
   conviven ambos caminos — avisarnos la fecha de corte si es así).
2. Si ya hay datos cargados en `Usuario` con estos campos (de antes de este cambio),
   definir si se migran automáticamente a `Negocio` o si se le pide al usuario que los
   vuelva a ingresar.

### 3.4 Relación 1:1 vs 1:N

El frontend asume **1:1** (`Usuario` → `Negocio`), igual que la spec de configuración.
Confirmar que este es también el modelo de backend, o si se previó soporte para que un
usuario administre más de un negocio.

---

## 4. Checklist de implementación

- [x] Entidad `Negocio` creada, incluyendo `TipoIdentificacion`/`NumeroIdentificacion`
      (confirmado en `docs/swagger-api-login.json` — `NegocioRequest`).
- [x] Endpoints de Negocio implementados con patrón upsert: `GET`/`PUT /api/negocios/me`
      (coincide con lo recomendado acá y con `backend-configuracion-anfitrion-spec.md §2.2`).
      Ya conectado en el frontend: `src/lib/negocios-api.ts`, `src/actions/negocio.ts`.
- [x] Campos fiscales retirados de `CompletarPerfilRequest`/`Usuario` — confirmado, ya no
      aparecen en el schema.
- [ ] No confirmado qué pasó con los datos fiscales ya cargados en `Usuario` antes del
      cambio (migración automática vs re-captura) — verificar con backend si hay usuarios
      existentes con esos campos ya completados que ahora quedarían con `Negocio` vacío.
- [ ] No confirmado 1:1 vs 1:N entre `Usuario` y `Negocio` — el endpoint `/me` sugiere 1:1
      pero no está documentado explícitamente.
- [ ] `NegocioRequest` no tiene campos `ciudad`/`provincia` — confirmado con respuesta real
      de `GET /api/negocios/me` (§5), no solo por inspección del swagger. Ver §5 para el
      pedido completo: agregarlos a `Negocio`, no a `Usuario`.

---

## 5. Nuevo pedido: mover `provincia`/`ciudad` de `Usuario` a `Negocio`

> Actualización — confirmado contra el backend real, no solo contra el swagger.

`docs/backend-cambios-solicitados.md §11` había pedido agregar `provinciaId`/`ciudadId`
a `Usuario`/`CompletarPerfilRequest`/`UsuarioResponse`, y backend ya lo implementó
(confirmado en `docs/swagger-api-login.json`). Con el uso real, esto resultó ser el
lugar equivocado:

- La ubicación (provincia/ciudad) de un anfitrión **como persona** no tiene ninguna
  relevancia funcional hoy — no se usa en ningún cálculo, filtro ni validación del
  perfil personal.
- Donde sí importa la ubicación es en el **negocio**: dirección fiscal/comercial,
  posible uso a futuro para filtros de búsqueda o reportes por zona, etc.

Confirmado en desarrollo real que `GET /api/negocios/me` **no** devuelve `ciudad` ni
`provincia` (ni `provinciaId`/`ciudadId`) — la entidad `Negocio` no tiene ese dato en
ningún lado:

```jsonc
// GET /api/negocios/me — respuesta real, sin campos de ubicación
{
  "id": "7b7f821d-b140-44d1-93dd-3a0cd2b1fd25",
  "usuarioId": "8814f4b6-9365-4aba-88cc-c83e2614f55d",
  "nombreNegocio": "Complejo Urderno",
  "tipoIdentificacion": "04",
  "numeroIdentificacion": "1205162926001",
  "razonSocial": "ANGEL JESUS MAQUILON CEPEDA",
  "direccion": "Gye Urdenor",
  "categoria": "Entretenimiento",
  "telefonoNegocio": "0997857871",
  "descripcion": "Compleo Urdenor deportes y entretenimiento.",
  "logoUrl": "https://...",
  "createdAt": "2026-08-03T18:57:15.9669242",
  "updatedAt": "2026-08-03T18:57:15.9669242"
  // sin "ciudad" / "provincia" / "provinciaId" / "ciudadId"
}
```

Esto coincide con el gap ya señalado en el checklist original de esta spec (§4, último
ítem) — ahora confirmado con una respuesta real, no solo por inspección del swagger.

**Acción requerida:**

1. Agregar `ProvinciaId`/`CiudadId` (FK al catálogo de `GET /api/catalogos/ubicaciones`,
   mismo patrón que ya existe en `Usuario` y en `Espacio`) a la entidad `Negocio`, y
   exponerlos en `NegocioRequest`/`NegocioResponse` (recordar que `NegocioRequest`
   tiene `"additionalProperties": false` — sin este cambio el backend ignora/rechaza
   el campo).
2. Quitar `ProvinciaId`/`CiudadId` de `Usuario`/`CompletarPerfilRequest`/
   `UsuarioResponse` — revierte el pedido de `backend-cambios-solicitados.md §11`, ya
   que no tiene relevancia en el perfil personal.
3. Si ya hay usuarios con `ProvinciaId`/`CiudadId` cargados en `Usuario` (por ejemplo,
   los completados durante el onboarding en el tiempo que estuvo ahí), definir si esos
   valores se migran automáticamente al `Negocio` correspondiente o si se le vuelve a
   pedir al anfitrión que los ingrese en el tab de Negocio.

El frontend va a:
- Quitar los campos Provincia/Ciudad del tab **Perfil** (`PerfilTab.tsx`) y del step de
  perfil del onboarding, una vez confirmado este cambio.
- Mantenerlos en el tab **Negocio** (`NegocioTab.tsx`, ya tiene los `<select>`
  encadenados listos usando el mismo catálogo) una vez que `NegocioRequest`/
  `NegocioResponse` los soporten — hoy `src/actions/negocio.ts` los fuerza a `""` y no
  los envía, precisamente porque el backend no los tiene.
