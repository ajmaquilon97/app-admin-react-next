# Pruebas del Portal Web — qué está hecho y qué falta completar en la tesis

> Documento de trabajo. Cruza el estado real del repositorio `app-admin-react-next`
> con lo que pide el documento de tesis, sección por sección. Cada apartado indica
> **qué falta**, **de dónde sale el dato** y, cuando aplica, **el comando exacto**.
>
> Generado el 13/08/2026 contra la rama `develop`.

---

## 0. Resumen ejecutivo

| | |
|---|---|
| Suite de pruebas del portal web | **Implementada** — 35 archivos, 875 pruebas, 0 fallos |
| Cobertura global | Statements 93,33 % · Branches 86,14 % · Functions 89,18 % · Lines 94,36 % |
| Umbral de la tesis (§8.6.1) | 70 % en las cuatro métricas — **superado en todas las filas** |
| `npm run verify` | Pasa: `tsc` sin errores, ESLint 0 errores / 2 warnings conocidos, 875 pruebas, `next build` correcto |
| Pipeline de CI | **Implementado** — `pruebas.yml` ejecuta la suite con cobertura en cada push y PR a `feature`, y notifica por correo |

**Lo que sigue pendiente y depende de ti, no del código:**

1. Pegar la tabla de cobertura y las capturas en §10.8.3.1 (§3 de este documento).
2. Rellenar la tabla de herramientas §10.8.2 con las versiones reales (§4).
3. **Resolver tres discrepancias entre lo que el documento afirma y lo que existe
   en el repositorio** — son las que más peso tienen ante un jurado (§8).
4. **Importar los dos rulesets** de `docs/rulesets/` para proteger `main` (§5.3).
   Van listos; hay un detalle a resolver antes: la rama `refactor/slices-verticales`
   incumple la convención y podría abrir un PR a `main` saltándose la regla.
5. Completar los huecos de cumplimiento OWASP/ISO/LOPDP (§6).

---

## 1. Qué se implementó

### Infraestructura

| Archivo | Función |
|---|---|
| `jest.config.ts` | Configuración sobre `next/jest` (mismo compilador SWC que `next build`), entorno jsdom, umbral de cobertura al 70 % en las cuatro métricas |
| `jest.setup.ts` | Entorno común: variables de entorno de prueba, observers, `matchMedia`, doble de `sonner` |
| `jest.polyfills.ts` | WebCrypto, `TextEncoder`/`TextDecoder` y `structuredClone` para que `jose` (cifrado de la sesión) funcione en jsdom |
| `tests/helpers/render.tsx` | `renderWithQuery` / `renderHookWithQuery`: cliente de React Query aislado por prueba |
| `tests/helpers/fixtures.ts` | Constructores de datos de prueba, en forma de transporte (`*Api`) y de dominio |
| `scripts/coverage-filas.mjs` | Reparto de archivos en las filas de la tabla de la tesis, compartido por los dos generadores |
| `scripts/coverage-tesis.mjs` | Imprime la tabla de §10.8.3.1 en Markdown, lista para pegar |
| `scripts/coverage-email.mjs` | Construye el reporte que el pipeline envía por correo (HTML, Markdown y asunto) |
| `.github/workflows/pruebas.yml` | Ejecuta la suite en cada push y PR a `feature`, publica la cobertura y notifica por correo |

### Comandos

```bash
npm test                     # ejecuta las 875 pruebas
npm run test:coverage        # + reporte de cobertura (consola, HTML y lcov)
npm run test:ci              # modo CI, secuencial, con cobertura
npm run test:tabla-tesis     # imprime la tabla de §10.8.3.1 en Markdown
npm run test:reporte-correo  # genera el reporte de cobertura del pipeline en local
npm run verify               # typecheck + lint + test + build
```

El reporte HTML navegable queda en `coverage/lcov-report/index.html` — sirve tanto
para las capturas de la tesis como para revisar qué líneas quedan sin cubrir.

### Cobertura: qué se mide y qué no

Se excluyen a propósito (`collectCoverageFrom` en `jest.config.ts`):

- `src/app/**` — páginas y layouts. Son cascarones `async` de servidor (ver
  `AGENTS.md`); su render real no es alcanzable desde jsdom.
- `src/**/api/**` — capa de transporte `server-only`. Se verifica con
  Postman/Newman, tal como plantea §8.5.1.2.
- `index.ts` de cada módulo — solo re-exports, sin lógica propia.

