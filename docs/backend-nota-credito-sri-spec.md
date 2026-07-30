# Addendum: Nota de Crédito SRI (Reversos) — Backend (ApiTesis / ASP.NET Core)

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Contexto:** addendum a `docs/backend-facturacion-electronica-sri-spec.md` (ya
> implementada de su lado). Este documento cubre solo lo **nuevo**: emitir una **nota
> de crédito** para reversar una factura ya autorizada, necesaria para la pestaña
> "Reversos" del módulo financiero (`/financiero` en el portal). Validado end-to-end
> contra el ambiente de pruebas real del SRI en `scripts/sri-test/emit-credit-note.mjs`
> (`npm run nc`) — resultado **RECIBIDA → AUTORIZADO** sin errores de estructura ni de
> firma. El XML completo de referencia (ya autorizado) queda en `scripts/sri-test/`
> por si sirve para comparar byte a byte.

---

## 0. Qué NO cambia

- Mismos servicios SOAP (Recepción/Autorización), mismas URLs de ambiente, mismo
  certificado digital, misma librería/enfoque de firma XAdES-BES que ya tienen
  funcionando para facturas — la nota de crédito se firma y se envía exactamente
  igual, solo cambia el contenido del XML.
- Mismo algoritmo de clave de acceso (49 dígitos, módulo 11) — cambia únicamente el
  `codDoc` (`04` en vez de `01`) y usa **su propio secuencial**, independiente del de
  facturas (ver §3).

## 1. Regla de negocio crítica — validar ANTES de intentar cualquier reverso

> **El SRI no permite anular una factura (por ningún medio, ni siquiera nota de
> crédito) si fue emitida a "Consumidor Final"** (`tipoIdentificacionComprador = 07`).

Esto **debe validarse en el backend antes de generar la factura original**, no solo al
momento del reverso: si existe alguna posibilidad de que la reserva se cancele después
de facturada, el comprador **debe** quedar registrado con identificación real (RUC,
cédula, pasaporte o identificación del exterior) — nunca como Consumidor Final
genérico.

**Acción requerida:**
1. Al emitir la factura (`POST /api/reservas/{id}/factura`, ya implementado): si el
   cliente no tiene datos fiscales completos, **no** hacer fallback silencioso a
   Consumidor Final — o se le pide el dato, o se documenta explícitamente que esa
   factura queda irreversible.
2. Al recibir una solicitud de reverso: si la factura original tiene
   `tipoIdentificacionComprador = "07"`, rechazar de inmediato con un mensaje claro
   (`400`), sin llegar a intentar el envío al SRI (el SRI la va a rechazar igual, pero
   sin un mensaje útil para el usuario final).

## 2. Los dos mecanismos del SRI — solo uno es automatizable

| Mecanismo | Cómo funciona | ¿Automatizable desde el backend? |
| --- | --- | --- |
| **Anulación en línea** | Portal "SRI en Línea" (RUC + clave del portal, **no** el certificado digital), hasta el día 10 del mes siguiente a la emisión. Se sube un Excel + carta de solicitud vía "Trámites y notificaciones". | **No.** No existe WSDL/REST/servicio programático — es un flujo pensado para que un humano lo haga desde el navegador. No intentar scraping/automatización del portal: no es un servicio soportado por el SRI. |
| **Nota de crédito** | Comprobante electrónico nuevo (`codDoc=04`), mismo flujo SOAP que la factura. Vigente hasta 12 meses después de la emisión original. | **Sí.** Es la única vía que el backend debe implementar. |

**Conclusión de producto:** el botón "Reversar" del módulo financiero (`/financiero`,
pestaña Reversos) solo debe disparar una **nota de crédito**. La "anulación en línea"
queda fuera del alcance de la automatización — si el negocio la necesita, la hace
directamente en el portal del SRI, y como mucho el sistema permite registrar
manualmente que ocurrió (sin disparar nada).

## 3. Estructura del XML — validada contra el SRI real

