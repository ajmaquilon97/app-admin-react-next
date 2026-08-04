# Inactivación de espacios — feedback para Frontend

Implementadas las 3 reglas de negocio pedidas. Respuesta punto a punto de tu checklist.

## 1. `POST /api/espacios/{id}/inactivar`

✅ Implementado.

- **Auth**: requiere JWT (`Authorization: Bearer <accessToken>`).
- **Autorización**: puede inactivar el `PropietarioId` del espacio, **o** cualquier usuario con
  claim `role == "admin"`. Cualquier otro autenticado recibe `403 Forbidden` (sin cuerpo).
- **Estado actual no es "activo"** → `409 Conflict`:
  ```json
  { "message": "El espacio no está activo (estado actual: \"revision\"); solo puede inactivarse un espacio activo." }
  ```
- **Éxito** → `200 OK` con el `EspacioResponse` actualizado, `estado: "inactivo"`.
- **No existe el espacio** → `404 Not Found`, `{ "message": "No existe un espacio con ese ID." }`.
- **No toca reservas**: el método solo actualiza la columna `Estado` del `Espacio`. No hay ninguna
  consulta ni escritura sobre `Reservas` en esta operación — reservas pasadas o futuras del espacio
  quedan exactamente igual que antes de inactivar. La restricción real recae sobre reservas
  *nuevas* (punto 2).

Ejemplo de request:
```
POST /api/espacios/152/inactivar
Authorization: Bearer eyJhbGciOi...
```

## 2. Validación de estado al crear reservas

✅ Implementado — y con un ajuste de alcance que quiero que confirmes: la spec mencionaba
`POST /api/reservas`, pero existe un **segundo endpoint de creación** con la misma responsabilidad
de negocio: `POST /api/mobile/reservas` (usado por la app del Cliente, método de servicio
`CrearComoClienteAsync`). Apliqué el mismo chequeo en **ambos**, porque de lo contrario un cliente
podía seguir reservando un espacio inactivo/en revisión desde la app móvil aunque el endpoint Web
ya lo bloqueara — la regla de negocio quedaba incompleta en la práctica. Avísame si por alguna
razón el flujo móvil debía quedar exento.

- Antes de calcular montos o guardar la reserva, se verifica `Espacio.Estado == "activo"`.
- Si el estado es `"inactivo"` o `"revision"` (o cualquier valor distinto de `"activo"`) →
  `409 Conflict`:
  ```json
  { "message": "El espacio no está activo y no acepta reservas nuevas." }
  ```
- Aplica igual en `POST /api/reservas` (creación por el Anfitrión) y `POST /api/mobile/reservas`
  (creación por el Cliente).

## 3. `PUT /api/espacios/{id}` vuelve a "revision"

✅ Implementado.

- Cualquier actualización exitosa de los datos del espacio sobreescribe `Estado` a `"revision"`,
  sin importar si estaba `"activo"` o `"inactivo"` antes del cambio (si ya estaba en `"revision"`,
  simplemente se mantiene ahí — no hay ningún efecto adicional).
- El `EspacioResponse` devuelto por el `PUT` ya refleja `estado: "revision"` inmediatamente.

### Respuesta a tu pregunta del punto 5

Sí, confirmado: **la vuelta a `"revision"` siempre requiere aprobación manual del backoffice, sin
excepción.** No implementé (ni existe en el backend) ningún camino de auto-aprobación para
ediciones menores — da igual que el cambio sea trivial (por ejemplo, solo el `Descripcion`) o
sustancial (cambiar `TipoEspacioId`, capacidad, etc.): el resultado siempre es `"revision"`, y solo
`POST /api/espacios/{id}/activar` (el endpoint ya existente, no tocado en este trabajo) puede
devolver un espacio a `"activo"` — y ese endpoint valida sus propias condiciones (estado previo
`"inactivo"` + al menos una modalidad de tarifa configurada), no puede dispararse automáticamente
desde una edición.

## Nota aparte — no incluida en el alcance de este pedido

`PUT /api/espacios/{id}` y `POST /api/espacios/{id}` (creación) **no tienen `[Authorize]` ni
ningún chequeo de propiedad hoy** — a diferencia de `activar`/`inactivar`, que sí lo exigen. No lo
toqué porque no formaba parte de este pedido, pero lo señalo porque, tal como está, cualquier
usuario (incluso no autenticado) puede editar cualquier espacio y forzarlo a `"revision"` con el
cambio que acabamos de implementar. Si les interesa, es un follow-up natural.
