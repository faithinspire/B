import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type ServiceInput = {
  name: string
  description?: string
  category: 'box_braids' | 'knotless' | 'cornrows' | 'locs' | 'twists' | 'kids' | 'other'
  duration_minutes: number
  price: number
}

export async function addService(input: ServiceInput, braiderId: string) {
  const supabase = createClientComponentClient()

  // ── Guard: make sure auth session exists ────────────────
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be logged in to add a service')
  if (session.user.id !== braiderId) throw new Error('Unauthorized')

  // ── Ensure braider_profiles row exists ────────────────
  const { error: profileError } = await supabase
    .from('braider_profiles')
    .upsert({ user_id: braiderId, id: `braider_${braiderId}` }, { onConflict: 'user_id' })

  if (profileError) {
    console.error('Profile upsert error:', profileError)
    // Don't fail - continue with service insert
  }

  // ── Call API route to insert service (uses service role) ───
  try {
    const response = await fetch('/api/services/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        braider_id: braiderId,
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        category: input.category,
        duration_minutes: input.duration_minutes,
        price: input.price,
        is_active: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add service')
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}
