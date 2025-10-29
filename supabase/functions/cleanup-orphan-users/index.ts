import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para decodificar JWT sin verificar firma
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded
  } catch (error) {
    console.error('Error decoding JWT:', error)
    throw new Error('Invalid token')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente con SERVICE_ROLE_KEY para todas las operaciones
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticación del usuario que hace la petición
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    console.log('Decoding JWT token...')
    const payload = decodeJWT(token)
    const userId = payload.sub
    
    if (!userId) {
      console.error('No user ID in token')
      throw new Error('Invalid token: no user ID')
    }

    console.log('User ID from token:', userId)

    // Verificar que el usuario tenga rol master
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw new Error('Error fetching user profile')
    }

    if (!profile) {
      console.error('Profile not found for user:', userId)
      throw new Error('Profile not found')
    }

    console.log('User profile:', profile.email, 'Role:', profile.role)

    if (profile.role !== 'master') {
      console.error('User does not have master role:', profile.role)
      throw new Error('Unauthorized: Only master can cleanup orphan users')
    }

    console.log('User has master role, proceeding with cleanup...')

    // Obtener todos los usuarios de auth
    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }

    console.log(`Found ${authUsers.length} auth users`)

    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    const profileIds = new Set(profiles?.map(p => p.id) || [])
    console.log(`Found ${profileIds.size} profiles`)

    // Encontrar usuarios huérfanos (en auth pero no en profiles)
    const orphanUsers = authUsers.filter(authUser => !profileIds.has(authUser.id))
    
    console.log(`Found ${orphanUsers.length} orphan users`)

    const deletedUsers = []

    // Eliminar usuarios huérfanos
    for (const orphanUser of orphanUsers) {
      console.log(`Deleting orphan user: ${orphanUser.email} (${orphanUser.id})`)
      
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphanUser.id)
      
      if (deleteError) {
        console.error(`Error deleting user ${orphanUser.email}:`, deleteError)
      } else {
        deletedUsers.push({
          id: orphanUser.id,
          email: orphanUser.email
        })
        console.log(`Successfully deleted user: ${orphanUser.email}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${deletedUsers.length} orphan users`,
        deletedUsers 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in cleanup-orphan-users function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
