import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchUF(): Promise<string> {
  try {
    console.log('Fetching UF...');
    const response = await fetch('https://www.sii.cl/valores_y_fechas/uf/uf2025.htm');
    const html = await response.text();
    console.log('UF HTML fetched, length:', html.length);
    
    // Obtener el día actual
    const today = new Date();
    const day = today.getDate();
    console.log('Looking for UF for day:', day);
    
    // Buscar el valor de UF del día actual en la tabla de Octubre (mes actual)
    // El formato en el HTML es: <th width="40"><strong>21</strong></th><td width="200">39.546,71</td>
    const monthPattern = /<h2>Octubre<\/h2>[\s\S]*?<\/table>/;
    const monthMatch = html.match(monthPattern);
    
    if (!monthMatch) {
      console.error('No se encontró la tabla de Octubre');
      return '0';
    }
    
    console.log('Found Octubre table');
    const monthTable = monthMatch[0];
    const dayPattern = new RegExp(`<th[^>]*><strong>${day}</strong></th>\\s*<td[^>]*>([\\d.,]+)</td>`);
    const match = monthTable.match(dayPattern);
    
    if (match && match[1]) {
      console.log('UF found:', match[1]);
      return match[1];
    }
    
    console.error('No se encontró el valor de UF para el día', day);
    return '0';
  } catch (error) {
    console.error('Error fetching UF:', error);
    return '0';
  }
}

async function fetchUTM(): Promise<string> {
  try {
    console.log('Fetching UTM...');
    const response = await fetch('https://www.sii.cl/valores_y_fechas/utm/utm2025.htm');
    const html = await response.text();
    console.log('UTM HTML fetched, length:', html.length);
    
    // Obtener el mes actual (Octubre = 10)
    const today = new Date();
    const month = today.getMonth() + 1;
    
    // Mapear números de mes a nombres en español
    const monthNames = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const monthName = monthNames[month];
    console.log('Looking for UTM for month:', monthName);
    
    // Buscar el valor de UTM del mes actual
    // El formato en el HTML es: <th>Octubre</th><td>69.265</td>
    const pattern = new RegExp(`<th>${monthName}</th>\\s*<td>([\\d.]+)</td>`);
    const match = html.match(pattern);
    
    if (match && match[1]) {
      console.log('UTM found:', match[1]);
      return match[1];
    }
    
    console.error('No se encontró el valor de UTM para', monthName);
    return '0';
  } catch (error) {
    console.error('Error fetching UTM:', error);
    return '0';
  }
}

async function fetchUSD(): Promise<string> {
  try {
    console.log('Fetching USD...');
    const response = await fetch('https://si3.bcentral.cl/Siete/ES/Siete/Cuadro/CAP_TIPO_CAMBIO/MN_TIPO_CAMBIO4/DOLAR_OBS_ADO');
    const html = await response.text();
    console.log('USD HTML fetched, length:', html.length);
    
    // Buscar el último valor disponible en la tabla (última columna con datos)
    // El formato es: <td class="ar col">935,74</td>
    const pattern = /<td class="ar col">([^<]+)<\/td>/g;
    const matches = [...html.matchAll(pattern)];
    console.log('Found USD values:', matches.length);
    
    if (matches.length > 0) {
      // Tomar el último valor que no esté vacío
      for (let i = matches.length - 1; i >= 0; i--) {
        const value = matches[i][1].trim();
        if (value && value !== '' && value !== '&nbsp;') {
          console.log('USD found:', value);
          return value.replace('.', ',');
        }
      }
    }
    
    console.error('No se encontró el valor del dólar');
    return '0';
  } catch (error) {
    console.error('Error fetching USD:', error);
    return '0';
  }
}

serve(async (req) => {
  console.log('Economic indicators function called');
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Fetching all economic indicators...');
    const [uf, utm, usd] = await Promise.all([
      fetchUF(),
      fetchUTM(),
      fetchUSD()
    ]);

    console.log('All indicators fetched:', { uf, utm, usd });

    return new Response(
      JSON.stringify({ uf, utm, usd }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in economic-indicators function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
