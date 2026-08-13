<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Arquitectura: feature-sliced, obligatoria

Cada dominio de negocio vive **entero** en `src/modules/<dominio>/`. El razonamiento completo
y las decisiones históricas están en [`docs/architecture.md`](docs/architecture.md); esto es el
subconjunto que hay que cumplir al escribir código.

`src/` tiene cuatro carpetas y solo cuatro:

```
app/         rutas y layouts (App Router)
components/  UI transversal — NADA de features de negocio
lib/         lógica transversal — solo lo que usan 2+ dominios
modules/     los 8 dominios
```

## Las tres capas de un módulo

```
modules/<f>/api/         transporte: fetch al backend, tipos con sufijo *Api, `import "server-only"`
modules/<f>/actions/     "use server": sesión, validación Zod, mapeo *Api → dominio
modules/<f>/hooks/       React Query: useQuery/useMutation llamando a ../actions
modules/<f>/components/  UI (raíz + subcomponentes)
modules/<f>/{types,constants,schemas,utils}/
modules/<f>/index.ts     API pública del módulo
```

Una feature nueva crea su carpeta en `modules/` con los segmentos que necesite. **No** se añade
nada a `src/components/` ni a `src/lib/` salvo que lo consuman dos o más dominios.

## Las tres reglas de aislamiento

1. **Un módulo NO importa de otro.** Ni por alias (`@/modules/x`) ni por ruta relativa (`../../x`).
   Si dos dominios necesitan lo mismo, sube a `lib/`: `domain/` si es vocabulario, `api/` si es
   transporte, `actions/` si es Server Action.
2. **Desde fuera solo se importa el barril**: `@/modules/bookings`, nunca
   `@/modules/bookings/components/Algo`.
3. **`lib/` solo admite lo que usan 2+ dominios.** El corolario inverso también aplica: si algo de
   `lib/` queda con un único dominio consumidor, baja al módulo.

> No hay regla de ESLint que lo verifique todavía. Depende de que no escribas el import equivocado.

## `lib/` no es "la zona del servidor"

Sus cuatro subcarpetas tienen **contratos distintos**. Al añadir un archivo la pregunta no es
"¿es de servidor?" sino **"¿quién puede invocarlo?"**:

| Carpeta | Contrato |
|---|---|
| `lib/api/` | `server-only` — revienta si el cliente lo empaqueta |
| `lib/actions/` | `"use server"` — **cada export es un endpoint alcanzable desde el navegador** |
| `lib/auth/` | mixto: `dal`, `session`, `api` son server-only; `definitions` es isomorfo |
| `lib/domain/` | isomorfo, corre en ambos lados |

**Nunca añadas un parámetro `accessToken` (ni ningún secreto) a una función exportada desde un
archivo `"use server"`**: sería un argumento controlable desde el navegador. Si el servidor ya tiene
el token, llama al cargador `server-only` directamente — ver `lib/api/espacios-catalogo.ts`, que
expone `loadEspacioOptions(token)` para el servidor y `lib/actions/catalogo-espacios.ts`, que expone
`getSpaceOptions()` para el cliente.

## Modelo dual: transporte vs dominio

Hay **dos modelos de datos separados a propósito**, con una capa anticorrupción entre ellos:

- **Transporte** (`*/api/`): sufijo `*Api`, forma y vocabulario del backend en español —
  `ReservaResponseApi`, `EstadoPagoApi`.
- **Dominio** (`*/types/`): sin sufijo, vocabulario del frontend — `Booking`, `PaymentStatus`.
- **El mapeo vive en `*/actions/`** (`toBooking`, `toTimeline`…). Así un renombre del backend se
  absorbe en una función en vez de propagarse a los componentes.

**Nunca pases un tipo `*Api` a un componente.** Si un campo del backend falta en el modelo de
dominio, añádelo al modelo de dominio y mapéalo.

## Convenciones que ya están decididas — no las reinventes

- **El id de espacio es `number`** en todo el dominio (es la forma del backend). El `string` solo
  existe en el borde del DOM, porque `<select>` no sabe de números: la conversión vive **únicamente
  en los componentes de selector** — `components/ui/HeaderSpaceSelector.tsx` (el compartido) y los
  `<select>` propios de `availability/BlockModal.tsx` y `pricing/SpaceSelector.tsx`. No escribas
  `String(id)` ni `Number(id)` sobre un id de espacio en actions, hooks, tipos ni transporte.
- **`EspacioOption` y `PagedResponse<T>` viven en `lib/domain/`.** No los redefinas en un módulo;
  re-expórtalos desde sus `types/` si necesitas usarlos con ruta local.
- **El catálogo de espacios ya está resuelto**: `loadEspacioOptions()` / `getSpaceOptions()`. No
  vuelvas a componer el join `espacio → tipoEspacio → modalidadReserva` a mano.
- **`getArchetype()` (`lib/domain/`)** deriva `franja_exclusiva | cupo_compartido`. Úsalo en vez de
  comparar `modalidadReserva` con strings.
- **Query keys en `constants/` del módulo**, nunca dentro del hook.
- **Named exports.** `export default` solo donde Next.js lo exige: `page.tsx`, `layout.tsx`,
  `route.ts`.
- **`"use client"` explícito** en la primera línea de todo componente interactivo.

## El `page.tsx` es un cascarón

Server Component que verifica sesión, hace el fetch inicial si hace falta y renderiza el módulo.
Nada más — ni helpers de formato, ni mapeo, ni JSX de la pantalla:

```tsx
export default async function ReservasPage() {
  await verifySession();
  return <ReservasModule />;
}
```

## Antes de dar por terminado un cambio

```
npx tsc --noEmit
npx eslint .
npx next build
```

Ninguno de los tres ejecuta el render de las páginas del portal (son rutas dinámicas y protegidas).
Si tocaste una pantalla, dilo explícitamente en el resumen en vez de darla por verificada.

---

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
5. Excepciones existentes: los prototipos sueltos de `docs/` (`disponibilidadui.tsx`, `gesti_n_de_tarifas.tsx`, `reservas.tsx` — referencia de diseño, no se compilan ni se migran) y valores no tipográficos puntuales (p. ej. dígitos de inputs OTP).
