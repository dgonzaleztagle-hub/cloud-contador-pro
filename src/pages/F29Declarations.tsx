import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Plus, Trash2, FileText, Download, Eye, BarChart3, Edit, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
  valor: string | null;
}

interface F29Declaration {
  id: string;
  client_id: string;
  periodo_mes: number;
  periodo_anio: number;
  iva_ventas: number;
  iva_compras: number;
  iva_neto: number;
  ppm: number;
  tasa_ppm: number;
  honorarios: number;
  retencion_2cat: number;
  impuesto_unico: number;
  remanente_anterior: number;
  remanente_proximo: number;
  total_impuestos: number;
  total_general: number;
  observaciones: string | null;
  created_at: string;
  estado_honorarios: string;
  estado_declaracion: string;
  fuera_de_plazo: boolean;
  fecha_limite_declaracion: string | null;
  dias_atraso: number;
  correccion_monetaria: number;
  interes_moratorio: number;
  multa: number;
  total_recargos: number;
  recargos_con_condonacion: number;
  clients?: { rut: string; razon_social: string };
}

export default function F29Declarations() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [declarations, setDeclarations] = useState<F29Declaration[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClearFormAlert, setShowClearFormAlert] = useState(false);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [hasFormData, setHasFormData] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isResumenOpen, setIsResumenOpen] = useState(false);
  const [resumenFilterMes, setResumenFilterMes] = useState(0); // 0 = todos
  const [resumenFilterAnio, setResumenFilterAnio] = useState(new Date().getFullYear());
  
  // Filter state
  const [filterClientId, setFilterClientId] = useState('all');
  const [filterMes, setFilterMes] = useState(0); // 0 = todos
  const [filterAnio, setFilterAnio] = useState(0); // 0 = todos

  // Form state
  const [currentMonthCount, setCurrentMonthCount] = useState<number>(0);
  const [editingDeclarationId, setEditingDeclarationId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [ivaVentas, setIvaVentas] = useState('0');
  const [ivaCompras, setIvaCompras] = useState('0');
  const [ppm, setPpm] = useState('0');
  const [tasaPpm, setTasaPpm] = useState('0');
  const [honorarios, setHonorarios] = useState('0');
  const [retencion2cat, setRetencion2cat] = useState('0');
  const [impuestoUnico, setImpuestoUnico] = useState('0');
  const [remanenteAnterior, setRemanenteAnterior] = useState('0');
  const [observaciones, setObservaciones] = useState('');
  const [estadoHonorarios, setEstadoHonorarios] = useState('pendiente');
  const [estadoDeclaracion, setEstadoDeclaracion] = useState('pendiente');
  const [isSyncingSII, setIsSyncingSII] = useState(false);
  
  // Nuevos campos para declaración fuera de plazo
  const [fueraDePlazo, setFueraDePlazo] = useState(false);
  const [fechaLimite, setFechaLimite] = useState('');
  const [diasAtraso, setDiasAtraso] = useState(0);
  const [correccionMonetaria, setCorreccionMonetaria] = useState(0);
  const [interesMoratorio, setInteresMoratorio] = useState(0);
  const [multaCalculada, setMultaCalculada] = useState(0);
  const [totalRecargos, setTotalRecargos] = useState(0);
  const [recargosConCondonacion, setRecargosConCondonacion] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, rut, razon_social, valor')
      .eq('activo', true)
      .order('razon_social');

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
      });
    } else {
      setClients(clientsData || []);
    }

    const { data: declarationsData, error: declarationsError } = await supabase
      .from('f29_declarations')
      .select('*, clients(rut, razon_social)')
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes', { ascending: false });

    if (declarationsError) {
      console.error('Error loading declarations:', declarationsError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las declaraciones',
      });
    } else {
      setDeclarations(declarationsData || []);
    }

    setLoadingData(false);
  };

  // Calcular y actualizar remanente anterior ajustado por UTM cuando cambia el periodo
  useEffect(() => {
    if (selectedClientId && mes && anio) {
      calcularRemanenteAjustado();
      // Calcular fecha límite para el mes seleccionado (día 12 del mes siguiente)
      const fechaLim = new Date(anio, mes, 12); // mes es 0-indexed en Date, pero mes del form es 1-12
      setFechaLimite(fechaLim.toISOString().split('T')[0]);
    }
  }, [selectedClientId, mes, anio]);

  // Calcular recargos cuando cambian los datos relevantes
  useEffect(() => {
    if (fueraDePlazo && fechaLimite) {
      calcularRecargos();
    } else {
      // Resetear recargos si no está fuera de plazo
      setDiasAtraso(0);
      setCorreccionMonetaria(0);
      setInteresMoratorio(0);
      setMultaCalculada(0);
      setTotalRecargos(0);
      setRecargosConCondonacion(0);
    }
  }, [fueraDePlazo, fechaLimite, ivaVentas, ivaCompras, ppm, honorarios, retencion2cat, impuestoUnico]);

  const calcularRemanenteAjustado = async () => {
    if (!selectedClientId) return;

    try {
      // Buscar declaración del mes anterior para este cliente
      let mesAnterior = mes - 1;
      let anioAnterior = anio;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        anioAnterior--;
      }

      const { data: declaracionAnterior, error: errorDecl } = await supabase
        .from('f29_declarations')
        .select('remanente_proximo')
        .eq('client_id', selectedClientId)
        .eq('periodo_mes', mesAnterior)
        .eq('periodo_anio', anioAnterior)
        .maybeSingle();

      if (errorDecl) {
        console.error('Error buscando declaración anterior:', errorDecl);
        return;
      }

      if (!declaracionAnterior || declaracionAnterior.remanente_proximo === 0) {
        setRemanenteAnterior('0');
        return;
      }

      // Obtener UTM del mes anterior y del mes actual
      const { data: utmAnterior } = await supabase
        .from('utm_mensual')
        .select('valor')
        .eq('mes', mesAnterior)
        .eq('anio', anioAnterior)
        .maybeSingle();

      const { data: utmActual } = await supabase
        .from('utm_mensual')
        .select('valor')
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();

      if (!utmAnterior || !utmActual) {
        // Si no hay UTM, usar el remanente directo
        setRemanenteAnterior(declaracionAnterior.remanente_proximo.toString());
        return;
      }

      // Aplicar fórmula: (Remanente anterior / UTM mes anterior) * UTM mes seleccionado
      const remanenteAjustado = (declaracionAnterior.remanente_proximo / utmAnterior.valor) * utmActual.valor;
      setRemanenteAnterior(Math.round(remanenteAjustado).toString());

    } catch (error) {
      console.error('Error calculando remanente ajustado:', error);
    }
  };

  const calcularRecargos = async () => {
    if (!fechaLimite) return;

    try {
      // Calcular días de atraso
      const hoy = new Date();
      const limite = new Date(fechaLimite);
      const diffTime = hoy.getTime() - limite.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setDiasAtraso(diffDays);

      if (diffDays === 0) {
        setCorreccionMonetaria(0);
        setInteresMoratorio(0);
        setMultaCalculada(0);
        setTotalRecargos(0);
        setRecargosConCondonacion(0);
        return;
      }

      // Calcular el impuesto base (total a pagar)
      const totals = calculateTotals();
      const impuestoBase = totals.totalGeneral;

      if (impuestoBase <= 0) {
        setCorreccionMonetaria(0);
        setInteresMoratorio(0);
        setMultaCalculada(0);
        setTotalRecargos(0);
        setRecargosConCondonacion(0);
        return;
      }

      // 1. Corrección monetaria según tabla SII
      // Determinar el mes que debió declarar (mes + 1 del periodo)
      let mesDebioDeclarar = mes + 1;
      let anioDebio = anio;
      if (mesDebioDeclarar > 12) {
        mesDebioDeclarar = 1;
        anioDebio++;
      }

      // Mes actual en que se declara
      const mesActualDeclaracion = hoy.getMonth() + 1;
      const anioActualDeclaracion = hoy.getFullYear();

      const { data: tasaCorreccion } = await supabase
        .from('correccion_monetaria_sii')
        .select('tasa')
        .eq('anio', anioDebio)
        .eq('mes_debio_declarar', mesDebioDeclarar)
        .eq('mes_declara', mesActualDeclaracion)
        .maybeSingle();

      const tasaCM = tasaCorreccion ? tasaCorreccion.tasa : 0.7; // Default 0.7% si no hay dato
      const correccion = impuestoBase * (tasaCM / 100);
      setCorreccionMonetaria(correccion);

      // 2. Interés moratorio: 0.05% por día
      const interes = impuestoBase * (0.05 / 100) * diffDays;
      setInteresMoratorio(interes);

      // 3. Multa: 10% el primer mes, +2% por cada mes adicional hasta 30%
      const mesesAtraso = Math.ceil(diffDays / 30);
      let porcentajeMulta = 10 + ((mesesAtraso - 1) * 2);
      porcentajeMulta = Math.min(porcentajeMulta, 30); // Máximo 30%
      const multa = impuestoBase * (porcentajeMulta / 100);
      setMultaCalculada(multa);

      // Total de recargos
      const total = correccion + interes + multa;
      setTotalRecargos(total);

      // Aplicar condonación del 70%
      const condonacion = total * 0.30; // Paga solo el 30%
      setRecargosConCondonacion(condonacion);

    } catch (error) {
      console.error('Error calculando recargos:', error);
    }
  };

  const calculateTotals = () => {
    const ventas = parseFloat(ivaVentas) || 0;
    const compras = parseFloat(ivaCompras) || 0;
    const ppmVal = parseFloat(ppm) || 0;
    const honorariosVal = estadoHonorarios === 'pendiente' ? (parseFloat(honorarios) || 0) : 0;
    const retencionVal = parseFloat(retencion2cat) || 0;
    const impuestoVal = parseFloat(impuestoUnico) || 0;
    const remanenteAnt = parseFloat(remanenteAnterior) || 0;

    let totalImpuestos = 0;
    let remanenteProx = 0;
    let ivaNeto = 0;

    if (ventas === 0 && compras > 0) {
      remanenteProx = compras + remanenteAnt;
      totalImpuestos = retencionVal + impuestoVal;
      ivaNeto = 0;
    } else if (ventas > 0) {
      const diferencia = ventas - compras;
      
      if (diferencia < 0) {
        remanenteProx = Math.abs(diferencia) + remanenteAnt;
        totalImpuestos = retencionVal + impuestoVal + ppmVal;
        ivaNeto = 0;
      } else {
        const diferenciaConRemanente = diferencia - remanenteAnt;
        
        if (diferenciaConRemanente > 0) {
          totalImpuestos = diferenciaConRemanente + ppmVal + retencionVal + impuestoVal;
          remanenteProx = 0;
          ivaNeto = diferencia;
        } else {
          remanenteProx = Math.abs(diferenciaConRemanente);
          totalImpuestos = ppmVal + retencionVal + impuestoVal;
          ivaNeto = diferencia;
        }
      }
    }

    // Sumar recargos si está fuera de plazo
    const totalConRecargos = totalImpuestos + (fueraDePlazo ? recargosConCondonacion : 0);
    const totalGeneral = totalConRecargos + honorariosVal;

    return {
      ivaNeto,
      totalImpuestos,
      totalGeneral,
      remanenteProximo: remanenteProx,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Por favor inicia sesión nuevamente',
      });
      navigate('/auth');
      return;
    }

    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un cliente',
      });
      return;
    }

    setIsSaving(true);
    const totals = calculateTotals();

    const declarationData = {
      client_id: selectedClientId,
      periodo_mes: mes,
      periodo_anio: anio,
      iva_ventas: parseFloat(ivaVentas) || 0,
      iva_compras: parseFloat(ivaCompras) || 0,
      iva_neto: totals.ivaNeto,
      ppm: parseFloat(ppm) || 0,
      tasa_ppm: parseFloat(tasaPpm) || 0,
      honorarios: parseFloat(honorarios) || 0,
      retencion_2cat: parseFloat(retencion2cat) || 0,
      impuesto_unico: parseFloat(impuestoUnico) || 0,
      remanente_anterior: parseFloat(remanenteAnterior) || 0,
      remanente_proximo: totals.remanenteProximo,
      total_impuestos: totals.totalImpuestos,
      total_general: totals.totalGeneral,
      observaciones: observaciones || null,
      estado_honorarios: estadoHonorarios,
      estado_declaracion: estadoDeclaracion,
      fuera_de_plazo: fueraDePlazo,
      fecha_limite_declaracion: fechaLimite || null,
      dias_atraso: diasAtraso,
      correccion_monetaria: correccionMonetaria,
      interes_moratorio: interesMoratorio,
      multa: multaCalculada,
      total_recargos: totalRecargos,
      recargos_con_condonacion: recargosConCondonacion,
    };

    let error;
    if (editingDeclarationId) {
      const result = await supabase
        .from('f29_declarations')
        .update(declarationData)
        .eq('id', editingDeclarationId);
      error = result.error;
    } else {
      const result = await supabase
        .from('f29_declarations')
        .insert({ ...declarationData, created_by: user.id });
      error = result.error;
    }

    if (error) {
      console.error('Error guardando F29:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || (editingDeclarationId ? 'No se pudo actualizar la declaración' : 'No se pudo guardar la declaración'),
      });
      setIsSaving(false);
      return;
    }

    // Sincronizar con el módulo de honorarios
    await syncHonorarios(selectedClientId, mes, anio, parseFloat(honorarios) || 0, estadoHonorarios);

    toast({
      title: editingDeclarationId ? 'Declaración actualizada' : 'Declaración guardada',
      description: editingDeclarationId ? 'La declaración F29 y honorarios se actualizaron exitosamente' : 'La declaración F29 y honorarios se guardaron exitosamente',
    });
    resetForm();
    setIsDialogOpen(false);
    loadData();
    setIsSaving(false);
  };

  const syncHonorarios = async (clientId: string, mes: number, anio: number, montoHonorarios: number, estado: string) => {
    try {
      // Verificar si ya existe un registro de honorarios para este cliente y período
      const { data: existingHonorario, error: checkError } = await supabase
        .from('honorarios')
        .select('*')
        .eq('client_id', clientId)
        .eq('periodo_mes', mes)
        .eq('periodo_anio', anio)
        .maybeSingle();

      if (checkError) {
        console.error('Error verificando honorarios:', checkError);
        return;
      }

      const honorarioData = {
        client_id: clientId,
        periodo_mes: mes,
        periodo_anio: anio,
        monto: montoHonorarios,
        estado: estado === 'pagado' ? 'pagado' : 'pendiente',
        monto_pagado: estado === 'pagado' ? montoHonorarios : 0,
        fecha_pago: estado === 'pagado' ? new Date().toISOString().split('T')[0] : null,
      };

      if (existingHonorario) {
        // Actualizar solo si el estado cambió desde F29
        const { error: updateError } = await supabase
          .from('honorarios')
          .update({
            estado: honorarioData.estado,
            monto_pagado: honorarioData.monto_pagado,
            fecha_pago: honorarioData.fecha_pago,
          })
          .eq('id', existingHonorario.id);

        if (updateError) {
          console.error('Error actualizando honorarios:', updateError);
        }
      } else if (montoHonorarios > 0) {
        // Crear nuevo registro solo si hay monto
        const { error: insertError } = await supabase
          .from('honorarios')
          .insert(honorarioData);

        if (insertError) {
          console.error('Error creando honorarios:', insertError);
        }
      }
    } catch (error) {
      console.error('Error en syncHonorarios:', error);
    }
  };

  const resetForm = () => {
    setEditingDeclarationId(null);
    setSelectedClientId('');
    setMes(new Date().getMonth() + 1);
    setAnio(new Date().getFullYear());
    setIvaVentas('0');
    setIvaCompras('0');
    setPpm('0');
    setTasaPpm('0');
    setHonorarios('0');
    setRetencion2cat('0');
    setImpuestoUnico('0');
    setRemanenteAnterior('0');
    setObservaciones('');
    setEstadoHonorarios('pendiente');
    setEstadoDeclaracion('pendiente');
    setFueraDePlazo(false);
    setFechaLimite('');
    setDiasAtraso(0);
    setCorreccionMonetaria(0);
    setInteresMoratorio(0);
    setMultaCalculada(0);
    setTotalRecargos(0);
    setRecargosConCondonacion(0);
    setHasFormData(false);
  };

  const syncWithSII = async () => {
    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un cliente primero',
      });
      return;
    }

    setIsSyncingSII(true);
    
    try {
      console.log('Sincronizando con SII...');
      
      const { data, error } = await supabase.functions.invoke('sii-sync', {
        body: {
          clientId: selectedClientId,
          periodoMes: mes,
          periodoAnio: anio,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Si hay valores reales (no son 0), actualizamos los campos
        if (data.ivaVentas && data.ivaVentas > 0) {
          setIvaVentas(data.ivaVentas.toString());
        }
        if (data.ivaCompras && data.ivaCompras > 0) {
          setIvaCompras(data.ivaCompras.toString());
        }
        
        // Si hay un mensaje de error, mostrarlo como advertencia
        if (data.error) {
          toast({
            variant: 'default',
            title: 'Autenticación exitosa',
            description: data.error,
          });
        } else {
          toast({
            title: 'Sincronización exitosa',
            description: `IVA Ventas: $${data.ivaVentas?.toLocaleString() || '0'} | IVA Compras: $${data.ivaCompras?.toLocaleString() || '0'}`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'No se pudo sincronizar',
          description: data.error || 'El SII no respondió correctamente.',
        });
      }
    } catch (error) {
      console.error('Error syncing with SII:', error);
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: 'No se pudo conectar con el SII. Esta es una limitación esperada - el SII requiere CAPTCHA y navegación compleja.',
      });
    } finally {
      setIsSyncingSII(false);
    }
  };

  const checkExistingDeclaration = async (clientId: string, month: number, year: number) => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('f29_declarations')
      .select('*')
      .eq('client_id', clientId)
      .eq('periodo_mes', month)
      .eq('periodo_anio', year)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing declaration:', error);
      return;
    }

    if (data) {
      setEditingDeclarationId(data.id);
      setIvaVentas(data.iva_ventas.toString());
      setIvaCompras(data.iva_compras.toString());
      setPpm(data.ppm.toString());
      setTasaPpm(data.tasa_ppm?.toString() || '0');
      setHonorarios(data.honorarios.toString());
      setRetencion2cat(data.retencion_2cat.toString());
      setImpuestoUnico(data.impuesto_unico.toString());
      setRemanenteAnterior(data.remanente_anterior.toString());
      setObservaciones(data.observaciones || '');
      setEstadoHonorarios(data.estado_honorarios);
      setEstadoDeclaracion(data.estado_declaracion || 'pendiente');
      setHasFormData(true);
      
      toast({
        title: 'Declaración existente',
        description: 'Se cargó la declaración existente para este período',
      });
    } else {
      setEditingDeclarationId(null);
      setIvaVentas('0');
      setIvaCompras('0');
      setPpm('0');
      setTasaPpm('0');
      setRetencion2cat('0');
      setImpuestoUnico('0');
      setRemanenteAnterior('0');
      setObservaciones('');
      setEstadoHonorarios('pendiente');
      setEstadoDeclaracion('pendiente');
      setHasFormData(false);
      
      if (estadoHonorarios === 'pendiente') {
        const client = clients.find(c => c.id === clientId);
        if (client?.valor) {
          setHonorarios(client.valor);
        } else {
          setHonorarios('0');
        }
      } else {
        setHonorarios('0');
      }
    }
  };

  const checkIfFormHasData = () => {
    return (
      ivaVentas !== '0' ||
      ivaCompras !== '0' ||
      ppm !== '0' ||
      honorarios !== '0' ||
      retencion2cat !== '0' ||
      impuestoUnico !== '0' ||
      remanenteAnterior !== '0' ||
      observaciones !== ''
    );
  };

  const handleClientChange = async (newClientId: string) => {
    const hasData = checkIfFormHasData();
    
    if (hasData && selectedClientId && !editingDeclarationId) {
      setPendingClientId(newClientId);
      setShowClearFormAlert(true);
    } else {
      setSelectedClientId(newClientId);
      checkExistingDeclaration(newClientId, mes, anio);
      
      // Contar declaraciones acumuladas hasta el mes actual para este cliente
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { count } = await supabase
        .from('f29_declarations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', newClientId)
        .eq('periodo_anio', currentYear)
        .lte('periodo_mes', currentMonth);
      
      setCurrentMonthCount(count || 0);
    }
  };

  const handlePeriodChange = (newMes: number, newAnio: number) => {
    setMes(newMes);
    setAnio(newAnio);
    if (selectedClientId) {
      checkExistingDeclaration(selectedClientId, newMes, newAnio);
    }
  };

  const confirmClientChange = () => {
    if (pendingClientId) {
      setSelectedClientId(pendingClientId);
      checkExistingDeclaration(pendingClientId, mes, anio);
      setPendingClientId(null);
    }
    setShowClearFormAlert(false);
  };

  const cancelClientChange = () => {
    setPendingClientId(null);
    setShowClearFormAlert(false);
  };

  const handleEdit = (declaration: F29Declaration) => {
    setEditingDeclarationId(declaration.id);
    setSelectedClientId(declaration.client_id);
    setMes(declaration.periodo_mes);
    setAnio(declaration.periodo_anio);
    setIvaVentas(declaration.iva_ventas.toString());
    setIvaCompras(declaration.iva_compras.toString());
    setPpm(declaration.ppm.toString());
    setTasaPpm(declaration.tasa_ppm?.toString() || '0');
    setHonorarios(declaration.honorarios.toString());
    setRetencion2cat(declaration.retencion_2cat.toString());
    setImpuestoUnico(declaration.impuesto_unico.toString());
    setRemanenteAnterior(declaration.remanente_anterior.toString());
    setObservaciones(declaration.observaciones || '');
    setEstadoHonorarios(declaration.estado_honorarios);
    setEstadoDeclaracion(declaration.estado_declaracion);
    setFueraDePlazo(declaration.fuera_de_plazo || false);
    setFechaLimite(declaration.fecha_limite_declaracion || '');
    setDiasAtraso(declaration.dias_atraso || 0);
    setCorreccionMonetaria(declaration.correccion_monetaria || 0);
    setInteresMoratorio(declaration.interes_moratorio || 0);
    setMultaCalculada(declaration.multa || 0);
    setTotalRecargos(declaration.total_recargos || 0);
    setRecargosConCondonacion(declaration.recargos_con_condonacion || 0);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta declaración?')) {
      const { error } = await supabase.from('f29_declarations').delete().eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar la declaración',
        });
      } else {
        toast({
          title: 'Declaración eliminada',
          description: 'La declaración se eliminó exitosamente',
        });
        loadData();
      }
    }
  };

  const exportToPDF = async (declaration: F29Declaration) => {
    const doc = new jsPDF();
    
    // Logo (si está disponible)
    try {
      const logoImg = new Image();
      logoImg.src = '/logo-pdf.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve; // Continuar aunque falle el logo
      });
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      }
    } catch (e) {
      console.log('Logo no disponible');
    }
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94); // Color azul oscuro
    const mesTexto = meses[declaration.periodo_mes - 1].toUpperCase();
    doc.text(`RESUMEN IMPUESTOS ${mesTexto} ${declaration.periodo_anio}`, 105, 25, { align: 'center' });
    
    // Empresa
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${declaration.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    
    // Tabla de impuestos
    const startY = 50;
    const tableWidth = 120;
    const leftMargin = (210 - tableWidth) / 2; // Centrar tabla
    const rightCol = leftMargin + tableWidth;
    const labelCol = leftMargin + 5;
    const valueCol = rightCol - 5;
    
    // Header de tabla con fondo
    doc.setFillColor(52, 73, 94);
    doc.rect(leftMargin, startY, tableWidth, 8, 'F');
    
    let currentY = startY;
    const rowHeight = 8;
    
    // Función helper para filas - solo muestra si el valor no es cero
    const addRow = (label: string, value: string | number, isBold = false, fillColor?: [number, number, number], forceShow = false) => {
      // Omitir si el valor es 0 y no es forzado a mostrar
      if (!forceShow && typeof value === 'number' && value === 0) {
        return;
      }
      if (!forceShow && typeof value === 'string' && (value === '0' || value === '0%')) {
        return;
      }
      
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.rect(leftMargin, currentY, tableWidth, rowHeight, 'F');
      }
      
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(fillColor ? 255 : 0);
      doc.text(label, labelCol, currentY + 5.5);
      
      const valueText = typeof value === 'number' ? value.toLocaleString('es-CL') : value;
      doc.text(valueText, valueCol, currentY + 5.5, { align: 'right' });
      
      // Borde de celda
      doc.setDrawColor(100);
      doc.setLineWidth(0.1);
      doc.rect(leftMargin, currentY, tableWidth, rowHeight);
      
      currentY += rowHeight;
      doc.setTextColor(0);
    };
    
    // Filas de la tabla - solo se muestran las que tienen valores
    addRow('REMANENTE PER ANTERIOR', declaration.remanente_anterior, true, [52, 73, 94]);
    addRow('IVA VENTAS', declaration.iva_ventas);
    addRow('IVA COMPRAS', declaration.iva_compras);
    addRow('IVA NETO', declaration.iva_neto);
    
    const tasaPPM = declaration.tasa_ppm || 0;
    if (tasaPPM > 0) {
      addRow('TASA PPM %', tasaPPM.toString() + '%', false, undefined, true);
    }
    addRow('PPM', declaration.ppm);
    addRow('HONORARIOS', declaration.honorarios);
    addRow('RETENCIÓN 2DA CATEGORÍA', declaration.retencion_2cat);
    addRow('IMPUESTO ÚNICO', declaration.impuesto_unico);
    
    // Recargos por fuera de plazo (si aplica)
    if (declaration.fuera_de_plazo) {
      addRow('CORRECCIÓN MONETARIA', declaration.correccion_monetaria);
      addRow('INTERÉS MORATORIO', declaration.interes_moratorio);
      addRow('MULTA', declaration.multa);
      addRow('RECARGOS CON CONDONACIÓN 70%', declaration.recargos_con_condonacion, true, [255, 193, 7]);
    }
    
    addRow('TOTAL IMPUESTOS', declaration.total_impuestos, false, undefined, true);
    addRow('REMANENTE PROX PERIODO', declaration.remanente_proximo, true, [52, 73, 94]);
    
    // Total destacado
    currentY += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, currentY, tableWidth, 10, 'F');
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, currentY, tableWidth, 10);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    const totalConHonorarios = declaration.total_general;
    doc.text(`TOTAL + HONORARIOS: ${totalConHonorarios.toLocaleString('es-CL')}`, 105, currentY + 7, { align: 'center' });
    
    // Información de la empresa
    currentY += 25;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('PLUS CONTABLE LTDA', 105, currentY, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Joel Carvajal Rantul', 105, currentY + 7, { align: 'center' });
    
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Contador General y Auditor', 105, currentY + 13, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 102, 204); // Azul para email
    doc.text('pluscontableltda@gmail.com', 105, currentY + 19, { align: 'center' });
    
    // Observaciones si existen
    if (declaration.observaciones) {
      currentY += 30;
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Observaciones:', 20, currentY);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitObservaciones = doc.splitTextToSize(declaration.observaciones, 170);
      doc.text(splitObservaciones, 20, currentY + 5);
    }
    
    const fileName = `F29_${declaration.clients?.rut}_${meses[declaration.periodo_mes - 1]}_${declaration.periodo_anio}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF exportado',
      description: 'La declaración se exportó correctamente',
    });
  };

  const previewPDF = async (declaration: F29Declaration) => {
    const doc = new jsPDF();
    
    // Logo (si está disponible)
    try {
      const logoImg = new Image();
      logoImg.src = '/logo-pdf.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      }
    } catch (e) {
      console.log('Logo no disponible');
    }
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    const mesTexto = meses[declaration.periodo_mes - 1].toUpperCase();
    doc.text(`RESUMEN IMPUESTOS ${mesTexto} ${declaration.periodo_anio}`, 105, 25, { align: 'center' });
    
    // Empresa
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${declaration.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    
    // Tabla de impuestos
    const startY = 50;
    const tableWidth = 120;
    const leftMargin = (210 - tableWidth) / 2;
    const rightCol = leftMargin + tableWidth;
    const labelCol = leftMargin + 5;
    const valueCol = rightCol - 5;
    
    doc.setFillColor(52, 73, 94);
    doc.rect(leftMargin, startY, tableWidth, 8, 'F');
    
    let currentY = startY;
    const rowHeight = 8;
    
    const addRow = (label: string, value: string | number, isBold = false, fillColor?: [number, number, number], forceShow = false) => {
      // Omitir si el valor es 0 y no es forzado a mostrar
      if (!forceShow && typeof value === 'number' && value === 0) {
        return;
      }
      if (!forceShow && typeof value === 'string' && (value === '0' || value === '0%')) {
        return;
      }
      
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.rect(leftMargin, currentY, tableWidth, rowHeight, 'F');
      }
      
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(fillColor ? 255 : 0);
      doc.text(label, labelCol, currentY + 5.5);
      
      const valueText = typeof value === 'number' ? value.toLocaleString('es-CL') : value;
      doc.text(valueText, valueCol, currentY + 5.5, { align: 'right' });
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.1);
      doc.rect(leftMargin, currentY, tableWidth, rowHeight);
      
      currentY += rowHeight;
      doc.setTextColor(0);
    };
    
    addRow('REMANENTE PER ANTERIOR', declaration.remanente_anterior, true, [52, 73, 94]);
    addRow('IVA VENTAS', declaration.iva_ventas);
    addRow('IVA COMPRAS', declaration.iva_compras);
    addRow('IVA NETO', declaration.iva_neto);
    
    const tasaPPM = declaration.tasa_ppm || 0;
    if (tasaPPM > 0) {
      addRow('TASA PPM %', tasaPPM.toString() + '%', false, undefined, true);
    }
    addRow('PPM', declaration.ppm);
    addRow('HONORARIOS', declaration.honorarios);
    addRow('RETENCIÓN 2DA CATEGORÍA', declaration.retencion_2cat);
    addRow('IMPUESTO ÚNICO', declaration.impuesto_unico);
    
    // Recargos por fuera de plazo (si aplica)
    if (declaration.fuera_de_plazo) {
      addRow('CORRECCIÓN MONETARIA', declaration.correccion_monetaria);
      addRow('INTERÉS MORATORIO', declaration.interes_moratorio);
      addRow('MULTA', declaration.multa);
      addRow('RECARGOS CON CONDONACIÓN 70%', declaration.recargos_con_condonacion, true, [255, 193, 7]);
    }
    
    addRow('TOTAL IMPUESTOS', declaration.total_impuestos, false, undefined, true);
    addRow('REMANENTE PROX PERIODO', declaration.remanente_proximo, true, [52, 73, 94]);
    
    currentY += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, currentY, tableWidth, 10, 'F');
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, currentY, tableWidth, 10);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    const totalConHonorarios = declaration.total_general;
    doc.text(`TOTAL + HONORARIOS: ${totalConHonorarios.toLocaleString('es-CL')}`, 105, currentY + 7, { align: 'center' });
    
    currentY += 25;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('PLUS CONTABLE LTDA', 105, currentY, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Joel Carvajal Rantul', 105, currentY + 7, { align: 'center' });
    
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Contador General y Auditor', 105, currentY + 13, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 102, 204);
    doc.text('pluscontableltda@gmail.com', 105, currentY + 19, { align: 'center' });
    
    if (declaration.observaciones) {
      currentY += 30;
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Observaciones:', 20, currentY);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitObservaciones = doc.splitTextToSize(declaration.observaciones, 170);
      doc.text(splitObservaciones, 20, currentY + 5);
    }
    
    // Generar PDF y convertirlo a imagen para preview
    const pdfBlob = doc.output('blob');
    
    // Configurar worker de PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    // Convertir PDF a imagen
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      toast({
        title: "Error",
        description: "No se pudo crear el contexto del canvas",
        variant: "destructive"
      });
      return;
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    } as any).promise;
    
    // Convertir canvas a blob JPG
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setPreviewUrl(imageUrl);
        setIsPreviewOpen(true);
      }
    }, 'image/jpeg', 0.95);
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPreviewOpen(false);
  };

  const totals = calculateTotals();
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const canModify = userRole === 'master' || userRole === 'contador';

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Declaraciones F29
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResumenOpen(true)}
                className="border-primary/20 hover:bg-primary/10"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Resumen Consolidado
              </Button>
              {canModify && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Declaración
                    </Button>
                  </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDeclarationId ? 'Editar Declaración F29' : 'Nueva Declaración F29'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label>Cliente</Label>
                          {selectedClientId && currentMonthCount > 0 && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {currentMonthCount} declaración{currentMonthCount !== 1 ? 'es' : ''} este mes
                            </span>
                          )}
                        </div>
                        <Select value={selectedClientId} onValueChange={handleClientChange}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.rut} - {client.razon_social}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Mes</Label>
                        <Select value={mes.toString()} onValueChange={(v) => handlePeriodChange(parseInt(v), anio)}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {meses.map((m, i) => (
                              <SelectItem key={i} value={(i + 1).toString()}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Año</Label>
                        <Input
                          type="number"
                          value={anio}
                          onChange={(e) => handlePeriodChange(mes, parseInt(e.target.value))}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">IVA</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={syncWithSII}
                          disabled={!selectedClientId || isSyncingSII}
                          className="gap-2"
                        >
                          {isSyncingSII ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sincronizando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Actualizar desde SII
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>IVA Ventas</Label>
                          <Input
                            type="number"
                            value={ivaVentas}
                            onChange={(e) => setIvaVentas(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>IVA Compras</Label>
                          <Input
                            type="number"
                            value={ivaCompras}
                            onChange={(e) => setIvaCompras(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        IVA Neto: ${totals.ivaNeto.toLocaleString('es-CL')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Otros Impuestos</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tasa PPM % (Informativo)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tasaPpm}
                            onChange={(e) => setTasaPpm(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>PPM</Label>
                          <Input
                            type="number"
                            value={ppm}
                            onChange={(e) => setPpm(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Retención 2da Cat.</Label>
                          <Input
                            type="number"
                            value={retencion2cat}
                            onChange={(e) => setRetencion2cat(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Impuesto Único</Label>
                          <Input
                            type="number"
                            value={impuestoUnico}
                            onChange={(e) => setImpuestoUnico(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Honorarios</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estado Honorarios</Label>
                          <Select value={estadoHonorarios} onValueChange={(value) => {
                            setEstadoHonorarios(value);
                            if (value === 'pendiente' && selectedClientId) {
                              const client = clients.find(c => c.id === selectedClientId);
                              if (client?.valor) {
                                setHonorarios(client.valor);
                              }
                            } else if (value === 'pagado') {
                              setHonorarios('0');
                            }
                          }}>
                            <SelectTrigger className="bg-input border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="pagado">Pagado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Valor Honorarios</Label>
                          <Input
                            type="number"
                            value={honorarios}
                            onChange={(e) => setHonorarios(e.target.value)}
                            className="bg-input border-border"
                            disabled={estadoHonorarios === 'pagado'}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Los honorarios {estadoHonorarios === 'pendiente' ? 'pendientes se suman' : 'pagados no se incluyen en'} al Total a Pagar
                      </div>
                    </div>

                    <div>
                      <Label>Remanente Anterior</Label>
                      <Input
                        type="number"
                        value={remanenteAnterior}
                        onChange={(e) => setRemanenteAnterior(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="bg-secondary p-4 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Impuestos:</span>
                        <span className="font-semibold text-foreground">${totals.totalImpuestos.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remanente Próximo:</span>
                        <span className="font-semibold text-foreground">${totals.remanenteProximo.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between text-base border-t border-border pt-2 mt-2">
                        <span className="font-semibold text-foreground">Total a Pagar:</span>
                        <span className="font-bold text-primary text-lg">${totals.totalGeneral.toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div>
                      <Label>Observaciones</Label>
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="bg-input border-border"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Estado de la Declaración</Label>
                      <Select value={estadoDeclaracion} onValueChange={setEstadoDeclaracion}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="guardado">Guardado</SelectItem>
                          <SelectItem value="declarado">Declarado</SelectItem>
                          <SelectItem value="girado">Girado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sección Fuera de Plazo */}
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fueraDePlazo"
                          checked={fueraDePlazo}
                          onChange={(e) => setFueraDePlazo(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="fueraDePlazo" className="font-semibold">
                          Declaración Fuera de Plazo
                        </Label>
                      </div>

                      {fueraDePlazo && (
                        <div className="space-y-3 pl-6 border-l-2 border-primary/50">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Días de Atraso</Label>
                              <Input
                                value={diasAtraso}
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Fecha Límite</Label>
                              <Input
                                value={fechaLimite}
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                            <h4 className="font-semibold text-sm">Cálculo de Recargos:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span>Corrección Monetaria:</span>
                              <span className="font-semibold">${Math.round(correccionMonetaria).toLocaleString('es-CL')}</span>
                              
                              <span>Interés Moratorio (0.05% diario):</span>
                              <span className="font-semibold">${Math.round(interesMoratorio).toLocaleString('es-CL')}</span>
                              
                              <span>Multa:</span>
                              <span className="font-semibold">${Math.round(multaCalculada).toLocaleString('es-CL')}</span>
                              
                              <span className="font-bold border-t pt-1">Total Recargos:</span>
                              <span className="font-bold border-t pt-1">${Math.round(totalRecargos).toLocaleString('es-CL')}</span>
                            </div>
                          </div>

                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-sm">Con Condonación 70%:</span>
                              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                                ${Math.round(recargosConCondonacion).toLocaleString('es-CL')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Este monto se suma automáticamente al Total a Pagar
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Declaración'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Declaraciones F29</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
              <div>
                <Label>Cliente</Label>
                <Select value={filterClientId} onValueChange={setFilterClientId}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.rut} - {client.razon_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mes</Label>
                <Select value={filterMes.toString()} onValueChange={(v) => setFilterMes(parseInt(v))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los meses</SelectItem>
                    {meses.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select value={filterAnio.toString()} onValueChange={(v) => setFilterAnio(parseInt(v))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los años</SelectItem>
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {declarations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay declaraciones registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {declarations
                  .filter((declaration) => {
                    if (filterClientId !== 'all' && declaration.client_id !== filterClientId) return false;
                    if (filterMes !== 0 && declaration.periodo_mes !== filterMes) return false;
                    if (filterAnio !== 0 && declaration.periodo_anio !== filterAnio) return false;
                    return true;
                  })
                  .map((declaration) => (
                  <div
                    key={declaration.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {declaration.clients?.razon_social || 'Cliente'}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {meses[declaration.periodo_mes - 1]} {declaration.periodo_anio}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          declaration.estado_declaracion === 'declarado' ? 'bg-green-500/20 text-green-300' :
                          declaration.estado_declaracion === 'girado' ? 'bg-blue-500/20 text-blue-300' :
                          declaration.estado_declaracion === 'guardado' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {declaration.estado_declaracion === 'declarado' ? 'Declarado' :
                           declaration.estado_declaracion === 'girado' ? 'Girado' :
                           declaration.estado_declaracion === 'guardado' ? 'Guardado' :
                           'Pendiente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">IVA Neto:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${declaration.iva_neto.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tasa PPM:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            {declaration.tasa_ppm || 0}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PPM:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${declaration.ppm.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Impuestos:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${declaration.total_impuestos.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total a Pagar:</span>
                          <span className="ml-2 font-bold text-primary">
                            ${declaration.total_general.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      {declaration.observaciones && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-semibold">Obs:</span> {declaration.observaciones}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {canModify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(declaration)}
                          className="text-primary hover:text-primary"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(declaration)}
                        className="text-primary hover:text-primary"
                        title="Previsualizar PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(declaration)}
                        className="text-primary hover:text-primary"
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canModify && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(declaration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-2xl h-[85vh]">
            <DialogHeader>
              <DialogTitle>Vista Previa - F29</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden rounded border bg-gray-50">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[calc(85vh-80px)]"
                  title="Vista Previa F29"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />

      <AlertDialog open={showClearFormAlert} onOpenChange={setShowClearFormAlert}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar formulario?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya has ingresado datos en el formulario. ¿Deseas limpiar los datos y cambiar de cliente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClientChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClientChange}>Sí, limpiar datos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Resumen Consolidado */}
      <Dialog open={isResumenOpen} onOpenChange={setIsResumenOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Resumen Consolidado de Estados - F29</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Filtros del resumen */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
              <div>
                <Label>Mes</Label>
                <Select value={resumenFilterMes.toString()} onValueChange={(v) => setResumenFilterMes(parseInt(v))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los meses</SelectItem>
                    {meses.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select value={resumenFilterAnio.toString()} onValueChange={(v) => setResumenFilterAnio(parseInt(v))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Tabla de resumen por cliente */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-sm">Cliente</th>
                    <th className="text-center p-3 font-semibold text-sm">Declaraciones</th>
                    <th className="text-center p-3 font-semibold text-sm">Pendientes</th>
                    <th className="text-center p-3 font-semibold text-sm">Guardadas</th>
                    <th className="text-center p-3 font-semibold text-sm">Declaradas</th>
                    <th className="text-center p-3 font-semibold text-sm">Giradas</th>
                    <th className="text-center p-3 font-semibold text-sm">Hon. Pend.</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    // Filtrar declaraciones por mes y año
                    let clientDeclarations = declarations.filter(d => d.client_id === client.id);
                    if (resumenFilterMes !== 0) {
                      clientDeclarations = clientDeclarations.filter(d => d.periodo_mes === resumenFilterMes);
                    }
                    if (resumenFilterAnio !== 0) {
                      clientDeclarations = clientDeclarations.filter(d => d.periodo_anio === resumenFilterAnio);
                    }
                    
                    const totalDecl = clientDeclarations.length;
                    const pendientes = clientDeclarations.filter(d => d.estado_declaracion === 'pendiente').length;
                    const guardadas = clientDeclarations.filter(d => d.estado_declaracion === 'guardado').length;
                    const declaradas = clientDeclarations.filter(d => d.estado_declaracion === 'declarado').length;
                    const giradas = clientDeclarations.filter(d => d.estado_declaracion === 'girado').length;
                    const honPendientes = clientDeclarations.filter(d => d.estado_honorarios === 'pendiente').length;
                    
                    if (totalDecl === 0) return null;
                    
                    return (
                      <tr key={client.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="p-3 text-sm">
                          <div className="font-medium">{client.razon_social}</div>
                          <div className="text-xs text-muted-foreground">{client.rut}</div>
                        </td>
                        <td className="text-center p-3 text-sm font-medium">{totalDecl}</td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                            pendientes > 0 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {pendientes}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                            guardadas > 0 ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {guardadas}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                            declaradas > 0 ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {declaradas}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                            giradas > 0 ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {giradas}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                            honPendientes > 0 ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {honPendientes}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen global */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {(() => {
                    let filtered = declarations;
                    if (resumenFilterMes !== 0) filtered = filtered.filter(d => d.periodo_mes === resumenFilterMes);
                    if (resumenFilterAnio !== 0) filtered = filtered.filter(d => d.periodo_anio === resumenFilterAnio);
                    return filtered.length;
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Declaraciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {(() => {
                    let filtered = declarations;
                    if (resumenFilterMes !== 0) filtered = filtered.filter(d => d.periodo_mes === resumenFilterMes);
                    if (resumenFilterAnio !== 0) filtered = filtered.filter(d => d.periodo_anio === resumenFilterAnio);
                    return filtered.filter(d => d.estado_declaracion === 'pendiente').length;
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {(() => {
                    let filtered = declarations;
                    if (resumenFilterMes !== 0) filtered = filtered.filter(d => d.periodo_mes === resumenFilterMes);
                    if (resumenFilterAnio !== 0) filtered = filtered.filter(d => d.periodo_anio === resumenFilterAnio);
                    return filtered.filter(d => d.estado_declaracion === 'declarado').length;
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Declaradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(() => {
                    let filtered = declarations;
                    if (resumenFilterMes !== 0) filtered = filtered.filter(d => d.periodo_mes === resumenFilterMes);
                    if (resumenFilterAnio !== 0) filtered = filtered.filter(d => d.periodo_anio === resumenFilterAnio);
                    return filtered.filter(d => d.estado_honorarios === 'pendiente').length;
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Hon. Pendientes</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
