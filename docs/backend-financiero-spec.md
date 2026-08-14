# Especificación de Backend — Ventana Financiero (`/financiero`)

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Objetivo:** contrato de los endpoints que consume la ventana `/financiero` del
> portal (pestañas Resumen, Ingresos, Facturas, Reversos). Hoy el frontend está
> implementado completo contra **datos mock** (`src/lib/financiero-mock.ts`) — este
> documento es el contrato exacto para reemplazar el mock por el backend real, sin
> tener que tocar los componentes de UI.
>
> **No repite** la mecánica de fondo (firma XAdES-BES, flujo SOAP con el SRI, reglas
> de la nota de crédito) — eso ya está en:
> - `docs/backend-facturacion-electronica-sri-spec.md` (facturación)
> - `docs/backend-nota-credito-sri-spec.md` (reversos vía nota de crédito)
> - `docs/backend-cancelacion-reservas-spec.md` (disparo automático del reverso al cancelar)
>
> Este documento solo cubre los endpoints de **consulta agregada/listado** que la
> ventana necesita y que esas tres specs no cubrían (estaban enfocadas en la acción
> puntual sobre una reserva, no en listar/resumir).

---

## 0. Fuente de verdad de los tipos

Los campos y su `camelCase` exacto están definidos en
`src/modules/financiero/types/index.ts` (código real, ya implementado). Cualquier
diferencia entre esta spec y ese archivo, **el archivo `.ts` gana** — avisar para
corregir el documento.

## 1. `GET /api/financiero/resumen` — pestaña Resumen

Query params: `from` (`YYYY-MM-DD`, opcional), `to` (`YYYY-MM-DD`, opcional).

```jsonc
// 200 OK
{
  "ingresosMes": 1245.50,
  "variacionIngresos": 8.4,          // % vs. mes anterior; null si no hay dato comparativo
  "facturasAutorizadas": 34,
  "facturasConError": 3,             // suma de Devuelta + No autorizada + Error
  "totalReversado": 96.00,
  "serieIngresos": [
    { "fecha": "2026-07-16", "monto": 45.00 },
    { "fecha": "2026-07-17", "monto": 0 }
    // últimos 14 días, incluyendo días en $0 (el frontend no rellena huecos)
  ]
}
```

## 2. `GET /api/financiero/ingresos` — pestaña Ingresos

Vista de caja: pagos ya registrados por reserva (no reemplaza `/reservas`, es el
mismo dato desde el ángulo financiero, con el estado de su factura asociada).

Query params: `search` (cliente o código de reserva), `spaceId`, `dateFrom`, `dateTo`,
`page` (default `1`), `pageSize` (default `10`).

