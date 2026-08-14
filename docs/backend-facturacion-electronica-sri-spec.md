# Especificación de Facturación Electrónica SRI — Backend (ApiTesis / ASP.NET Core)

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Objetivo:** emitir factura electrónica ante el SRI por cada reserva pagada,
> autorizarla y generar el RIDE (PDF), sin que el frontend hable directo con el SRI.
> **Contexto:** ya se validó el flujo completo end-to-end en un script de pruebas
> Node.js (`scripts/sri-test/`, ver `FINDINGS.md` ahí) contra el ambiente de pruebas
> real del SRI (`celcer.sri.gob.ec`), con un certificado digital real de Security
> Data. Esta spec traduce esos hallazgos a requerimientos concretos para el backend.

---

## 0. Regla de oro y frontera de responsabilidad

> El **backend habla con el SRI** (SOAP, firma XAdES-BES, XML). El **frontend nunca
> toca el SRI directamente** — solo pide "emitir factura de esta reserva" y consulta
> el resultado, igual que ya hace con pagos y reservas.

```
Usuario confirma pago de una reserva (ya implementado)
   → Next: botón "Generar factura" (o automático al completar el pago)
   → POST /api/reservas/{id}/factura
        Backend:
          1. Valida que la reserva tenga pago registrado y datos fiscales del cliente
          2. Arma el XML de la factura según el esquema del SRI
          3. Calcula la clave de acceso (49 dígitos, módulo 11)
          4. Firma el XML (XAdES-BES) con el certificado digital de la empresa
          5. Envía a RecepcionComprobantesOffline (SOAP) → RECIBIDA | DEVUELTA
          6. Si RECIBIDA: espera unos segundos, consulta
             AutorizacionComprobantesOffline (SOAP) → AUTORIZADO | NO AUTORIZADO | PENDIENTE
          7. Si AUTORIZADO: genera el RIDE (PDF), guarda XML + PDF (storage ya
             existente, S3), persiste todo en una tabla Factura
   ← 202 Accepted (proceso asíncrono) o 201/200 con el resultado si se resuelve rápido
   → Next hace polling de GET /api/reservas/{id}/factura hasta ver estado final
```

**El SRI no entrega el PDF.** Sus únicos dos servicios web trabajan solo con XML
(Recepción y Autorización). El RIDE es responsabilidad exclusiva del emisor —
no hay ningún endpoint del SRI que lo genere.

---

## 1. Servicios del SRI a consumir (SOAP/WSDL)

| Ambiente | Recepción | Autorización |
| --- | --- | --- |
| **Pruebas** | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` |
| **Producción** | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` |

- **Recepción** (`validarComprobante`): recibe el XML firmado en **base64**, responde
  `RECIBIDA` (pasó validación de estructura y firma) o `DEVUELTA` (con el motivo del
  rechazo — estructura, firma inválida, secuencial repetido, etc.).
- **Autorización** (`autorizacionComprobante`): recibe la **clave de acceso**, responde
  `AUTORIZADO` (con el XML autorizado embebido en la respuesta, número y fecha de
  autorización), `NO AUTORIZADO` (con el motivo — puede ser de validación de negocio,
  ej. catálogo de impuestos incorrecto) o **sin autorizaciones aún** (hay que reintentar
  la consulta más tarde; el esquema "offline" puede tardar de segundos a ~24h, aunque
  en la práctica fue casi inmediato en las pruebas).
- **Ambos exigen HTTPS con TLS moderno**; no requieren autenticación adicional (la
  "autenticación" es la firma XAdES-BES del XML mismo).
- **No existe un certificado de prueba del SRI.** El ambiente de pruebas exige la
  misma firma real que producción — solo cambia la URL, y los comprobantes de pruebas
  no tienen validez tributaria.

---

## 2. Certificado digital

- Debe ser un certificado real, emitido por una entidad acreditada: **Security Data**,
  Banco Central del Ecuador, ANFAC, Consejo de la Judicatura o UANATACA.
- Formato `.p12`/`.pfx`, protegido con contraseña.
- **Nunca en el repo.** Debe vivir en configuración segura del backend (Key Vault /
  variable de entorno / secret manager), igual que ya se hace con las credenciales de
  AWS S3 y el secreto de sesión.
- Tiene fecha de vigencia (`notBefore`/`notAfter`) — validar antes de firmar y alertar
  cuando esté por vencer.

---

## 3. Firma XAdES-BES — la parte crítica

