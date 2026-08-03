# Especificación de Cancelación de Reservas — Backend (ApiTesis / ASP.NET Core)

> **De:** equipo Frontend (Next.js — portal de anfitriones)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Contexto:** implementa las reglas de negocio definidas en
> `docs/politica-cancelaciones-reversos.md`. Hoy `POST /api/reservas/{id}/cancelar`
> ya existe y funciona (lo usa este portal, `src/lib/reservas/api.ts`), pero **sin
> ninguna validación de ventana de tiempo ni distinción de quién cancela** — cualquier
> llamada lo cancela sin más. Esta spec agrega esas reglas.

---

## 0. Supuesto a confirmar con backend

Este portal (`app-admin-react-next`) es el **lado del anfitrión** — todo lo que llama
hoy a `POST /api/reservas/{id}/cancelar` es, por definición, una cancelación de
**anfitrión/staff**. La cancelación del **usuario final (cliente)** sale de la app de
cliente final (fuera de este repo, sin visibilidad de su código desde acá).

**Pregunta para backend:** ¿la cancelación del cliente final pega al **mismo**
endpoint `POST /api/reservas/{id}/cancelar` (diferenciando por el rol/claims del JWT
de quien llama), o es un endpoint distinto? Esta spec asume que es **el mismo
endpoint**, diferenciado por rol, porque es el diseño más simple — pero si la app de
cliente final ya tiene su propio contrato distinto, avisar para ajustar.

---

## 1. Reglas a aplicar (resumen — detalle completo en la política)

| Actor (según rol del JWT) | Ventana permitida | Validación del backend |
| --- | --- | --- |
| `cliente` (usuario final) | Hasta 1 día antes de `fecha + horaInicio` de la reserva | Si falta menos de 1 día → `409 Conflict`, no cancela |
| `admin` \| `staff` (anfitrión/su equipo) | Sin restricción de tiempo | Siempre permitido |

