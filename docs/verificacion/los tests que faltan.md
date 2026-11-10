# Los tests que faltan

Registro de lo que salió desde la petición:

> Escribe un test para cada scenario que en la Matriz de Trazabilidad tenga Estado "No lo sé" siguiendo el estilo de los que ya hay en backend/tests/functional/auth/. La Matriz de Trazabilidad se encuentra en docs/verificacion/HR.md. Los test grabalos en backend/tests/functional/tasks/. No toques nada fuera de backend/tests/.

PR: https://github.com/humbertoenGit/flowsync-ai4devs-202610-ro/pull/2

## Tests escritos

Fichero: `backend/tests/functional/tasks/assignee.spec.ts`. Hay un test por cada scenario «No lo sé» del requisito «Lo que cada tarea muestra de su responsable». Los tres comprueban la tarea suelta (`GET /api/v1/tasks/:id`) y también la lista (`GET /api/v1/tasks`).

| Scenario | Test | Resultado |
|---|---|---|
| Responsable identificable | `el responsable llega con su nombre y sus iniciales` | ✅ verde |
| La tarea no filtra datos de cuenta | `el responsable no trae el email ni datos de acceso, ni suelto ni en la lista` | ❌ rojo |
| Responsable sin nombre | `un responsable sin nombre llega con el nombre nulo y con iniciales` | ✅ verde |

## El test en rojo es un defecto real

La tarea suelta no expone el email del responsable: la serializa `TaskDetailTransformer`, que pasa el responsable por `TaskAssigneeTransformer` (`id`, `fullName`, `initials`).

La lista sí lo expone. Usa `TaskTransformer`, que pasa el responsable por `UserTransformer`, y este incluye `email`. Lo mismo ocurre en `POST /api/v1/tasks` y en `PATCH /api/v1/tasks/:id/status`.

El fallo está en `assignee.spec.ts`:

```
AssertionError: la tarea en la lista expone el email:
expected { id: 9, …(5) } to not have nested property 'email'
```

No se tocó el código ni se aflojó el test. Se entrega en rojo.

## Ejecución

- `node ace test functional --files=tasks/assignee`: 2 tests pasan y 1 falla.
- `node ace test`: 22 tests pasan y 1 falla, el mismo; la suite de `auth` sigue en verde.
- `prettier --check`, `eslint` y `tsc --noEmit` sobre el fichero nuevo salen limpios.

## Decisiones al escribir los tests

- **Quién crea y quién mira.** Las tareas las crea su responsable por la API, y las consulta otra cuenta. Así lo que llega en `assignee` no se confunde con los datos de la propia sesión.
- **Cómo se comprueba «ningún otro dato de acceso».** El `assignee` no tiene la propiedad `email`, y ni el email ni la contraseña (ni la palabra `password`) aparecen en el `assignee` serializado. No se fija la lista exacta de claves, para no prohibir el `id`, que la spec no menciona.
- **Las iniciales del responsable sin nombre.** Se exige que sean un texto no vacío, pero no se fija su valor: la regla que las deriva es de `auth`, no de este requisito.
- **El día de referencia.** La consulta de una tarea suelta exige un `today`, y se fijó en `2026-11-09`. Para este requisito no importa qué día sea.

## Revisión adversarial

No encontró nada que bloquee. Confirmó que el rojo se debe al defecto descrito, que el aislamiento con `withGlobalTransaction` funciona (el resultado es el mismo en ejecuciones repetidas), que el estilo sigue el de `auth/` y que el commit solo toca `backend/tests/`.

Cambio aplicado:

- Al principio, los scenarios «Responsable identificable» y «Responsable sin nombre» solo miraban la tarea suelta. Como el requisito habla de «cada tarea» y la lista tiene su propio transformer, ahora miran las dos lecturas. Ambos siguen en verde.

Cambios no aplicados:

- **Exigir exactamente las claves `id`, `fullName` e `initials`.** La spec no dice si el `id` está permitido.
- **Fijar el valor de las iniciales de la cuenta sin nombre.** Esa regla es de `auth`. Además, el revisor propuso `SI`, y lo que sale de `sin-nombre@example.com` es `SE`.

## Pendiente

La Parte B de `docs/verificacion/HR.md` está editada en local y sin commitear. Sus líneas 2 y 3 dicen que no había tests y que no se llegó a escribir ninguno, y eso ya no es así.
