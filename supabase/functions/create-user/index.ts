import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Cliente con service role para crear usuarios sin hacer login
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar que el usuario actual es master
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser(token)
    
    if (!user) {
      throw new Error('No autorizado')
    }

    // Verificar rol master
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'master') {
      throw new Error('Solo el Master puede crear usuarios')
    }

    const { email, password, fullName, role, clientId } = await req.json()

    // Validaciones
    if (!email || !password || !fullName || !role) {
      throw new Error('Faltan campos requeridos')
    }

    if (role === 'viewer' && !clientId) {
      throw new Error('Debes seleccionar una empresa para el cliente')
    }

    // Crear usuario usando service role (no hace login automático)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      if (createError.message.includes('already registered')) {
        throw new Error('Este correo ya está registrado en el sistema')
      }
      throw createError
    }

    if (!newUser.user) {
      throw new Error('No se pudo crear el usuario')
    }

    // Actualizar perfil con rol y nombre
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: role,
        full_name: fullName 
      })
      .eq('id', newUser.user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error('Error al actualizar el perfil del usuario')
    }

    // Si es viewer, asociar con empresa
    if (role === 'viewer' && clientId) {
      const { error: clientUpdateError } = await supabaseAdmin
        .from('clients')
        .update({ user_id: newUser.user.id })
        .eq('id', clientId)

      if (clientUpdateError) {
        console.error('Error linking client:', clientUpdateError)
        throw new Error('Error al asociar el usuario con la empresa')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