- El cálculo de "falta 1 día" se hace en **hora de Ecuador** (`America/Guayaquil`),
  comparando `now()` contra `fecha` + `horaInicio` de la reserva — no contra
  medianoche del día de la reserva. Confirmar con backend cuál de las dos interpreta
  la política si hay ambigüedad (la política dice "el mismo día ya no se puede", que
  es más estricto que "24 horas exactas antes" — un caso borde: reserva mañana a las
  23:00, ¿se puede cancelar hoy a las 23:30 (menos de 24h pero no es "el mismo día")?
  **Definición a aplicar:** se compara por **fecha calendario**, no por horas exactas
  — "hasta 1 día antes" = se permite cancelar cualquier día antes de la fecha de la
  reserva; el día mismo de la reserva, no.

## 2. Qué NO cubre este endpoint

- El caso "reserva en curso, surge un problema" **no** es una cancelación — es un
  ticket de soporte (§4, nuevo, alcance separado). `POST /api/reservas/{id}/cancelar`
  debe seguir rechazando cualquier intento de cancelar una reserva cuya
  `fecha + horaInicio` ya pasó (o está en curso), para cualquier rol, incluyendo
  `admin`/`staff` — si la reserva ya empezó, no se "cancela", se maneja por soporte.

## 3. Efecto colateral: disparar el reverso automáticamente

Al cancelar exitosamente (por cualquiera de los dos actores permitidos), si la
reserva tiene una factura en estado `AUTORIZADO`
(`docs/backend-facturacion-electronica-sri-spec.md`), el backend debe **disparar
automáticamente** la emisión de la nota de crédito correspondiente
(`docs/backend-nota-credito-sri-spec.md`) — sin intervención manual, sin pedirle
nada al frontend. El frontend solo necesita saber el resultado (ver §5).

Si la factura fue emitida a "Consumidor Final" (`tipoIdentificacionComprador = 07`),
el reverso fiscal automático **va a fallar** (restricción del SRI, ver
`backend-nota-credito-sri-spec.md` §1). Backend debe decidir cómo comunicar este caso
— idealmente nunca debería ocurrir si se sigue la recomendación de exigir
identificación real al facturar, pero si pasa, la cancelación de la reserva en sí
**debe completarse igual** (el cliente no debe quedar bloqueado de cancelar por un
problema fiscal); el reverso del dinero en ese caso queda pendiente de resolución
manual — reportarlo como caso especial en la respuesta (`reversoEstado: "ERROR"`
+ motivo).

## 4. Nuevo: ticket de soporte para "reserva en curso, no se pudo usar el espacio"

No existe hoy en el sistema. Alcance mínimo para desbloquear el reverso en este caso:

### 4.1 Modelo

```csharp
public class TicketSoporteReserva
{
    public Guid      Id           { get; set; }
    public Guid      ReservaId    { get; set; }
    public string    ClienteId    { get; set; } = default!;  // quien lo reporta — siempre el usuario final
    public string    Descripcion  { get; set; } = default!;
    public string    Estado       { get; set; } = default!;  // Abierto | EnRevision | Aprobado | Rechazado
    public string?   ResolucionNotas { get; set; }
    public DateTime  CreatedAt    { get; set; }
    public DateTime? ResueltoAt   { get; set; }
}
```

### 4.2 Endpoints

- `POST /api/reservas/{id}/incidencia` — solo el **usuario final** dueño de la
  reserva puede crearlo, solo si la reserva está `EnCurso` o ya `Finalizada` (no
  antes de que empiece). Body: `{ "descripcion": string }`. → `201` con el ticket
  (`Estado = Abierto`).
- `GET /api/tickets-soporte?estado=&page=` — listado para soporte/admin (no cubierto
  por este portal todavía, pero backend debe exponerlo para cuando exista esa
  pantalla).
- `POST /api/tickets-soporte/{id}/resolver` — solo `admin`/`staff` con permiso de
  soporte. Body: `{ "aprobado": boolean, "notas": string }`.
  - Si `aprobado = true` → dispara el mismo mecanismo de nota de crédito que una
    cancelación normal (§3), y marca `Estado = Aprobado`.
  - Si `aprobado = false` → `Estado = Rechazado`, no hay reverso.

No se define en esta spec la pantalla de soporte para revisar tickets — solo el
contrato de backend, para no bloquear el resto de la implementación.

## 5. Contrato de respuesta — `POST /api/reservas/{id}/cancelar` — **CONFIRMADO (forma real, distinta a la propuesta)**

Backend implementó esto con una forma **más plana** que la propuesta original de esta
spec — sin objeto anidado `reverso`, y sin `canceladaPor`/`fechaCancelacion` confirmados
como campos propios (no aparecen mencionados en la descripción del endpoint en
`docs/swagger-api-login.json`; puede que sean parte del shape real y simplemente no
se hayan destacado en el resumen, pero no está confirmado — verificar contra logs
reales, ver `readAndLog` en `src/lib/reservas/api.ts`):

```jsonc
// 200 OK — forma real según swagger (ReservaCancelacionResponse, sin schema formal)
{
  // ...mismos campos que ReservaResponse (id, estado="cancelada", etc.)...
  "estadoReverso": "PROCESANDO" | "ERROR" | null   // null si no había factura que reversar
}
```

El frontend ya está actualizado para leer `estadoReverso` de esta respuesta y avisar si
vale `"ERROR"` (`src/actions/reservas.ts` → `cancelBooking`,
`src/modules/bookings/hooks/useBookingActions.ts` → `useCancelBooking`).

```jsonc
// 409 Conflict — cliente intentando cancelar fuera de ventana
{ "message": "Esta reserva ya no se puede cancelar: falta menos de 1 día para la fecha." }
```

```jsonc
// 409 Conflict — reserva ya en curso o finalizada (para cualquier rol)
{ "message": "Esta reserva ya está en curso o finalizó. Si hubo un problema, repórtalo como incidencia." }
```

## 6. Checklist

- [x] Confirmar con backend si cliente-final y anfitrión pegan al mismo endpoint o a
      endpoints distintos (§0) — **confirmado: mismo endpoint** `POST /api/reservas/{id}/cancelar`,
      diferenciado por rol del JWT ("Endpoint único: Cliente y Anfitrión comparten la
      misma lógica").
- [x] Validación de ventana de 1 día, por fecha calendario, hora Ecuador, solo para
      rol `cliente` — confirmado en la descripción del endpoint.
- [x] Bloqueo de cancelación (para cualquier rol) si la reserva ya está en curso o
      finalizada — confirmado ("no se puede cancelar si la reserva ya está en curso o
      finalizó").
- [x] Disparo automático de nota de crédito al cancelar, si había factura
      `AUTORIZADO` — confirmado ("best-effort: si falla, la cancelación igual se
      confirma y el fallo se refleja en `estadoReverso`") (§3).
- [ ] No confirmado si se registra `canceladaPor`/`fechaCancelacion` como campos propios
      de la reserva — no mencionados en la descripción del endpoint; verificar con logs
      reales o preguntar a backend si hace falta para el timeline.
- [x] Nuevo modelo y endpoints de `TicketSoporteReserva` — confirmado, implementados:
      `POST /api/reservas/{id}/incidencia`, `GET /api/tickets-soporte`,
      `POST /api/tickets-soporte/{id}/resolver` (§4). Ya conectados en el frontend:
      `src/lib/tickets-soporte-api.ts`, `src/actions/tickets-soporte.ts`,
      pantalla nueva en `/soporte` (`src/modules/tickets-soporte/`). La creación de la
      incidencia (`POST .../incidencia`) es exclusiva del cliente final — no aplica a
      este portal, solo el listado/resolución para Admin/Staff.
- [ ] No confirmado qué pasa si el reverso fiscal falla por Consumidor Final (§3) — el
      campo `estadoReverso = "ERROR"` cubre el caso genérico de fallo, pero no queda
      claro si distingue esta causa específica de otras.
