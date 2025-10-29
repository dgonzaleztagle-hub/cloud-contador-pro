import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
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
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verificar que el usuario tenga rol master
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'master') {
      throw new Error('Unauthorized: Only master can cleanup orphan users')
    }

    console.log('Starting orphan user cleanup...')

    // Obtener todos los usuarios de auth
    const { data: { users: authUsers }, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }

    console.log(`Found ${authUsers.length} auth users`)

    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabaseClient
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
      
      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(orphanUser.id)
      
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
