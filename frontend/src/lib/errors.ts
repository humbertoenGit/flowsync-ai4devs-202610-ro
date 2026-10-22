import { ApiError, NETWORK_ERROR_STATUS } from './api'

/**
 * Mensaje para errores que no tienen un tratamiento específico en la pantalla.
 */
export function genericErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === NETWORK_ERROR_STATUS) {
    return 'No se pudo conectar con el servidor. Comprueba que el backend está levantado e inténtalo de nuevo.'
  }
  return 'Algo ha fallado. Inténtalo de nuevo en unos segundos.'
}