Esto fue, por lejos, el punto que más costó resolver en las pruebas. Documentamos el
detalle porque es fácil volver a caer en los mismos errores si se implementa a mano.

### 3.1 No implementar la canonicalización XML a mano

En las pruebas, la librería Node.js `open-factura` (la más popular del ecosistema JS
para esto) resultó tener **4 bugs reales** en su firma (typos de namespace/atributos) y,
aun corrigiéndolos, **nunca produjo una firma que el SRI aceptara** — su canonicalización
(C14N) está implementada con concatenación de strings en vez de un algoritmo C14N real,
y los digests no coinciden con los que el validador del SRI recalcula. Reimplementar la
canonicalización a mano (incluso con una librería C14N real como base) tampoco fue
suficiente: hay detalles de posicionamiento de namespaces en el árbol XML muy fáciles de
hacer mal y que invalidan la firma sin ningún mensaje de error útil (`FIRMA INVALIDA:
firma y/o certificados alterados` es el único mensaje que da el SRI, sin importar cuál
sea la causa exacta). Lo que sí funcionó fue usar una librería dedicada y probada contra
el SRI real (`ec-sri-invoice-signer` en el ecosistema Node).

**Para .NET:** la buena noticia es que `System.Security.Cryptography.Xml` (incluido en
el framework) trae una implementación de C14N espec-compliant, mucho más confiable que
las opciones ad-hoc de JS. Aun así, **no armar el `<ds:Signature>` a mano** — usar una
librería dedicada a XAdES-BES para SRI Ecuador que ya maneje la estructura exacta
(SignedProperties, QualifyingProperties, etc.) sobre esa base. Opciones a evaluar en
NuGet: `Infoware.FirmaXadesNet` / `Infoware.SRI.Firmar` (específicas para SRI Ecuador),
o `FirmaXadesNetCore` (XAdES genérico, requeriría adaptar la parte específica del SRI).
**Recomendación:** antes de comprometerse a una, armar un spike de firma + Recepción +
Autorización contra el ambiente de pruebas real (igual que se hizo en
`scripts/sri-test/`) para confirmar que el SRI la acepta — no basta con que "compile" o
"parezca válida", hay que verificarla contra el servicio real.

### 3.2 Estructura de firma confirmada como válida (referencia)

Comparado byte a byte contra un RIDE/XML real de producción, esta es la forma exacta
que el SRI acepta:

- **SHA-256** para digests (`http://www.w3.org/2001/04/xmlenc#sha256`) y para la firma
  (`http://www.w3.org/2001/04/xmldsig-more#rsa-sha256`). (Nota: también se comprobó que
  una firma **SHA-1** espec-compliant es aceptada — el algoritmo no es lo que importa,
  sino que la canonicalización sea correcta. SHA-256 es lo que usa el ejemplo de
  referencia real, así que es la opción más segura a replicar.)
- **Solo 2 `<ds:Reference>`** dentro de `<ds:SignedInfo>`: una sobre `#comprobante`
  (con transform `enveloped-signature`) y otra sobre el `SignedProperties` (XAdES). **No**
  se referencia el `KeyInfo`.
- `<ds:KeyInfo>` **minimalista**: solo `<ds:X509Data><ds:X509Certificate>`, sin
  `KeyValue`/`RSAKeyValue`.
- Los namespaces (`xmlns:ds`, `xmlns:xades`, `xmlns:xades141`) se declaran una sola vez,
  en los elementos raíz correspondientes (`<ds:Signature>`, `<xades:QualifyingProperties>`)
  — **no** redeclararlos en `SignedProperties` ni otros hijos; la posición donde se
  declara un namespace cambia el resultado de la canonicalización C14N y por tanto el
  digest.
- `<xades:SigningTime>` con offset de zona horaria real y milisegundos
  (`2026-07-28T18:45:32.509-05:00`), no UTC "pelado".
- El elemento `<ds:Signature>` va como **último hijo** de `<factura id="comprobante">`.

Ejemplo de referencia real disponible en `scripts/sri-test/` (aportado durante las
pruebas) si el equipo de backend quiere compararlo directamente.

---

## 4. Clave de acceso (49 dígitos)

Algoritmo público del SRI ("módulo 11"), ya implementado y verificado en
`scripts/sri-test/emit-invoice.mjs::generateAccessKey`:

