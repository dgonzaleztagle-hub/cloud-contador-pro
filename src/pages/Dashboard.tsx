import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, DollarSign, Calendar, Users, LogOut, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Footer } from '@/components/Footer';

export default function Dashboard() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [uf, setUf] = useState('37.456,78');
  const [utm, setUtm] = useState('67.210');
  const [dollar, setDollar] = useState('985,45');
  const [clientsCount, setClientsCount] = useState({ total: 0, activos: 0, inactivos: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && userRole) {
      // Fetch clients count
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase
          .from('clients')
          .select('activo', { count: 'exact' })
          .then(({ data, count, error }) => {
            if (error) {
              console.error('Error fetching clients:', error);
              return;
            }
            if (data) {
              const activos = data.filter(c => c.activo).length;
              const inactivos = data.filter(c => !c.activo).length;
              setClientsCount({ total: count || 0, activos, inactivos });
              console.log('Clients loaded:', { total: count, activos, inactivos });
            }
          });
      });
    }
  }, [user, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header con datos en tiempo real */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Plus Contable
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(currentDateTime, "EEEE, d 'de' MMMM 'de' yyyy • HH:mm:ss", { locale: es })}
              </p>
            </div>
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="text-muted-foreground">UF</p>
                  <p className="font-semibold text-foreground">${uf}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="text-muted-foreground">UTM</p>
                  <p className="font-semibold text-foreground">${utm}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Dólar</p>
                  <p className="font-semibold text-foreground">${dollar}</p>
                </div>
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Bienvenido
            </h2>
            <p className="text-muted-foreground">
              Rol: <span className="text-primary font-semibold capitalize">{userRole}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes Activos
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{clientsCount.activos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {clientsCount.inactivos} inactivos
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Declaraciones F29
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">0</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  RRHH
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">0</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Trabajadores registrados
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Documentos
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">0</div>
                <p className="text-xs text-muted-foreground mt-1">
                  PDFs almacenados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/clients')}
                className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group"
              >
                <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Agenda de Clientes</h3>
                <p className="text-sm text-muted-foreground">Gestiona tus clientes</p>
              </button>
              <button className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group">
                <TrendingUp className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Declaraciones F29</h3>
                <p className="text-sm text-muted-foreground">Gestión de impuestos</p>
              </button>
              <button className="p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all text-left group">
                <Calendar className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Recursos Humanos</h3>
                <p className="text-sm text-muted-foreground">Gestión de RRHH</p>
              </button>
            </CardContent>
          </Card>

          {/* Admin Section - Solo para Master */}
          {userRole === 'master' && (
            <Card className="border-border bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Administración Master
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="p-6 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all text-left group"
                >
                  <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-foreground mb-1">Gestión de Usuarios</h3>
                  <p className="text-sm text-muted-foreground">Crear y administrar usuarios</p>
                </button>
                <button className="p-6 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all text-left group">
                  <Settings className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-foreground mb-1">Configuración</h3>
                  <p className="text-sm text-muted-foreground">Opciones avanzadas</p>
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
