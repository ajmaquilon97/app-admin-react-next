# Respuesta al Addendum de Facturación — Backend

Ángel: los tres puntos del addendum están implementados, compilados (`dotnet build` → 0 errores) y
con sus migraciones ya aplicadas en `db_acb096_reservas`. Detalle abajo, más **dos cosas que
necesito que revises** (secciones ⚠️): una es un efecto del formato de asunto que pediste, la otra
es un cambio de ruta que rompe lo que te documenté ayer.

---

## 1. El endpoint móvil ahora devuelve un array de facturas ✅

**La ruta cambió a plural.** Antes te documenté `/factura`; ahora es:

```
GET /api/mobile/reservas/{reservaId}/facturas
```

⚠️ **La ruta vieja en singular ya no existe** — no quedó alias. Si alcanzaste a cablearla en la app,
hay que cambiarla o va a dar 404. Como todavía no habían integrado, asumí que era el momento de
hacer el corte limpio; si prefieres que mantenga la singular redirigiendo, lo agrego.

La respuesta **ya no es un objeto con envoltura**: es el arreglo directo, como pediste. Metí dentro
de cada elemento los datos que antes vivían en la envoltura (`codigoReserva`, `urlsExpiranEnSegundos`)
para que no se pierda nada al aplanar — cada factura viaja completa y autocontenida.

```json
[
  {
    "facturaId": "6f2a0c31-8d4e-4b0a-9f11-2c7e5a0b91d3",
    "reservaId": 154,
    "codigoReserva": "RES-06082026-28-154",
    "tipoFactura": "reserva_espacio",
    "descripcion": "Alquiler del espacio",
    "emisorRazonSocial": "AGORA ESPACIOS S.A.",
    "emisorNombreComercial": "Quinta Los Almendros",
    "numeroComprobante": "001-001-000000019",
    "claveAcceso": "0608202601120516292600110010010000000191234567819",
    "numeroAutorizacion": "0608202601120516292600110010010000000191234567819",
    "fechaAutorizacion": "2026-08-06T15:22:31",
    "subtotal": 43.48,
    "iva": 6.52,
    "total": 50.00,
    "pdfUrl": "https://agora-espacios-dev.s3.us-east-1.amazonaws.com/facturas/1205162926001/001-001-000000019.pdf?X-Amz-Signature=...",
    "xmlUrl": "https://agora-espacios-dev.s3.us-east-1.amazonaws.com/facturas/1205162926001/001-001-000000019.xml?X-Amz-Signature=...",
    "urlsExpiranEnSegundos": 3600,
    "nombreArchivoPdf": "factura-001-001-000000019.pdf",
    "nombreArchivoXml": "factura-001-001-000000019.xml"
  },
  {
    "facturaId": "b1c7d955-2a63-4f18-8e02-7d1904ab6c55",
    "reservaId": 154,
    "codigoReserva": "RES-06082026-28-154",
    "tipoFactura": "fee_plataforma",
    "descripcion": "Comisión de servicio",
    "emisorRazonSocial": "AGORA ESPACIOS S.A.",
    "emisorNombreComercial": "Agora",
    "numeroComprobante": "001-001-000000020",
    "claveAcceso": "0608202601120516292600110010010000000201234567815",
    "numeroAutorizacion": "0608202601120516292600110010010000000201234567815",
    "fechaAutorizacion": "2026-08-06T15:22:35",
    "subtotal": 4.35,
    "iva": 0.65,
    "total": 5.00,
    "pdfUrl": "https://agora-espacios-dev.s3.us-east-1.amazonaws.com/facturas/1205162926001/001-001-000000020.pdf?X-Amz-Signature=...",
    "xmlUrl": "https://agora-espacios-dev.s3.us-east-1.amazonaws.com/facturas/1205162926001/001-001-000000020.xml?X-Amz-Signature=...",
    "urlsExpiranEnSegundos": 3600,
    "nombreArchivoPdf": "factura-001-001-000000020.pdf",
    "nombreArchivoXml": "factura-001-001-000000020.xml"
  }
]
```

Solo trae facturas en estado **Autorizada**. Las que están en proceso o rechazadas no aparecen en
el arreglo — el endpoint responde `400` si *ninguna* llegó a autorizarse (ver tabla de errores en
`feedback-mobile-facturacion.md`, que ya actualicé con la ruta nueva).

### ⚠️ Sobre `emisorRazonSocial`

Te lo expongo porque lo pediste, pero **es el mismo valor en las dos facturas** y probablemente no
es el campo que quieres mostrar.

Los dos comprobantes se firman con un único certificado `.p12`, y el SRI rechaza el comprobante si
la razón social no corresponde al RUC del firmante. O sea que el **emisor legal siempre es la
plataforma**, en ambas facturas — incluida la del alquiler.

Lo que sí distingue una de otra es **`emisorNombreComercial`**: ahí va el nombre del anfitrión en la
factura del espacio y la marca Agora en la del fee. Es también lo que el RIDE imprime como
encabezado, o sea lo que el cliente ve como "de quién es esta factura".

**Recomendación**: usa `emisorNombreComercial` para el título de la fila y `descripcion` como
subtítulo. `emisorRazonSocial` déjalo para la letra chica. Ojo que `emisorNombreComercial` es
nullable.

---

## 2. El envío está aislado en try-catch y no bloquea el estado AUTORIZADO ✅

Implementado en `FacturaProcessor.ProcesarAsync`, y el orden importa:

