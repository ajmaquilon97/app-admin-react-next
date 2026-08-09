<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system: plantilla global obligatoria

Todo estilo visual sale de `src/app/theme.css` (tokens en `@theme` + clases semánticas). Toda página o componente nuevo DEBE apegarse a él.

## Reglas

1. **Prohibido hardcodear colores** (`text-[#1F2937]`, `bg-[#1E3A5F]`, `text-slate-400`, etc.). Usa las utilidades generadas por los tokens: `text-primary`, `bg-surface`, `text-text-main`, `text-text-muted`, `text-text-soft`, `bg-background`, `text-success` / `warning` / `error` / `info`, `shadow-soft`, `shadow-card`.
2. **Títulos y textos usan las clases semánticas**, no combinaciones sueltas de utilidades tipográficas:
   - `page-title` — h1 de página
   - `section-title` — h2 de sección o paso de wizard
   - `subtitle` — h3 / encabezado 18px semibold
   - `modal-title` — título de modal, drawer o diálogo
   - `card-title` — título de card o bloque
   - `overline` — eyebrow en mayúsculas (grupos en drawers)
   - `text-body`, `text-muted-body`, `text-caption` — cuerpo, secundario y auxiliar
   - `brand-title`, `brand-overline`, `brand-label` — solo para pantallas branded (onboarding/marketing)
3. **Variaciones puntuales** se hacen apilando utilidades sobre la clase semántica (`subtitle font-bold`, `brand-label text-secondary`), nunca reconstruyendo el estilo desde cero.
4. **Si falta un rol tipográfico o un token**, se agrega a `theme.css` (token en `@theme` + clase en `@layer components`) en lugar de improvisar utilidades en el componente.
5. Excepciones existentes: los mockups de `src/gemini/` (referencia, no migrar) y valores no tipográficos puntuales (p. ej. dígitos de inputs OTP).
