import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, Mail, Navigation, ArrowLeft, Users, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/Footer';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
  nombre_fantasia: string | null;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  correo: string | null;
  giro: string | null;
  activo: boolean;
}

export default function Clients() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && userRole) {
      loadClients();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredClients(clients);
    } else if (filter === 'active') {
      setFilteredClients(clients.filter(c => c.activo));
    } else {
      setFilteredClients(clients.filter(c => !c.activo));
    }
  }, [filter, clients]);

  const loadClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('razon_social', { ascending: true });

    if (data) {
      setClients(data);
    }
    setLoadingClients(false);
  };

  const handleCall = (telefono: string | null) => {
    if (telefono) {
      window.location.href = `tel:${telefono}`;
    }
  };

  const handleEmail = (correo: string | null) => {
    if (correo) {
      window.location.href = `mailto:${correo}`;
    }
  };

  const handleWaze = (direccion: string | null, ciudad: string | null) => {
    if (direccion) {
      const query = ciudad ? `${direccion}, ${ciudad}` : direccion;
      window.open(`https://waze.com/ul?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  if (loading || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = clients.filter(c => c.activo).length;
  const inactiveCount = clients.filter(c => !c.activo).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Agenda de Clientes
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-gradient-to-r from-primary to-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Activos ({activeCount})
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilter('inactive')}
            className={filter === 'inactive' ? 'bg-gradient-to-r from-primary to-accent' : ''}
          >
            <UserX className="h-4 w-4 mr-2" />
            Inactivos ({inactiveCount})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-gradient-to-r from-primary to-accent' : ''}
          >
            Todos ({clients.length})
          </Button>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'active' && 'No hay clientes activos'}
                {filter === 'inactive' && 'No hay clientes inactivos'}
                {filter === 'all' && 'No hay clientes registrados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className={`border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all ${
                  !client.activo ? 'opacity-60' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between gap-2">
                    <span className="text-foreground">{client.razon_social}</span>
                    {!client.activo && (
                      <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-normal">
                        Inactivo
                      </span>
                    )}
                  </CardTitle>
                  {client.nombre_fantasia && (
                    <p className="text-sm text-muted-foreground mt-1">{client.nombre_fantasia}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">RUT:</span>{' '}
                      <span className="text-foreground font-medium">{client.rut}</span>
                    </div>
                    {client.giro && (
                      <div>
                        <span className="text-muted-foreground">Giro:</span>{' '}
                        <span className="text-foreground text-xs">{client.giro}</span>
                      </div>
                    )}
                    {client.direccion && (
                      <div>
                        <span className="text-muted-foreground">Dirección:</span>{' '}
                        <span className="text-foreground">
                          {client.direccion}
                          {client.ciudad && `, ${client.ciudad}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(client.telefono)}
                      disabled={!client.telefono}
                      className={!client.telefono ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Llamar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(client.correo)}
                      disabled={!client.correo}
                      className={!client.correo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWaze(client.direccion, client.ciudad)}
                      disabled={!client.direccion}
                      className={!client.direccion ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" />
                      Waze
                    </Button>
                  </div>

                  {/* Missing data indicators */}
                  {(!client.telefono || !client.correo || !client.direccion) && (
                    <div className="text-xs text-destructive pt-2">
                      Faltan datos:{' '}
                      {[
                        !client.telefono && 'teléfono',
                        !client.correo && 'correo',
                        !client.direccion && 'dirección',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