**Esta exclusión hay que declararla en el documento** (ver §3.2 más abajo): si el
jurado compara el número de archivos del repositorio con los del reporte, la
diferencia debe estar justificada por escrito, no descubierta en la defensa.

---

## 2. Enfoque de las pruebas (para redactar §10.8.1)

El documento ya describe cuatro principios en §10.8.1. Estos son los hechos
concretos del portal web con los que puedes sustentarlos:

- **Automatización completa.** Un solo comando (`npm test`), sin servicios
  externos ni base de datos: el backend se sustituye por dobles en la frontera
  de transporte.
- **Cobertura orientada a riesgo.** Los flujos con mayor cobertura son
  precisamente los de mayor riesgo: sesión cifrada y autenticación (91 %),
  mapeo de reservas y estados de pago (95 %), y traducción de tarifas (97 %).
- **Independencia entre pruebas.** Cada prueba crea su propio `QueryClient` con
  caché aislada (`tests/helpers/render.tsx`), y `clearMocks`/`restoreMocks`
  reinician los dobles entre casos.
- **Consulta por rol de accesibilidad.** Siguiendo a Dodds (2019), los elementos
  se buscan por rol, etiqueta o texto visible, no por clases CSS.

Un matiz que conviene corregir en el texto: **§8.5.1.1 menciona el *snapshot
testing* como técnica adoptada.** Esta suite no usa snapshots a propósito —
capturan el marcado, no la conducta, y se convierten en ruido cuando cambia el
diseño. O bien se ajusta ese párrafo, o bien se justifica la decisión; hoy el
documento afirma algo que el código no hace.

---

## 3. §10.8.3.1 — Tabla «Portal Web — Next.js»

### 3.1 Tabla con los datos reales

Regenerable en cualquier momento con `npm run test:tabla-tesis`:

| Módulo | Tests | Pasados | Fallidos | Statements (%) | Branches (%) | Functions (%) | Lines (%) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Autenticación / Usuarios | 115 | 115 | 0 | 91,67 | 86,22 | 92,21 | 93,37 |
| Gestión de Espacios | 71 | 71 | 0 | 90,54 | 75,41 | 80,65 | 91,34 |
| Módulo de Reservas | 146 | 146 | 0 | 94,98 | 92,46 | 87,61 | 95,10 |
| Disponibilidad y Aforo | 141 | 141 | 0 | 91,72 | 88,15 | 86,29 | 92,77 |
| Tarifas | 120 | 120 | 0 | 97,37 | 90,41 | 96,47 | 98,57 |
| Financiero y Facturación | 59 | 59 | 0 | 95,40 | 85,07 | 89,33 | 95,09 |
| Configuración y Soporte | 100 | 100 | 0 | 98,72 | 93,48 | 98,75 | 99,54 |
| Dashboard | 28 | 28 | 0 | 100,00 | 93,75 | 100,00 | 100,00 |
| Componentes UI comunes | 53 | 53 | 0 | 87,94 | 80,21 | 82,46 | 90,50 |
| Dominio compartido (`lib/`) | 42 | 42 | 0 | 100,00 | 100,00 | 100,00 | 100,00 |
| **TOTAL PROYECTO WEB** | **875** | **875** | **0** | **93,33** | **86,14** | **89,18** | **94,36** |
| Umbral mínimo requerido | — | — | — | 70 | 70 | 70 | 70 |

> ⚠️ **Las filas del documento no coinciden con los módulos que existen.** La tabla
> de la tesis lista «Invitaciones / QR» y «Hooks personalizados». La primera no
> existe en este portal (ver §8.1); la segunda no es un módulo sino una capa
> presente dentro de cada uno, así que se disolvió en sus filas. A cambio, el
> portal tiene cuatro dominios que la tabla original no contempla: Disponibilidad
> y Aforo, Tarifas, Financiero y Configuración/Soporte. **Sustituye las filas del
> documento por las de arriba.**

### 3.2 Párrafo de exclusiones (redáctalo bajo la tabla)

> Las métricas se calculan sobre el código ejercitable en el entorno jsdom. Quedan
> excluidas del cómputo, por decisión explícita registrada en `jest.config.ts`, las
> rutas y layouts de `src/app/` —componentes de servidor cuyo render no es
> alcanzable desde jsdom—, la capa de transporte `server-only` de cada módulo
> —verificada mediante las colecciones de Postman descritas en §8.5.1.2— y los
> archivos barril, que solo contienen reexportaciones.

