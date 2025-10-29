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
      throw new Error('Unauthorized: Only master can delete users')
    }

    // Obtener el ID o email del usuario a eliminar
    const { userId, email } = await req.json()

    if (!userId && !email) {
      throw new Error('User ID or email is required')
    }

    let userIdToDelete = userId

    // Si se proporcionó email, buscar el ID del usuario
    if (!userIdToDelete && email) {
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
      
      if (listError) throw listError
      
      const userToDelete = users.find(u => u.email === email)
      if (!userToDelete) {
        throw new Error(`User with email ${email} not found`)
      }
      userIdToDelete = userToDelete.id
    }

    // No permitir que el usuario se elimine a sí mismo
    if (userIdToDelete === user.id) {
      throw new Error('Cannot delete your own account')
    }

    // Eliminar el usuario de auth.users (esto también eliminará el perfil por la cascade)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
