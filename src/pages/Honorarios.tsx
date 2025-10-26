import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
  valor: string;
}

interface Honorario {
  id: string;
  client_id: string;
  periodo_mes: number;
  periodo_anio: number;
  monto: number;
  saldo_pendiente_anterior: number;
  total_con_saldo: number;
  estado: 'pendiente' | 'pagado' | 'parcial';
  monto_pagado: number;
  saldo_actual: number;
  fecha_pago: string | null;
  notas: string | null;
  created_at: string;
  clients?: { rut: string; razon_social: string };
}

interface HonorariosSummary {
  total_facturado: number;
  total_pendiente: number;
  total_pagado: number;
  total_parcial: number;
  cantidad_pendiente: number;
  cantidad_pagado: number;
  cantidad_parcial: number;
}

export default function Honorarios() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [summary, setSummary] = useState<HonorariosSummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filtros
  const [filterMes, setFilterMes] = useState(new Date().getMonth() + 1);
  const [filterAnio, setFilterAnio] = useState(new Date().getFullYear());
  const [filterEstado, setFilterEstado] = useState<string>('all');
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [monto, setMonto] = useState('');
  const [saldoPendienteAnterior, setSaldoPendienteAnterior] = useState('0');
  const [estado, setEstado] = useState<'pendiente' | 'pagado' | 'parcial'>('pendiente');
  const [montoPagado, setMontoPagado] = useState('0');
  const [fechaPago, setFechaPago] = useState('');
  const [notas, setNotas] = useState('');

  const canModify = userRole === 'master' || userRole === 'admin';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterMes, filterAnio, filterEstado]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, rut, razon_social, valor')
        .eq('activo', true)
        .order('razon_social');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Cargar honorarios del período
      let query = supabase
        .from('honorarios')
        .select(`
          *,
          clients(rut, razon_social)
        `)
        .eq('periodo_mes', filterMes)
        .eq('periodo_anio', filterAnio)
        .order('created_at', { ascending: false });

      if (filterEstado !== 'all') {
        query = query.eq('estado', filterEstado);
      }

      const { data: honorariosData, error: honorariosError } = await query;

      if (honorariosError) throw honorariosError;
      setHonorarios((honorariosData as any) || []);

      // Cargar resumen del período
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_honorarios_summary', {
          p_mes: filterMes,
          p_anio: filterAnio
        })
        .single();

      if (!summaryError && summaryData) {
        setSummary(summaryData);
      }

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cargar los datos',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un cliente',
      });
      return;
    }

    setIsSaving(true);

    const honorarioData = {
      client_id: selectedClientId,
      periodo_mes: filterMes,
      periodo_anio: filterAnio,
      monto: parseFloat(monto) || 0,
      saldo_pendiente_anterior: parseFloat(saldoPendienteAnterior) || 0,
      estado,
      monto_pagado: parseFloat(montoPagado) || 0,
      fecha_pago: fechaPago || null,
      notas: notas || null,
    };

    let error;
    if (editingId) {
      const result = await supabase
        .from('honorarios')
        .update(honorarioData)
        .eq('id', editingId);
      error = result.error;
    } else {
      const result = await supabase
        .from('honorarios')
        .insert(honorarioData);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar el honorario',
      });
    } else {
      toast({
        title: editingId ? 'Honorario actualizado' : 'Honorario registrado',
        description: 'Los datos se guardaron exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleEdit = (honorario: Honorario) => {
    setEditingId(honorario.id);
    setSelectedClientId(honorario.client_id);
    setMonto(honorario.monto.toString());
    setSaldoPendienteAnterior(honorario.saldo_pendiente_anterior.toString());
    setEstado(honorario.estado);
    setMontoPagado(honorario.monto_pagado.toString());
    setFechaPago(honorario.fecha_pago || '');
    setNotas(honorario.notas || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const { error } = await supabase
        .from('honorarios')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar el registro',
        });
      } else {
        toast({
          title: 'Registro eliminado',
          description: 'El honorario se eliminó exitosamente',
        });
        loadData();
      }
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client && client.valor) {
      setMonto(client.valor);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedClientId('');
    setMonto('');
    setSaldoPendienteAnterior('0');
    setEstado('pendiente');
    setMontoPagado('0');
    setFechaPago('');
    setNotas('');
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Pagado</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Parcial</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Control de Honorarios</h1>
              <p className="text-sm text-muted-foreground">Gestión mensual de honorarios por cliente</p>
            </div>

            {canModify && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                    <Plus className="h-4 w-4" />
                    Nuevo Honorario
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Honorario' : 'Nuevo Honorario'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Cliente *</Label>
                      <Select 
                        value={selectedClientId} 
                        onValueChange={handleClientChange}
                        disabled={!!editingId}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.razon_social} - {client.rut}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        El monto se completa automáticamente con el valor del cliente
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monto del Mes *</Label>
                        <Input
                          type="number"
                          value={monto}
                          onChange={(e) => setMonto(e.target.value)}
                          placeholder="0"
                          required
                          min="0"
                          step="0.01"
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <Label>Saldo Pendiente Anterior</Label>
                        <Input
                          type="number"
                          value={saldoPendienteAnterior}
                          onChange={(e) => setSaldoPendienteAnterior(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="bg-input border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Deuda de períodos anteriores
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Estado *</Label>
                        <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="parcial">Pago Parcial</SelectItem>
                            <SelectItem value="pagado">Pagado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Monto Pagado</Label>
                        <Input
                          type="number"
                          value={montoPagado}
                          onChange={(e) => setMontoPagado(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Fecha de Pago</Label>
                      <Input
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>

                    <div>
                      <Label>Notas</Label>
                      <Textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Observaciones adicionales..."
                        className="bg-input border-border"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>{editingId ? 'Actualizar' : 'Guardar'}</>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Resumen del período */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${Number(summary.total_facturado).toLocaleString('es-CL')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${Number(summary.total_pendiente).toLocaleString('es-CL')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.cantidad_pendiente} cliente(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pagado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${Number(summary.total_pagado).toLocaleString('es-CL')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.cantidad_pagado} cliente(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pago Parcial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${Number(summary.total_parcial).toLocaleString('es-CL')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.cantidad_parcial} cliente(s)
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Mes</Label>
                  <Select value={filterMes.toString()} onValueChange={(v) => setFilterMes(parseInt(v))}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((mes, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>
                          {mes}
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
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado</Label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="parcial">Pagos Parciales</SelectItem>
                      <SelectItem value="pagado">Pagados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de honorarios */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                Honorarios de {meses[filterMes - 1]} {filterAnio}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {honorarios.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No hay honorarios registrados para este período
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {honorarios.map((honorario) => (
                    <div
                      key={honorario.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {honorario.clients?.razon_social}
                          </h3>
                          {getEstadoBadge(honorario.estado)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          RUT: {honorario.clients?.rut}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monto mes:</span>
                            <div className="font-medium">${Number(honorario.monto).toLocaleString('es-CL')}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Saldo anterior:</span>
                            <div className="font-medium">${Number(honorario.saldo_pendiente_anterior).toLocaleString('es-CL')}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <div className="font-medium">${Number(honorario.total_con_saldo).toLocaleString('es-CL')}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Saldo actual:</span>
                            <div className="font-medium text-primary">${Number(honorario.saldo_actual).toLocaleString('es-CL')}</div>
                          </div>
                        </div>
                        {honorario.notas && (
                          <div className="text-xs text-muted-foreground mt-2">
                            📝 {honorario.notas}
                          </div>
                        )}
                      </div>

                      {canModify && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(honorario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(honorario.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