### 3.3 Capturas pendientes

| # | Qué capturar | Cómo obtenerla |
|---|---|---|
| 1 | Tabla de cobertura por directorio | `npm run test:coverage` y capturar la salida de consola completa |
| 2 | Reporte HTML de cobertura | Abrir `coverage/lcov-report/index.html`, capturar la vista de resumen |
| 3 | Resultado de la ejecución | `npm test` mostrando «Test Suites: 35 passed / Tests: 875 passed» |

Recomendación: la captura 2 luce mejor en el documento que la 1 y muestra el
mismo dato con las cuatro métricas por carpeta.

---

## 4. §10.8.2 — Tabla de herramientas y configuración

La tabla del documento tiene la columna **Versión** con guiones. Estos son los
valores instalados en este repositorio:

| Repositorio | Herramienta | Versión | Tipo de Prueba | Comando Local | Comando CI |
|---|---|---|---|---|---|
| Frontend Web (Next.js) | Jest | 30.4.2 | Unitarias / Componentes | `npm test` | `npm run test:ci` |
| Frontend Web (Next.js) | React Testing Library | 16.3.2 | Componentes | `npm test` | `npm run test:ci` |
| Frontend Web (Next.js) | `@testing-library/user-event` | 14.6.4 | Simulación de interacción | — | — |
| Frontend Web (Next.js) | `@testing-library/jest-dom` | 6.9.1 | Aserciones sobre el DOM | — | — |
| Frontend Web (Next.js) | `jest-environment-jsdom` | 30.4.1 | Entorno DOM simulado | — | — |

Contexto del entorno, por si el tribunal lo pregunta: Next.js 16.2.9, React 19.2.4,
TypeScript 5.9.3, Node 20.

Faltan por completar, y **no dependen de este repositorio**: las versiones de la
app móvil y las de Postman/Newman del backend.

---

## 5. §10.9 — Pipeline de Integración Continua

### 5.1 Estado real del pipeline

El repositorio tiene **dos workflows**, y ninguno se llama `ci.yml` como afirman
§10.9.1 y §10.9.2. Hay que actualizar esa descripción:

| Archivo | Trigger | Jobs | Para qué sirve |
|---|---|---|---|
| `.github/workflows/pruebas.yml` | push y PR a `feature` / `feature/**`, más ejecución manual | `pruebas` (Jest + cobertura + reporte por correo) | Es el pipeline que la tesis describe como «lint → test → build» |
| `.github/workflows/code-analysis.yml` | PR a `feature` / `feature/**` | `codeql` → `sonarcloud` | Análisis de seguridad y deuda técnica |

`pruebas.yml` hace más de lo que pide el documento, y eso juega a favor:

1. `npm ci` con caché de dependencias.
2. `npm run test:ci` — las 875 pruebas con cobertura; el umbral del 70 % vive en
   `jest.config.ts`, así que el paso falla solo si la cobertura baja de ahí.
3. Construye el reporte con `scripts/coverage-email.mjs`, que genera la misma
   tabla por módulo de §10.8.3.1 en tres formatos: HTML para el correo, Markdown
   para el resumen de la ejecución y una línea de asunto.
4. Publica el resumen en `$GITHUB_STEP_SUMMARY` — visible en la propia ejecución.
5. Sube `coverage/` y `jest-results.json` como artefacto, 30 días de retención.
6. **Envía el reporte por correo** a `DESTINATARIOS_REPORTE`, tanto si las
   pruebas pasan como si fallan (de ahí el `continue-on-error` en el paso 2).
7. Marca el job en rojo al final si las pruebas fallaron o la cobertura no llegó
   al umbral.

**Qué cambiar en el documento (§10.9.1 y §10.9.2):**

- El nombre del archivo: `pruebas.yml`, no `ci.yml`.
- El trigger: `feature` / `feature/**`, no `main`.
- Los jobs: un único job que ejecuta pruebas con cobertura, publica artefacto y
  notifica por correo. La verificación de tipos, el linting y el build **no** están
  en este workflow (sí en `npm run verify`, que se corre en local). O se ajusta la
  frase de §10.9.2, o se añaden esos pasos al YAML.
- La tabla de §10.9.1 lista una sola fila por repositorio; aquí conviene
  mencionar los dos workflows, porque `code-analysis.yml` respalda la afirmación
  de §10.1.4 sobre análisis de seguridad.

