# Ubicación movida de Usuario a Negocio — feedback para Frontend

Aplicada la corrección arquitectónica. Resumen y contratos actualizados.

## Corrección sobre la spec: dónde vivía realmente la validación

La spec decía "misma lógica que ya se usa en `EspacioRequest`" para la validación
ciudad-pertenece-a-provincia. Al revisar el código, **`EspacioRequest`/`EspaciosService` no tienen
ninguna validación de este tipo** — `ProvinciaId`/`CiudadId` de un Espacio se guardan sin cruzarlos
contra el catálogo. La validación real (y la única que existía en el proyecto) vivía en
`PUT /api/usuarios/{id}` (`CompletarPerfilRequest`). Repliqué esa lógica —no la de Espacios— para
Negocio, que es la que efectivamente hace `AnyAsync(c => c.Id == ciudadId && c.ProvinciaId ==
provinciaId)` contra `CAT_Ciudades`. El comportamiento es el mismo que ya conocían de
`CompletarPerfil`, solo movido de contexto.

## 1. `PUT /api/usuarios/{id}` — contrato limpio

✅ Confirmado: `ProvinciaId`/`CiudadId` **ya no existen** en el request ni en la respuesta.

**Request** (`CompletarPerfilRequest`) — ya no acepta estos campos; si el frontend los sigue
enviando, se ignoran silenciosamente (el binder de ASP.NET Core descarta propiedades del JSON que
no tienen contraparte en el DTO, no da error):
```json
{
  "tipoUsuarioId": 2,
  "nombre": "Ana",
  "apellido": "Torres",
  "numeroCedula": "0102030405",
  "fechaNacimiento": "1990-05-12",
  "rutaFotoCedula": "https://...",
  "fotoPerfilUrl": "https://..."
}
```

**Response** (`UsuarioResponse`) — ya no incluye `provinciaId`/`ciudadId`:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Ana",
  "apellido": "Torres",
  "correo": "ana@example.com",
  "fechaNacimiento": "1990-05-12",
  "numeroCedula": "0102030405",
  "rutaFotoCedula": "https://...",
  "fotoPerfilUrl": "https://...",
  "tipoUsuarioId": 2,
  "tipoUsuarioNombre": "Propietario",
  "username": "ana.torres",
  "fechaCreacion": "2026-01-10T15:22:00Z"
}
```

También se eliminó la validación 400 de "CiudadId no pertenece a ProvinciaId" de este endpoint
(ya no aplica, porque el endpoint ya no recibe esos campos).

## 2. `PUT /api/negocios/me` — nuevo contrato

**Request** (`NegocioRequest`) — agrega `provinciaId`/`ciudadId`, ambos opcionales:
```json
{
  "nombreNegocio": "Salón Aurora",
  "tipoIdentificacion": "04",
  "numeroIdentificacion": "0912345678001",
  "razonSocial": "Aurora Eventos S.A.",
  "direccion": "Av. Principal 123",
  "categoria": "Salón de eventos",
  "telefonoNegocio": "0999999999",
  "descripcion": "Espacio para eventos sociales",
  "logoUrl": "https://...",
  "provinciaId": 9,
  "ciudadId": 90101
}
```

**Reglas de `provinciaId`/`ciudadId`**:
- Ambos son opcionales de forma independiente entre sí, **salvo** que se envíe `ciudadId`: en ese
  caso `provinciaId` pasa a ser obligatorio.
- `ciudadId` sin `provinciaId` → `400 Bad Request`:
  ```json
  { "message": "CiudadId requiere que también se envíe ProvinciaId." }
  ```
- `ciudadId` que no pertenece a `provinciaId` en el catálogo → `400 Bad Request`:
  ```json
  { "message": "La ciudad 90101 no pertenece a la provincia 9." }
  ```
- La validación corre **en el servicio** (`NegociosService.UpsertAsync`), antes de crear o
  actualizar el negocio — igual para el primer `PUT` (crea) que para los siguientes (actualiza),
  porque es un único endpoint upsert.

## 3. `GET /api/negocios/me` — nuevo formato de respuesta

`NegocioResponse` ahora incluye `provinciaId`/`ciudadId`:
```json
{
  "id": "9b2e1d3a-1234-4a5b-8c9d-abcdef123456",
  "usuarioId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombreNegocio": "Salón Aurora",
  "tipoIdentificacion": "04",
  "numeroIdentificacion": "0912345678001",
  "razonSocial": "Aurora Eventos S.A.",
  "direccion": "Av. Principal 123",
  "categoria": "Salón de eventos",
  "telefonoNegocio": "0999999999",
  "descripcion": "Espacio para eventos sociales",
  "logoUrl": "https://...",
  "provinciaId": 9,
  "ciudadId": 90101,
  "createdAt": "2026-07-20T10:00:00Z",
  "updatedAt": "2026-08-04T04:02:00Z"
}
```

**Nota**: al igual que en el `UsuarioResponse` anterior, solo se exponen los IDs — **no**
`provinciaNombre`/`ciudadNombre`. Si necesitan mostrar el nombre en la UI, hoy tendrían que
resolverlo aparte contra el catálogo (`GET` de provincias/ciudades, que ya existe en el proyecto).
Avísenme si prefieren que agregue los nombres resueltos directamente en este response.

## 4. Migración de base de datos

Migración `MoveUbicacionFromUsuarioToNegocio` generada y aplicada contra la base de datos
configurada en `ConnectionStrings:DefaultConnection` (`appsettings.json`). Cambios de esquema:

- `SEG_Usuarios`: se eliminan las columnas `ProvinciaId`, `CiudadId` y sus FKs/índices hacia
  `CAT_Provincias`/`CAT_Ciudades`.
- `NEG_Negocios`: se agregan las columnas `ProvinciaId` (`int`, nullable), `CiudadId` (`int`,
  nullable) con FKs `Restrict` hacia `CAT_Provincias`/`CAT_Ciudades` respectivamente.

**Sin pérdida de datos**: antes de aplicar la migración se verificó que **ningún usuario** tenía
`ProvinciaId`/`CiudadId` asignado en la base actual (0 de 53), así que no hubo necesidad de un paso
de migración de datos (copiar valores existentes de Usuario a su Negocio antes de dropear las
columnas). Si esto se ejecuta contra otro ambiente (staging/producción) que sí tenga datos en esos
campos, **ese paso de copia no existe en esta migración** y esos valores se perderían — avísenme
antes de correr esta migración en cualquier ambiente con datos reales para agregarlo.
