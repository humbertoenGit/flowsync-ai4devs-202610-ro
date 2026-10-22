const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

/**
 * Lo que devuelve UserTransformer en el backend.
 */
export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string | null
  initials: string
}

type AuthPayload = { user: User; token: string }

/**
 * Forma de los errores del backend: VineJS (422) devuelve `field` y `rule`;
 * las credenciales inválidas (400) solo `message`.
 */
export type ApiFieldError = { message: string; field?: string; rule?: string }

export class ApiError extends Error {
  status: number
  errors: ApiFieldError[]

  constructor(status: number, errors: ApiFieldError[]) {
    super(errors[0]?.message ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  fieldError(field: string) {
    return this.errors.find((error) => error.field === field)
  }
}

/**
 * Status 0: no hubo respuesta del servidor (red caída o backend apagado).
 */
export const NETWORK_ERROR_STATUS = 0

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, [{ message: 'Network error' }])
  }

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    const errors = Array.isArray(json?.errors) ? json.errors : []
    throw new ApiError(response.status, errors)
  }

  // ctx.serialize() envuelve las respuestas en { data }; logout no lo hace.
  return (json && 'data' in json ? json.data : json) as T
}

export function signup(input: {
  email: string
  password: string
  passwordConfirmation: string
  fullName?: string | null
}) {
  // El validador define fullName como nullable pero no optional: la clave tiene
  // que viajar aunque sea null, o el backend responde 422.
  return request<AuthPayload>('/auth/signup', {
    method: 'POST',
    body: { ...input, fullName: input.fullName ?? null },
  })
}

export function login(input: { email: string; password: string }) {
  return request<AuthPayload>('/auth/login', { method: 'POST', body: input })
}

export function getProfile(token: string) {
  return request<User>('/account/profile', { token })
}

export function logout(token: string) {
  return request<{ message: string }>('/account/logout', {
    method: 'POST',
    token,
  })
}