```
claveAcceso =
    fechaEmision (DDMMYYYY, 8 dígitos)
  + codDoc                              (2, "01" = factura)
  + ruc                                 (13)
  + ambiente                            (1: "1"=pruebas, "2"=producción)
  + establecimiento                     (3)
  + puntoEmision                        (3)
  + secuencial                          (9)
  + códigoNumerico aleatorio            (8 dígitos)
  + tipoEmision                         (1, "1"=normal)
  + dígitoVerificador (módulo 11 sobre todo lo anterior, con multiplicador cíclico 2-7)
```

⚠️ **Cuidado con el bug encontrado en `open-factura`:** si se calcula la fecha con
`new Date("DD/MM/YYYY")` en vez de parsear el string directamente, cualquier día > 12 da
`Invalid Date` (JS interpreta `DD/MM/YYYY` como `MM/DD/YYYY`). No aplica a .NET
directamente, pero es un ejemplo de por qué conviene tener un test unitario que cubra
fechas con día > 12.

**El secuencial debe ser persistente y atómico por establecimiento+puntoEmisión**
(incrementar en una transacción; el SRI rechaza con `DEVUELTA` / `ERROR SECUENCIAL
REGISTRADO` si se reintenta el mismo secuencial, incluso si el intento anterior nunca
llegó a autorizarse).

---

## 5. Catálogos del SRI relevantes

| Campo | Valor confirmado | Nota |
| --- | --- | --- |
| `codigoPorcentaje` IVA 15% | **`4`** | ⚠️ Confirmado contra un comprobante real autorizado. `8` (usado en un intento inicial) **no** es válido — el SRI lo rechaza en Autorización con `ERROR EN DIFERENCIAS` / "la tarifa del impuesto no es igual a la parametrizada". Verificar este catálogo contra la ficha técnica vigente del SRI antes de hardcodearlo definitivamente; puede haber más códigos vigentes (0%, exento, no objeto de IVA) que la reserva no necesite hoy pero sí a futuro. |
| `tipoIdentificacionComprador` | `04`=RUC, `05`=Cédula, `06`=Pasaporte, `07`=Consumidor final, `08`=Identificación del exterior | |
| `formaPago` | `01`=Sin utilización del sistema financiero (efectivo), `20`=Otros con utilización del sistema financiero, etc. | Mapear desde el método de pago real de la reserva. |
| `codDoc` | `01` = factura | Único tipo necesario para este caso de uso (reservas pagadas). |
| `ambiente` | `1`=pruebas, `2`=producción | Debe ser configurable por entorno de despliegue del backend. |
| `tipoEmision` | `1` = normal | El SRI también soporta "contingencia" (offline prolongado); no es necesario para el alcance actual. |

---

## 6. Modelo de datos — qué falta hoy

El modelo actual de `Reserva`/`Cliente` (según lo integrado en el frontend, ver
`src/lib/reservas/api.ts` y `src/modules/bookings/types/index.ts`) **no tiene datos
fiscales**. Solo existe `id, nombre, email, telefono` para el cliente y `pago.{total,
pagado, pendiente}` sin desglose de impuestos.

### 6.1 Datos fiscales del cliente — necesarios antes de poder facturar

| Campo | Tipo | Nota |
| --- | --- | --- |
| `tipoIdentificacion` | `"04"\|"05"\|"06"\|"07"\|"08"` | Si no se captura, usar `"07"` (Consumidor Final) con identificación `9999999999999`. |
| `numeroIdentificacion` | string | RUC (13) o cédula (10). |
| `razonSocial` | string | Razón social o nombre completo. |
| `direccion` | string | Requerida por el XSD del SRI (`direccionComprador`). |

**Pregunta abierta para UX/producto:** ¿estos datos se capturan al momento de reservar,
en el perfil del usuario, o se piden justo antes de emitir la factura (como hace la
mayoría de plataformas — "¿Necesitas factura? Completa tus datos")? Afecta si esto va
en el modelo de `Usuario`/`Cliente` o en un formulario aparte ligado a la `Factura`.

### 6.2 Nueva entidad `Factura`

