import nextJest from "next/jest.js";
import type { Config } from "jest";

/**
 * Configuración de Jest para el portal administrativo.
 *
 * Se apoya en `next/jest`, que reutiliza el compilador SWC del proyecto: así las
 * pruebas ven exactamente la misma transformación de TS/JSX que `next build`,
 * y los alias `@/*` de `tsconfig.json` se resuelven sin duplicar configuración.
 */
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],

  // `next/jest` resuelve los alias `@/*` en tiempo de compilación (SWC lee los
  // `paths` de tsconfig), pero eso no alcanza a los literales de `jest.mock()`,
  // que el resolver de Jest procesa en runtime. El mapeo explícito cubre ambos.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // ── Cobertura ───────────────────────────────────────────────────────────────
  // Se mide sobre el código que las pruebas unitarias pueden ejercitar en jsdom.
  // Quedan fuera, por decisión explícita:
  //   · app/**            → páginas y layouts: cascarones async de servidor (ver AGENTS.md);
  //                         su render real no es alcanzable desde jsdom.
  //   · **/api/**         → transporte `server-only`: se verifica con Postman/Newman.
  //   · index.ts (barril) → solo re-exports, sin lógica propia.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/app/**",
    "!src/**/api/**",
    "!src/**/index.ts",
    "!src/lib/auth/dal.ts",
    "!src/lib/auth/api.ts",
    "!src/proxy.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "html", "lcov", "json-summary"],

  // Criterio de aceptación de la tesis (§8.6.1): ≥ 70% en las cuatro métricas.
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },

  clearMocks: true,
  restoreMocks: true,

  // Por defecto son 5 s. Las pruebas de componentes encadenan varias
  // interacciones de `userEvent` y, al correr con `--coverage`, la
  // instrumentación las ralentiza lo suficiente como para rozar ese límite.
  testTimeout: 15000,
};

/**
 * Paquetes de `node_modules` que SÍ deben pasar por SWC.
 *
 * `jose` —el cifrado de la cookie de sesión— se publica únicamente como ESM, y
 * Jest ejecuta CommonJS. Los demás son los que `next/jest` ya venía permitiendo;
 * se repiten aquí porque sus patrones se sustituyen por completo: como
 * `transformIgnorePatterns` es una lista OR, basta con que uno de ellos empareje
 * para que el archivo quede sin transformar, así que añadir una excepción no
 * sirve — hay que reescribir los patrones que abarcan todo `node_modules`.
 */
const TRANSPILAR_EN_NODE_MODULES = [
  "jose",
  "geist",
  "next[\\\\/]dist[\\\\/]client",
  "next[\\\\/]dist[\\\\/]shared[\\\\/]lib",
  "next[\\\\/]src[\\\\/]client",
  "next[\\\\/]src[\\\\/]shared[\\\\/]lib",
];

const withNextConfig = createJestConfig(config);

const buildConfig = async (): Promise<Config> => {
  const resolved = (await withNextConfig()) as Config;
  return {
    ...resolved,
    transformIgnorePatterns: [
      `node_modules[\\\\/](?!\\.pnpm)(?!(${TRANSPILAR_EN_NODE_MODULES.join("|")})[\\\\/])`,
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
};

export default buildConfig;
