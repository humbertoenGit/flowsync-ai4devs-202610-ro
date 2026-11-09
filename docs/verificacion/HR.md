# Matriz de Trazabilidad

**Requisito:** Lo que cada tarea muestra de su responsable

**Scenarios en el requisito:** 3 &nbsp;&nbsp; **Cubiertos:** 0

| Scenario | Test | Estado | Qué Faltó |
|---|---|---|---|
| Responsable identificable | — | No lo sé | No encontré dónde se comprueba. Ningún test pide una tarea ni mira su `assignee`. Hay uno parecido que no prueba lo mismo: `initials.spec.ts` › «un nombre de dos palabras da la inicial de cada una» comprueba que "Ada Lovelace" da `AL`, pero en `data.user` de la respuesta de `POST /api/v1/auth/login`, no en el `assignee` de una tarea. |
| La tarea no filtra datos de cuenta | — | No lo sé | No encontré dónde se comprueba. El test más cercano dice otra cosa: `signup.spec.ts` › «la contraseña nunca sale en la respuesta» comprueba que el usuario serializado del registro no contiene la contraseña. No mira el email (que sí sale ahí, y es correcto para el perfil), no mira el `assignee` y no cubre ni una tarea suelta ni una de la lista. |
| Responsable sin nombre | — | No lo sé | Hay dos tests parecidos, pero ninguno habla de tareas. `signup.spec.ts` › «una cuenta puede quedarse sin nombre» comprueba que `fullName` llega nulo en el usuario registrado, y `initials.spec.ts` › «sin nombre, las iniciales salen del email» comprueba que salen las iniciales `AE` en el login. Ninguno lo verifica en el `assignee` de una tarea. |

## Fuentes

- Requisito y scenarios: `openspec/specs/tasks/spec.md`, sección «Requirement: Lo que cada tarea muestra de su responsable».
- Tests revisados: todo `backend/tests/functional/`. Solo hay cuatro ficheros, todos de `auth/`: `initials.spec.ts`, `login.spec.ts`, `session.spec.ts` y `signup.spec.ts`.

## Notas

- Se usa «No lo sé» en los tres scenarios porque el criterio de la matriz lo reserva para los casos en que no se encontró un test que los cubra. En realidad no hay ninguno: buscar `tasks` o `assignee` en todo `backend/tests` no da resultados, así que los tres podrían marcarse también «No cubierto».
- Para cerrar el hueco haría falta una suite functional de `tasks` que:
  1. Cree una tarea a nombre de "Ada Lovelace" y compruebe `assignee.fullName` y `assignee.initials` (`AL`).
  2. Compruebe que `assignee` no trae `email` ni otros datos de acceso, tanto en la consulta de una tarea suelta como en la lista.
  3. Cree una tarea a nombre de una cuenta sin nombre y compruebe que `assignee.fullName` es `null` y `assignee.initials` sigue llegando.
