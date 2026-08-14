// Script standalone para emitir una NOTA DE CRÉDITO de PRUEBA contra el SRI (Ecuador),
// referenciando una factura ya AUTORIZADA (generada con `npm run emit`).
//
// Motivo de esta prueba: la "anulación en línea" del SRI es 100% manual (portal SRI en
// Línea, sin API). La única vía automatizable para reversar una factura es la nota de
// crédito (mismo flujo SOAP Recepción/Autorización que la factura). Además, el SRI NO
// permite anular (por ningún medio) facturas emitidas a "Consumidor Final" — el
// comprador debe tener RUC/cédula real. Por eso `npm run emit` debe haberse corrido
// con SRI_CLIENTE_TIPO_ID=05 (o 04/06/08) antes de probar esto.
//
// Uso: node emit-credit-note.mjs [ruta-al-xml-autorizado-de-la-factura-original]
import "dotenv/config";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { getP12FromLocalFile, documentReception, documentAuthorization } from "open-factura";
import { signCreditNoteXml } from "ec-sri-invoice-signer";

const RECEPTION_URL = {
  1: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
  2: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
};
const AUTHORIZATION_URL = {
  1: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
  2: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
};

const outputDir = new URL("./output/", import.meta.url);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name} (revisa scripts/sri-test/.env)`);
  return value;
}

function pad(value, length) {
  return String(value).padStart(length, "0");
}

function todayDDMMYYYY() {
  const now = new Date();
  return `${pad(now.getDate(), 2)}/${pad(now.getMonth() + 1, 2)}/${now.getFullYear()}`;
}

function verificatorDigit(accessKey) {
  let addition = 0;
  let multiple = 7;
  for (let i = 0; i < accessKey.length; i++) {
    addition += parseInt(accessKey.charAt(i), 10) * multiple;
    multiple = multiple > 2 ? multiple - 1 : 7;
  }
  let result = 11 - (addition % 11);
  if (result === 10) result = 1;
  if (result === 11) result = 0;
  return result;
}

function generateAccessKey({ fechaEmisionDDMMYYYY, codDoc, ruc, ambiente, estab, ptoEmi, secuencial }) {
  const [dd, mm, yyyy] = fechaEmisionDDMMYYYY.split("/");
  let accessKey = `${dd}${mm}${yyyy}`;
  accessKey += codDoc;
  accessKey += ruc;
  accessKey += ambiente;
  accessKey += estab;
  accessKey += ptoEmi;
  accessKey += secuencial;
  accessKey += String(Math.floor(10000000 + Math.random() * 89999999));
  accessKey += "1";
  accessKey += verificatorDigit(accessKey);
  return accessKey;
}

function findLatestAuthorizedInvoice() {
  const files = readdirSync(outputDir).filter((f) => f.endsWith("-authorized.xml"));
  if (!files.length) {
    throw new Error("No hay ninguna factura autorizada en output/. Corre primero: npm run emit");
  }
  return files.map((f) => ({ f, t: statSync(new URL(f, outputDir)).mtimeMs })).sort((a, b) => a.t - b.t).at(-1).f;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

async function main() {
  mkdirSync(outputDir, { recursive: true });

  const invoiceFileName = process.argv[2] || findLatestAuthorizedInvoice();
  const invoicePath = invoiceFileName.includes("/") || invoiceFileName.includes("\\") ? invoiceFileName : new URL(invoiceFileName, outputDir);
  console.log(`Factura original: ${invoiceFileName}`);
  const invoiceXml = readFileSync(invoicePath, "utf8");

  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, parseAttributeValue: false });
  const parsed = parser.parse(invoiceXml);
  const factura = parsed.factura;
  const infoTribOriginal = factura.infoTributaria;
  const infoFacturaOriginal = factura.infoFactura;

  if (infoFacturaOriginal.tipoIdentificacionComprador === "07") {
    throw new Error(
      "La factura original fue emitida a CONSUMIDOR FINAL (tipoIdentificacionComprador=07). " +
        "El SRI no permite anular ese tipo de comprobantes por ningún medio (ni nota de crédito, ni anulación en línea). " +
        "Genera primero una factura con SRI_CLIENTE_TIPO_ID=05 (o 04/06/08) y una identificación real."
    );
  }

  const ambiente = process.env.SRI_AMBIENTE === "2" ? "2" : "1";
  const ruc = required("SRI_RUC");
  const estab = pad(process.env.SRI_ESTABLECIMIENTO || "001", 3);
  const ptoEmi = pad(process.env.SRI_PUNTO_EMISION || "001", 3);
  const secuencial = pad(required("SRI_NC_SECUENCIAL"), 9);
  const fechaEmision = todayDDMMYYYY();
  const codDoc = "04"; // nota de crédito

  const accessKey = generateAccessKey({
    fechaEmisionDDMMYYYY: fechaEmision,
    codDoc,
    ruc,
    ambiente,
    estab,
    ptoEmi,
    secuencial,
  });

  const numDocModificado = `${infoTribOriginal.estab}-${infoTribOriginal.ptoEmi}-${infoTribOriginal.secuencial}`;
  const totalImpuestosOriginal = asArray(infoFacturaOriginal.totalConImpuestos.totalImpuesto);
  const detallesOriginal = asArray(factura.detalles.detalle);
  const motivo = process.env.SRI_NC_MOTIVO || "ANULACION POR CANCELACION DE RESERVA";

  const notaCredito = {
    notaCredito: {
      "@xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@id": "comprobante",
      "@version": "1.1.0",
      infoTributaria: {
        ambiente,
        tipoEmision: "1",
        razonSocial: infoTribOriginal.razonSocial,
        nombreComercial: infoTribOriginal.nombreComercial,
        ruc,
        claveAcceso: accessKey,
        codDoc,
        estab,
        ptoEmi,
        secuencial,
        dirMatriz: infoTribOriginal.dirMatriz,
      },
      infoNotaCredito: {
        fechaEmision,
        dirEstablecimiento: infoFacturaOriginal.dirEstablecimiento,
        tipoIdentificacionComprador: infoFacturaOriginal.tipoIdentificacionComprador,
        razonSocialComprador: infoFacturaOriginal.razonSocialComprador,
        identificacionComprador: infoFacturaOriginal.identificacionComprador,
        obligadoContabilidad: infoFacturaOriginal.obligadoContabilidad,
        codDocModificado: "01",
        numDocModificado,
        fechaEmisionDocSustento: infoFacturaOriginal.fechaEmision,
        totalSinImpuestos: infoFacturaOriginal.totalSinImpuestos,
        valorModificacion: infoFacturaOriginal.importeTotal,
        moneda: "DOLAR",
        totalConImpuestos: {
          totalImpuesto: totalImpuestosOriginal.map((t) => ({
            codigo: t.codigo,
            codigoPorcentaje: t.codigoPorcentaje,
            baseImponible: t.baseImponible,
            valor: t.valor,
          })),
        },
        motivo,
      },
      detalles: {
        detalle: detallesOriginal.map((d) => ({
          codigoInterno: d.codigoPrincipal,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuento: d.descuento,
          precioTotalSinImpuesto: d.precioTotalSinImpuesto,
          impuestos: {
            impuesto: asArray(d.impuestos.impuesto).map((imp) => ({
              codigo: imp.codigo,
              codigoPorcentaje: imp.codigoPorcentaje,
              tarifa: imp.tarifa,
              baseImponible: imp.baseImponible,
              valor: imp.valor,
            })),
          },
        })),
      },
    },
  };

  console.log("1/5 Generando XML de la nota de crédito...");
  const { create } = await import("xmlbuilder2");
  const xml = create(notaCredito).end({ prettyPrint: true });
  writeFileSync(new URL(`./output/${accessKey}-nc-unsigned.xml`, import.meta.url), xml, "utf8");
  console.log(`    Clave de acceso: ${accessKey}`);
  console.log(`    Referencia: factura ${numDocModificado}, motivo: "${motivo}"`);

  console.log("2/5 Firmando XML con el certificado digital (.p12)...");
  const p12Data = getP12FromLocalFile(required("SRI_P12_PATH"));
  const xmlWithoutNamespaces = xml.replace(/ xmlns:ds="[^"]*"/, "").replace(/ xmlns:xsi="[^"]*"/, "");
  const signedXml = signCreditNoteXml(xmlWithoutNamespaces, Buffer.from(p12Data), {
    pkcs12Password: required("SRI_P12_PASSWORD"),
  });
  writeFileSync(new URL(`./output/${accessKey}-nc-signed.xml`, import.meta.url), signedXml, "utf8");

  console.log("3/5 Enviando a Recepción del SRI (ambiente %s)...", ambiente === "1" ? "PRUEBAS" : "PRODUCCIÓN");
  const receptionResult = await documentReception(signedXml, RECEPTION_URL[ambiente]);
  writeFileSync(
    new URL(`./output/${accessKey}-nc-reception.json`, import.meta.url),
    JSON.stringify(receptionResult, null, 2),
    "utf8"
  );
  const estadoRecepcion = receptionResult?.RespuestaRecepcionComprobante?.estado;
  console.log(`    Estado de recepción: ${estadoRecepcion ?? "desconocido (revisa output/*-nc-reception.json)"}`);

  if (estadoRecepcion !== "RECIBIDA") {
    console.log("    El SRI devolvió el comprobante. Revisa las mensajes de error en el JSON guardado.");
    return;
  }

  console.log("4/5 Esperando unos segundos antes de consultar autorización...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("5/5 Consultando Autorización del SRI...");
  const authorizationResult = await documentAuthorization(accessKey, AUTHORIZATION_URL[ambiente]);
  writeFileSync(
    new URL(`./output/${accessKey}-nc-authorization.json`, import.meta.url),
    JSON.stringify(authorizationResult, null, 2),
    "utf8"
  );

  const autorizacion = authorizationResult?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;
  const primeraAutorizacion = Array.isArray(autorizacion) ? autorizacion[0] : autorizacion;
  const estadoAutorizacion = primeraAutorizacion?.estado;
  console.log(`    Estado de autorización: ${estadoAutorizacion ?? "PENDIENTE (vuelve a consultar más tarde con el mismo accessKey)"}`);

  if (estadoAutorizacion === "AUTORIZADO" && primeraAutorizacion?.comprobante) {
    writeFileSync(new URL(`./output/${accessKey}-nc-authorized.xml`, import.meta.url), primeraAutorizacion.comprobante, "utf8");
    console.log(`    XML autorizado guardado en output/${accessKey}-nc-authorized.xml`);
  }

  console.log("\nListo. Revisa la carpeta scripts/sri-test/output/ para los artefactos de la nota de crédito.");
}

main().catch((error) => {
  console.error("Error durante la emisión de la nota de crédito:", error);
  process.exitCode = 1;
});