Root element `notaCredito` (no `factura`). Mismo estilo que `infoTributaria` de la
factura, pero `codDoc = "04"` y **secuencial independiente** (llevar un contador
separado por establecimiento+puntoEmisión, específico para notas de crédito — no
comparte la numeración con las facturas).

```xml
<notaCredito id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>...</razonSocial>
    <nombreComercial>...</nombreComercial>
    <ruc>...</ruc>
    <claveAcceso>...</claveAcceso>            <!-- codDoc=04 en el cálculo -->
    <codDoc>04</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>000000001</secuencial>         <!-- secuencia propia de notas de crédito -->
    <dirMatriz>...</dirMatriz>
  </infoTributaria>
  <infoNotaCredito>
    <fechaEmision>DD/MM/YYYY</fechaEmision>
    <dirEstablecimiento>...</dirEstablecimiento>
    <tipoIdentificacionComprador>05</tipoIdentificacionComprador>  <!-- NUNCA "07" -->
    <razonSocialComprador>...</razonSocialComprador>
    <identificacionComprador>...</identificacionComprador>
    <obligadoContabilidad>NO</obligadoContabilidad>
    <codDocModificado>01</codDocModificado>              <!-- 01 = factura -->
    <numDocModificado>001-001-000000005</numDocModificado>  <!-- estab-ptoEmi-secuencial de la factura original -->
    <fechaEmisionDocSustento>DD/MM/YYYY</fechaEmisionDocSustento>  <!-- fechaEmision de la factura original -->
    <totalSinImpuestos>10.00</totalSinImpuestos>
    <valorModificacion>11.50</valorModificacion>          <!-- = importeTotal de la factura original -->
    <moneda>DOLAR</moneda>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>4</codigoPorcentaje>            <!-- mismo catálogo: 4 = IVA 15% -->
        <baseImponible>10.00</baseImponible>
        <valor>1.50</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <motivo>ANULACION POR CANCELACION DE RESERVA</motivo>  <!-- último campo de infoNotaCredito -->
  </infoNotaCredito>
  <detalles>
    <detalle>
      <codigoInterno>...</codigoInterno>          <!-- equivalente a codigoPrincipal de la factura -->
      <descripcion>...</descripcion>
      <cantidad>1</cantidad>
      <precioUnitario>10.00</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>10.00</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>4</codigoPorcentaje>
          <tarifa>15</tarifa>
          <baseImponible>10.00</baseImponible>
          <valor>1.50</valor>
        </impuesto>
      </impuestos>
    </detalle>
  </detalles>
</notaCredito>
```

**Regla práctica:** copiar comprador, montos, impuestos y detalle **directamente de la
factura original** (no volver a calcularlos) — así el reverso siempre cuadra
exactamente con lo que se facturó, sin importar si hubo redondeos particulares en esa
factura.

## 4. Firma

- Se firma exactamente igual que la factura (XAdES-BES, misma librería, mismo
  certificado). Si están usando una librería .NET con funciones separadas por tipo de
  documento (patrón visto en el equivalente Node, `ec-sri-invoice-signer`, que expone
  `signInvoiceXml` / `signCreditNoteXml` / `signDebitNoteXml` como funciones
  separadas aunque hacen lo mismo internamente), usar la función/entry point
  correspondiente a nota de crédito si existe, o el genérico si la librería no
  distingue por tipo — lo que importa es que el **root tag** (`notaCredito`) y el
  contenido firmado sean correctos, la mecánica de firma es idéntica a la factura.
- Mismo dato de referencia útil: en las pruebas, el XML autorizado real quedó con
  `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">` (SHA-1)
  — confirma otra vez que **el algoritmo de hash no es lo que determina si el SRI
  acepta o rechaza la firma**; lo crítico es que la canonicalización XML (C14N) esté
  bien implementada (ver `docs/backend-facturacion-electronica-sri-spec.md` §3 para el
  detalle completo de ese hallazgo).

