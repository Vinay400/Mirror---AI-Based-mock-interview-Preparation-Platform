const FALLBACK = 'Something went wrong.'

// Pulls a human-readable message out of an axios error, matching the shapes the
// backend actually returns: { message } for handled cases, { error } for 500s.
export const getApiErrorMessage = (error, fallback = FALLBACK) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error instanceof Error ? error.message : null) ||
    fallback
  )
}

// The backend tags some failures with a machine-readable code so the UI can
// offer the right next step (e.g. resend a verification email).
export const getApiErrorCode = (error) => error?.response?.data?.code || null