1. Se sube el PDF y el XML a S3.
2. Se guarda la factura como **`Autorizada`** — `await UpdateAsync(factura)`. **Commit hecho.**
3. *Recién ahí* se intenta el correo, dentro de un `try/catch (Exception)` que loguea con `ILogger`
   y **no relanza**.

Como el estado ya está confirmado en base de datos en el paso 2, no hay rollback posible por un
fallo del paso 3. Un timeout de SMTP deja la factura `Autorizada` con `emailEnviado: false`, y nada
más. Tampoco cae en el `catch` general del método, que la marcaría como `Error` — una factura que el
SRI sí autorizó jamás debe terminar en ese estado por culpa del correo.

**El envío es independiente por factura** porque cada una se procesa en su propia invocación del
worker, con su propio scope de DI. Que falle el correo de la factura del espacio no afecta en nada
al de la comisión.

### Cambio de implementación que hice por tu requisito

Antes el correo se encolaba (`IAsynchronousEmailService`, fire-and-forget) y otro worker lo entregaba
después. **Lo pasé a envío síncrono** dentro del `try`.

Razón: con la cola, el fallo de SMTP ocurría en otro hilo, este `try` nunca lo veía, y
`emailEnviado` habría quedado en `true` para correos que jamás llegaron — el campo no serviría para
nada. Tu requisito de capturar "ej. timeout del SMTP" solo se cumple si se espera al envío. Como
esto corre en un worker de fondo y no atendiendo una petición HTTP, esperar al servidor de correo no
le hace esperar a ningún usuario.

La cola sigue existiendo para los QR de invitados, que no necesitan constancia de entrega.

### Asunto dinámico ✅

```
Tu factura de {EmisorRazonSocial} — Reserva {CodigoReserva}
```

Ejemplo real: `Tu factura de AGORA ESPACIOS S.A. — Reserva RES-06082026-28-154`

⚠️ **Consecuencia del punto anterior**: como `emisorRazonSocial` es idéntico en ambas facturas, el
cliente va a recibir **dos correos con exactamente el mismo asunto** para la misma reserva, y solo
podrá distinguirlos abriéndolos.

Lo dejé como lo especificaste, pero sugiero cambiar la plantilla a `EmisorNombreComercial`:

```
Tu factura de Quinta Los Almendros — Reserva RES-06082026-28-154
Tu factura de Agora — Reserva RES-06082026-28-154
```

Es una línea en `FacturaEmailBuilder.ConstruirAsunto`. Dime y lo cambio.

---

## 3. Campos `emailEnviado` y `fechaEnvioEmail` en `/api/facturas` ✅

Agregados a la entidad `Factura` (migración `AddTrazabilidadEmailAFacturas`, **ya aplicada**) y
expuestos en el DTO de `GET /api/facturas`, que es el que consume tu panel financiero:

```json
{
  "id": "6f2a0c31-8d4e-4b0a-9f11-2c7e5a0b91d3",
  "bookingCode": "RES-06082026-28-154",
  "numeroComprobante": "001-001-000000019",
  "estado": "Autorizada",
  "total": 50.00,
  "ridePdfUrl": "https://agora-espacios-dev.s3.us-east-1.amazonaws.com/facturas/...",
  "motivoRechazo": null,
  "emailEnviado": true,
  "fechaEnvioEmail": "2026-08-06 10:22"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `emailEnviado` | `bool` | `true` **solo cuando el SMTP aceptó el mensaje**, no cuando se decidió enviarlo. |
| `fechaEnvioEmail` | `string \| null` | `YYYY-MM-DD HH:mm` en **hora de Ecuador** (ya convertida, no la conviertas otra vez). `null` si nunca se envió. |

**Lo que te sirve para el panel**: una factura con `estado: "Autorizada"` + `emailEnviado: false` es
exactamente el caso "salió bien ante el SRI pero al cliente no le llegó nada". Ese es el filtro que
justifica los campos.

Ojo con dos casos donde queda en `false` sin que haya un error de SMTP:

- **Facturas anteriores a esta migración**: todas quedaron en `false` con `fechaEnvioEmail: null`,
  porque el campo no existía cuando se emitieron. No significa que el correo haya fallado — es que
  no hay registro. Si el panel las va a marcar en rojo, conviene filtrar también por
  `fechaAutorizacion` posterior al despliegue.
- **Reservas sin correo de facturación ni email de cuenta**: no se intenta el envío, se loguea un
  warning y queda en `false`.

**No hay endpoint de reenvío todavía.** Si lo quieres para el panel (un `POST /api/facturas/{id}/reenviar-email`),
dime y lo agrego — los archivos ya están en S3, así que es directo.

---

## Estado

| Punto del addendum | Estado |
|---|---|
| 1. Endpoint plural con array de facturas | ✅ Implementado |
| 2. Try-catch aislado + asunto dinámico | ✅ Implementado |
| 3. `emailEnviado` / `fechaEnvioEmail` + migración + DTOs | ✅ Implementado y migrado |
| 4. Este documento | ✅ |

Migraciones aplicadas: `AddXmlS3UrlAFacturas`, `AddTrazabilidadEmailAFacturas`. 0 pendientes.

**Sin probar en vivo**: el envío SMTP con adjuntos y la subida del XML a S3 solo se ejercitan cuando
un pago real dispara la emisión. La lógica compila y está revisada, pero el primer pago de prueba es
el que va a confirmar que `emailEnviado` se marca de verdad.