El envío del reporte por correo es un añadido que el documento no contempla y que
vale la pena describir: es un mecanismo de retroalimentación inmediata al equipo,
y encaja bien en §8.5.3.1, donde se argumenta que el coste de un defecto crece
con el tiempo que tarda en detectarse.

**Captura sugerida para §10.9.2:** el correo recibido con la tabla de cobertura.
Es evidencia más vistosa que una captura de consola y demuestra el pipeline
funcionando de extremo a extremo.

### 5.2 Huecos concretos de §10.9.4

| Hueco | Qué poner | De dónde sale |
|---|---|---|
| «causas raíz identificadas fueron [COMPLETAR]» | Las causas reales de los 7 fallos de la fase de estabilización | Pestaña **Actions** de GitHub → cada ejecución roja → paso que falló |
| «tasa de éxito del [COMPLETAR: X]%» | Ejecuciones verdes ÷ total, sobre los últimos N PR | Actions → filtrar por workflow → contar |
| «sobre los últimos [COMPLETAR: N] Pull Requests» | El N que hayas contado | ídem |
| «tiempo promedio de retroalimentación de [COMPLETAR: X] minutos» | Duración media de las ejecuciones | Columna de duración en Actions |
| Captura del historial estabilizado | Lista de ejecuciones con predominio de verdes | Actions → workflow → captura de la lista |

La tabla de métricas de §10.9.4 está rellenada con datos **de la app móvil**
(compilación Expo, `expo-doctor`). Si vas a presentar también las del portal web,
necesitas una tabla equivalente; si no, aclara en el texto que esa tabla
corresponde solo al repositorio móvil, porque hoy aparece dentro de una sección
que habla de los tres repositorios.

### 5.3 §10.9.5 — Protección de ramas

**Modelo de ramas del proyecto** (decidido por el equipo):

```
feature/xxx  ──PR──►  feature  ──PR──►  main
             (aquí corren            (aquí no se
              las pruebas)            repite nada)
```

La puerta de calidad está **en los Pull Requests hacia `feature`**, no hacia
`main`. `pruebas.yml` corre la suite con cobertura en cada PR hacia `feature` y
—esto es lo que cierra el círculo— **también en cada push a `feature`**, así que
la rama de integración queda verificada después de cada merge, no solo antes.

A `main` solo llega contenido que ya pasó por ese filtro, y por eso el PR
`feature → main` no vuelve a ejecutar nada: sería repetir una verificación ya
hecha sobre el mismo árbol. `main` se mantiene limpia por construcción.

Esto tiene una consecuencia directa sobre lo que `main` puede exigir, y es la
que hay que reflejar en el documento:

> ⚠️ **En la rama `main` no se puede requerir ningún status check.** Ningún
> workflow se dispara en un PR hacia `main`, así que un check requerido nunca
> reportaría y el PR quedaría bloqueado en estado pendiente para siempre. La fila
> «Status check requerido» de la tabla de §10.9.5 **no aplica a este repositorio**
> — ver la tabla corregida más abajo.

No es una carencia, es el diseño: el control se ejerce antes, en `feature`. Pero
la tabla actual del documento afirma lo contrario, y eso sí es un problema.

#### Los dos rulesets a importar

Los dejé listos en `docs/rulesets/`. GitHub permite importarlos como JSON, así que
no hay que ir marcando casillas una por una:

**Settings → Rules → Rulesets → New ruleset → Import a ruleset** → seleccionar el
archivo.

| Archivo | Qué hace |
|---|---|
| `docs/rulesets/proteccion-main.json` | Protege `main`: exige PR con 1 aprobación, prohíbe borrarla, bloquea force-push y no admite excepciones |
| `docs/rulesets/convencion-nombres-rama.json` | Impide crear ramas fuera de `feature/**` y `hotfix/**` (más `main` y `develop`, que ya existen) |

Ambos vienen con `"enforcement": "active"`. Si prefieres verlos actuar sin
bloquear nada todavía, cambia ese campo a `"evaluate"` antes de importar y
súbelo a `active` cuando estés conforme.

Detalles de `proteccion-main.json` que conviene conocer antes de importar:

- **`required_approving_review_count: 1`.** Lo puse en 1 porque §8.5.3.3 afirma
  que cada historia pasó por revisión de pares; con esto la afirmación se vuelve
  verificable. Si prefieres no exigirlo, ponlo en `0` y matiza ese apartado.
- **`dismiss_stale_reviews_on_push: true`.** Un push posterior invalida la
  aprobación previa. Es lo razonable, pero añade fricción: si te estorba, ponlo
  en `false`.
