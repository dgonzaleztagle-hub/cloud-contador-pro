import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  razon_social: string;
}

interface Worker {
  id: string;
  nombre: string;
  rut: string;
}

interface Cotizacion {
  id: string;
  client_id: string;
  periodo_mes: number;
  periodo_anio: number;
  estado: string;
  fecha_declaracion: string | null;
  fecha_pago: string | null;
  observaciones: string | null;
  clients?: { razon_social: string };
}

interface CotizacionTrabajador {
  id: string;
  cotizacion_id: string;
  worker_id: string;
  monto: number;
  pagado: boolean;
  fecha_pago: string | null;
  rrhh_workers?: { nombre: string; rut: string };
}

export default function CotizacionesPrevisionales() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterMes, setFilterMes] = useState(new Date().getMonth() + 1);
  const [filterAnio, setFilterAnio] = useState(new Date().getFullYear());
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [periodoMes, setPeriodoMes] = useState(new Date().getMonth() + 1);
  const [periodoAnio, setPeriodoAnio] = useState(new Date().getFullYear());
  const [estado, setEstado] = useState('pendiente');
  const [fechaDeclaracion, setFechaDeclaracion] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Worker payment details
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerPayments, setWorkerPayments] = useState<CotizacionTrabajador[]>([]);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterClientId, filterMes, filterAnio]);

  const canModify = userRole === 'master' || userRole === 'admin';

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Cargar clientes
      const { data: clientsData, error: clientsError} = await supabase
        .from('clients')
        .select('id, razon_social')
        .eq('activo', true)
        .order('razon_social');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Cargar cotizaciones
      let query = supabase
        .from('cotizaciones_previsionales')
        .select('*, clients(razon_social)')
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes', { ascending: false });

      if (filterClientId !== 'all') {
        query = query.eq('client_id', filterClientId);
      }
      
      query = query.eq('periodo_mes', filterMes).eq('periodo_anio', filterAnio);

      const { data: cotizacionesData, error: cotizacionesError } = await query;

      if (cotizacionesError) throw cotizacionesError;
      setCotizaciones(cotizacionesData || []);
      
      // Cargar todos los trabajadores de las cotizaciones visibles
      if (cotizacionesData && cotizacionesData.length > 0) {
        const cotizacionIds = cotizacionesData.map(c => c.id);
        const { data: workersData } = await supabase
          .from('cotizaciones_trabajadores')
          .select('*, rrhh_workers(nombre, rut)')
          .in('cotizacion_id', cotizacionIds);
        
        if (workersData) {
          setWorkerPayments(workersData);
        }
      } else {
        setWorkerPayments([]);
      }

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

  const loadWorkers = async (clientId: string) => {
    const { data, error } = await supabase
      .from('rrhh_workers')
      .select('id, nombre, rut')
      .eq('client_id', clientId)
      .eq('activo', true)
      .order('nombre');

    if (!error && data) {
      setWorkers(data);
    }
  };

  const loadWorkerPayments = async (cotizacionId: string) => {
    const { data, error } = await supabase
      .from('cotizaciones_trabajadores')
      .select('*, rrhh_workers(nombre, rut)')
      .eq('cotizacion_id', cotizacionId);

    if (!error && data) {
      setWorkerPayments(data);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setPeriodoMes(new Date().getMonth() + 1);
    setPeriodoAnio(new Date().getFullYear());
    setEstado('pendiente');
    setFechaDeclaracion('');
    setFechaPago('');
    setObservaciones('');
    setEditingId(null);
  };

  const handleEdit = (cotizacion: Cotizacion) => {
    setEditingId(cotizacion.id);
    setSelectedClientId(cotizacion.client_id);
    setPeriodoMes(cotizacion.periodo_mes);
    setPeriodoAnio(cotizacion.periodo_anio);
    setEstado(cotizacion.estado);
    setFechaDeclaracion(cotizacion.fecha_declaracion || '');
    setFechaPago(cotizacion.fecha_pago || '');
    setObservaciones(cotizacion.observaciones || '');
    setIsDialogOpen(true);
  };

  const handleManageWorkers = async (cotizacion: Cotizacion) => {
    setSelectedCotizacionId(cotizacion.id);
    await loadWorkers(cotizacion.client_id);
    await loadWorkerPayments(cotizacion.id);
    setIsWorkerDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const cotizacionData = {
        client_id: selectedClientId,
        periodo_mes: periodoMes,
        periodo_anio: periodoAnio,
        estado,
        fecha_declaracion: fechaDeclaracion || null,
        fecha_pago: fechaPago || null,
        observaciones: observaciones || null,
        created_by: user?.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('cotizaciones_previsionales')
          .update(cotizacionData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Cotización actualizada",
          description: "Los datos se han actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('cotizaciones_previsionales')
          .insert(cotizacionData);

        if (error) throw error;

        toast({
          title: "Cotización creada",
          description: "La cotización se ha registrado correctamente"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving cotizacion:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cotización",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta cotización?')) return;

    try {
      const { error } = await supabase
        .from('cotizaciones_previsionales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cotización eliminada",
        description: "La cotización se ha eliminado correctamente"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting cotizacion:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización",
        variant: "destructive"
      });
    }
  };

  const handlePreloadCotizaciones = async () => {
    if (!confirm(`¿Desea pre-cargar cotizaciones pendientes para todas las empresas con trabajadores activos para ${format(new Date(filterAnio, filterMes - 1), 'MMMM yyyy', { locale: es })}?`)) {
      return;
    }

    setIsPreloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obtener todas las empresas con trabajadores activos
      const { data: clientsWithWorkers, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, 
          razon_social,
          rrhh_workers!inner(id)
        `)
        .eq('activo', true)
        .eq('rrhh_workers.activo', true);

      if (clientsError) throw clientsError;

      // Obtener cotizaciones existentes para este período
      const { data: existingCotizaciones, error: existingError } = await supabase
        .from('cotizaciones_previsionales')
        .select('client_id')
        .eq('periodo_mes', filterMes)
        .eq('periodo_anio', filterAnio);

      if (existingError) throw existingError;

      const existingClientIds = new Set(existingCotizaciones?.map(c => c.client_id) || []);
      
      // Filtrar solo las empresas que no tienen cotización para este período
      const uniqueClients = Array.from(
        new Map(clientsWithWorkers?.map(c => [c.id, c])).values()
      ).filter(client => !existingClientIds.has(client.id));

      if (uniqueClients.length === 0) {
        toast({
          title: "Información",
          description: "Todas las empresas con trabajadores activos ya tienen cotización registrada para este período"
        });
        setIsPreloading(false);
        return;
      }

      // Crear cotizaciones pendientes
      const newCotizaciones = uniqueClients.map(client => ({
        client_id: client.id,
        periodo_mes: filterMes,
        periodo_anio: filterAnio,
        estado: 'pendiente',
        created_by: user?.id
      }));

      const { error: insertError } = await supabase
        .from('cotizaciones_previsionales')
        .insert(newCotizaciones);

      if (insertError) throw insertError;

      toast({
        title: "Cotizaciones pre-cargadas",
        description: `Se crearon ${uniqueClients.length} cotizaciones pendientes`
      });

      loadData();
    } catch (error) {
      console.error('Error preloading cotizaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron pre-cargar las cotizaciones",
        variant: "destructive"
      });
    } finally {
      setIsPreloading(false);
    }
  };

  const handleToggleWorkerPayment = async (workerId: string, currentPaid: boolean) => {
    try {
      const existingPayment = workerPayments.find(wp => wp.worker_id === workerId);
      
      if (existingPayment) {
        const { error } = await supabase
          .from('cotizaciones_trabajadores')
          .update({ 
            pagado: !currentPaid,
            fecha_pago: !currentPaid ? new Date().toISOString().split('T')[0] : null
          })
          .eq('id', existingPayment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cotizaciones_trabajadores')
          .insert({
            cotizacion_id: selectedCotizacionId,
            worker_id: workerId,
            monto: 0,
            pagado: true,
            fecha_pago: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
      }

      await loadWorkerPayments(selectedCotizacionId);
      
      toast({
        title: "Estado actualizado",
        description: "El estado del pago se ha actualizado"
      });
    } catch (error) {
      console.error('Error updating worker payment:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      pagado_total: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado Total' },
      pagado_parcial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pagado Parcial' },
      declarado_no_pagado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declarado No Pagado' }
    };
    
    const badge = badges[estado as keyof typeof badges] || badges.pendiente;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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
              <h1 className="text-3xl font-bold">Cotizaciones Previsionales</h1>
            </div>
          {canModify && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePreloadCotizaciones}
                disabled={isPreloading}
              >
                {isPreloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pre-cargando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Pre-cargar Cotizaciones
                  </>
                )}
              </Button>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cotización
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canModify && (
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

              <div className="space-y-2">
                <Label>Mes</Label>
                <Select value={filterMes.toString()} onValueChange={(v) => setFilterMes(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Año</Label>
                <Select value={filterAnio.toString()} onValueChange={(v) => setFilterAnio(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de cotizaciones */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Trabajadores</TableHead>
                  <TableHead className="text-center">Pagados</TableHead>
                  <TableHead className="text-center">Pendientes</TableHead>
                  <TableHead>Fecha Declaración</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  {canModify && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No hay cotizaciones registradas para este período
                    </TableCell>
                  </TableRow>
                ) : (
                  cotizaciones.map((cotizacion) => {
                    // Calcular trabajadores desde workerPayments si están disponibles
                    const payments = workerPayments.filter(p => p.cotizacion_id === cotizacion.id);
                    const totalWorkers = payments.length;
                    const paidWorkers = payments.filter(p => p.pagado).length;
                    const pendingWorkers = totalWorkers - paidWorkers;
                    
                    return (
                      <TableRow key={cotizacion.id}>
                        <TableCell>{cotizacion.clients?.razon_social}</TableCell>
                        <TableCell>
                          {format(new Date(cotizacion.periodo_anio, cotizacion.periodo_mes - 1), 'MMMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{getEstadoBadge(cotizacion.estado)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {totalWorkers}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {paidWorkers}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${pendingWorkers > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                            {pendingWorkers}
                          </span>
                        </TableCell>
                        <TableCell>
                          {cotizacion.fecha_declaracion
                            ? format(new Date(cotizacion.fecha_declaracion), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {cotizacion.fecha_pago
                            ? format(new Date(cotizacion.fecha_pago), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManageWorkers(cotizacion)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Gestionar trabajadores y pagos</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(cotizacion)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar cotización</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(cotizacion.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar cotización</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog para crear/editar cotización */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Cotización' : 'Nueva Cotización'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes *</Label>
                  <Select
                    value={periodoMes.toString()}
                    onValueChange={(v) => setPeriodoMes(parseInt(v))}
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Año *</Label>
                  <Select
                    value={periodoAnio.toString()}
                    onValueChange={(v) => setPeriodoAnio(parseInt(v))}
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado_total">Pagado Total</SelectItem>
                    <SelectItem value="pagado_parcial">Pagado Parcial</SelectItem>
                    <SelectItem value="declarado_no_pagado">Declarado No Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Declaración</Label>
                  <Input
                    type="date"
                    value={fechaDeclaracion}
                    onChange={(e) => setFechaDeclaracion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Pago</Label>
                  <Input
                    type="date"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
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

        {/* Dialog para gestionar pagos por trabajador */}
        <Dialog open={isWorkerDialogOpen} onOpenChange={setIsWorkerDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestionar Pagos por Trabajador</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => {
                    const payment = workerPayments.find(wp => wp.worker_id === worker.id);
                    return (
                      <TableRow key={worker.id}>
                        <TableCell>{worker.nombre}</TableCell>
                        <TableCell>{worker.rut}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={payment?.pagado || false}
                            onCheckedChange={() => handleToggleWorkerPayment(worker.id, payment?.pagado || false)}
                          />
                        </TableCell>
                        <TableCell>
                          {payment?.fecha_pago
                            ? format(new Date(payment.fecha_pago), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
    </TooltipProvider>
  );
}
