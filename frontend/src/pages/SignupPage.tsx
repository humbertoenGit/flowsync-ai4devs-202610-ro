import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/auth/context'
import { AuthCard } from '@/components/AuthCard'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { ApiError, signup } from '@/lib/api'
import { genericErrorMessage } from '@/lib/errors'

// Mismos límites que passwordValidator en backend/app/validators/user.ts
const PASSWORD_MIN = 8
const PASSWORD_MAX = 32

type FieldErrors = {
  email?: string
  password?: string
  passwordConfirmation?: string
}

function validate(
  email: string,
  password: string,
  passwordConfirmation: string,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Introduce un email válido.'
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`
  }
  if (passwordConfirmation !== password) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  }
  return errors
}

/**
 * Traduce los errores de VineJS (422) a mensajes para cada campo.
 */
function fieldErrorsFromApi(error: ApiError): FieldErrors {
  const errors: FieldErrors = {}
  const email = error.fieldError('email')
  if (email) {
    errors.email =
      email.rule === 'database.unique'
        ? 'Ya existe una cuenta con ese email. Inicia sesión o usa otro.'
        : 'Introduce un email válido.'
  }
  if (error.fieldError('password')) {
    errors.password = `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`
  }
  if (error.fieldError('passwordConfirmation')) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  }
  return errors
}

export function SignupPage() {
  const navigate = useNavigate()
  const { setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = validate(email, password, passwordConfirmation)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    try {
      const { token } = await signup({ email, password, passwordConfirmation })
      setToken(token)
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const apiErrors = fieldErrorsFromApi(error)
        setFieldErrors(apiErrors)
        if (Object.keys(apiErrors).length === 0) {
          setFormError('Revisa los datos del formulario.')
        }
      } else {
        setFormError(genericErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Crear cuenta"
      description="Regístrate con tu email y una contraseña."
      error={formError}
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary underline">
            Inicia sesión
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
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          id="passwordConfirmation"
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={fieldErrors.passwordConfirmation}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthCard>
  )
}
