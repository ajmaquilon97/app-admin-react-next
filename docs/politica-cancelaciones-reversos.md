# Política de Cancelaciones y Reversos de Reserva

> **Estado:** definición de reglas de negocio, sin implementar todavía. Sirve de
> insumo para el endpoint `{id}/cancelar` de reservas y para el flujo de "Reversos"
> del módulo financiero (`docs/backend-nota-credito-sri-spec.md`).

---

## 1. Matriz de reglas

| Quién actúa | Cuándo | ¿Se puede? | Resultado |
| --- | --- | --- | --- |
| **Usuario final (cliente)** | Hasta 1 día antes de la fecha de la reserva | Sí | Cancelación autoservicio → reverso automático (nota de crédito si la reserva ya estaba facturada) |
| **Usuario final (cliente)** | El mismo día de la reserva (sin importar la hora, incluso si aún no empieza) | **No** | Botón de cancelar deshabilitado/no disponible para el cliente |
| **Anfitrión** | En cualquier momento (incluso el mismo día o con la reserva en curso) | Sí | Cancelación → **reverso automático**, sin revisión adicional |
| **Usuario final (cliente)** | Reserva ya **en curso** (dentro del horario) y no se pudo ejecutar la actividad (novedad del anfitrión o del local) | No es "cancelar" | Se abre un **ticket de soporte**; soporte investiga y decide si procede el reverso |

## 2. Por qué el reverso por anfitrión es automático y el de "reserva en curso" no

- Cuando **cancela el anfitrión**, no hay nada que arbitrar: es dueño del espacio y su
  decisión es unilateral y verificable (la reserva pasa a estado `Cancelada` por su
  acción). No tiene sentido interponer una revisión manual — solo agrega fricción.
- Cuando el problema surge **con la reserva ya en curso**, es una situación en
  disputa (¿de verdad no se pudo usar el espacio? ¿fue responsabilidad del anfitrión,
  del local, o del propio cliente?) — por eso pasa por soporte en vez de ser
  autoservicio. **Solo el usuario final puede abrir este ticket** (no el anfitrión).

## 3. Monto del reverso

Por ahora es **binario, siempre 100%**: o se puede cancelar/reversar (reembolso
completo) o no se puede. No hay política de reembolso parcial por cercanía a la fecha
(tipo "flexible/moderada/estricta"). Si más adelante se necesita, es un cambio
significativo: afecta cómo se calcula `valorModificacion` en la nota de crédito (ya
no sería igual al `importeTotal` de la factura original, sino un porcentaje) y
requeriría una nota de crédito **parcial**, no total.

## 4. Flujo resultante

```
Cliente pide cancelar
   → ¿Falta ≥ 1 día para la reserva?
        Sí → cancelar (Booking.status = Cancelada) → ¿tenía factura AUTORIZADO?
              Sí → disparar nota de crédito automática (docs/backend-nota-credito-sri-spec.md)
              No → solo cancelar, sin nota de crédito
        No → bloquear botón, mostrar por qué no se puede

Anfitrión pide cancelar (cualquier momento)
   → cancelar (Booking.status = Cancelada) → ¿tenía factura AUTORIZADO?
        Sí → disparar nota de crédito automática
        No → solo cancelar

Cliente reporta problema con reserva en curso
   → crear Ticket de soporte (nuevo, no existe hoy en el sistema)
   → soporte revisa → aprueba o rechaza
        Aprueba → disparar nota de crédito (mismo mecanismo, iniciado manualmente por soporte)
        Rechaza → se notifica al cliente, sin reverso
```

## 5. Riesgo a resolver: intersección con la restricción de "Consumidor Final"

El SRI no permite nota de crédito sobre facturas emitidas a Consumidor Final
(`docs/backend-nota-credito-sri-spec.md` §1). Esta política asume que **siempre** se
puede reversar una reserva pagada y facturada — pero si esa factura se emitió sin
identificación real del cliente, el reverso fiscal automático **no va a funcionar**,
sin importar cuál de los 3 flujos de arriba lo dispare.

**Implicación:** hay que decidir, junto con la spec de facturación, si:
- (a) se exige identificación real del cliente **siempre** que haya riesgo de
  cancelación (es decir, casi siempre) — la opción ya recomendada en el addendum de
  nota de crédito, o
- (b) se acepta que algunas reservas facturadas a Consumidor Final queden
  irreversibles fiscalmente, y el reembolso al cliente se resuelve **solo** a nivel
  de pago (reverso de cobro), sin nota de crédito — dejando una inconsistencia entre
  "el cliente recuperó su dinero" y "el comprobante fiscal sigue vigente y con
  validez tributaria" (lo cual puede ser un problema contable/legal a mediano plazo).

Se recomienda (a). No se implementa nada de esto todavía — queda marcado como
pendiente de decisión de producto antes de tocar el endpoint de facturación.

## 6. Pendiente — no cubierto por esta política

- El sistema de **tickets de soporte** no existe hoy en el proyecto — es una
  funcionalidad nueva a diseñar (fuera del alcance de este documento).
- No se definió qué pasa si el anfitrión cancela una reserva que el cliente ya no
  puede cancelar por estar en la ventana de "mismo día" — ¿aplica alguna penalización
  o aviso especial al anfitrión por cancelar tan tarde? Queda abierto.
