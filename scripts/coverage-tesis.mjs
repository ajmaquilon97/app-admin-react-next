/**
 * Genera la tabla de cobertura por módulo que pide la tesis (§10.8.3.1,
 * "Portal Web — Next.js"), agrupando el reporte de Jest en las filas que el
 * documento espera.
 *
 * Uso:
 *   npm run test:coverage        # produce coverage/coverage-summary.json
 *   node scripts/coverage-tesis.mjs
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const RESUMEN = "coverage/coverage-summary.json";

/**
 * Cada fila de la tabla es un grupo de rutas. El orden importa: un archivo cae
 * en la primera fila cuyo `coincide` devuelva verdadero.
 */
const FILAS = [
  {
    nombre: "Autenticación / Usuarios",
    coincide: (f) =>
      f.includes("lib/auth/") ||
      f.includes("lib/actions/auth") ||
      f.includes("lib/actions/usuarios") ||
      f.includes("components/auth/") ||
      f.includes("components/onboarding/"),
  },
  {
    nombre: "Gestión de Espacios",
    coincide: (f) => f.includes("modules/spaces/"),
  },
  {
    nombre: "Módulo de Reservas",
    coincide: (f) => f.includes("modules/bookings/"),
  },
  {
    nombre: "Disponibilidad y Aforo",
    coincide: (f) => f.includes("modules/availability/"),
  },
  {
    nombre: "Tarifas",
    coincide: (f) => f.includes("modules/pricing/"),
  },
  {
    nombre: "Financiero y Facturación",
    coincide: (f) => f.includes("modules/financiero/"),
  },
  {
    nombre: "Configuración y Soporte",
    coincide: (f) => f.includes("modules/configuracion/") || f.includes("modules/tickets-soporte/"),
  },
  {
    nombre: "Dashboard",
    coincide: (f) => f.includes("modules/dashboard/"),
  },
  {
    nombre: "Componentes UI comunes",
    coincide: (f) => f.includes("components/ui/") || f.includes("components/providers/") || f.includes("src/components/"),
  },
  {
    nombre: "Dominio compartido (lib/)",
    coincide: (f) => f.includes("lib/"),
  },
];

const METRICAS = ["statements", "branches", "functions", "lines"];

function normalizar(ruta) {
  return ruta.replace(/\\/g, "/");
}

function acumular(destino, fichero) {
  for (const m of METRICAS) {
    destino[m].total += fichero[m].total;
    destino[m].covered += fichero[m].covered;
  }
}

function vacio() {
  return Object.fromEntries(METRICAS.map((m) => [m, { total: 0, covered: 0 }]));
}

function pct({ total, covered }) {
  return total === 0 ? 100 : (covered / total) * 100;
}

/** Cuenta de pruebas por fila, a partir del reporte JSON de Jest. */
function conteoDePruebas() {
  const salida = execSync("npx jest --silent --json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const json = JSON.parse(salida.slice(salida.indexOf("{")));

  const porFila = new Map(FILAS.map((f) => [f.nombre, { total: 0, pasados: 0, fallidos: 0 }]));
  const CARPETA_A_FILA = {
    auth: "Autenticación / Usuarios",
    spaces: "Gestión de Espacios",
    bookings: "Módulo de Reservas",
    availability: "Disponibilidad y Aforo",
    pricing: "Tarifas",
    financiero: "Financiero y Facturación",
    configuracion: "Configuración y Soporte",
    "tickets-soporte": "Configuración y Soporte",
    dashboard: "Dashboard",
    ui: "Componentes UI comunes",
    lib: "Dominio compartido (lib/)",
  };

  for (const suite of json.testResults) {
    const carpeta = normalizar(suite.name).split("/tests/")[1]?.split("/")[0];
    const fila = porFila.get(CARPETA_A_FILA[carpeta]);
    if (!fila) continue;
    for (const t of suite.assertionResults) {
      fila.total += 1;
      if (t.status === "passed") fila.pasados += 1;
      else fila.fallidos += 1;
    }
  }
  return porFila;
}

const resumen = JSON.parse(readFileSync(RESUMEN, "utf8"));
const pruebas = conteoDePruebas();

const acumulados = new Map(FILAS.map((f) => [f.nombre, vacio()]));
const totalProyecto = vacio();

for (const [ruta, datos] of Object.entries(resumen)) {
  if (ruta === "total") continue;
  const f = normalizar(ruta);
  const fila = FILAS.find((x) => x.coincide(f));
  if (!fila) {
    console.warn(`[aviso] sin fila asignada: ${f}`);
    continue;
  }
  acumular(acumulados.get(fila.nombre), datos);
  acumular(totalProyecto, datos);
}

const filas = FILAS.map((f) => {
  const cov = acumulados.get(f.nombre);
  const t = pruebas.get(f.nombre) ?? { total: 0, pasados: 0, fallidos: 0 };
  return {
    Módulo: f.nombre,
    Tests: t.total,
    Pasados: t.pasados,
    Fallidos: t.fallidos,
    "Statements (%)": pct(cov.statements).toFixed(2),
    "Branches (%)": pct(cov.branches).toFixed(2),
    "Functions (%)": pct(cov.functions).toFixed(2),
    "Lines (%)": pct(cov.lines).toFixed(2),
  };
});

const totalTests = [...pruebas.values()].reduce(
  (a, t) => ({
    total: a.total + t.total,
    pasados: a.pasados + t.pasados,
    fallidos: a.fallidos + t.fallidos,
  }),
  { total: 0, pasados: 0, fallidos: 0 },
);

filas.push({
  Módulo: "TOTAL PROYECTO WEB",
  Tests: totalTests.total,
  Pasados: totalTests.pasados,
  Fallidos: totalTests.fallidos,
  "Statements (%)": pct(totalProyecto.statements).toFixed(2),
  "Branches (%)": pct(totalProyecto.branches).toFixed(2),
  "Functions (%)": pct(totalProyecto.functions).toFixed(2),
  "Lines (%)": pct(totalProyecto.lines).toFixed(2),
});

filas.push({
  Módulo: "Umbral mínimo requerido",
  Tests: "—",
  Pasados: "—",
  Fallidos: "—",
  "Statements (%)": "70",
  "Branches (%)": "70",
  "Functions (%)": "70",
  "Lines (%)": "70",
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
