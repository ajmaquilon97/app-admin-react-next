# Hallazgos — prueba de facturación electrónica SRI (2026-07-28/29)

## Resultado final: ✅ AUTORIZADO

El flujo completo (generar XML → firmar XAdES-BES → enviar a Recepción → consultar
Autorización) funciona end-to-end contra el ambiente de pruebas del SRI
(`celcer.sri.gob.ec`) con un certificado real de Security Data. Reproducido más de
una vez con secuenciales distintos.

## Camino recorrido

1. **XML + SOAP + Recepción**: funcionó desde el principio con `open-factura`
   (librería open-source para generar el XML según el esquema del SRI).
2. **Firma (`signXml` de `open-factura`)**: nunca llegó a producir una firma
   válida. Se identificaron y corrigieron 4 typos reales en su código (namespace
   `xmldisg#`→`xmldsig#`, atributo `Algorith`→`Algorithm`, transform
   `xmlndsig#`→`xmldsig#`, y un `.replace()` que nunca hacía match por buscar
   `"<ets:SignedProperties"` en vez de `"<etsi:SignedProperties"`) — arreglar los 4
   resolvió el rechazo por estructura (`DEVUELTA`) pero **no** la autorización
   (`FIRMA INVALIDA`). Coincide con el
   [issue #14 sin resolver](https://github.com/miguelangarano/open-factura/issues/14)
   del repo.
3. **Reimplementación propia de la firma** (canonicalización C14N real vía
   `xml-crypto`, en vez de concatenación de strings): se llegó a una firma
   matemáticamente autoconsistente (digests verificados de forma independiente,
   verificación RSA exitosa) y aun así el SRI seguía devolviendo `FIRMA INVALIDA`.
   Comparando byte a byte contra un XML real firmado con una herramienta oficial
   (aportado por el usuario) se encontraron diferencias estructurales relevantes:
   SHA-256 en vez de SHA-1, solo 2 `<ds:Reference>` (sin referenciar `KeyInfo`),
   `KeyInfo` minimalista (sin `KeyValue`/`RSAKeyValue`), y un bug propio de
   posicionamiento de namespaces en la canonicalización de `SignedProperties`
   (el namespace `ds:` se declaraba en el lugar equivocado del árbol, cambiando el
   resultado canónico). Corregido todo esto, la firma seguía sin ser aceptada —
   quedó descartada esta vía por tiempo.
4. **Librería `ec-sri-invoice-signer`** (sugerida por el usuario, mantenida
   activamente con tests contra el SRI real): funcionó al primer intento
   estructuralmente válido — pasó de `FIRMA INVALIDA` a un error de **validación de
   negocio** (`ERROR EN DIFERENCIAS`, identificador 52: código de IVA incorrecto).
   Usa SHA-1 interno, lo cual confirma que el algoritmo no era el problema —
   el problema siempre fue la implementación de la canonicalización/firma.
5. **Corrección de dato de negocio**: `codigoPorcentaje` para IVA 15% es **`4`**,
   no `8` (confirmado contra un comprobante real autorizado por el SRI que aportó
   el usuario). Con ese cambio: **AUTORIZADO**.

## Stack final que funciona

- `open-factura`: solo para `generateInvoiceXml`, `getP12FromLocalFile`,
  `documentReception`, `documentAuthorization` (SOAP). **No** se usa su `signXml`
  (bug sin resolver).
- `ec-sri-invoice-signer`: firma XAdES-BES (`signInvoiceXml`). Requiere que el XML
  de entrada no tenga `xmlns:` en la raíz (`open-factura` los agrega; se remueven
  con un `.replace()` antes de firmar — ver `emit-invoice.mjs`).

## RIDE (PDF)

El SRI **no genera ni entrega el PDF**: sus dos servicios web (Recepción y
Autorización) solo trabajan con el XML. El RIDE (Representación Impresa del
Documento Electrónico) es responsabilidad exclusiva del emisor — no hay endpoint
oficial que lo devuelva.

`generate-ride.mjs` arma el RIDE a partir del XML autorizado (`output/*-authorized.xml`)
replicando el formato estándar usado por la mayoría de facturadores en Ecuador
(comparado contra un RIDE real de producción aportado por el usuario):

- Dos recuadros de cabecera: emisor (razón social, dir. matriz/sucursal,
  contribuyente especial, obligado a contabilidad) y datos tributarios (RUC,
  "FACTURA", número, número/fecha de autorización, ambiente, tipo de emisión).
- **Código de barras (Code128)**, no QR, con la clave de acceso — es el estándar
  real de los RIDE en Ecuador (`bwip-js`).
- Datos del comprador, tabla de detalle (Cod. Principal / Cant / Descripción /
  P. Unitario / Descuento / P. Total).
- Desglose de subtotales por tarifa de IVA (`SUBTOTAL 15%`, `SUBTOTAL 0%`, etc.,
  derivados de `codigoPorcentaje` en cada `totalImpuesto`), ICE, IRBPNR, propina,
  descuento y valor total.
- Recuadro "Forma de pago".

Usa `pdfkit` (layout) + `bwip-js` (código de barras) + `fast-xml-parser` (leer el
XML — con `parseTagValue: false` para no perder precisión en la clave de acceso de
49 dígitos, que se corrompe en notación científica si se parsea como número).
La altura de cada fila/celda se calcula con `pdf.heightOfString()` antes de
dibujar — no se puede inferir del `pdf.y` post-hoc porque solo refleja la última
columna escrita, no la más alta (bug real que causó solapes en un intento
anterior).

Uso: `npm run ride` (toma el `*-authorized.xml` más reciente) o
`node generate-ride.mjs <ruta-al-xml>`.

## Anulación de facturas: solo vía nota de crédito (validado end-to-end)

Investigando el diseño de "Reversos" del módulo financiero, se confirmó que el SRI
ofrece **dos mecanismos distintos** para invalidar una factura ya autorizada, y solo
uno es automatizable:

- **Anulación en línea** (portal "SRI en Línea", hasta el día 10 del mes siguiente a
  la emisión): **100% manual**. Requiere las claves del portal (RUC + clave SRI, no
  el certificado digital), y se hace subiendo un Excel + una carta de solicitud vía
  "Trámites y notificaciones". **No existe WSDL/REST ni ningún servicio programático**
  para esto — no se puede disparar desde `sri-test` ni desde ningún backend.
- **Nota de crédito** (dentro de 12 meses, o como única vía pasado el plazo de la
  anulación en línea): es un comprobante electrónico más, mismo flujo SOAP
  Recepción/Autorización que la factura. **Sí es automatizable.**

⚠️ **Restricción crítica**: el SRI no permite anular (por ningún medio, ni siquiera
nota de crédito) facturas emitidas a **"Consumidor Final"**. El comprador debe tener
una identificación real (RUC/cédula/pasaporte) para que la factura sea reversable.
Esto afecta directamente el diseño de "Reversos" del módulo financiero: si el negocio
quiere poder reversar una reserva ya facturada, **no puede facturarla como Consumidor
Final** desde el inicio.

### Prueba realizada

`emit-credit-note.mjs` (nuevo, `npm run nc`) toma una factura ya `AUTORIZADO` (leyendo
su `*-authorized.xml`), arma el XML de `notaCredito` (`codDoc=04`, versión `1.1.0`)
referenciándola vía `codDocModificado`/`numDocModificado`/`fechaEmisionDocSustento`,
reutiliza los mismos montos/impuestos/comprador de la factura original, y la firma con
`signCreditNoteXml` (misma librería `ec-sri-invoice-signer`, sin necesidad de
reimplementar nada de firma — el problema de canonicalización ya estaba resuelto).

Resultado: **RECIBIDA → AUTORIZADO** al primer intento, sin errores de estructura ni de
firma (la estructura `infoNotaCredito` que se usó — orden: identificación de
comprador → `codDocModificado`/`numDocModificado`/`fechaEmisionDocSustento` →
totales → `totalConImpuestos` → `motivo` — resultó válida contra el SRI real).

El script valida explícitamente que la factura original **no** sea a Consumidor Final
antes de intentarlo (lanza error claro en vez de dejar que el SRi la rechace).

## Implicación para el documento de requerimientos al backend

- **No usar `open-factura` para firmar** (aunque sirve bien para generar el XML y
  hablar SOAP con el SRI). Usar `ec-sri-invoice-signer` u otra librería
  específicamente probada contra el SRI real, no una genérica de XML-DSig armada a
  mano.
- **Catálogo de `codigoPorcentaje` de IVA**: `4` = 15% (tarifa vigente). Verificar
  contra la ficha técnica actual del SRI antes de hardcodear cualquier código.
- El certificado digital debe ser real (Security Data, BCE, ANFAC, Consejo de la
  Judicatura o UANATACA) — no existe "certificado de prueba" del SRI.
- El ambiente de pruebas (`celcer.sri.gob.ec`) y producción (`cel.sri.gob.ec`)
  comparten la misma exigencia de firma; solo cambia la URL y que los comprobantes
  de pruebas no tienen validez tributaria.
- **El RIDE (PDF) lo debe generar el backend** inmediatamente después de recibir
  `AUTORIZADO` (ya tiene el XML completo en ese momento) y entregarlo como adjunto
  o URL descargable — no hay que esperar ni pedirle nada al SRI para esto.
- **Reversos ("Anulación"): solo nota de crédito es automatizable.** El backend debe
  emitir un comprobante `notaCredito` (codDoc 04) referenciando la factura original,
  no intentar ninguna integración con la "anulación en línea" del portal (no tiene
  API). Ver detalle y ejemplo funcional en `scripts/sri-test/emit-credit-note.mjs`.
- **Regla de negocio a aplicar antes de facturar**: si existe alguna posibilidad de
  que la reserva se cancele y haya que reversar la factura, el comprador **no puede
  quedar registrado como "Consumidor Final"** — exigir identificación real
  (RUC/cédula/pasaporte) en ese flujo, o la factura queda irreversible por el SRI.
