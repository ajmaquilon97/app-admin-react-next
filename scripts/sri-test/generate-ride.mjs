// Genera el RIDE (Representación Impresa del Documento Electrónico) en PDF a partir del
// XML AUTORIZADO por el SRI. El SRI no entrega el PDF — solo autoriza el XML — el RIDE es
// responsabilidad del emisor. Layout basado en el formato estándar usado por la mayoría de
// facturadores electrónicos en Ecuador (dos recuadros de cabecera + código de barras +
// desglose de subtotales por tarifa de IVA).
// Uso: node generate-ride.mjs [ruta-al-xml-autorizado]
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";

const outputDir = new URL("./output/", import.meta.url);
const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = CONTENT_RIGHT - MARGIN;

// codigoPorcentaje del catálogo de IVA del SRI usados para el desglose de subtotales.
const IVA_RATE_LABELS = {
  0: "SUBTOTAL 0%",
  2: "SUBTOTAL 12%",
  3: "SUBTOTAL 14%",
  4: "SUBTOTAL 15%",
  5: "SUBTOTAL 5%",
  6: "SUBTOTAL No objeto de IVA",
  7: "SUBTOTAL Exento IVA",
  8: "SUBTOTAL 8%",
};
const IVA_VALUE_LABELS = {
  0: "IVA 0%",
  2: "IVA 12%",
  3: "IVA 14%",
  4: "IVA 15%",
  5: "IVA 5%",
  8: "IVA 8%",
};

const FORMA_PAGO_LABELS = {
  "01": "SIN UTILIZACIÓN DEL SISTEMA FINANCIERO",
  "15": "COMPENSACIÓN DE DEUDAS",
  "16": "TARJETA DE DÉBITO",
  "17": "DINERO ELECTRÓNICO",
  "18": "TARJETA PREPAGO",
  "19": "TARJETA DE CRÉDITO",
  "20": "OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO",
  "21": "ENDOSO DE TÍTULOS",
};

function findLatestAuthorizedXml() {
  const files = readdirSync(outputDir).filter((f) => f.endsWith("-authorized.xml"));
  if (!files.length) {
    throw new Error("No hay ningún *-authorized.xml en output/. Corre primero: npm run emit");
  }
  return files.map((f) => ({ f, t: statSync(new URL(f, outputDir)).mtimeMs })).sort((a, b) => a.t - b.t).at(-1).f;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function money(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

const xmlFileName = process.argv[2] || findLatestAuthorizedXml();
const xmlPath = xmlFileName.includes("/") || xmlFileName.includes("\\") ? xmlFileName : new URL(xmlFileName, outputDir);
const xml = readFileSync(xmlPath, "utf8");

// parseTagValue: false es obligatorio — sin esto, fast-xml-parser interpreta la clave de
// acceso (49 dígitos) como number y la corrompe en notación científica.
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, parseAttributeValue: false });
const doc = parser.parse(xml);
const factura = doc.factura;
const infoTributaria = factura.infoTributaria;
const infoFactura = factura.infoFactura;
const detalles = asArray(factura.detalles.detalle);
const totalImpuestos = asArray(infoFactura.totalConImpuestos?.totalImpuesto);
const pagos = asArray(infoFactura.pagos?.pago);
const camposAdicionales = asArray(factura.infoAdicional?.campoAdicional);

const accessKey = infoTributaria.claveAcceso;
const ambienteLabel = String(infoTributaria.ambiente) === "1" ? "PRUEBAS" : "PRODUCCION";
const emisionLabel = String(infoTributaria.tipoEmision) === "1" ? "NORMAL" : "CONTINGENCIA";
const numeroFactura = `${infoTributaria.estab}-${infoTributaria.ptoEmi}-${infoTributaria.secuencial}`;

