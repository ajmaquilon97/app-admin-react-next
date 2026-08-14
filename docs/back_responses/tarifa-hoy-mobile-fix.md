# Respuesta a Frontend Mobile — `TarifaHoy` en espacios de cupo compartido

**Estado:** ✅ Corregido
**Fecha:** 2026-08-05
**Reportado por:** equipo Frontend Mobile (QA de Cupo Compartido)

---

## Resumen

Tenían razón: había un espacio de cupo compartido devolviendo etiquetas de la modalidad `Hora`.
Ya está corregido y pueden avanzar con la UI de piscinas — **no hay bloqueos**.

Un matiz importante sobre *dónde* estaba el problema, porque cambia lo que conviene re-testear.

---

## Qué encontramos exactamente

Al revisar el código, el módulo tiene dos puntos que arman `TarifaHoy`, y sólo uno estaba mal:

| Endpoint | Estado antes del fix |
|---|---|
| `GET /api/mobile/espacios` (listado) | ✅ **Ya estaba correcto.** Devolvía `"Entrada"` / `"entrada"` con `entradaPrecio`. |
| `GET /api/mobile/espacios/{espacioId}/disponibilidad` (detalle) | ❌ **Roto.** Devolvía `"Hora"` / `"hora"`. |

El listado ya pasaba por un resolutor que contempla la modalidad. El endpoint de disponibilidad, en
cambio, llamaba directo al resolutor de precios por hora, sin la rama de cupo compartido.

### Corrección al diagnóstico: en disponibilidad el precio también estaba mal

En el reporte mencionan que *"se está calculando con el precio correcto"* y que sólo faltaban las
etiquetas. Eso es cierto para el **listado**, pero no para **disponibilidad**: ahí no era sólo un
problema de labels. El resolutor de hora lee `Tarifario.HoraPrecio`, no `Tarifario.EntradaPrecio`,
así que para una piscina devolvía:

- el **precio por hora** del espacio, si por alguna razón tenía uno configurado, o
- **`tarifa: null`**, que es lo más probable, porque estos espacios se configuran con
  `entradaActiva`/`entradaPrecio` y no con precio por hora.

Lo señalamos porque si estaban asumiendo que el número era bueno y sólo el texto era cosmético,
puede que hayan dado por válido un `null` o un precio que no correspondía. **Vale la pena re-testear
la pantalla de detalle/disponibilidad de piscinas**, no sólo el listado.

---

## Qué se cambió

Un solo punto: `MobileEspaciosService.ObtenerDisponibilidadPorFechaAsync` ahora usa el mismo
resolutor que el listado (`ResolverTarifaHoy`) en lugar de llamar al de hora directamente. Con eso
los dos endpoints comparten una única fuente de verdad y no pueden volver a divergir.

También se actualizaron los comentarios de `TarifaHoyDto` y `DisponibilidadMobileResponse`, que
seguían diciendo que este DTO era "para la modalidad Hora" — una descripción que quedó vieja cuando
se agregó cupo compartido y que probablemente contribuyó a la confusión.

---

## Contrato resultante

Para un espacio de **cupo compartido** (piscinas), ambos endpoints devuelven ahora:

```json
{
  "modalidad": "Entrada",
  "precio": 8.50,
  "unidad": "entrada",
  "esPromocion": false
}
```

Para un espacio de **franja exclusiva** (canchas, salones) nada cambia:

```json
{
  "modalidad": "Hora",
  "precio": 25.00,
  "unidad": "hora",
  "esPromocion": true
}
```

### Notas de contrato

- `modalidad` y `unidad` son **texto libre para mostrar**, no identificadores. Si necesitan
  ramificar lógica, usen el campo `modalidadReserva` del espacio
  (`"franja_exclusiva"` \| `"cupo_compartido"`), que es el valor estable.
- `precio` es `decimal` con 2 decimales.
- `esPromocion` viene **siempre `false`** en cupo compartido: las promociones sólo están
  implementadas sobre la jerarquía de precios por hora, no sobre el precio de entrada. Si el
  producto necesita promociones en piscinas, es trabajo pendiente de backend — avísennos.
- `tarifa` / `tarifaHoy` puede seguir viniendo **`null`** si el espacio no tiene configurado el
  precio de su modalidad (en cupo compartido: sin `entradaActiva` o sin `entradaPrecio`). La UI
  tiene que tolerar ese caso; no es un error.

---

## Cierre

Gracias por el catch — es exactamente el tipo de revisión que sirve. Detectaron una inconsistencia
real entre dos endpoints que debían comportarse igual, y de paso destapó que el problema en
disponibilidad era más profundo que las etiquetas.

**No hay bloqueos para la UI de piscinas.** Adelante.

Cualquier cosa que encuentren al re-testear disponibilidad, la vemos.
