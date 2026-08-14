# Addendum: Envío de Facturas por Correo — Backend (ApiTesis / ASP.NET Core)

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Contexto:** addendum a `docs/backend-facturacion-electronica-sri-spec.md`. Por
> cada reserva pagada se emiten **dos comprobantes SRI independientes** (ya
> implementado del lado del backend):
> 1. **Factura de servicio de Agora** — emitida con el RUC de Agora (la plataforma),
>    por el fee/comisión.
> 2. **Factura de servicio del espacio** — emitida con el RUC del anfitrión, por el
>    valor de la reserva.
>
> Lo único que falta es el **envío automático de ambas al correo del usuario final**
> cuando queden autorizadas. Este documento cubre solo eso.

---

## 1. Qué debe pasar

Cuando cualquiera de las dos facturas de una reserva pasa a estado `AUTORIZADO`, el
backend debe enviar un correo al **usuario final** (el cliente que hizo la reserva,
no el anfitrión) con esa factura adjunta (XML + RIDE en PDF, o al menos el PDF —
ver §3).

- Si ambas facturas se autorizan por separado (no necesariamente al mismo tiempo,
  ya que cada una pasa por su propio flujo de Recepción/Autorización con el SRI),
  **cada una dispara su propio envío** en el momento en que queda autorizada — no
  se espera a que las dos estén listas para mandar un solo correo combinado.
  Razón: evitar que un fallo/demora en una bloquee la entrega de la otra, que ya
  está lista y el cliente puede necesitar antes.
- El destinatario es el **correo del cliente de la reserva** (mismo dato que ya usa
  el sistema para notificaciones de reserva — `BookingClient.email` del lado del
  frontend).

## 2. Disparo

- Automático, en el mismo momento en que el flujo de facturación
  (`docs/backend-facturacion-electronica-sri-spec.md`) recibe `AUTORIZADO` del SRI —
  no requiere ninguna acción del frontend ni de un usuario.
- Aplica igual si la factura se autorizó en el primer intento o tras un reintento
  (`POST /api/facturas/{id}/reintentar`, `docs/backend-financiero-spec.md` §3.2).

## 3. Contenido del correo

Mínimo, por cada factura enviada:
- **Asunto** sugerido: `Tu factura de {razonSocialEmisor} — Reserva {códigoReserva}`
  (para que el cliente distinga a simple vista si es la de Agora o la del espacio).
- **Adjuntos**: el RIDE en PDF (`docs/backend-facturacion-electronica-sri-spec.md`
  §8) — es lo mínimo indispensable, es lo que el cliente necesita para sus propios
  registros. El XML autorizado como adjunto adicional es deseable pero no
  bloqueante; backend decide si lo incluye o solo lo deja disponible por descarga.
- Cuerpo del correo: datos básicos (número de comprobante, fecha, monto, a nombre
  de quién) — backend define el template exacto; no hay un diseño de este correo
  todavía del lado de producto/frontend.

## 4. Qué NO debe pasar

- El envío del correo **no debe bloquear ni revertir** el estado `AUTORIZADO` de la
  factura si falla (ej. correo inválido, proveedor de email caído). La factura sigue
  siendo válida ante el SRI independientemente de si el correo se entregó o no.
- **Acción requerida:** definir qué pasa si el envío falla — ¿se reintenta
  automáticamente (cuántas veces, con qué backoff), o queda como un estado
  consultable (`emailEnviado: false` + motivo) que alguien puede reintentar
  manualmente? No se resuelve en este documento — dejarlo como pregunta abierta
  para que backend proponga según lo que ya tengan de infraestructura de email
  (¿usan algún proveedor tipo SendGrid/SES ya integrado para otras notificaciones
  del sistema?).

## 5. Visibilidad para el frontend (opcional, no bloqueante)

Sería útil — pero no es requisito para esta primera versión — que
`GET /api/facturas` / `GET /api/reservas/{id}/factura`
(`docs/backend-facturacion-electronica-sri-spec.md`,
`docs/backend-financiero-spec.md`) devuelvan un campo adicional indicando si el
correo ya se envió, para poder mostrarlo en la ventana `/financiero`:

```jsonc
{
  // ...campos ya definidos...
  "emailEnviado": true,
  "fechaEnvioEmail": "2026-07-29T20:05:00Z"   // null si no se ha enviado / falló
}
```

## 6. Checklist

- [ ] Envío automático de cada factura (Agora y espacio, por separado) al correo del
      cliente final, al momento de quedar `AUTORIZADO`.
- [ ] RIDE en PDF adjunto como mínimo; XML autorizado adjunto es deseable.
- [ ] Fallo de envío no afecta el estado de la factura ante el SRI.
- [ ] Definir política de reintento de envío (§4) — pendiente de que backend
      proponga según su infraestructura de email actual.
- [ ] (Opcional) exponer `emailEnviado`/`fechaEnvioEmail` en los endpoints de
      consulta de factura, para visibilidad en `/financiero`.
