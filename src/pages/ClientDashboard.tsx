import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Users, DollarSign, ClipboardList, BookOpen, LogOut, TrendingUp, Calendar, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import NotificationBell from '@/components/NotificationBell';
import { OrdenTrabajoDialog } from '@/components/OrdenTrabajoDialog';
import logo from '@/assets/logo.png';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientData {
  id: string;
  razon_social: string;
  rut: string;
  saldo_honorarios_pendiente: number;
}

export default function ClientDashboard() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isOTDialogOpen, setIsOTDialogOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [stats, setStats] = useState({
    trabajadores: 0,
    f29_mes: 0,
    cotizaciones_mes: 0,
    documentos: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && userRole && userRole !== 'viewer') {
      navigate('/dashboard');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'viewer') {
      loadClientData();
    }
  }, [user, userRole]);

  const loadClientData = async () => {
    try {
      setLoadingData(true);
      
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, razon_social, rut, saldo_honorarios_pendiente')
        .eq('user_id', user?.id)
        .eq('activo', true)
        .single();

      if (clientError) throw clientError;
      setClientData(client);

      if (!client) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se encontró información de cliente asociada a tu cuenta'
        });
        return;
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { count: trabajadoresCount } = await supabase
        .from('rrhh_workers')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('activo', true);

      const { count: f29Count } = await supabase
        .from('f29_declarations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('periodo_mes', currentMonth)
        .eq('periodo_anio', currentYear);

      const { count: cotizacionesCount } = await supabase
        .from('cotizaciones_previsionales')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('periodo_mes', currentMonth)
        .eq('periodo_anio', currentYear);

      const { count: documentosCount } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      setStats({
        trabajadores: trabajadoresCount || 0,
        f29_mes: f29Count || 0,
        cotizaciones_mes: cotizacionesCount || 0,
        documentos: documentosCount || 0
      });

    } catch (error: any) {
      console.error('Error loading client data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos'
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No se encontró información de cliente</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Portal del Cliente</h1>
                <p className="text-sm text-muted-foreground">{clientData.razon_social}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="space-y-6">
          {/* Fecha y Hora */}
          <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  {format(currentDateTime, 'HH:mm:ss')}
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  {format(currentDateTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trabajadores
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.trabajadores}</div>
                <p className="text-xs text-muted-foreground mt-1">Activos</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  F29 Mes Actual
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.f29_mes}</div>
                <p className="text-xs text-muted-foreground mt-1">Declaraciones</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cotizaciones
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.cotizaciones_mes}</div>
                <p className="text-xs text-muted-foreground mt-1">Mes actual</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Documentos
                </CardTitle>
                <BookOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.documentos}</div>
                <p className="text-xs text-muted-foreground mt-1">Archivos</p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Acciones Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate(`/rrhh?clientId=${clientData.id}`)}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Recursos Humanos</h3>
                <p className="text-sm text-muted-foreground">Gestionar trabajadores y eventos</p>
              </button>

              <button 
                onClick={() => navigate('/f29')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <FileText className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Declaraciones F29</h3>
                <p className="text-sm text-muted-foreground">Ver declaraciones mensuales</p>
              </button>

              <button 
                onClick={() => navigate('/f22')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <FileText className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Declaraciones F22</h3>
                <p className="text-sm text-muted-foreground">Ver declaraciones anuales</p>
              </button>

              <button 
                onClick={() => navigate('/honorarios')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <DollarSign className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Honorarios</h3>
                <p className="text-sm text-muted-foreground">Ver honorarios pendientes y pagados</p>
              </button>

              <button 
                onClick={() => navigate('/cotizaciones')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <Calendar className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Cotizaciones</h3>
                <p className="text-sm text-muted-foreground">Trazabilidad de cotizaciones</p>
              </button>

              <button 
                onClick={() => navigate('/documents')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <BookOpen className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Documentos</h3>
                <p className="text-sm text-muted-foreground">Ver documentos (solo lectura)</p>
              </button>

              <button 
                onClick={() => setIsOTDialogOpen(true)}
                className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 transition-all text-left group hover:scale-105"
              >
                <ClipboardList className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Nueva Orden de Trabajo</h3>
                <p className="text-sm text-muted-foreground">Enviar solicitud de trabajo</p>
              </button>

              <button 
                onClick={() => navigate(`/client/${clientData.id}`)}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <Building2 className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Mi Ficha</h3>
                <p className="text-sm text-muted-foreground">Ver datos de la empresa</p>
              </button>
            </CardContent>
          </Card>

          {/* Honorarios Pendientes */}
          {clientData.saldo_honorarios_pendiente > 0 && (
            <Card className="border-border bg-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                  Honorarios Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  ${clientData.saldo_honorarios_pendiente.toLocaleString('es-CL')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Monto pendiente de pago
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <OrdenTrabajoDialog
        clientId={clientData.id}
        clientName={clientData.razon_social}
        isOpen={isOTDialogOpen}
        onClose={() => setIsOTDialogOpen(false)}
        onSuccess={loadClientData}
      />

      <Footer />
    </div>
  );
}
