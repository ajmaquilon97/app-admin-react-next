/**
 * Agrupación de la cobertura de Jest en las filas por módulo que espera la
 * tesis (§10.8.3.1).
 *
 * Vive aparte porque la consumen dos generadores distintos:
 *   · `coverage-tesis.mjs` → tabla Markdown para pegar en el documento.
 *   · `coverage-email.mjs`  → cuerpo HTML del correo que envía el pipeline.
 *
 * Si la tabla del documento cambia de filas, se cambia aquí una sola vez.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Cada fila de la tabla es un grupo de rutas. El orden importa: un archivo cae
 * en la primera fila cuyo `coincide` devuelva verdadero.
 */
export const FILAS = [
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
    coincide: (f) =>
      f.includes("components/ui/") ||
      f.includes("components/providers/") ||
      f.includes("src/components/"),
  },
  {
    nombre: "Dominio compartido (lib/)",
    coincide: (f) => f.includes("lib/"),
  },
];

export const METRICAS = ["statements", "branches", "functions", "lines"];

/** Umbral de aceptación de la tesis (§8.6.1), el mismo de `jest.config.ts`. */
export const UMBRAL = 70;

/** Carpeta de `tests/` → fila de la tabla. */
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

export function normalizar(ruta) {
  return ruta.replace(/\\/g, "/");
}

function vacio() {
  return Object.fromEntries(METRICAS.map((m) => [m, { total: 0, covered: 0 }]));
}

function acumular(destino, fichero) {
  for (const m of METRICAS) {
    destino[m].total += fichero[m].total;
    destino[m].covered += fichero[m].covered;
  }
}

export function pct({ total, covered }) {
  return total === 0 ? 100 : (covered / total) * 100;
}

/**
 * Reparte `coverage/coverage-summary.json` entre las filas.
 * Devuelve `{ porFila: Map<nombre, métricas>, total: métricas }`.
 */
export function agruparCobertura(rutaResumen = "coverage/coverage-summary.json") {
  const resumen = JSON.parse(readFileSync(rutaResumen, "utf8"));
  const porFila = new Map(FILAS.map((f) => [f.nombre, vacio()]));
  const total = vacio();

  for (const [ruta, datos] of Object.entries(resumen)) {
    if (ruta === "total") continue;
    const f = normalizar(ruta);
    const fila = FILAS.find((x) => x.coincide(f));
    if (!fila) {
      console.warn(`[aviso] sin fila asignada: ${f}`);
      continue;
    }
    acumular(porFila.get(fila.nombre), datos);
    acumular(total, datos);
  }

  return { porFila, total };
}

/**
 * Conteo de pruebas por fila.
 *
 * `rutaResultados` es el JSON que produce `jest --json --outputFile=…`. En CI se
 * reaprovecha el de la ejecución que ya corrió; en local, si no se pasa ruta, se
 * vuelve a ejecutar Jest (más lento, pero no obliga a recordar el flag).
 */
export function contarPruebas(rutaResultados) {
  const json = rutaResultados
    ? JSON.parse(readFileSync(rutaResultados, "utf8"))
    : (() => {
        const salida = execSync("npx jest --silent --json", {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        });
        return JSON.parse(salida.slice(salida.indexOf("{")));
      })();

  const porFila = new Map(FILAS.map((f) => [f.nombre, { total: 0, pasados: 0, fallidos: 0 }]));

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

/** Suma de los conteos de todas las filas. */
export function totalizarPruebas(porFila) {
  return [...porFila.values()].reduce(
    (a, t) => ({
      total: a.total + t.total,
      pasados: a.pasados + t.pasados,
      fallidos: a.fallidos + t.fallidos,
    }),
    { total: 0, pasados: 0, fallidos: 0 },
  );
}

/**
 * Filas listas para renderizar: nombre, conteo de pruebas y las cuatro métricas
 * ya en porcentaje con dos decimales.
 */
export function construirFilas({ porFilaCobertura, porFilaPruebas }) {
  return FILAS.map((f) => {
    const cov = porFilaCobertura.get(f.nombre);
    const t = porFilaPruebas.get(f.nombre) ?? { total: 0, pasados: 0, fallidos: 0 };
    return {
      nombre: f.nombre,
      tests: t.total,
      pasados: t.pasados,
      fallidos: t.fallidos,
      metricas: Object.fromEntries(METRICAS.map((m) => [m, pct(cov[m])])),
    };
  });
}
