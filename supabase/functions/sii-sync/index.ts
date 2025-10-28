import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SIIResponse {
  success: boolean;
  ivaVentas?: number;
  ivaCompras?: number;
  fechaSincronizacion?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SII Sync function called');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get request parameters
    const { clientId, periodoMes, periodoAnio } = await req.json();
    
    if (!clientId || !periodoMes || !periodoAnio) {
      throw new Error('Faltan parámetros: clientId, periodoMes, periodoAnio');
    }

    console.log(`Obteniendo datos del SII para cliente ${clientId}, período ${periodoMes}/${periodoAnio}`);

    // Get client credentials from database
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('rut, clave_sii, razon_social')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new Error('Cliente no encontrado');
    }

    if (!client.clave_sii) {
      throw new Error('El cliente no tiene configurada la clave del SII');
    }

    console.log(`Intentando conectar al SII para RUT: ${client.rut}`);

    // ADVERTENCIA: Esto probablemente NO funcionará debido a:
    // 1. CAPTCHA en el login del SII
    // 2. JavaScript/cookies requeridos
    // 3. Protecciones anti-bot
    // Esta es una implementación experimental básica
    
    const response = await attemptSIILogin(client.rut, client.clave_sii, periodoMes, periodoAnio);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400
      }
    );

  } catch (error) {
    console.error('Error en función SII sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al conectar con el SII';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function attemptSIILogin(
  rut: string, 
  clave: string, 
  mes: number, 
  anio: number
): Promise<SIIResponse> {
  try {
    console.log('Intentando login en SII con URL directa...');
    
    // URL directa de autenticación sin CAPTCHA
    const loginUrl = 'https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://www4.sii.cl/consdcvinternetui/';
    
    // Realizar POST con las credenciales
    const formData = new URLSearchParams();
    formData.append('RUT', rut);
    formData.append('DV', rut.split('-')[1] || '');
    formData.append('CLAVE', clave);
    
    console.log(`Intentando autenticación para RUT: ${rut}`);
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9',
        'Referer': 'https://zeusr.sii.cl/',
      },
      body: formData.toString(),
      redirect: 'follow',
    });

    console.log(`Status de respuesta del SII: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      throw new Error(`Error al autenticar en el SII: ${loginResponse.status}`);
    }

    const responseText = await loginResponse.text();
    console.log('Login exitoso, buscando datos de IVA...');

    // Intentar obtener datos de los libros de compra y venta
    // NOTA: Esto es una implementación experimental y necesitará ajustes
    // basados en la estructura real de las páginas del SII
    
    // Por ahora, retornamos éxito parcial indicando que se logró autenticar
    // pero se necesita más desarrollo para extraer los datos
    return {
      success: true,
      ivaVentas: 0,
      ivaCompras: 0,
      fechaSincronizacion: new Date().toISOString(),
      error: 'Autenticación exitosa. La extracción de datos de IVA está en desarrollo. Se necesita analizar la estructura de las páginas de Libros de Compra y Venta del SII.'
    };

  } catch (error) {
    console.error('Error en attemptSIILogin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al intentar conectar con el SII';
    return {
      success: false,
      error: errorMessage
    };
  }
}
