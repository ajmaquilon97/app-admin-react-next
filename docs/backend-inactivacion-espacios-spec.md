# Inactivación de espacios por el anfitrión — Backend

> **De:** equipo Frontend (Next.js — portal de anfitriones)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Contexto:** hoy el anfitrión solo puede **activar** un espacio inactivo
> (`POST /api/espacios/{id}/activar`, ya implementado). Falta el camino inverso:
> que el propio anfitrión pueda **inactivar** un espacio `activo`, sin perder las
> reservas que ya se hicieron sobre ese espacio.

---

## 1. Qué ya hace el backend hoy (según lo entendemos)

- `GET /api/espacios/mis-espacios` devuelve todos los espacios del anfitrión, con su
  `estado` (`activo` | `inactivo` | `revision`).
- Los listados/búsquedas públicas (lo que consume la app de cliente final) ya
  **filtran por `estado = activo`** — un espacio `inactivo` o en `revision` no
  aparece para nuevas búsquedas. Esto es lo que hoy evita, indirectamente, que un
  espacio inactivo reciba reservas nuevas **a través de la búsqueda normal**.
- `POST /api/espacios/{id}/activar` reactiva un espacio `inactivo`, validando que
  tenga al menos una modalidad de tarifa activa con precio > 0.

## 2. Qué necesitamos: `POST /api/espacios/{id}/inactivar`

Endpoint simétrico a `/activar`, mismo estilo de contrato:

```
POST /api/espacios/{id}/inactivar
Authorization: Bearer {accessToken del anfitrión dueño del espacio}
```

- Solo puede llamarlo el propietario del espacio (o admin/staff).
- Solo válido si el espacio está actualmente `activo` (si ya está `inactivo` o en
  `revision`, `409 Conflict` con `{ message }`).
- Efecto: `estado = "inactivo"`.
- `200 OK` con el `EspacioResponse` actualizado (mismo shape que `/activar`).

El frontend ya está conectado a este contrato de forma preventiva —
`src/lib/spaces-api.ts` (`inactivarEspacio`), `src/actions/spaces.ts`, y el botón
"Inactivar" en `/espacios` (`src/components/spaces/InactivarEspacioButton.tsx`), con
un modal de confirmación que le avisa al anfitrión: deja de recibir reservas nuevas,
pero las reservas ya hechas se mantienen. Falta que backend implemente el endpoint
real para que deje de fallar.

## 3. Punto importante: bloquear la reserva en el backend, no solo en el listado

El filtro de `GET` en listados públicos (§1) evita que un espacio inactivo aparezca
en búsquedas nuevas, pero **no evita** que alguien intente reservarlo directamente
contra el endpoint de creación de reserva (ej. un cliente con la página ya abierta
antes de que se inactive, o un llamado directo a la API).

**Pedido explícito:** el endpoint de creación de reserva (`POST /api/reservas` o el
que corresponda) debe **validar el estado del espacio en el momento de crear la
reserva**, y rechazar con `409 Conflict` si `estado != "activo"`. No basta con que el
espacio no aparezca en el listado — la validación debe estar también del lado del
endpoint que efectivamente crea la reserva.

Esto aplica igual para espacios en `estado = "revision"` (ver §4) — un espacio en
revisión tampoco debería poder recibir reservas nuevas.

## 4. Las reservas existentes NO se tocan

Al inactivar un espacio, las reservas que ya existían sobre él (confirmadas o
pendientes, con fecha pasada o futura) **deben mantenerse exactamente como estaban**
— el backend no debe cancelarlas, modificarlas ni cambiar su estado como efecto
colateral de inactivar el espacio. Solo se bloquean las reservas **nuevas** (§3).

## 5. Nuevo: el espacio vuelve a `revision` al editarse

Cuando el anfitrión edita la información de un espacio (`PUT /api/espacios/{id}`),
el backend debe **resetear `estado = "revision"`** automáticamente, sin importar el
estado anterior (`activo` o `inactivo`) — porque cualquier cambio en los datos del
espacio necesita pasar de nuevo por la aprobación del backoffice antes de volver a
estar visible/reservable.

- Excepción: si el espacio ya estaba en `revision`, se queda igual (no hay nada que
  resetear).
- Igual que en §3/§4: al pasar a `revision`, el espacio deja de aceptar reservas
  nuevas (mismo mecanismo), pero **las reservas ya existentes no se ven afectadas**.
- El frontend ya avisa de esto al anfitrión en el wizard de edición
  (`src/components/spaces/EditarEspacioWizard.tsx`), pero el cambio de estado real
  lo debe aplicar el backend al procesar el `PUT`.

**Pregunta para backend:** ¿"volver a revisión" implica que el equipo de backoffice
tiene que re-aprobar manualmente (como con un espacio nuevo), o hay algún tipo de
auto-aprobación para ediciones menores (ej. solo cambiar la descripción)? Esta spec
asume que **siempre** requiere revisión manual, sin distinción de qué campos
cambiaron — avisar si no es así.

## 6. Checklist

- [ ] `POST /api/espacios/{id}/inactivar` implementado, simétrico a `/activar` (§2).
- [ ] Validación de estado del espacio (`activo`) al crear una reserva nueva, no solo
      en el listado (§3) — confirmar si ya existe o si hace falta agregarla.
- [ ] Confirmado que inactivar un espacio no cancela ni modifica sus reservas
      existentes (§4).
- [ ] `PUT /api/espacios/{id}` resetea `estado = "revision"` en cada edición del
      anfitrión, excepto si ya estaba en `revision` (§5).
- [ ] Confirmar si la vuelta a `revision` siempre requiere aprobación manual del
      backoffice o si hay algún caso de auto-aprobación (§5).
