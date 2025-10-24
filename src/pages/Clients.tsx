import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Phone, Mail, Navigation, ArrowLeft, Users, UserX, Eye, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/Footer';
import { ClientDialog } from '@/components/ClientDialog';
import { ClientEditDialog } from '@/components/ClientEditDialog';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
  valor: string | null;
  clave_sii: string | null;
  clave_certificado: string | null;
  direccion: string | null;
  ciudad: string | null;
  email: string | null;
  fono: string | null;
  cod_actividad: string | null;
  giro: string | null;
  regimen_tributario: string | null;
  contabilidad: string | null;
  fecha_incorporacion: string | null;
  representante_legal: string | null;
  rut_representante: string | null;
  clave_sii_repr: string | null;
  clave_unica: string | null;
  previred: string | null;
  portal_electronico: string | null;
  region: string | null;
  observacion_1: string | null;
  observacion_2: string | null;
  observacion_3: string | null;
  activo: boolean;
}

export default function Clients() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedClient(null);
  };

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

  // Función para normalizar texto (quitar tildes y pasar a minúsculas)
  const normalizeText = (text: string): string => {
    if (!text) return '';
    try {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    } catch (e) {
      // Fallback para navegadores que no soportan normalize
      return text.toLowerCase();
    }
  };

  useEffect(() => {
    try {
      console.log('🔄 Aplicando filtros...', { 
        totalClients: clients.length, 
        filter, 
        searchTerm: searchTerm.substring(0, 20) 
      });
      
      let filtered = [...clients];
      
      // Aplicar filtro de estado
      if (filter === 'active') {
        filtered = filtered.filter(c => c && c.activo === true);
      } else if (filter === 'inactive') {
        filtered = filtered.filter(c => c && c.activo === false);
      }

      // Aplicar búsqueda si hay término
      if (searchTerm && searchTerm.trim()) {
        const normalizedSearch = normalizeText(searchTerm.trim());
        filtered = filtered.filter((client) => {
          if (!client) return false;
          try {
            const razonSocial = normalizeText(client.razon_social || '');
            const rutEmpresa = normalizeText(client.rut || '');
            const nombreRepLegal = normalizeText(client.representante_legal || '');
            const rutRepLegal = normalizeText(client.rut_representante || '');

            return (
              razonSocial.includes(normalizedSearch) ||
              rutEmpresa.includes(normalizedSearch) ||
              nombreRepLegal.includes(normalizedSearch) ||
              rutRepLegal.includes(normalizedSearch)
            );
          } catch (e) {
            console.error('Error en filtro de búsqueda:', e);
            return true;
          }
        });
      }

      console.log('✅ Filtros aplicados:', { resultados: filtered.length });
      setFilteredClients(filtered);
    } catch (err) {
      console.error('💥 Error en useEffect de filtros:', err);
      setFilteredClients([]);
    }
  }, [filter, clients, searchTerm]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      console.log('🔍 Cargando clientes...', { user: user?.email, role: userRole });
      
      const { data, error, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('razon_social', { ascending: true });

      if (error) {
        console.error('❌ Error cargando clientes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes. Por favor, recarga la página.",
          variant: "destructive",
        });
        setClients([]);
      } else {
        console.log('✅ Clientes cargados:', { total: count, data_length: data?.length, sample: data?.[0] });
        const clientsData = Array.isArray(data) ? data : [];
        console.log('📊 Datos procesados:', { isArray: Array.isArray(clientsData), length: clientsData.length });
        setClients(clientsData);
      }
    } catch (err) {
      console.error('💥 Excepción cargando clientes:', err);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar los clientes.",
        variant: "destructive",
      });
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleCall = (fono: string | null) => {
    if (fono) {
      window.location.href = `tel:${fono}`;
    }
  };

  const handleEmail = (email: string | null) => {
    if (email) {
      window.location.href = `mailto:${email}`;
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
                Agenda de Clientes
              </h1>
            </div>
            {(userRole === 'master' || userRole === 'admin') && (
              <ClientDialog onClientCreated={loadClients} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por empresa, cliente o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>

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
                {searchTerm ? (
                  <>No se encontraron clientes que coincidan con "{searchTerm}"</>
                ) : (
                  <>
                    {filter === 'active' && 'No hay clientes activos'}
                    {filter === 'inactive' && 'No hay clientes inactivos'}
                    {filter === 'all' && 'No hay clientes registrados'}
                  </>
                )}
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
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(client);
                      }}
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(client.fono);
                      }}
                      disabled={!client.fono}
                      className={!client.fono ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Llamar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmail(client.email);
                      }}
                      disabled={!client.email}
                      className={!client.email ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWaze(client.direccion, client.ciudad);
                      }}
                      disabled={!client.direccion}
                      className={!client.direccion ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" />
                      Waze
                    </Button>
                  </div>

                  {/* Missing data indicators */}
                  {(!client.fono || !client.email || !client.direccion) && (
                    <div className="text-xs text-destructive pt-2">
                      Faltan datos:{' '}
                      {[
                        !client.fono && 'fono',
                        !client.email && 'email',
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
      
      <ClientEditDialog
        client={selectedClient}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onClientUpdated={loadClients}
        userRole={userRole}
      />
      
      <Footer />
    </div>
  );
}