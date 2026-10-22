import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useAuth } from '@/auth/context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError, getProfile, logout, type User } from '@/lib/api'
import { genericErrorMessage } from '@/lib/errors'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; user: User }
  | { status: 'error'; message: string }

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'long' })

export function ProfilePage() {
  const { token, clearToken } = useAuth()
  const [state, setState] = useState<ProfileState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getProfile(token)
      .then((user) => {
        if (!cancelled) setState({ status: 'ready', user })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Token caducado o revocado: se cierra la sesión y RequireAuth lleva a /login.
        if (error instanceof ApiError && error.status === 401) {
          clearToken()
          return
        }
        setState({ status: 'error', message: genericErrorMessage(error) })
      })

    return () => {
      cancelled = true
    }
  }, [token, clearToken, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      if (token) await logout(token)
    } catch {
      // Aunque el backend no responda, la sesión local se cierra igual.
    } finally {
      clearToken()
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta en FlowSync.</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === 'loading' && (
            <p className="text-sm text-muted-foreground">Cargando perfil…</p>
          )}

          {state.status === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive" role="alert">
                <CircleAlert />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}

          {state.status === 'ready' && (
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                {state.user.initials}
              </div>
              <dl className="grid gap-1 text-sm">
                {state.user.fullName && (
                  <div>
                    <dt className="sr-only">Nombre</dt>
                    <dd className="font-medium">{state.user.fullName}</dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>{state.user.email}</dd>
                </div>
                <div>
                  <dt className="sr-only">Miembro desde</dt>
                  <dd className="text-muted-foreground">
                    Miembro desde{' '}
                    {dateFormatter.format(new Date(state.user.createdAt))}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
