import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ArrowLeft, Eye, EyeOff, FileText, Calendar, CheckCircle2, AlertCircle, Clock, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  razon_social: string;
  regimen_tributario: string;
  rut: string;
  clave_sii: string;
  representante_legal: string;
  rut_representante: string;
  clave_sii_repr: string;
}

interface F22Tipo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_limite_dia: number;
  fecha_limite_mes: number;
  regimen_tributario: string[];
  orden: number;
  es_comun: boolean;
}

interface F22Declaracion {
  id: string;
  client_id: string;
  f22_tipo_id: string;
  anio_tributario: number;
  estado: string;
  fecha_presentacion: string | null;
  fecha_aceptacion: string | null;
  observaciones: string | null;
  oculta: boolean;
  clients?: { 
    razon_social: string; 
    regimen_tributario: string;
    rut: string;
    clave_sii: string;
    representante_legal: string;
    rut_representante: string;
    clave_sii_repr: string;
  };
  f22_tipos?: F22Tipo;
}

export default function F22Declarations() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [f22Tipos, setF22Tipos] = useState<F22Tipo[]>([]);
  const [declaraciones, setDeclaraciones] = useState<F22Declaracion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'por-cliente' | 'por-dj'>('por-cliente');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterTipoId, setFilterTipoId] = useState<string>('all');
  const [filterAnio, setFilterAnio] = useState(new Date().getFullYear() + 1); // AT 2026 para 2025
  const [showOcultas, setShowOcultas] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [selectedClientForInfo, setSelectedClientForInfo] = useState<Client | null>(null);
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTipoId, setSelectedTipoId] = useState('');
  const [anioTributario, setAnioTributario] = useState(new Date().getFullYear() + 1);
  const [estado, setEstado] = useState('pendiente');
  const [fechaPresentacion, setFechaPresentacion] = useState('');
  const [fechaAceptacion, setFechaAceptacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterClientId, filterTipoId, filterAnio, showOcultas]);

  const canModify = userRole === 'master' || userRole === 'admin';

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, razon_social, regimen_tributario, rut, clave_sii, representante_legal, rut_representante, clave_sii_repr')
        .eq('activo', true)
        .order('razon_social');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Cargar tipos de F22
      const { data: tiposData, error: tiposError } = await supabase
        .from('f22_tipos')
        .select('*')
        .eq('activo', true)
        .order('orden');

      if (tiposError) throw tiposError;
      setF22Tipos(tiposData || []);

      // Cargar declaraciones
      let query = supabase
        .from('f22_declaraciones')
        .select(`
          *,
          clients(razon_social, regimen_tributario, rut, clave_sii, representante_legal, rut_representante, clave_sii_repr),
          f22_tipos(*)
        `)
        .eq('anio_tributario', filterAnio);

      if (filterClientId !== 'all') {
        query = query.eq('client_id', filterClientId);
      }

      if (filterTipoId !== 'all') {
        query = query.eq('f22_tipo_id', filterTipoId);
      }

      if (!showOcultas) {
        query = query.eq('oculta', false);
      }

      const { data: declaracionesData, error: declaracionesError } = await query;

      if (declaracionesError) throw declaracionesError;
      setDeclaraciones(declaracionesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedTipoId('');
    setAnioTributario(new Date().getFullYear() + 1);
    setEstado('pendiente');
    setFechaPresentacion('');
    setFechaAceptacion('');
    setObservaciones('');
    setOculta(false);
    setEditingId(null);
  };

  const handleEdit = (declaracion: F22Declaracion) => {
    setEditingId(declaracion.id);
    setSelectedClientId(declaracion.client_id);
    setSelectedTipoId(declaracion.f22_tipo_id);
    setAnioTributario(declaracion.anio_tributario);
    setEstado(declaracion.estado);
    setFechaPresentacion(declaracion.fecha_presentacion || '');
    setFechaAceptacion(declaracion.fecha_aceptacion || '');
    setObservaciones(declaracion.observaciones || '');
    setOculta(declaracion.oculta);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedClientId || !selectedTipoId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente y tipo de DJ",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const declaracionData = {
        client_id: selectedClientId,
        f22_tipo_id: selectedTipoId,
        anio_tributario: anioTributario,
        estado,
        fecha_presentacion: fechaPresentacion || null,
        fecha_aceptacion: fechaAceptacion || null,
        observaciones: observaciones || null,
        oculta,
        created_by: user?.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('f22_declaraciones')
          .update(declaracionData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Declaración actualizada",
          description: "Los datos se han actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('f22_declaraciones')
          .insert(declaracionData);

        if (error) throw error;

        toast({
          title: "Declaración registrada",
          description: "La declaración se ha registrado correctamente"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving declaracion:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la declaración",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOculta = async (declaracion: F22Declaracion) => {
    try {
      const { error } = await supabase
        .from('f22_declaraciones')
        .update({ oculta: !declaracion.oculta })
        .eq('id', declaracion.id);

      if (error) throw error;

      toast({
        title: declaracion.oculta ? "DJ visible" : "DJ ocultada",
        description: declaracion.oculta 
          ? "La declaración ahora es visible" 
          : "La declaración ha sido ocultada"
      });

      loadData();
    } catch (error) {
      console.error('Error toggling oculta:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: { icon: Clock, bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pendiente' },
      declarada: { icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', label: 'Declarada' }
    };
    
    const badge = badges[estado as keyof typeof badges] || badges.pendiente;
    const Icon = badge.icon;
    
    return (
      <Badge variant="secondary" className={`${badge.bg} ${badge.text} gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getResultadoBadge = (estado: string) => {
    const badges = {
      aceptada: { icon: CheckCircle2, bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-400', label: 'Aceptada' },
      observada: { icon: AlertCircle, bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', label: 'Observada' }
    };
    
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return null;
    
    const Icon = badge.icon;
    
    return (
      <Badge variant="secondary" className={`${badge.bg} ${badge.text} gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const handlePreloadDeclaraciones = async () => {
    if (!confirm(`¿Desea pre-cargar todas las declaraciones juradas para todos los clientes activos para el AT ${filterAnio}?`)) {
      return;
    }

    setIsPreloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obtener declaraciones existentes para este año
      const { data: existingDeclaraciones, error: existingError } = await supabase
        .from('f22_declaraciones')
        .select('client_id, f22_tipo_id')
        .eq('anio_tributario', filterAnio);

      if (existingError) throw existingError;

      const existingCombos = new Set(
        existingDeclaraciones?.map(d => `${d.client_id}_${d.f22_tipo_id}`) || []
      );

      // Crear todas las combinaciones posibles de cliente + tipo DJ
      const newDeclaraciones = [];
      for (const client of clients) {
        const regimenCliente = client.regimen_tributario || '';
        
        for (const tipo of f22Tipos) {
          // Verificar si el tipo DJ aplica al régimen del cliente
          const aplicaRegimen = tipo.es_comun || 
            (tipo.regimen_tributario && tipo.regimen_tributario.includes(regimenCliente));
          
          if (!aplicaRegimen) continue;

          const combo = `${client.id}_${tipo.id}`;
          if (!existingCombos.has(combo)) {
            newDeclaraciones.push({
              client_id: client.id,
              f22_tipo_id: tipo.id,
              anio_tributario: filterAnio,
              estado: 'pendiente',
              oculta: false,
              created_by: user?.id
            });
          }
        }
      }

      if (newDeclaraciones.length === 0) {
        toast({
          title: "Información",
          description: "Todas las declaraciones ya están registradas para este período"
        });
        setIsPreloading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('f22_declaraciones')
        .insert(newDeclaraciones);

      if (insertError) throw insertError;

      toast({
        title: "Declaraciones pre-cargadas",
        description: `Se crearon ${newDeclaraciones.length} declaraciones pendientes`
      });

      loadData();
    } catch (error) {
      console.error('Error preloading declaraciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron pre-cargar las declaraciones",
        variant: "destructive"
      });
    } finally {
      setIsPreloading(false);
    }
  };

  const getFechaLimite = (tipo: F22Tipo, anio: number) => {
    // La fecha límite es en el año del AT (ej: AT2026 = año 2026)
    return new Date(anio, tipo.fecha_limite_mes - 1, tipo.fecha_limite_dia);
  };

  const getDiasHastaVencimiento = (tipo: F22Tipo, anio: number) => {
    const fechaLimite = getFechaLimite(tipo, anio);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaLimite.setHours(0, 0, 0, 0);
    const diffTime = fechaLimite.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAlertaBadge = (declaracion: F22Declaracion) => {
    if (declaracion.estado !== 'pendiente' || !declaracion.f22_tipos) return null;
    
    const diasRestantes = getDiasHastaVencimiento(declaracion.f22_tipos, declaracion.anio_tributario);
    
    if (diasRestantes < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Vencida ({Math.abs(diasRestantes)} días)
        </Badge>
      );
    } else if (diasRestantes <= 7) {
      return (
        <Badge variant="destructive" className="ml-2 bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Vence en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
        </Badge>
      );
    } else if (diasRestantes <= 15) {
      return (
        <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {diasRestantes} días
        </Badge>
      );
    }
    return null;
  };

  const getResumenAlertas = () => {
    const vencidas = declaraciones.filter(d => 
      d.estado === 'pendiente' && 
      d.f22_tipos && 
      getDiasHastaVencimiento(d.f22_tipos, d.anio_tributario) < 0
    );
    
    const proximas = declaraciones.filter(d => 
      d.estado === 'pendiente' && 
      d.f22_tipos && 
      getDiasHastaVencimiento(d.f22_tipos, d.anio_tributario) >= 0 &&
      getDiasHastaVencimiento(d.f22_tipos, d.anio_tributario) <= 7
    );

    return { vencidas, proximas };
  };

  const getClientesDJ = (tipoId: string) => {
    return declaraciones
      .filter(d => d.f22_tipo_id === tipoId && (!d.oculta || showOcultas))
      .map(d => ({
        ...d,
        cliente: d.clients?.razon_social || 'N/A'
      }));
  };

  const getDJsCliente = (clientId: string) => {
    return declaraciones
      .filter(d => d.client_id === clientId && (!d.oculta || showOcultas))
      .map(d => ({
        ...d,
        tipo: d.f22_tipos
      }));
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Volver al Dashboard</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <h1 className="text-3xl font-bold">Declaraciones Juradas F22</h1>
                <p className="text-muted-foreground">
                  Año Tributario {filterAnio} (movimientos {filterAnio - 1})
                </p>
              </div>
            </div>
          {canModify && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => window.open('https://www.sii.cl', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ir al SII
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreloadDeclaraciones}
                disabled={isPreloading}
              >
                {isPreloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pre-cargando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Pre-cargar DJ
                  </>
                )}
              </Button>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <FileText className="mr-2 h-4 w-4" />
                Nueva Declaración
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros y Visualización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Año Tributario</Label>
                <Select 
                  value={filterAnio.toString()} 
                  onValueChange={(v) => setFilterAnio(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        AT {year} ({year - 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modo de Vista</Label>
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por-cliente">Por Cliente</SelectItem>
                    <SelectItem value="por-dj">Por Declaración</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {viewMode === 'por-cliente' && (
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={filterClientId} onValueChange={setFilterClientId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {viewMode === 'por-dj' && (
                <div className="space-y-2">
                  <Label>Declaración</Label>
                  <Select value={filterTipoId} onValueChange={setFilterTipoId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las DJ</SelectItem>
                      {f22Tipos.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.codigo} - {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-ocultas"
                    checked={showOcultas}
                    onCheckedChange={(checked) => setShowOcultas(checked as boolean)}
                  />
                  <Label htmlFor="show-ocultas" className="cursor-pointer">
                    Mostrar ocultadas
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Vencimiento */}
        {(() => {
          const { vencidas, proximas } = getResumenAlertas();
          if (vencidas.length === 0 && proximas.length === 0) return null;
          
          return (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Alertas de Vencimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vencidas.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5">
                      {vencidas.length}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold text-red-800">Declaraciones vencidas</p>
                      <p className="text-sm text-muted-foreground">
                        {vencidas.slice(0, 3).map(d => d.clients?.razon_social || 'N/A').join(', ')}
                        {vencidas.length > 3 && ` y ${vencidas.length - 3} más`}
                      </p>
                    </div>
                  </div>
                )}
                
                {proximas.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5 bg-orange-100 text-orange-800">
                      {proximas.length}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800">Próximas a vencer (7 días o menos)</p>
                      <p className="text-sm text-muted-foreground">
                        {proximas.slice(0, 3).map(d => d.clients?.razon_social || 'N/A').join(', ')}
                        {proximas.length > 3 && ` y ${proximas.length - 3} más`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Vista por Cliente */}
        {viewMode === 'por-cliente' && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filterClientId === 'all' && <TableHead className="w-[180px]">Cliente</TableHead>}
                    <TableHead className="w-[200px]">Declaración</TableHead>
                    <TableHead className="w-[140px]">RUT / Clave SII</TableHead>
                    <TableHead className="w-[140px]">Representante</TableHead>
                    <TableHead className="w-[180px]">Fecha Límite</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[100px]">Resultado</TableHead>
                    <TableHead className="w-[100px]">F. Presentación</TableHead>
                    {canModify && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declaraciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No hay declaraciones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    declaraciones.map((decl) => (
                      <TableRow key={decl.id} className={decl.oculta ? 'opacity-50' : ''}>
                        {filterClientId === 'all' && (
                          <TableCell className="font-medium text-sm">
                            {decl.clients?.razon_social}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-semibold">{decl.f22_tipos?.codigo}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {decl.f22_tipos?.nombre}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="font-medium">{decl.clients?.rut || 'N/A'}</div>
                            <div className="text-muted-foreground truncate">
                              {decl.clients?.clave_sii ? '••••••' : 'Sin clave'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="font-medium truncate">{decl.clients?.representante_legal || 'N/A'}</div>
                            <div className="text-muted-foreground">
                              {decl.clients?.rut_representante || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {decl.f22_tipos && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(
                                  getFechaLimite(decl.f22_tipos, decl.anio_tributario),
                                  "dd/MM/yy"
                                )}
                              </div>
                              {getAlertaBadge(decl)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getEstadoBadge(decl.estado)}</TableCell>
                        <TableCell>{getResultadoBadge(decl.estado)}</TableCell>
                        <TableCell className="text-xs">
                          {decl.fecha_presentacion
                            ? format(new Date(decl.fecha_presentacion), 'dd/MM/yy')
                            : '-'}
                        </TableCell>
                        {canModify && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleToggleOculta(decl)}
                                title={decl.oculta ? 'Mostrar' : 'Ocultar'}
                              >
                                {decl.oculta ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEdit(decl)}
                              >
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Vista por DJ */}
        {viewMode === 'por-dj' && (
          <div className="space-y-6">
            {f22Tipos
              .filter(tipo => filterTipoId === 'all' || tipo.id === filterTipoId)
              .map((tipo) => {
                const clientesDJ = getClientesDJ(tipo.id);
                if (clientesDJ.length === 0) return null;

                return (
                  <Card key={tipo.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {tipo.codigo} - {tipo.nombre}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tipo.descripcion}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Fecha límite: {format(
                              getFechaLimite(tipo, filterAnio),
                              "d 'de' MMMM, yyyy",
                              { locale: es }
                            )}
                            {(() => {
                              const pendientes = clientesDJ.filter(d => d.estado === 'pendiente');
                              if (pendientes.length === 0) return null;
                              const diasRestantes = getDiasHastaVencimiento(tipo, filterAnio);
                              if (diasRestantes < 0) {
                                return (
                                  <Badge variant="destructive" className="ml-2">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {pendientes.length} vencidas
                                  </Badge>
                                );
                              } else if (diasRestantes <= 7) {
                                return (
                                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {pendientes.length} pendientes - {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {clientesDJ.length} {clientesDJ.length === 1 ? 'cliente' : 'clientes'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>RUT / Clave SII</TableHead>
                            <TableHead>Representante Legal</TableHead>
                            <TableHead>Régimen</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Presentación</TableHead>
                            {canModify && <TableHead className="text-right">Acciones</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientesDJ.map((decl) => (
                            <TableRow key={decl.id} className={decl.oculta ? 'opacity-50' : ''}>
                              <TableCell className="font-medium">{decl.cliente}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{decl.clients?.rut || 'N/A'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {decl.clients?.clave_sii || 'No configurada'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{decl.clients?.representante_legal || 'N/A'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {decl.clients?.rut_representante || 'N/A'} · {decl.clients?.clave_sii_repr || 'No configurada'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {decl.clients?.regimen_tributario || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getEstadoBadge(decl.estado)}
                                  {getAlertaBadge(decl)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {decl.fecha_presentacion
                                  ? format(new Date(decl.fecha_presentacion), 'dd/MM/yyyy')
                                  : '-'}
                              </TableCell>
                              {canModify && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleToggleOculta(decl)}
                                      title={decl.oculta ? 'Mostrar' : 'Ocultar'}
                                    >
                                      {decl.oculta ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(decl)}
                                    >
                                      Editar
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Dialog para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Declaración' : 'Nueva Declaración'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de DJ *</Label>
                  <Select
                    value={selectedTipoId}
                    onValueChange={setSelectedTipoId}
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {f22Tipos.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.codigo} - {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Año Tributario *</Label>
                  <Select
                    value={anioTributario.toString()}
                    onValueChange={(v) => setAnioTributario(parseInt(v))}
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          AT {year} ({year - 1})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="declarada">Declarada</SelectItem>
                      <SelectItem value="aceptada">Aceptada (Declarada + SII Aceptó)</SelectItem>
                      <SelectItem value="observada">Observada (Declarada + SII Observó)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estado: Pendiente/Declarada | Resultado: Aceptada/Observada
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Presentación</Label>
                  <Input
                    type="date"
                    value={fechaPresentacion}
                    onChange={(e) => setFechaPresentacion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Aceptación</Label>
                  <Input
                    type="date"
                    value={fechaAceptacion}
                    onChange={(e) => setFechaAceptacion(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  placeholder="Observaciones o comentarios adicionales..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="oculta"
                  checked={oculta}
                  onCheckedChange={(checked) => setOculta(checked as boolean)}
                />
                <Label htmlFor="oculta" className="cursor-pointer">
                  Ocultar esta declaración (no se presentará)
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
    </TooltipProvider>
  );
}