```csharp
public class Factura
{
    public Guid      Id                  { get; set; }
    public Guid      ReservaId           { get; set; }
    public string    Ambiente            { get; set; } = default!;   // "1" | "2"
    public string    Establecimiento     { get; set; } = default!;   // "001"
    public string    PuntoEmision        { get; set; } = default!;   // "001"
    public string    Secuencial          { get; set; } = default!;   // "000000001", atómico
    public string    ClaveAcceso         { get; set; } = default!;   // 49 dígitos
    public string    Estado              { get; set; } = default!;   // ver §7.3
    public string?    NumeroAutorizacion  { get; set; }
    public DateTime?  FechaAutorizacion   { get; set; }
    public decimal    Subtotal            { get; set; }
    public decimal    Iva                 { get; set; }
    public decimal    Total               { get; set; }
    public string      XmlFirmado          { get; set; } = default!;  // o URL a storage
    public string?      XmlAutorizado       { get; set; }              // o URL a storage
    public string?      RidePdfUrl          { get; set; }              // URL en S3
    public string?      MotivoRechazo       { get; set; }              // mensaje crudo del SRI si DEVUELTA/NO AUTORIZADO
    public DateTime      CreatedAt           { get; set; }
    public DateTime?      UpdatedAt           { get; set; }
}
```

- **1 reserva → 0 o 1 factura** (no se contempla nota de crédito/reembolso fiscal en
  este alcance; si se necesita a futuro, es un documento separado `notaCredito` que
  referencia la factura original).
- El XML (firmado y autorizado) y el PDF **deben persistirse** — son el respaldo legal;
  el SRI exige guardarlos mínimo 7 años. Subir a S3 (ya usado en el proyecto,
  `S3_BUCKET_NAME`) y guardar solo la URL/key en la tabla.

---

## 7. Endpoints requeridos (contrato con el frontend)

Mismo patrón que el resto de la API (`/api/reservas/...`), JSON `camelCase`, errores
`{ "message": string }`.

### 7.1 `POST /api/reservas/{id}/factura` — Emitir factura

- Requiere sesión (Bearer access token), rol con permiso sobre la reserva.
- Precondiciones que el backend debe validar (y devolver `400`/`409` claro si fallan):
  - La reserva existe y su `payment.status` es `Pagado` o `Pagado parcialmente` (definir
    con negocio si se factura solo cuando está 100% pagado, o también parcial).
  - El cliente tiene datos fiscales completos (§6.1) — si no, `400` con mensaje
    accionable para que el frontend pida completarlos.
  - No existe ya una factura `AUTORIZADO` para esa reserva (evitar doble facturación).
- Dispara el flujo de §0 (armar XML → firmar → Recepción → Autorización → RIDE).
- **Recomendado: asíncrono.** Autorización puede tardar; no bloquear el request HTTP
  esperando al SRI. Responder `202 Accepted` con el `facturaId` y que el frontend haga
  polling a 7.2, o usar un mecanismo de notificación (SignalR/webhook) si ya existe algo
  similar en el proyecto.
  ```jsonc
  // 202 Accepted
  { "facturaId": "guid", "estado": "PROCESANDO" }
  ```

### 7.2 `GET /api/reservas/{id}/factura` — Consultar estado/detalle

```jsonc
// 200 OK
{
  "facturaId": "guid",
  "estado": "AUTORIZADO",              // ver catálogo §7.3
  "claveAcceso": "280720260112...011",
  "numeroAutorizacion": "280720260112...011",
  "fechaAutorizacion": "2026-07-29T00:20:54Z",
  "numeroComprobante": "001-001-000000004",
  "subtotal": 10.00,
  "iva": 1.50,
  "total": 11.50,
  "ridePdfUrl": "https://.../factura.pdf",
  "motivoRechazo": null
}
```
- `404` si la reserva no tiene factura emitida todavía.

### 7.3 Catálogo de `estado`

| Estado | Significado | Acción del frontend |
| --- | --- | --- |
| `PROCESANDO` | Se está armando/firmando/enviando | Seguir haciendo polling |
| `RECIBIDA` | El SRI aceptó el XML, esperando autorización | Seguir haciendo polling |
| `AUTORIZADO` | Factura válida, `ridePdfUrl` disponible | Mostrar/descargar factura |
| `DEVUELTA` | El SRI rechazó por estructura/firma (`motivoRechazo`) | Mostrar error; requiere intervención técnica, no reintento automático del usuario |
| `NO_AUTORIZADO` | El SRI rechazó por regla de negocio (`motivoRechazo`, ej. catálogo de impuestos) | Igual que `DEVUELTA` |
| `ERROR` | Falla no atribuible al SRI (timeout, error interno) | Permitir reintentar |

### 7.4 `GET /api/reservas/{id}/factura/pdf` — Descargar RIDE