```jsonc
// 200 OK
{
  "items": [
    {
      "id": "guid",
      "bookingId": "guid",
      "bookingCode": "RES-1032",
      "clientName": "Carlos Mendoza",
      "spaceId": "guid",
      "spaceName": "Cancha Sintética 1",
      "amount": 45.00,
      "paymentMethod": "Tarjeta de crédito",
      "paymentDate": "2026-07-20",
      "invoiceStatus": "Autorizada",   // o null si la reserva aún no se facturó
      "invoiceId": "guid"              // o null si invoiceStatus es null
    }
  ],
  "total": 48,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

`invoiceStatus` usa el mismo catálogo de estados que la Factura (§3).

## 3. Facturas — pestaña Facturas

`docs/backend-facturacion-electronica-sri-spec.md` ya define
`GET /api/reservas/{id}/factura` (detalle **por reserva puntual**). Faltan estos dos,
específicos para la ventana financiera:

### 3.1 `GET /api/facturas` — listado paginado

Query params: `search` (cliente, número de comprobante o código de reserva),
`status` (uno de los estados de §3.3), `dateFrom`, `dateTo`, `page`, `pageSize`.

```jsonc
// 200 OK
{
  "items": [
    {
      "id": "guid",
      "bookingId": "guid",
      "bookingCode": "RES-1032",
      "numeroComprobante": "001-001-000000004",
      "claveAcceso": "2807202601120516292600110010010000000044617060011",
      "clientName": "Carlos Mendoza",
      "clientIdentification": "1712345678",
      "fechaEmision": "2026-07-20",
      "fechaAutorizacion": "2026-07-20",   // null si no autorizada aún
      "estado": "Autorizada",
      "subtotal": 39.13,
      "iva": 5.87,
      "total": 45.00,
      "ridePdfUrl": "https://.../factura.pdf",  // null si no autorizada aún
      "motivoRechazo": null                      // texto del SRI si Devuelta/No autorizada/Error
    }
  ],
  "total": 34,
  "page": 1,
  "pageSize": 10,
  "totalPages": 4
}
```

### 3.2 `POST /api/facturas/{id}/reintentar` — reintentar emisión

Solo aplicable si `estado` es `Devuelta` o `Error` (no `No autorizada` — ese es
rechazo de negocio, requiere corregir el dato, no un simple reintento; ver nota
abajo). Dispara de nuevo el flujo de `docs/backend-facturacion-electronica-sri-spec.md`
con el mismo XML corregido según el motivo de rechazo (si fue un problema
transitorio de red/timeout, basta reenviar; si fue estructural, backend decide si
reintenta tal cual o requiere que se corrija algo primero — fuera de alcance de
este documento definir esa lógica interna).

```jsonc
// 202 Accepted
{ "id": "guid", "estado": "Procesando" }
```

> **Nota de producto:** ¿reintentar `No autorizada` debería estar disponible en la UI
> si el motivo es de negocio (ej. catálogo de impuestos mal armado) y no se corrigió
> nada? Probablemente no debería reintentarse igual sin cambios — dejarlo fuera del
> botón "Reintentar" del frontend salvo que backend confirme que sí tiene sentido.

### 3.3 Catálogo de `estado` (Invoice / IncomeEntry.invoiceStatus)

Mismo catálogo usado en `backend-facturacion-electronica-sri-spec.md` §7.3, con estos
nombres exactos en español (frontend ya los usa así, `PascalCase con espacios`):

| Valor | Equivalente en la spec de facturación |
| --- | --- |
| `Procesando` | `PROCESANDO` |
| `Recibida` | `RECIBIDA` |
| `Autorizada` | `AUTORIZADO` |
| `Devuelta` | `DEVUELTA` |
| `No autorizada` | `NO_AUTORIZADO` |
| `Error` | `ERROR` |

**Acción requerida:** backend debe exponer estos valores exactos (o el frontend
mapea — a definir quién hace la traducción; más simple si el backend ya devuelve
este set directamente en los endpoints de esta ventana).

## 4. Reversos — pestaña Reversos — **CONFIRMADO, forma distinta a la propuesta**

`GET /api/reversos` está confirmado en `docs/swagger-api-login.json`, pero devuelve
`PagedResponse<NotaCreditoResponse>` — **sin el campo `tipo`** (no distingue
`NotaCredito`/`ReversoPago`: el backend solo trackea notas de crédito) y con un
**catálogo de `estado` distinto**: `procesando | enviada | autorizada | rechazada | anulada`
(no `Procesando | Autorizado | Rechazado | Completado` como se pedía acá).

**El frontend ya se adaptó a esto**: `Reversal` perdió el campo `tipo`, `ReversalStatus`
pasó a ser `Procesando | Enviada | Autorizada | Rechazada | Anulada`, y se eliminó
`useRequestReversal`/`RequestReversalPayload` (no había — ni hay — endpoint real para
solicitar un reverso manualmente desde esta pantalla; el único mecanismo real es el
automático al cancelar una reserva, `docs/backend-cancelacion-reservas-spec.md §3`).

Contrato original (ya no vigente, se deja como referencia histórica):

`docs/backend-nota-credito-sri-spec.md` ya define `GET /api/reversos` (listado) y
`POST/GET /api/reservas/{id}/reverso` (acción puntual). Precisión de contrato para
que calce con `src/modules/financiero/types/index.ts`:

```jsonc
// GET /api/reversos?from=&to=&tipo=&estado=&page=
{
  "items": [
    {
      "id": "guid",
      "tipo": "NotaCredito",              // "NotaCredito" | "ReversoPago"
      "facturaId": "guid",                // null si tipo = "ReversoPago"
      "bookingId": "guid",
      "bookingCode": "RES-1032",
      "clientName": "Carlos Mendoza",
      "monto": 45.00,
      "motivo": "Cancelación de reserva solicitada por el cliente",
      "estado": "Completado",             // "Procesando" | "Autorizado" | "Rechazado" | "Completado"
      "fechaSolicitud": "2026-07-25",
      "fechaResolucion": "2026-07-25",    // null si Procesando
      "claveAcceso": "..."                // solo si tipo=NotaCredito y ya autorizada; null en otro caso
    }
  ],
  "total": 6, "page": 1, "pageSize": 10, "totalPages": 1
}
```

**Nota sobre `tipo` (ya no aplica):** la idea original era distinguir `NotaCredito`
(reverso fiscal) de `ReversoPago` (reverso del cobro sin comprobante fiscal, para
reservas canceladas sin factura autorizada todavía). El backend no implementó esa
distinción — `GET /api/reversos` solo devuelve notas de crédito. Si el caso
"reserva cancelada sin factura" también necesita reflejarse en esta pantalla, haría
falta pedirlo aparte — hoy no hay forma de verlo en Reversos.

## 5. Espacios (filtro de la pestaña Ingresos)

Reutilizar el endpoint que ya expone `/reservas` para el filtro de espacios
(`GET /api/espacios` o el que ya use `getSpaceOptions()` en
`src/actions/reservas.ts`) — no hace falta uno nuevo específico para financiero.

## 6. Checklist

- [x] `GET /api/financiero/resumen` — confirmado, schema exacto (`FinancieroResumenResponse`).
- [x] `GET /api/financiero/ingresos` (paginado) — endpoint confirmado, pero el swagger
      **no formaliza el schema de `IngresoItemDto`** (solo dice `PagedResponse<IngresoItemDto>`
      sin desglose de campos). Implementado con la forma de §2 como mejor suposición —
      pendiente verificar contra los logs reales (`readAndLog` en `src/lib/financiero-api.ts`).
- [x] `GET /api/facturas` (paginado) — mismo caso: endpoint confirmado, `FacturaItemDto`
      no formalizado. Implementado con la forma de §3.1, pendiente de verificar.
- [x] `POST /api/facturas/{id}/reintentar` — confirmado (`202 Accepted`), shape de
      respuesta (`{ id, estado }`) no formalizado, asumido igual al `202` de §3.2.
- [x] `GET /api/reversos` — confirmado, pero con forma **distinta** a la de §4 (ver nota
      arriba: sin `tipo`, catálogo de `estado` diferente). Frontend ya adaptado.
- [ ] No confirmado si el catálogo exacto de estados de factura (§3.3) coincide
      carácter por carácter con lo que devuelve el backend real en `GET /api/facturas` —
      el frontend asume que sí (mismo set de `InvoiceStatus` ya usado en el resto de la
      app), pero no hay schema formal que lo garantice.
