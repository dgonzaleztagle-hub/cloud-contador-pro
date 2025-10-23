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
import { Loader2, ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
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
  honorarios: number;
  retencion_2cat: number;
  impuesto_unico: number;
  remanente_anterior: number;
  remanente_proximo: number;
  total_impuestos: number;
  total_general: number;
  observaciones: string | null;
  created_at: string;
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

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [ivaVentas, setIvaVentas] = useState('0');
  const [ivaCompras, setIvaCompras] = useState('0');
  const [ppm, setPpm] = useState('0');
  const [honorarios, setHonorarios] = useState('0');
  const [retencion2cat, setRetencion2cat] = useState('0');
  const [impuestoUnico, setImpuestoUnico] = useState('0');
  const [remanenteAnterior, setRemanenteAnterior] = useState('0');
  const [observaciones, setObservaciones] = useState('');

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

    // Load clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, rut, razon_social')
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

    // Load F29 declarations
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

  const calculateTotals = () => {
    const ventas = parseFloat(ivaVentas) || 0;
    const compras = parseFloat(ivaCompras) || 0;
    const ivaNeto = ventas - compras;
    const ppmVal = parseFloat(ppm) || 0;
    const honorariosVal = parseFloat(honorarios) || 0;
    const retencionVal = parseFloat(retencion2cat) || 0;
    const impuestoVal = parseFloat(impuestoUnico) || 0;
    const remanenteAnt = parseFloat(remanenteAnterior) || 0;

    const totalImpuestos = ppmVal + honorariosVal + retencionVal + impuestoVal;
    const totalGeneral = ivaNeto + totalImpuestos - remanenteAnt;
    const remanenteProx = totalGeneral < 0 ? Math.abs(totalGeneral) : 0;

    return {
      ivaNeto,
      totalImpuestos,
      totalGeneral: Math.max(0, totalGeneral),
      remanenteProximo: remanenteProx,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const { error } = await supabase.from('f29_declarations').insert({
      client_id: selectedClientId,
      periodo_mes: mes,
      periodo_anio: anio,
      iva_ventas: parseFloat(ivaVentas) || 0,
      iva_compras: parseFloat(ivaCompras) || 0,
      iva_neto: totals.ivaNeto,
      ppm: parseFloat(ppm) || 0,
      honorarios: parseFloat(honorarios) || 0,
      retencion_2cat: parseFloat(retencion2cat) || 0,
      impuesto_unico: parseFloat(impuestoUnico) || 0,
      remanente_anterior: parseFloat(remanenteAnterior) || 0,
      remanente_proximo: totals.remanenteProximo,
      total_impuestos: totals.totalImpuestos,
      total_general: totals.totalGeneral,
      observaciones: observaciones || null,
      created_by: user?.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la declaración',
      });
    } else {
      toast({
        title: 'Declaración guardada',
        description: 'La declaración F29 se guardó exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setIvaVentas('0');
    setIvaCompras('0');
    setPpm('0');
    setHonorarios('0');
    setRetencion2cat('0');
    setImpuestoUnico('0');
    setRemanenteAnterior('0');
    setObservaciones('');
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

  const totals = calculateTotals();
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const canModify = userRole === 'master' || userRole === 'admin';

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Declaraciones F29
              </h1>
            </div>
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
                    <DialogTitle>Nueva Declaración F29</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Cliente</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
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
                        <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
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
                          onChange={(e) => setAnio(parseInt(e.target.value))}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">IVA</h3>
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
                          <Label>PPM</Label>
                          <Input
                            type="number"
                            value={ppm}
                            onChange={(e) => setPpm(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Honorarios</Label>
                          <Input
                            type="number"
                            value={honorarios}
                            onChange={(e) => setHonorarios(e.target.value)}
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
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Declaraciones F29 ({declarations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {declarations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay declaraciones registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {declarations.map((declaration) => (
                  <div
                    key={declaration.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {declaration.clients?.razon_social || 'Cliente'}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {meses[declaration.periodo_mes - 1]} {declaration.periodo_anio}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">IVA Neto:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${declaration.iva_neto.toLocaleString('es-CL')}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
