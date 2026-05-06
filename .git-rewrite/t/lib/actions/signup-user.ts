export async function signupUser(data: {
  email: string
  password: string
  full_name: string
  role: 'braider' | 'customer' | 'admin'
}) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }

    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}
