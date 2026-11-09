import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, que la tarea no
 * filtre datos de la cuenta, y el responsable sin nombre.
 *
 * Las tareas se crean por la API y no con el modelo: así el responsable lo pone
 * el sistema, como en la realidad. Quien las mira es otra cuenta, para que lo que
 * llega en `assignee` no se confunda con los datos de la propia sesión.
 *
 * El requisito habla de «cada tarea», y la tarea suelta y la lista tienen cada
 * una su propio transformer, así que todos los scenarios se comprueban en las dos.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const today = '2026-11-09'

  async function sesion(client: any, fullName: string | null, email: string) {
    await User.create({ fullName, email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(client: any, token: string) {
    const response = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    response.assertStatus(201)
    return response.body().data.id as number
  }

  /**
   * El responsable de la tarea `id` tal y como llega en las dos lecturas: la
   * tarea suelta y la tarea dentro de la lista.
   */
  async function responsables(client: any, token: string, id: number) {
    const suelta = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today })
      .header('Authorization', `Bearer ${token}`)

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    const enLaLista = (lista.body().data as any[]).find((tarea) => tarea.id === id)

    return [
      ['suelta', suelta.body().data.assignee],
      ['en la lista', enLaLista?.assignee],
    ] as Array<[string, any]>
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const ada = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const alan = await sesion(client, 'Alan Turing', 'alan@example.com')
    const id = await tareaDe(client, ada)

    for (const [donde, assignee] of await responsables(client, alan, id)) {
      assert.exists(assignee, `la tarea ${donde} no trae responsable`)
      assert.equal(assignee.fullName, 'Ada Lovelace', `la tarea ${donde} no trae el nombre`)
      assert.equal(assignee.initials, 'AL', `la tarea ${donde} no trae las iniciales`)
    }
  })

  test('el responsable no trae el email ni datos de acceso, ni suelto ni en la lista', async ({
    client,
    assert,
  }) => {
    const ada = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const alan = await sesion(client, 'Alan Turing', 'alan@example.com')
    const id = await tareaDe(client, ada)

    for (const [donde, assignee] of await responsables(client, alan, id)) {
      assert.exists(assignee, `la tarea ${donde} no trae responsable`)

      const serialized = JSON.stringify(assignee)
      assert.notProperty(assignee, 'email', `la tarea ${donde} expone el email`)
      assert.notInclude(serialized, 'ada@example.com', `la tarea ${donde} expone el email`)
      assert.notInclude(serialized, 'password', `la tarea ${donde} expone la contraseña`)
      assert.notInclude(serialized, 'secreto123', `la tarea ${donde} expone la contraseña`)
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const sinNombre = await sesion(client, null, 'sin-nombre@example.com')
    const alan = await sesion(client, 'Alan Turing', 'alan@example.com')
    const id = await tareaDe(client, sinNombre)

    for (const [donde, assignee] of await responsables(client, alan, id)) {
      assert.exists(assignee, `la tarea ${donde} no trae responsable`)
      assert.property(assignee, 'fullName', `la tarea ${donde} no trae el campo del nombre`)
      assert.isNull(assignee.fullName, `en la tarea ${donde} el nombre no llega nulo`)
      assert.isString(assignee.initials, `la tarea ${donde} no trae las iniciales`)
      assert.isNotEmpty(assignee.initials, `la tarea ${donde} trae las iniciales vacías`)
    }
  })
})
