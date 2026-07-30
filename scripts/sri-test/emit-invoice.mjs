// Script standalone para emitir una factura de PRUEBA contra el SRI (Ecuador).
// No depende de la app Next.js ni de src/. Ejecutar con: npm run emit
//
// Flujo: construir factura -> generar XML -> firmar (.p12) -> enviar a Recepción -> consultar Autorización.
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { generateInvoiceXml, getP12FromLocalFile, documentReception, documentAuthorization } from "open-factura";
import { signInvoiceXml as signInvoiceXmlLib } from "ec-sri-invoice-signer";

// El SRI no ofrece un "certificado de prueba": incluso en el ambiente celcer
// hay que firmar con un certificado digital real (persona natural/jurídica).
const RECEPTION_URL = {
  1: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
  2: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
};
const AUTHORIZATION_URL = {
  1: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
  2: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
};

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

// Algoritmo público del SRI ("módulo 11") para el dígito verificador de la clave de acceso.
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

// Se calcula manualmente (en vez de usar generateInvoice() de open-factura) porque esa función
// arma la fecha con `new Date("DD/MM/YYYY")`, que en JS se interpreta como MM/DD/YYYY y revienta
// (Invalid Date) para cualquier día > 12. Aquí partimos el string DD/MM/YYYY directamente.
function generateAccessKey({ fechaEmisionDDMMYYYY, codDoc, ruc, ambiente, estab, ptoEmi, secuencial }) {
  const [dd, mm, yyyy] = fechaEmisionDDMMYYYY.split("/");
  let accessKey = `${dd}${mm}${yyyy}`;
  accessKey += codDoc;
  accessKey += ruc;
  accessKey += ambiente;
  accessKey += estab;
  accessKey += ptoEmi;
  accessKey += secuencial;
  accessKey += String(Math.floor(10000000 + Math.random() * 89999999)); // código numérico, 8 dígitos
  accessKey += "1"; // tipo de emisión: 1 = normal
  accessKey += verificatorDigit(accessKey);
  return accessKey;
}

function buildInvoice() {
  const ambiente = process.env.SRI_AMBIENTE === "2" ? "2" : "1";
  const ruc = required("SRI_RUC");
  const estab = pad(process.env.SRI_ESTABLECIMIENTO || "001", 3);
  const ptoEmi = pad(process.env.SRI_PUNTO_EMISION || "001", 3);
  const secuencial = pad(required("SRI_SECUENCIAL"), 9);
  const fechaEmision = todayDDMMYYYY();
  const codDoc = "01"; // factura

  const accessKey = generateAccessKey({
    fechaEmisionDDMMYYYY: fechaEmision,
    codDoc,
    ruc,
    ambiente,
    estab,
    ptoEmi,
    secuencial,
  });

  const cantidad = Number(process.env.SRI_ITEM_CANTIDAD || "1");
  const precioUnitario = Number(process.env.SRI_ITEM_PRECIO_UNITARIO || "10.00");
  const descuento = 0;
  const precioTotalSinImpuesto = (cantidad * precioUnitario - descuento).toFixed(2);
  const tarifa = process.env.SRI_IVA_TARIFA || "15";
  const codigoPorcentajeIva = process.env.SRI_IVA_CODIGO_PORCENTAJE || "8";
  const valorIva = ((Number(precioTotalSinImpuesto) * Number(tarifa)) / 100).toFixed(2);
  const importeTotal = (Number(precioTotalSinImpuesto) + Number(valorIva)).toFixed(2);

  const invoice = {
    factura: {
      "@xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@id": "comprobante",
      "@version": "1.0.0",
      infoTributaria: {
        ambiente,
        tipoEmision: "1",
        razonSocial: required("SRI_RAZON_SOCIAL"),
        nombreComercial: process.env.SRI_NOMBRE_COMERCIAL || required("SRI_RAZON_SOCIAL"),
        ruc,
        claveAcceso: accessKey,
        codDoc,
        estab,
        ptoEmi,
        secuencial,
        dirMatriz: required("SRI_DIR_MATRIZ"),
      },
      infoFactura: {
        fechaEmision,
        dirEstablecimiento: process.env.SRI_DIR_ESTABLECIMIENTO || required("SRI_DIR_MATRIZ"),
        obligadoContabilidad: process.env.SRI_OBLIGADO_CONTABILIDAD === "SI" ? "SI" : "NO",
        tipoIdentificacionComprador: process.env.SRI_CLIENTE_TIPO_ID || "07",
        razonSocialComprador: process.env.SRI_CLIENTE_RAZON_SOCIAL || "CONSUMIDOR FINAL",
        identificacionComprador: process.env.SRI_CLIENTE_IDENTIFICACION || "9999999999999",
        direccionComprador: process.env.SRI_CLIENTE_DIRECCION || "N/A",
        totalSinImpuestos: precioTotalSinImpuesto,
        totalDescuento: descuento.toFixed(2),
        totalConImpuestos: {
          totalImpuesto: [
            {
              codigo: "2", // IVA
              codigoPorcentaje: codigoPorcentajeIva,
              descuentoAdicional: "0.00",
              baseImponible: precioTotalSinImpuesto,
              tarifa,
              valor: valorIva,
            },
          ],
        },
        importeTotal,
        moneda: "DOLAR",
        pagos: {
          pago: [
            {
              formaPago: "01", // sin utilización del sistema financiero (efectivo)
              total: importeTotal,
              plazo: "0",
              unidadTiempo: "dias",
            },
          ],
        },
      },
      detalles: {
        detalle: [
          {
            codigoPrincipal: "RESERVA-TEST",
            codigoAuxiliar: "RESERVA-TEST",
            descripcion: process.env.SRI_ITEM_DESCRIPCION || "Reserva de espacio - prueba",
            cantidad: String(cantidad),
            precioUnitario: precioUnitario.toFixed(2),
            descuento: descuento.toFixed(2),
            precioTotalSinImpuesto,
            impuestos: {
              impuesto: [
                {
                  codigo: "2",
                  codigoPorcentaje: codigoPorcentajeIva,
                  tarifa,
                  baseImponible: precioTotalSinImpuesto,
                  valor: valorIva,
                },
              ],
            },
          },
        ],
      },
    },
  };

  return { invoice, accessKey, ambiente };
}