## 5. Modelo de datos — qué agregar

Extensión de la entidad `Factura` (o entidad nueva `Reverso`/`NotaCredito`, según
prefieran modelarlo) definida en la spec original:

```csharp
public class NotaCredito
{
    public Guid      Id                  { get; set; }
    public Guid      FacturaOriginalId   { get; set; }   // FK a Factura
    public string    Secuencial          { get; set; } = default!;  // secuencia propia, NO la de facturas
    public string    ClaveAcceso         { get; set; } = default!;
    public string    Estado              { get; set; } = default!;  // mismo catálogo que Factura: PROCESANDO/RECIBIDA/AUTORIZADO/DEVUELTA/NO_AUTORIZADO/ERROR
    public string?   NumeroAutorizacion  { get; set; }
    public DateTime? FechaAutorizacion   { get; set; }
    public decimal   Monto               { get; set; }             // = valorModificacion
    public string    Motivo              { get; set; } = default!;
    public string     XmlFirmado          { get; set; } = default!; // o URL a storage
    public string?      XmlAutorizado       { get; set; }
    public string?      MotivoRechazo       { get; set; }
    public DateTime      CreatedAt           { get; set; }
}
```

- **1 factura → 0 o varias notas de crédito** (podría necesitarse una nota de crédito
  parcial en el futuro; para el caso de uso actual — cancelación total de reserva — es
  siempre por el 100% del valor de la factura).
- Persistir el XML firmado/autorizado igual que la factura (mismo storage S3, mismos 7
  años de respaldo legal).

## 6. Endpoints (contrato con el frontend)

Ya definido conceptualmente en el diseño del módulo `/financiero` (pestaña Reversos).
Contrato concreto:

### `POST /api/reservas/{id}/reverso` — Solicitar nota de crédito

```jsonc
// Request
{ "motivo": "Cancelación de reserva solicitada por el cliente" }
```
- Precondiciones (`400`/`409` con mensaje claro si fallan):
  - La reserva tiene una factura en estado `AUTORIZADO`.
  - Esa factura **no** es a Consumidor Final (§1).
  - No existe ya una nota de crédito `AUTORIZADO` para esa factura.
- Igual que la emisión de factura: **asíncrono**, responde `202 Accepted`, el frontend
  hace polling.
  ```jsonc
  { "reversoId": "guid", "estado": "PROCESANDO" }
  ```

### `GET /api/reservas/{id}/reverso` — Consultar estado

```jsonc
{
  "reversoId": "guid",
  "facturaId": "guid",
  "estado": "AUTORIZADO",
  "claveAcceso": "...",
  "numeroAutorizacion": "...",
  "fechaAutorizacion": "2026-07-29T19:47:08Z",
  "monto": 11.50,
  "motivo": "Cancelación de reserva solicitada por el cliente",
  "motivoRechazo": null
}
```

### `GET /api/reversos?from=&to=&estado=&page=` — Listado (pestaña Reversos)

Mismo patrón de paginación que el resto de la API (`PagedResponse<T>`), usado por la
tabla de Reversos del módulo financiero.

## 7. Checklist

- [ ] Validar que la factura original no sea a Consumidor Final, tanto al facturar
      (§1, idealmente antes) como al solicitar el reverso.
- [ ] Secuencial propio para notas de crédito, atómico, independiente del de facturas.
- [ ] Generar XML `notaCredito` copiando datos de la factura original (§3), no
      recalculando montos/impuestos.
- [ ] Firmar con la misma infraestructura ya usada para facturas.
- [ ] Persistir XML firmado/autorizado en storage (S3), 7 años de respaldo.
- [ ] Endpoints `POST/GET /api/reservas/{id}/reverso`, `GET /api/reversos`.
- [ ] Catálogo de estados igual al de facturas (`PROCESANDO/RECIBIDA/AUTORIZADO/
      DEVUELTA/NO_AUTORIZADO/ERROR`) para que el frontend reutilice el mismo mapeo de
      badges.
