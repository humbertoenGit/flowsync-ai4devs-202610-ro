# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

FlowSync: proyecto de ejercicio del máster AI4Devs (LIDR). Monorepo sin workspace raíz, con dos apps independientes, cada una con su propio `package.json` y `node_modules`:

- `backend/`: API en AdonisJS 7 + Lucid (SQLite) + VineJS. **Ya existe y en esta sesión no se modifica**: se lee para saber qué exige la API.
- `frontend/`: React 19 + Vite + TypeScript. Aquí es donde se trabaja. Todavía es la plantilla de Vite: no hay router, cliente HTTP, Tailwind ni shadcn/ui.

Requiere Node.js 24 o superior: con versiones anteriores el backend falla con `Unknown file extension ".ts"`. Los documentos del repo (`README.md`, `prompts.md`) y los commits están en español.

## Comandos

Backend (desde `backend/`):

```bash
npm install && cp .env.example .env && node ace generate:key   # primera vez
node ace migration:run      # crea tmp/db.sqlite3 y regenera database/schema.ts
npm run dev                 # http://localhost:3333 (HMR)
npm test                    # node ace test (Japa)
node ace test functional    # una sola suite (unit | functional)
node ace test --files tests/functional/auth.spec.ts   # un solo archivo
npm run lint && npm run typecheck
```

Las suites se definen en `adonisrc.ts` (`tests/unit/**/*.spec.ts`, `tests/functional/**/*.spec.ts`). Ahora mismo no existe ningún spec, solo `tests/bootstrap.ts`.

Frontend (desde `frontend/`):

```bash
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build (es también la comprobación de tipos)
npm run lint      # oxlint (.oxlintrc.json)
npm run format    # prettier --write src
```

Hay un hook (`.claude/settings.json` → `.claude/hooks/format-frontend.mjs`) que ejecuta Prettier sobre cada archivo de `frontend/src/**` que se escribe o se edita. El estilo está en `frontend/.prettierrc.json`: sin punto y coma y con comillas simples.

## Arquitectura del backend

El flujo de cada petición es ruta → controlador → validador → modelo → transformer:

- `start/routes.ts`: todo cuelga de `/api/v1`. Las referencias a controladores vienen de `#generated/controllers`, que el assembler genera en `.adonisjs/`. Por eso `.adonisjs/**` y `database/schema.ts` cambian solos con `npm run dev` o `migration:run`. Son archivos generados: no se editan a mano.
- Alias de import con `#` (`#models/*`, `#validators/*`, etc., definidos en `package.json` → `imports`).
- Los modelos extienden las clases generadas en `database/schema.ts` (`User extends compose(UserSchema, withAuthFinder(hash))`). Para cambiar el esquema se crea una migration nueva en `database/migrations/`; nunca se edita `schema.ts`.
- `providers/api_provider.ts` añade `ctx.serialize()`, que **envuelve toda respuesta en `{ data: ... }`**. Los transformers (`app/transformers/`) fijan qué campos salen: `UserTransformer` devuelve `id, fullName, email, createdAt, updatedAt, initials`.
- `ForceJsonResponseMiddleware` hace que los errores también lleguen siempre en JSON.
- La autenticación usa el guard `api` de access tokens (`config/auth.ts`). Los tokens llevan el prefijo `oat_` y se envían como `Authorization: Bearer <token>`. En desarrollo, CORS acepta cualquier origen (`config/cors.ts`), así que el frontend puede llamar a `http://localhost:3333` directamente: Vite no tiene proxy configurado.

### Contrato de auth (lo que el ticket de producto no dice)

| Ruta | Body | Respuesta |
|---|---|---|
| `POST /api/v1/auth/signup` | `email`, `password` (8-32 caracteres), **`passwordConfirmation`** (igual a `password`), `fullName` opcional (nullable) | `{ data: { user, token } }` |
| `POST /api/v1/auth/login` | `email`, `password` | `{ data: { user, token } }` |
| `GET /api/v1/account/profile` | requiere Bearer | `{ data: user }` |
| `POST /api/v1/account/logout` | requiere Bearer | `{ message }` |

Las reglas están en `app/validators/user.ts`. Ahí se ve que el email es único en signup, y que si ya existe es la validación de VineJS la que falla (422), no la base de datos. Si las credenciales del login son inválidas, la respuesta la genera `User.verifyCredentials` (error de credenciales de `@adonisjs/auth`). Para saber la forma exacta del error, consulta el validador o la respuesta real; no la supongas.

## Harness de Claude Code en este repo

- Skills: `/priority-ticket` (trae de Jira el ticket de mayor prioridad que tienes asignado y entra en plan mode) y `/commit` (commit convencional a partir de los cambios preparados).
- Subagente: `adversarial-reviewer` (`.claude/agents/`): revisa un PR intentando romperlo, sin editar nada.
- Jira se usa a través del conector MCP de Atlassian.

## Reglas de proceso
- Antes de tocar código: crear una rama nueva (`git checkout -b feat/<slug>`). Nunca
commitear directo en `main`/`s1/start`.
- Al cerrar la tarea: usar la skill `/commit`, luego `gh pr create` con una descripción
completa de los cambios en el cuerpo del PR.
- Después de abrir el PR: usar el subagente `adversarial-reviewer` sobre él, antes de
darlo por terminado.
- No repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo
con la URL del PR.
