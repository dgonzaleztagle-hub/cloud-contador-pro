import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
}

interface Worker {
  id: string;
  client_id: string;
  rut: string;
  nombre: string;
  periodo_mes: number;
  periodo_anio: number;
  atrasos: number;
  permisos: number;
  faltas: number;
  anticipo: number;
  plazo_contrato: string | null;
  created_at: string;
  clients?: { rut: string; razon_social: string };
}

export default function RRHH() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [workerRut, setWorkerRut] = useState('');
  const [workerNombre, setWorkerNombre] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [atrasos, setAtrasos] = useState('0');
  const [permisos, setPermisos] = useState('0');
  const [faltas, setFaltas] = useState('0');
  const [anticipo, setAnticipo] = useState('0');
  const [plazoContrato, setPlazoContrato] = useState('');

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

    // Load workers
    const { data: workersData, error: workersError } = await supabase
      .from('rrhh_workers')
      .select('*, clients(rut, razon_social)')
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes', { ascending: false });

    if (workersError) {
      console.error('Error loading workers:', workersError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los trabajadores',
      });
    } else {
      setWorkers(workersData || []);
    }

    setLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !workerRut || !workerNombre) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Completa todos los campos obligatorios',
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from('rrhh_workers').insert({
      client_id: selectedClientId,
      rut: workerRut,
      nombre: workerNombre,
      periodo_mes: mes,
      periodo_anio: anio,
      atrasos: parseFloat(atrasos) || 0,
      permisos: parseFloat(permisos) || 0,
      faltas: parseFloat(faltas) || 0,
      anticipo: parseFloat(anticipo) || 0,
      plazo_contrato: plazoContrato || null,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el trabajador',
      });
    } else {
      toast({
        title: 'Trabajador guardado',
        description: 'El registro del trabajador se guardó exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setWorkerRut('');
    setWorkerNombre('');
    setAtrasos('0');
    setPermisos('0');
    setFaltas('0');
    setAnticipo('0');
    setPlazoContrato('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const { error } = await supabase.from('rrhh_workers').delete().eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar el registro',
        });
      } else {
        toast({
          title: 'Registro eliminado',
          description: 'El registro se eliminó exitosamente',
        });
        loadData();
      }
    }
  };

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
                Recursos Humanos
              </h1>
            </div>
            {canModify && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Trabajador
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nuevo Registro de Trabajador</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Cliente *</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>RUT Trabajador *</Label>
                        <Input
                          value={workerRut}
                          onChange={(e) => setWorkerRut(e.target.value)}
                          placeholder="12345678-9"
                          required
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <Label>Nombre Completo *</Label>
                        <Input
                          value={workerNombre}
                          onChange={(e) => setWorkerNombre(e.target.value)}
                          placeholder="Juan Pérez"
                          required
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                      <h3 className="font-semibold text-foreground">Novedades</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Atrasos ($)</Label>
                          <Input
                            type="number"
                            value={atrasos}
                            onChange={(e) => setAtrasos(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Permisos ($)</Label>
                          <Input
                            type="number"
                            value={permisos}
                            onChange={(e) => setPermisos(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Faltas ($)</Label>
                          <Input
                            type="number"
                            value={faltas}
                            onChange={(e) => setFaltas(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label>Anticipo ($)</Label>
                          <Input
                            type="number"
                            value={anticipo}
                            onChange={(e) => setAnticipo(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Plazo de Contrato</Label>
                      <Input
                        type="date"
                        value={plazoContrato}
                        onChange={(e) => setPlazoContrato(e.target.value)}
                        className="bg-input border-border"
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
                        'Guardar Registro'
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
            <CardTitle>Trabajadores Registrados ({workers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay trabajadores registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{worker.nombre}</h3>
                        <span className="text-sm text-muted-foreground">{worker.rut}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {worker.clients?.razon_social || 'Cliente'} • {meses[worker.periodo_mes - 1]} {worker.periodo_anio}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-muted-foreground">Atrasos:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${worker.atrasos.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Permisos:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${worker.permisos.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faltas:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${worker.faltas.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Anticipo:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            ${worker.anticipo.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      {worker.plazo_contrato && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Contrato hasta:</span>{' '}
                          {new Date(worker.plazo_contrato).toLocaleDateString('es-CL')}
                        </p>
                      )}
                    </div>
                    {canModify && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(worker.id)}
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