- **`allowed_merge_methods: ["merge", "squash"]`.** Excluye *rebase*. Ajústalo si
  usáis rebase.
- **`bypass_actors: []`** vacío a propósito: es el equivalente de «Do not allow
  bypassing the rules». Si se añade alguien aquí, esa fila de la tabla deja de
  ser cierta.

#### Cómo se aplica «main solo recibe PRs de feature o hotfix»

GitHub **no tiene** ninguna regla que mire la rama de origen de un Pull Request:
los patrones de nombre de los rulesets se aplican siempre a la rama destino. La
restricción se consigue de forma indirecta, impidiendo que existan ramas fuera de
la convención — eso es `convencion-nombres-rama.json`.

**Hay una rama que hoy incumple la convención:** `refactor/slices-verticales`.
El ruleset no la borra —solo impide *crear* ramas nuevas fuera del patrón—, así
que podría abrir un PR hacia `main` saltándose la regla. Antes de dar por cerrada
la configuración conviene fusionarla o eliminarla; si no, es un hueco real y la
tabla afirmaría una garantía que no se cumple del todo.

#### Tabla corregida, lista para pegar

Sustituye la tabla actual de §10.9.5 por esta. Los cambios frente a la original:
se elimina la fila de status check —que no aplica a `main` en este modelo—, se
añaden las tres reglas que el ruleset sí activa, y se justifica el guion de la
fila de tamaño de archivo.

| Regla de Protección | Frontend Web | App Móvil | Backend API |
|---|---|---|---|
| Require a pull request before merging | ✅ Activo | | |
| Required approving reviews (1) | ✅ Activo | | |
| Dismiss stale reviews on push | ✅ Activo | | |
| Require conversation resolution before merging | ✅ Activo | | |
| Origen restringido a ramas `feature/**` y `hotfix/**` | ✅ Activo | | |
| Restrict deletions | ✅ Activo | | |
| Block force pushes | ✅ Activo | | |
| Restrict pushes that create files > 10 MB | — ¹ | | |
| Do not allow bypassing the rules | ✅ Activo | | |

> ¹ No disponible en el plan del proyecto: las *push rules* de los rulesets
> (tamaño, extensión y ruta de archivo) requieren GitHub Team o Enterprise Cloud
> en repositorios privados.

Las columnas de App Móvil y Backend API quedan en blanco a propósito: solo puedo
responder por este repositorio. Rellénalas tras verificar la configuración real
de cada uno — si no están configurados, los ✅ son trivialmente desmentibles por
cualquiera con acceso.

#### Párrafo a añadir en §10.9.5

El párrafo introductorio actual («la efectividad del pipeline depende de que la
protección de `main` requiera la aprobación del pipeline antes del merge») **no
describe este proyecto** y hay que ajustarlo: aquí el pipeline se exige en
`feature`, no en `main`. Propuesta de redacción:

> La estrategia de protección de ramas del proyecto sitúa el control de calidad
> automatizado en la rama de integración. Cada Pull Request hacia `feature`, así
> como cada actualización de dicha rama, dispara la ejecución completa de la
> suite de pruebas con verificación del umbral de cobertura, de modo que
> `feature` se mantiene permanentemente en un estado verificado. La rama `main`
> se protege entonces mediante reglas estructurales —obligatoriedad de Pull
> Request con revisión aprobatoria, prohibición de escritura directa, de borrado
> y de reescritura del historial— y mediante la restricción de que únicamente
> pueda recibir integraciones procedentes de ramas `feature/**` o `hotfix/**`.
> Esta separación evita duplicar la ejecución del pipeline sobre un árbol de
> código ya verificado, y mantiene `main` como un registro limpio de versiones
> validadas.

Si quieres mantener la cita de Kodi (2023), encaja igual: el argumento de fondo
—que la protección de ramas es lo que da eficacia al pipeline— sigue siendo el
mismo; lo que cambia es en qué rama se sitúa la verificación.

#### Captura 9

El pie de figura actual dice «Settings → Branches»; con rulesets la ruta es
**Settings → Rules → Rulesets**. Capturas a tomar:

1. La lista de rulesets con los dos activos.
2. `Proteccion main` abierto, con sus reglas marcadas.
3. Opcional pero recomendable: `Convencion de nombres de rama` abierto, que es
   el que sostiene la fila de origen restringido.

Y una frase que conviene añadir, porque convierte una diferencia con el documento
en un punto a favor:

