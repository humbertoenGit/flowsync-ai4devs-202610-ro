import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/auth/context'
import { AuthCard } from '@/components/AuthCard'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { ApiError, login } from '@/lib/api'
import { genericErrorMessage } from '@/lib/errors'

type FieldErrors = { email?: string; password?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const { token } = await login({ email: email.trim(), password })
      setToken(token)
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFormError('Email o contraseña incorrectos.')
      } else if (error instanceof ApiError && error.status === 422) {
        setFieldErrors({
          email: error.fieldError('email') && 'Introduce un email válido.',
          password: error.fieldError('password') && 'Introduce tu contraseña.',
        })
      } else {
        setFormError(genericErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Entra con tu email y tu contraseña."
      error={formError}
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="font-medium text-primary underline">
            Regístrate
          </Link>
        </p>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthCard>
  )
}