- Devuelve el PDF directo (`Content-Type: application/pdf`) o un redirect a la URL de
  S3, según convención ya usada en el proyecto para otros archivos.

### 7.5 (Si aplica) `PUT /api/clientes/{id}/datos-fiscales` o similar

- Para completar los datos de §6.1 antes de poder facturar, si se decide capturarlos
  bajo demanda en vez de en el perfil. Definir junto con producto/UX.

---

## 8. Generación del RIDE (PDF)

- **No lo entrega el SRI** — es responsabilidad exclusiva del backend, inmediatamente
  después de recibir `AUTORIZADO` (ya se tiene el XML completo en ese momento).
- Formato de referencia validado (ver captura/PDF de ejemplo compartido, y el prototipo
  funcional en `scripts/sri-test/generate-ride.mjs`):
  - Dos recuadros de cabecera: **emisor** (razón social, dir. matriz/sucursal,
    contribuyente especial si aplica, obligado a contabilidad) y **datos
    tributarios/autorización** (RUC, "FACTURA", número, número/fecha de autorización,
    ambiente, tipo de emisión, clave de acceso).
  - **Código de barras Code128** con la clave de acceso (no QR — es el estándar real
    usado por los RIDE en Ecuador).
  - Datos del comprador, tabla de detalle, desglose de subtotales por tarifa de IVA
    (`SUBTOTAL 15%`, `SUBTOTAL 0%`, etc.), ICE, IRBPNR, propina, descuento, valor total.
  - Recuadro "Forma de pago".
- En .NET: cualquier librería de generación de PDF con soporte de barcode sirve
  (`QuestPDF`, `iTextSharp`/`iText7`, o generar el barcode aparte con `ZXing.Net` y
  embeberlo como imagen). No hay una librería "oficial" del SRI para esto.
- Marca de agua "AMBIENTE DE PRUEBAS - SIN VALOR TRIBUTARIO" cuando `ambiente = "1"`
  (para no confundir comprobantes de prueba con reales).

---

## 9. Configuración / secretos requeridos

| Variable | Ejemplo | Nota |
| --- | --- | --- |
| `Sri:Ambiente` | `1` (pruebas) / `2` (producción) | Por entorno de despliegue |
| `Sri:Ruc` | `1205162926001` | RUC de la empresa emisora |
| `Sri:RazonSocial` / `Sri:NombreComercial` | | |
| `Sri:DireccionMatriz` | | |
| `Sri:Establecimiento` / `Sri:PuntoEmision` | `001` / `001` | |
| `Sri:CertificadoPath` o `Sri:CertificadoBase64` | | El `.p12`, en secret manager — **nunca en el repo ni en appsettings versionado** |
| `Sri:CertificadoPassword` | | Secret manager |
| `Sri:ReceptionUrl` / `Sri:AuthorizationUrl` | según §1 | Derivar de `Ambiente` o configurar explícito |

---

## 10. Checklist de implementación

- [ ] Extender modelo de cliente/usuario con datos fiscales (§6.1) o definir dónde se
      capturan si no es en el perfil.
- [ ] Tabla `Factura` (§6.2) con secuencial atómico por establecimiento+puntoEmisión.
- [ ] Servicio de generación de XML según XSD vigente del SRI (validar contra el XSD
      real, no solo "que compile").
- [ ] Firma XAdES-BES con librería dedicada — **validar contra el SRI real en
      ambiente de pruebas antes de dar por bueno**, no solo verificación matemática
      propia (fue insuficiente en las pruebas: una firma autoconsistente y con RSA
      válido igual fue rechazada por el SRI hasta ajustar la estructura exacta).
- [ ] Cliente SOAP para Recepción y Autorización (con reintento/polling para
      Autorización).
- [ ] Persistencia de XML firmado, XML autorizado y RIDE en S3 (7 años de respaldo).
- [ ] Generación de RIDE en PDF con código de barras Code128.
- [ ] Endpoints `POST /api/reservas/{id}/factura`, `GET /api/reservas/{id}/factura`,
      `GET /api/reservas/{id}/factura/pdf`.
- [ ] Catálogo `codigoPorcentaje` de IVA verificado contra la ficha técnica vigente del
      SRI (confirmado `4` = 15% en pruebas reales).
- [ ] Manejo de vigencia del certificado (alertar antes de que expire).
- [ ] Definir con producto: ¿factura solo con pago completo, o también parcial? ¿Se
      emite automático al pagar, o el usuario la solicita?