> La protección se implementó mediante *repository rulesets*, el mecanismo que
> GitHub recomienda actualmente frente a las *branch protection rules* clásicas,
> por permitir la evaluación en seco de las reglas antes de su activación, una
> lista de excepciones explícita y auditable, y la exportación de la
> configuración como archivo JSON versionable.

Ese JSON es mejor anexo que la captura: es texto verificable, y ya está en el
repositorio bajo `docs/rulesets/`. Vale la pena incluir ambos.

---

## 6. Cumplimiento normativo y de calidad (§10.1.4 – §10.1.6)

Estas tres tablas están redactadas **desde la perspectiva del backend** (BCrypt,
Entity Framework, endpoints `/api/users/*`). El portal web aporta evidencia
propia y verificable por pruebas automatizadas, que hoy no aparece. Vale la pena
añadirla: convierte afirmaciones en evidencia reproducible.

### 6.1 OWASP Top 10 — controles del portal web

| # | Categoría | Control en el portal web | Evidencia (prueba automatizada) |
|---|---|---|---|
| A01 | Broken Access Control | Toda Server Action resuelve el token desde la cookie y redirige a `/login` si no hay sesión; ninguna acepta credenciales por parámetro | `tests/bookings/reservas-actions.test.ts` → «control de sesión»; se repite en cada módulo |
| A02 | Cryptographic Failures | Sesión cifrada como JWE A256GCM en cookie `httpOnly`; los tokens del backend nunca viajan legibles al navegador | `tests/lib/session-crypto.test.ts`, `tests/lib/session.test.ts` |
| A04 | Insecure Design | Modelo dual transporte/dominio con capa anticorrupción; aislamiento entre módulos verificado por ESLint | `eslint.config.mjs`; pruebas de mapeo en `*/actions/` |
| A05 | Security Misconfiguration | `SESSION_SECRET` obligatorio: el cifrado falla de forma explícita si falta | `tests/lib/session-crypto.test.ts` → «falla de forma explícita si falta SESSION_SECRET» |
| A07 | Auth & Identification Failures | Validación de servidor con Zod en cada action; política de contraseña; una cookie manipulada degrada a sesión nula | `tests/auth/auth-actions.test.ts`, `tests/auth/definitions.test.ts` |
| A08 | Data Integrity Failures | La etiqueta GCM invalida cualquier cookie alterada | `tests/lib/session-crypto.test.ts` → «devuelve null ante un JWE manipulado» |

**Pendiente tuyo:** decidir si esto va como tabla nueva en §10.1.4 o como
subsección propia del portal web. Recomiendo lo segundo, para no mezclar
controles de dos capas distintas en una sola tabla.

### 6.2 ISO/IEC 25010 — evidencia del portal web

La tabla de §10.1.5 puntúa de 0 a 5 sin decir de dónde sale cada nota. **Ese es
el punto más atacable del capítulo**: una puntuación sin instrumento es una
opinión. Con la suite ya existente puedes anclar tres filas:

| Característica | Subcaracterística | Métrica medible | Instrumento |
|---|---|---|---|
| Mantenibilidad | Modularidad | Aislamiento entre los 8 dominios, sin importaciones cruzadas | `npm run lint` (regla `no-restricted-imports`) |
| Mantenibilidad | Capacidad de ser probado | Cobertura de 93,33 % en sentencias sobre el criterio de 70 % | `npm run test:coverage` |
| Fiabilidad | Tolerancia a fallos | Cada listado y formulario tiene estado de error probado; ningún fallo del backend deja la pantalla en blanco | Pruebas «informa del fallo de carga» en los seis módulos |

Para las filas de **Eficiencia de desempeño** el portal web **no tiene aún
instrumento de medición**. Los criterios de §8.6.1 asignan el tiempo de respuesta
a la API (Newman) y el tiempo de carga de pantallas a la app móvil, así que el
portal web queda formalmente cubierto. Si quieres medirlo igualmente, lo estándar
sería Lighthouse CI sobre el build de producción; **no está implementado**, y si
decides no hacerlo, conviene que el documento diga explícitamente que la
eficiencia del portal web queda fuera del alcance de esta evaluación en vez de
dejarlo implícito.

### 6.3 LOPDP

La fila **«Consentimiento informado — Captura de pantalla del formulario de
registro»** es del portal web y sí está implementada y probada: el registro exige
marcar la casilla de aceptación, que enlaza a Términos y a Políticas de
privacidad, y el servidor rechaza el alta sin ella.

