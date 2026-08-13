import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Mensaje compartido para que el error explique qué hacer, no solo qué está mal. */
const BARREL_MSG =
  "Importa el barril del módulo (@/modules/<dominio>), no una ruta interna. " +
  "Si necesitas algo que el barril no expone, añádelo a su index.ts. Ver AGENTS.md.";

const CROSS_MODULE_MSG =
  "Un módulo no importa de otro. Si dos dominios necesitan lo mismo, sube a lib/: " +
  "domain/ (vocabulario), api/ (transporte) o actions/ (Server Action). Ver AGENTS.md.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototipos de diseño: no se compilan ni se migran (ver AGENTS.md, design system §5).
    "docs/**",
    // Reporte de cobertura de Jest: artefacto generado, no código del proyecto.
    "coverage/**",
  ]),

  // ── Aislamiento entre módulos (ver AGENTS.md → Arquitectura) ──────────────────
  // Convierte en error de lint las dos primeras reglas de aislamiento, que hasta
  // ahora dependían de que nadie escribiera el import equivocado.

  // Desde fuera de modules/: solo el barril.
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/modules/*/**"], message: BARREL_MSG }] },
      ],
    },
  },

  // Dentro de modules/: ninguna referencia a @/modules — ni a otro módulo (violación
  // de aislamiento) ni al propio (dentro del módulo se usan rutas relativas).
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/modules/**"], message: CROSS_MODULE_MSG }] },
      ],
    },
  },
]);

export default eslintConfig;