async function main() {
  mkdirSync(outputDir, { recursive: true });

  const barcodePng = await bwipjs.toBuffer({
    bcid: "code128",
    text: accessKey,
    scale: 2,
    height: 12,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });

  const outPath = new URL(`${accessKey}-ride.pdf`, outputDir);
  const pdf = new PDFDocument({ size: "A4", margin: MARGIN });
  const chunks = [];
  pdf.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => pdf.on("end", resolve));

  if (ambienteLabel === "PRUEBAS") {
    pdf
      .save()
      .rotate(-35, { origin: [PAGE_WIDTH / 2, 420] })
      .fontSize(46)
      .fillColor("#e5e5e5")
      .text("AMBIENTE DE PRUEBAS - SIN VALOR TRIBUTARIO", 0, 400, { width: PAGE_WIDTH, align: "center" })
      .restore()
      .fillColor("black");
  }

  // ---------- Cabecera: dos recuadros ----------
  const boxTop = MARGIN;
  const leftBoxX = MARGIN;
  const leftBoxWidth = 255;
  const rightBoxX = leftBoxX + leftBoxWidth + 15;
  const rightBoxWidth = CONTENT_RIGHT - rightBoxX;

  // -- Recuadro izquierdo: datos del emisor --
  let ly = boxTop + 10;
  const leftPad = leftBoxX + 8;
  const leftInnerWidth = leftBoxWidth - 16;
  pdf.font("Helvetica-Bold").fontSize(11).text(infoTributaria.razonSocial, leftPad, ly, { width: leftInnerWidth });
  ly = pdf.y + 4;
  if (infoTributaria.nombreComercial && infoTributaria.nombreComercial !== infoTributaria.razonSocial) {
    pdf.font("Helvetica").fontSize(8).text(infoTributaria.nombreComercial, leftPad, ly, { width: leftInnerWidth });
    ly = pdf.y + 4;
  }
  const leftField = (label, value) => {
    pdf.font("Helvetica-Bold").fontSize(8).text(label, leftPad, ly, { continued: true, width: leftInnerWidth });
    pdf.font("Helvetica").text(` ${value}`);
    ly = pdf.y + 4;
  };
  leftField("Dir. Matriz:", infoTributaria.dirMatriz);
  leftField("Dir. Sucursal:", infoFactura.dirEstablecimiento);
  if (infoFactura.contribuyenteEspecial) {
    leftField("Contribuyente Especial Nro.:", infoFactura.contribuyenteEspecial);
  }
  leftField("Obligado a llevar contabilidad:", infoFactura.obligadoContabilidad);

  // -- Recuadro derecho: datos tributarios / autorización --
  let ry = boxTop + 8;
  const rightPad = rightBoxX + 8;
  const rightInnerWidth = rightBoxWidth - 16;
  const rightLine = (text, opts = {}) => {
    pdf.text(text, rightPad, ry, { width: rightInnerWidth, ...opts });
    ry = pdf.y;
  };
  pdf.font("Helvetica").fontSize(9).text("R.U.C.:", rightPad, ry, { continued: true, width: rightInnerWidth });
  pdf.font("Helvetica-Bold").text(` ${infoTributaria.ruc}`);
  ry = pdf.y + 4;
  pdf.font("Helvetica-Bold").fontSize(16).text("F A C T U R A", rightPad, ry, { width: rightInnerWidth, align: "center" });
  ry = pdf.y + 6;
  pdf.font("Helvetica-Bold").fontSize(8);
  rightLine(`No.: ${numeroFactura}`);
  ry += 2;
  rightLine("NÚMERO DE AUTORIZACIÓN:");
  pdf.font("Helvetica").fontSize(8);
  rightLine(accessKey);
  ry += 2;
  pdf.font("Helvetica-Bold").fontSize(8);
  rightLine("FECHA Y HORA DE AUTORIZACIÓN:");
  pdf.font("Helvetica").fontSize(8);
  rightLine(new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" }));
  ry += 2;
  pdf.font("Helvetica-Bold").fontSize(8).text("AMBIENTE: ", rightPad, ry, { continued: true, width: rightInnerWidth });
  pdf.font("Helvetica").text(ambienteLabel);
  ry = pdf.y + 2;
  pdf.font("Helvetica-Bold").fontSize(8).text("EMISIÓN: ", rightPad, ry, { continued: true, width: rightInnerWidth });
  pdf.font("Helvetica").text(emisionLabel);
  ry = pdf.y + 6;
  pdf.font("Helvetica-Bold").fontSize(8);
  rightLine("CLAVE DE ACCESO");

  const barcodeDisplayWidth = rightInnerWidth;
  const barcodeDisplayHeight = 34;
  pdf.image(barcodePng, rightPad, ry, { width: barcodeDisplayWidth, height: barcodeDisplayHeight });
  ry += barcodeDisplayHeight + 2;
  pdf.font("Helvetica").fontSize(7).text(accessKey, rightPad, ry, { width: rightInnerWidth, align: "center" });
  ry = pdf.y;

  const headerBottom = Math.max(ly, ry) + 10;
  pdf.rect(leftBoxX, boxTop, leftBoxWidth, headerBottom - boxTop).stroke();
  pdf.rect(rightBoxX, boxTop, rightBoxWidth, headerBottom - boxTop).stroke();

  // ---------- Datos del comprador ----------
  let y = headerBottom + 8;
  pdf.font("Helvetica-Bold").fontSize(8).text("Razón Social / Nombre y Apellidos:", MARGIN, y, { continued: true });
  pdf.font("Helvetica").text(` ${infoFactura.razonSocialComprador}`);
  pdf.font("Helvetica-Bold").text("RUC / CI:", 400, y, { continued: true, width: CONTENT_RIGHT - 400 });
  pdf.font("Helvetica").text(` ${infoFactura.identificacionComprador}`);
  y += 14;
  if (infoFactura.direccionComprador) {
    pdf.font("Helvetica-Bold").fontSize(8).text("Dirección:", MARGIN, y, { continued: true });
    pdf.font("Helvetica").text(` ${infoFactura.direccionComprador}`);
    y += 14;
  }
  pdf.font("Helvetica-Bold").fontSize(8).text("Fecha de Emisión:", MARGIN, y, { continued: true });
  pdf.font("Helvetica").text(` ${infoFactura.fechaEmision}`);
  y += 18;

  pdf.moveTo(MARGIN, y).lineTo(CONTENT_RIGHT, y).stroke();

  // ---------- Tabla de detalle ----------
  const cols = [
    { key: "codigoPrincipal", label: "Cod. Principal", x: MARGIN, width: 60, align: "left" },
    { key: "cantidad", label: "Cant", x: MARGIN + 60, width: 35, align: "right" },
    { key: "descripcion", label: "Descripción", x: MARGIN + 95, width: 240, align: "left" },
    { key: "precioUnitario", label: "P. Unitario", x: MARGIN + 335, width: 55, align: "right" },
    { key: "descuento", label: "Descuento", x: MARGIN + 390, width: 55, align: "right" },
    { key: "precioTotalSinImpuesto", label: "P. Total", x: MARGIN + 445, width: 70, align: "right" },
  ];
  // Altura de fila calculada explícitamente con heightOfString (en vez de leer pdf.y después
  // de escribir, que solo refleja la última columna procesada y sub-estima filas donde una
  // columna anterior — p.ej. la descripción — ocupa más de una línea).
  const cellHeight = (font, size, text, width) => {
    pdf.font(font).fontSize(size);
    return pdf.heightOfString(String(text ?? ""), { width: width - 4 });
  };

  y += 8;
  const tableHeaderTop = y;
  const headerRowHeight = Math.max(...cols.map((c) => cellHeight("Helvetica-Bold", 7, c.label, c.width))) + 6;
  pdf.font("Helvetica-Bold").fontSize(7);
  for (const col of cols) {
    pdf.text(col.label, col.x + 2, y + 2, { width: col.width - 4, align: col.align });
  }
  y = tableHeaderTop + headerRowHeight;
  pdf.moveTo(MARGIN, y).lineTo(CONTENT_RIGHT, y).stroke();

  pdf.font("Helvetica").fontSize(7.5);
  for (const d of detalles) {
    const rowTop = y;
    const rowHeight = Math.max(...cols.map((c) => cellHeight("Helvetica", 7.5, d[c.key], c.width))) + 6;
    pdf.font("Helvetica").fontSize(7.5);
    for (const col of cols) {
      pdf.text(String(d[col.key] ?? ""), col.x + 2, rowTop + 3, { width: col.width - 4, align: col.align });
    }
    y = rowTop + rowHeight;
  }
  pdf.rect(MARGIN, tableHeaderTop, CONTENT_WIDTH, y - tableHeaderTop).stroke();
  for (const col of cols.slice(1)) {
    pdf.moveTo(col.x, tableHeaderTop).lineTo(col.x, y).stroke();
  }
  y += 10;

  // ---------- Información adicional + Totales ----------
  const infoBoxX = MARGIN;
  const infoBoxWidth = 300;
  const totalsBoxX = infoBoxX + infoBoxWidth + 15;
  const totalsBoxWidth = CONTENT_RIGHT - totalsBoxX;

  const subtotalesPorTarifa = {};
  for (const t of totalImpuestos) {
    if (t.codigo !== "2") continue; // solo IVA para el desglose "SUBTOTAL x%"
    const key = Number(t.codigoPorcentaje);
    subtotalesPorTarifa[key] = (subtotalesPorTarifa[key] || 0) + Number(t.baseImponible);
  }
  const ivaPorTarifa = {};
  for (const t of totalImpuestos) {
    if (t.codigo !== "2") continue;
    const key = Number(t.codigoPorcentaje);
    ivaPorTarifa[key] = (ivaPorTarifa[key] || 0) + Number(t.valor);
  }
  const ice = totalImpuestos.filter((t) => t.codigo === "3").reduce((s, t) => s + Number(t.valor), 0);
  const irbpnr = totalImpuestos.filter((t) => t.codigo === "5").reduce((s, t) => s + Number(t.valor), 0);

  const totalsRows = [];
  for (const [key, base] of Object.entries(subtotalesPorTarifa)) {
    totalsRows.push([IVA_RATE_LABELS[key] || `SUBTOTAL ${key}%`, money(base)]);
  }
  totalsRows.push(["SUBTOTAL SIN IMPUESTOS", money(infoFactura.totalSinImpuestos)]);
  totalsRows.push(["DESCUENTO", money(infoFactura.totalDescuento)]);
  totalsRows.push(["ICE", money(ice)]);
  for (const [key, valor] of Object.entries(ivaPorTarifa)) {
    totalsRows.push([IVA_VALUE_LABELS[key] || `IVA ${key}%`, money(valor)]);
  }
  totalsRows.push(["IRBPNR", money(irbpnr)]);
  totalsRows.push(["PROPINA", money(infoFactura.propina)]);
  totalsRows.push(["VALOR TOTAL", money(infoFactura.importeTotal)]);

  const rowHeight = 14;
  const totalsBoxHeight = Math.max(totalsRows.length * rowHeight + 6, 60);

  // Información adicional
  pdf.rect(infoBoxX, y, infoBoxWidth, totalsBoxHeight).stroke();
  pdf
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("Información Adicional", infoBoxX, y + 4, { width: infoBoxWidth, align: "center" });
  let infoY = y + 20;
  pdf.font("Helvetica").fontSize(7.5);
  for (const campo of camposAdicionales) {
    const nombre = campo["@_nombre"] ?? campo["@nombre"] ?? "";
    const valor = campo["#text"] ?? "";
    pdf.font("Helvetica-Bold").text(`${nombre}: `, infoBoxX + 6, infoY, { continued: true, width: infoBoxWidth - 12 });
    pdf.font("Helvetica").text(String(valor));
    infoY = pdf.y + 2;
  }

  // Totales
  let totalsY = y;
  for (const [label, value] of totalsRows) {
    const isTotal = label === "VALOR TOTAL";
    pdf.rect(totalsBoxX, totalsY, totalsBoxWidth, rowHeight).stroke();
    pdf.moveTo(totalsBoxX + totalsBoxWidth * 0.62, totalsY).lineTo(totalsBoxX + totalsBoxWidth * 0.62, totalsY + rowHeight).stroke();
    pdf
      .font(isTotal ? "Helvetica-Bold" : "Helvetica")
      .fontSize(8)
      .text(label, totalsBoxX + 6, totalsY + 4, { width: totalsBoxWidth * 0.62 - 10 });
    pdf
      .font(isTotal ? "Helvetica-Bold" : "Helvetica")
      .text(value, totalsBoxX + totalsBoxWidth * 0.62 + 4, totalsY + 4, {
        width: totalsBoxWidth * 0.38 - 10,
        align: "right",
      });
    totalsY += rowHeight;
  }

  y += totalsBoxHeight + 15;

  // ---------- Forma de pago ----------
  const pagoBoxWidth = 260;
  pdf.rect(MARGIN, y, pagoBoxWidth, 16 + pagos.length * 14).stroke();
  pdf.moveTo(MARGIN + 200, y).lineTo(MARGIN + 200, y + 16 + pagos.length * 14).stroke();
  pdf.font("Helvetica-Bold").fontSize(8).text("Forma de pago", MARGIN + 4, y + 4, { width: 190 });
  pdf.text("Total", MARGIN + 204, y + 4, { width: 56, align: "right" });
  let payY = y + 18;
  pdf.font("Helvetica").fontSize(7.5);
  for (const pago of pagos) {
    const label = FORMA_PAGO_LABELS[pago.formaPago] || pago.formaPago;
    pdf.text(label, MARGIN + 4, payY, { width: 190 });
    pdf.text(money(pago.total), MARGIN + 204, payY, { width: 56, align: "right" });
    payY += 14;
  }

  // ---------- Pie de página ----------
  pdf.font("Helvetica").fontSize(7).text("Página: 1 / 1", MARGIN, 770, { width: CONTENT_WIDTH, align: "right", lineBreak: false });

  pdf.end();
  await done;
  writeFileSync(outPath, Buffer.concat(chunks));
  console.log("RIDE generado:", outPath.pathname.replace(/^\/([A-Za-z]):/, "$1:"));
}

main().catch((err) => {
  console.error("Error generando el RIDE:", err);
  process.exitCode = 1;
});