- Evidencia automatizada: `tests/auth/definitions.test.ts` → «no permite
  registrarse sin aceptar las políticas de privacidad»; `tests/auth/auth-actions.test.ts`
  → «bloquea el registro si no se aceptaron las políticas de privacidad»;
  `tests/auth/auth-forms.test.tsx` → «enlaza términos y políticas de privacidad».
- **Captura pendiente:** formulario de `/signup` con la casilla y ambos enlaces
  visibles, 1280×800.

Un detalle adicional que puedes citar como privacidad por diseño: al fallar la
validación, el formulario repuebla nombre, apellido y correo pero **nunca** la
contraseña — hay una prueba que lo verifica («nunca devuelve la contraseña entre
los valores repoblados»).

Las demás filas (RAT, ARCO) son del backend y no se evidencian desde aquí.

---

## 7. §10.10 — Consolidación frente a los objetivos

Solo un hueco depende de este repositorio:

> **OE2.** «…cobertura Jest del portal web **[COMPLETAR: %]**»

Rellenar con: **93,33 % de sentencias (86,14 % ramas, 89,18 % funciones,
94,36 % líneas) sobre un criterio de aceptación del 70 %, con 875 pruebas
unitarias y de componentes, todas superadas.**

Para «Cumplido — [COMPLETAR]» en la misma fila, una síntesis defendible:

> Cumplido — el portal web cubre los ocho dominios de gestión del anfitrión con
> 875 pruebas automatizadas que superan el umbral del 70 % en las cuatro métricas
> de cobertura, con margen en todas ellas.

⚠️ Antes de firmar esa fila, revisa §8.1: la evidencia de OE2 menciona
«generación de invitaciones QR desde el portal», y eso no existe.

---

## 8. Discrepancias entre el documento y el repositorio

Son los tres puntos con más riesgo ante el tribunal, porque un revisor que abra
el repositorio los encuentra sin buscarlos.

### 8.1 🔴 El módulo de Invitaciones / QR no existe en el portal web

El documento lo afirma en tres lugares:

- §10.7.6.1 «Portal Web Administrativo — Gestión de Invitaciones», con tres
  capturas solicitadas (formulario de generación, listado de invitaciones,
  registro de accesos).
- La tabla de §10.8.3.1 incluye una fila «Invitaciones / QR» para el portal web.
- §10.10 lo cita como evidencia del OE2.

**En el repositorio no hay ninguna ruta, módulo, acción ni componente de
invitaciones o QR.** Las rutas del portal son: dashboard, espacios,
disponibilidad, reservas, tarifas, financiero, configuración y soporte.

Lo que sí existe como control de acceso desde el portal es el **PIN de recepción**:
un código de 6 dígitos, de un solo uso y con caducidad, que el anfitrión genera
desde el detalle de la reserva y entrega al personal de puerta
(`PinRecepcionModal`, probado en `tests/bookings/bookings-components.test.tsx`).

Tres salidas posibles, en orden de coste:

1. **Reescribir §10.7.6.1** para describir el PIN de recepción como el mecanismo
   de control de acceso del portal, y dejar el QR como responsabilidad exclusiva
   de la app móvil (donde sí está). Es lo más fiel a lo construido.
2. Implementar la gestión de invitaciones QR en el portal. Es alcance nuevo, no
   una corrección de redacción.
3. Marcar la funcionalidad como no implementada y moverla a §11.4 (Trabajo Futuro).

Elijas la que elijas, **hay que hacerlo antes de la defensa**: las tres capturas
web de §10.7.6.1 no se pueden tomar hoy.

### 8.2 🟠 El pipeline no se llama `ci.yml` ni se dispara donde dice el documento

El pipeline de pruebas **sí existe** (`pruebas.yml`) y hace más de lo que la
tesis describe. Lo que no coincide son los datos concretos que el documento da:

| | Documento | Repositorio real |
|---|---|---|
| Archivo | `.github/workflows/ci.yml` | `.github/workflows/pruebas.yml` (+ `code-analysis.yml`) |
| Trigger | PR + push a `main` | push y PR a `feature` / `feature/**` |
| Jobs | `lint → test → build` | Jest con cobertura, artefacto y notificación por correo |

Además, la tabla de §10.9.5 marca como activo un status check sobre `main` que
hoy **no puede reportar**, porque el workflow no se dispara en PRs hacia esa rama
(ver §5.3, obstáculo 1). Es el detalle más fácil de desmontar para un revisor: dos
clics en la pestaña Actions lo dejan a la vista.

