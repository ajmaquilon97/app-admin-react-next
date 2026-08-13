/**
 * Genera la tabla de cobertura por módulo que pide la tesis (§10.8.3.1,
 * "Portal Web — Next.js"), agrupando el reporte de Jest en las filas que el
 * documento espera.
 *
 * Uso:
 *   npm run test:coverage        # produce coverage/coverage-summary.json
 *   node scripts/coverage-tesis.mjs
 *
 * Con un JSON de resultados ya generado (`jest --json --outputFile=…`) se evita
 * la segunda ejecución de Jest:
 *   node scripts/coverage-tesis.mjs jest-results.json
 *
 * El reparto por filas vive en `coverage-filas.mjs`, compartido con el
 * generador del correo de cobertura.
 */
import {
  METRICAS,
  UMBRAL,
  agruparCobertura,
  construirFilas,
  contarPruebas,
  pct,
  totalizarPruebas,
} from "./coverage-filas.mjs";

const rutaResultados = process.argv[2];

const { porFila: porFilaCobertura, total: totalProyecto } = agruparCobertura();
const porFilaPruebas = contarPruebas(rutaResultados);

const filas = construirFilas({ porFilaCobertura, porFilaPruebas }).map((f) => ({
  Módulo: f.nombre,
  Tests: f.tests,
  Pasados: f.pasados,
  Fallidos: f.fallidos,
  "Statements (%)": f.metricas.statements.toFixed(2),
  "Branches (%)": f.metricas.branches.toFixed(2),
  "Functions (%)": f.metricas.functions.toFixed(2),
  "Lines (%)": f.metricas.lines.toFixed(2),
}));

const totalTests = totalizarPruebas(porFilaPruebas);

filas.push({
  Módulo: "TOTAL PROYECTO WEB",
  Tests: totalTests.total,
  Pasados: totalTests.pasados,
  Fallidos: totalTests.fallidos,
  ...Object.fromEntries(
    METRICAS.map((m) => [
      `${m[0].toUpperCase()}${m.slice(1)} (%)`,
      pct(totalProyecto[m]).toFixed(2),
    ]),
  ),
});

filas.push({
  Módulo: "Umbral mínimo requerido",
  Tests: "—",
  Pasados: "—",
  Fallidos: "—",
  "Statements (%)": String(UMBRAL),
  "Branches (%)": String(UMBRAL),
  "Functions (%)": String(UMBRAL),
  "Lines (%)": String(UMBRAL),
});

// Salida en Markdown, lista para pegar en el documento.
const columnas = Object.keys(filas[0]);
const linea = (celdas) => `| ${celdas.join(" | ")} |`;

console.log("");
console.log("### Tabla 10.8.3.1 — Portal Web (Next.js)");
console.log("");
console.log(linea(columnas));
console.log(linea(columnas.map(() => "---")));
for (const f of filas) console.log(linea(columnas.map((c) => String(f[c]))));
console.log("");