async function main() {
  mkdirSync(new URL("./output/", import.meta.url), { recursive: true });

  console.log("1/5 Generando XML de la factura...");
  const { invoice, accessKey, ambiente } = buildInvoice();
  const xml = generateInvoiceXml(invoice);
  writeFileSync(new URL(`./output/${accessKey}-unsigned.xml`, import.meta.url), xml, "utf8");
  console.log(`    Clave de acceso: ${accessKey}`);

  console.log("2/5 Firmando XML con el certificado digital (.p12)...");
  // Nota: se usa la librería ec-sri-invoice-signer (mantenida activamente, con tests contra
  // el SRI real) en vez de open-factura (bugs de canonicalización sin resolver, ver
  // FINDINGS.md) o de nuestra propia reimplementación (sign-xades.mjs, quedó descartada tras
  // no lograr autorización pese a autoconsistencia matemática verificada).
  const p12Data = getP12FromLocalFile(required("SRI_P12_PATH"));
  // La librería no acepta namespaces (xmlns:) en el elemento raíz — los agrega ella misma.
  const xmlWithoutNamespaces = xml.replace(/ xmlns:ds="[^"]*"/, "").replace(/ xmlns:xsi="[^"]*"/, "");
  const signedXml = signInvoiceXmlLib(xmlWithoutNamespaces, Buffer.from(p12Data), {
    pkcs12Password: required("SRI_P12_PASSWORD"),
  });
  writeFileSync(new URL(`./output/${accessKey}-signed.xml`, import.meta.url), signedXml, "utf8");

  console.log("3/5 Enviando a Recepción del SRI (ambiente %s)...", ambiente === "1" ? "PRUEBAS" : "PRODUCCIÓN");
  const receptionResult = await documentReception(signedXml, RECEPTION_URL[ambiente]);
  writeFileSync(
    new URL(`./output/${accessKey}-reception.json`, import.meta.url),
    JSON.stringify(receptionResult, null, 2),
    "utf8"
  );
  const estadoRecepcion = receptionResult?.RespuestaRecepcionComprobante?.estado;
  console.log(`    Estado de recepción: ${estadoRecepcion ?? "desconocido (revisa output/*-reception.json)"}`);

  if (estadoRecepcion !== "RECIBIDA") {
    console.log("    El SRI devolvió el comprobante. Revisa las mensajes de error en el JSON guardado.");
    return;
  }

  console.log("4/5 Esperando unos segundos antes de consultar autorización...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("5/5 Consultando Autorización del SRI...");
  const authorizationResult = await documentAuthorization(accessKey, AUTHORIZATION_URL[ambiente]);
  writeFileSync(
    new URL(`./output/${accessKey}-authorization.json`, import.meta.url),
    JSON.stringify(authorizationResult, null, 2),
    "utf8"
  );

  const autorizacion = authorizationResult?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;
  const primeraAutorizacion = Array.isArray(autorizacion) ? autorizacion[0] : autorizacion;
  const estadoAutorizacion = primeraAutorizacion?.estado;
  console.log(`    Estado de autorización: ${estadoAutorizacion ?? "PENDIENTE (vuelve a consultar más tarde con el mismo accessKey)"}`);

  if (estadoAutorizacion === "AUTORIZADO" && primeraAutorizacion?.comprobante) {
    writeFileSync(
      new URL(`./output/${accessKey}-authorized.xml`, import.meta.url),
      primeraAutorizacion.comprobante,
      "utf8"
    );
    console.log(`    XML autorizado guardado en output/${accessKey}-authorized.xml`);
    console.log(`    Número de autorización: ${primeraAutorizacion.numeroAutorizacion}`);
  }

  console.log("\nListo. Revisa la carpeta scripts/sri-test/output/ para el XML firmado y las respuestas completas del SRI.");
}

main().catch((error) => {
  console.error("Error durante la emisión de prueba:", error);
  process.exitCode = 1;
});