### 8.3 🟡 El documento menciona snapshot testing y la suite no lo usa

Ver §2. Es el más menor de los tres, pero se corrige con un párrafo.

---

## 9. Hallazgos del proceso de pruebas

Estos son resultados del trabajo, no tareas pendientes. Dan material para la
sección de análisis: demuestran que la suite **encontró** algo, que es
precisamente el argumento a favor de tener pruebas.

### 9.1 Defecto encontrado y corregido: el no-show se mostraba como éxito

En `modules/bookings/actions/reservas.ts`, la línea de tiempo de una reserva
clasifica cada evento del historial buscando palabras clave **por subcadena y en
orden**. La regla `"asistio"` estaba declarada antes que `"no_asisti"`, y como
`"no_asistio".includes("asistio")` es verdadero, la regla del no-show nunca se
alcanzaba: **una inasistencia se pintaba con el punto verde de éxito**, igual que
una asistencia confirmada.

- Detectado por: `tests/bookings/reservas-actions.test.ts` → «clasifica la acción
  no_asistio como evento warning».
- Corregido invirtiendo el orden de ambas reglas, con un comentario que explica
  por qué el orden importa.
- Para el documento: es un ejemplo real y citable de defecto de lógica detectado
  por pruebas unitarias antes de llegar a producción.

### 9.2 Observaciones registradas (sin cambiar el código)

| Observación | Dónde | Comentario |
|---|---|---|
| En Zod 4, `.trim()` corre **después** de validar: un correo con espacios alrededor se rechaza en vez de recortarse | `lib/auth/definitions.ts` | Afecta a quien pegue su correo con un espacio. Documentado en una prueba para que un cambio de orden se note |
| Tras un fallo de subida, la miniatura local sigue visible junto al mensaje de error | `components/ui/ImageUploader.tsx` | El `onload` del `FileReader` gana la carrera contra el `setPreview("")`. Es aceptable (deja claro qué archivo falló), queda fijado por prueba |
| Los campos de Perfil y Negocio no asocian su `<label>` con el input (falta `htmlFor`/`id`) | `modules/configuracion/components/` | `getByLabelText` no los encuentra; se seleccionan por `name`. **Mejora de accesibilidad pendiente**, relevante si se quiere argumentar accesibilidad en ISO 25010 |
| Crear un espacio exige marcar el punto en el mapa; editarlo no | `modules/spaces/components/` | Parece intencional (no bloquear espacios antiguos sin coordenadas). Documentado como tal en la prueba |

---

## 10. Fuera del alcance de este repositorio

Para que no se busquen aquí:

- **§10.8.3.2 — App Móvil (React Native / Expo).** Tabla y capturas propias, del
  repositorio `app-client-react-native`.
- **§9 — Matriz de entrevistas** (~40 huecos `[COMPLETAR]`, caps. 9.1–9.5). Son
  datos de campo, no de código.
- **Capturas móviles de §10.6 y §10.7.6.2** (escáner QR, resultados de validación).
- **Colecciones de Postman/Newman** y sus métricas de tiempo de respuesta:
  repositorio del backend.
- **Filas RAT y ARCO de la tabla LOPDP:** endpoints del backend.

---

## 11. Orden sugerido de trabajo

1. **Decidir qué hacer con Invitaciones/QR en el portal** (§8.1) — condiciona
   §10.7.6.1, §10.8.3.1 y §10.10.
2. **Habilitar la protección de `main`** (§5.3), en este orden:
   a. Añadir `main` a `pull_request.branches` en `pruebas.yml`.
   b. Crear `origen-pr.yml`.
   c. Abrir un PR de prueba hacia `main` para que ambos checks aparezcan.
   d. Configurar la regla de protección y tomar la captura 9.
3. Actualizar §10.9.1–10.9.2 con el nombre y el trigger reales (§5.1).
4. Ejecutar `npm run test:tabla-tesis` y pegar la tabla en §10.8.3.1, con el
   párrafo de exclusiones de §3.2.
5. Tomar las tres capturas de §3.3, más la del correo del pipeline (§5.1).
6. Rellenar versiones en §10.8.2 con los datos de §4.
7. Añadir la evidencia del portal web a las tablas de cumplimiento (§6).
8. Cerrar §10.10 con el porcentaje de §7.
9. Recoger de GitHub Actions los datos de §5.2.
