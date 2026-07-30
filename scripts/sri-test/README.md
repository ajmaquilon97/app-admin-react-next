# Prueba de facturación electrónica SRI (ambiente de pruebas)

Script standalone (no forma parte de la app Next.js) para emitir una factura de prueba
contra el ambiente `celcer.sri.gob.ec` del SRI y entender el flujo real antes de
especificarlo como requerimiento para el backend.

**Estado: funciona end-to-end (AUTORIZADO).** Ver `FINDINGS.md` para el detalle de
los problemas encontrados (y resueltos) en el camino.

## Prerrequisitos

1. **Certificado digital real** (.p12/.pfx) emitido por una entidad acreditada
   (Security Data, BCE, ANFAC, Consejo de la Judicatura, UANATACA), asociado a tu
   cédula/RUC. El SRI no ofrece certificados de prueba: el ambiente de pruebas exige
   la misma firma XAdES-BES que producción, solo cambia la URL del servicio.
2. Node.js 18+.

## Uso

```bash
cd scripts/sri-test
npm install
cp .env.example .env
# completa .env con tus datos (RUC, razón social, dirección, ruta al .p12, password)
# coloca tu certificado en scripts/sri-test/certificado.p12 (o ajusta SRI_P12_PATH)
npm run emit
```

## Qué hace el script (`emit-invoice.mjs`)

1. Arma el objeto de la factura (comprador, ítems, IVA 15% con `codigoPorcentaje=4`)
   y calcula la clave de acceso (49 dígitos, algoritmo módulo 11 del SRI). Usa
   `generateInvoiceXml` de `open-factura` para el XML.
2. Firma el XML con tu certificado `.p12` (XAdES-BES) usando `ec-sri-invoice-signer`
   (no la firma de `open-factura`, que tiene bugs sin resolver — ver `FINDINGS.md`).
3. Envía el XML firmado a `RecepcionComprobantesOffline` (SOAP) — respuesta
   `RECIBIDA` o `DEVUELTA`.
4. Si fue `RECIBIDA`, espera unos segundos y consulta
   `AutorizacionComprobantesOffline` con la clave de acceso.

Todos los artefactos (XML sin firmar, XML firmado, respuestas JSON de recepción y
autorización) se guardan en `output/` (ignorado por git, puede contener datos
tributarios reales).

## Notas

- Cada corrida debe usar un `SRI_SECUENCIAL` distinto (increméntalo en `.env`); el SRI
  rechaza secuenciales repetidos para el mismo establecimiento/punto de emisión.
- Si `estado` de autorización viene `PENDIENTE`, es normal: el esquema offline puede
  tardar segundos a minutos (hasta 24h en casos extremos). Vuelve a correr una consulta
  de autorización con el mismo `accessKey` más tarde.
- Este script es exploratorio: sirve para validar el flujo end-to-end y así documentar
  con precisión qué debe implementar el backend (ver conversación / documento de
  requerimientos). No está pensado para producción ni para integrarse en la app.
