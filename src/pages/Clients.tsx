import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Phone, Mail, ArrowLeft, Building2, UserX, Eye, Search, X, Briefcase, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/Footer';
import { ClientDialog } from '@/components/ClientDialog';
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
  saldo_honorarios_pendiente: number;
}

interface ClientWithSaldo extends Client {
  saldo_total_honorarios: number;
}

export default function Clients() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithSaldo[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithSaldo[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickViewClient, setQuickViewClient] = useState<ClientWithSaldo | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleClientClick = (client: ClientWithSaldo) => {
    navigate(`/clients/${client.id}`);
  };

  const handleQuickView = (client: ClientWithSaldo, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que abra la página completa
    setQuickViewClient(client);
    setIsQuickViewOpen(true);
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
        console.log('✅ Clientes cargados:', { total: count, data_length: data?.length });
        const clientsData = Array.isArray(data) ? data : [];
        
        // Calcular saldo total de honorarios para cada cliente
        const clientsWithSaldo = await Promise.all(
          clientsData.map(async (client) => {
            // Obtener declaraciones F29 con honorarios pendientes
            const { data: declarations, error: declError } = await supabase
              .from('f29_declarations')
              .select('honorarios, estado_honorarios')
              .eq('client_id', client.id)
              .eq('estado_honorarios', 'pendiente');

            if (declError) {
              console.error('Error cargando declaraciones:', declError);
              return {
                ...client,
                saldo_total_honorarios: client.saldo_honorarios_pendiente || 0
              };
            }

            // Sumar honorarios pendientes
            const honorariosPendientes = declarations?.reduce(
              (sum, decl) => sum + (decl.honorarios || 0),
              0
            ) || 0;

            return {
              ...client,
              saldo_total_honorarios: (client.saldo_honorarios_pendiente || 0) + honorariosPendientes
            };
          })
        );
        
        console.log('📊 Datos procesados con saldos:', { length: clientsWithSaldo.length });
        setClients(clientsWithSaldo);
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

  const handleRRHH = (clientId: string) => {
    // Navegar a RRHH con el cliente preseleccionado
    navigate('/rrhh', { state: { clientId } });
  };

  const handleDownloadFullPDF = (client: ClientWithSaldo, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Ficha de Cliente', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Información básica
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información Básica', 15, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const addField = (label: string, value: string | null | undefined | number | boolean) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${label}: ${value || 'N/A'}`, 15, yPos);
      yPos += 6;
    };

    addField('Razón Social', client.razon_social);
    addField('RUT', client.rut);
    addField('Estado', client.activo ? 'Activo' : 'Inactivo');
    addField('Valor Mensualidad', client.valor);
    addField('Saldo Honorarios Pendiente', client.saldo_total_honorarios.toString());
    yPos += 5;

    // Datos de contacto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Datos de Contacto', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Dirección', client.direccion);
    addField('Ciudad', client.ciudad);
    addField('Región', client.region);
    addField('Email', client.email);
    addField('Teléfono', client.fono);
    yPos += 5;

    // Información tributaria
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Información Tributaria', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Código Actividad', client.cod_actividad);
    addField('Giro', client.giro);
    addField('Régimen Tributario', client.regimen_tributario);
    addField('Contabilidad', client.contabilidad);
    addField('Fecha Incorporación', client.fecha_incorporacion);
    yPos += 5;

    // Representante legal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Representante Legal', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Representante Legal', client.representante_legal);
    addField('RUT Representante', client.rut_representante);
    addField('Clave SII Representante', client.clave_sii_repr);
    addField('Clave Certificado', client.clave_certificado);
    addField('Clave Única', client.clave_unica);
    yPos += 5;

    // Accesos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Accesos', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Clave SII', client.clave_sii);
    addField('Previred', client.previred);
    addField('Portal Electrónico', client.portal_electronico);
    yPos += 5;

    // Observaciones
    if (client.observacion_1 || client.observacion_2 || client.observacion_3) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Observaciones', 15, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      if (client.observacion_1) {
        addField('Observación 1', client.observacion_1);
      }
      if (client.observacion_2) {
        addField('Observación 2', client.observacion_2);
      }
      if (client.observacion_3) {
        addField('Observación 3', client.observacion_3);
      }
    }

    // Guardar PDF
    doc.save(`Ficha_${client.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

    toast({
      title: 'PDF generado',
      description: 'La ficha completa del cliente se ha descargado correctamente',
    });
  };

  const handleDownloadSimplifiedPDF = () => {
    if (!quickViewClient) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Vista Simplificada - Cliente', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const addField = (label: string, value: string | null | undefined) => {
      doc.text(`${label}: ${value || 'N/A'}`, 15, yPos);
      yPos += 6;
    };

    // Datos de la Empresa
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos de la Empresa', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Razón Social', quickViewClient.razon_social);
    addField('RUT', quickViewClient.rut);
    addField('Clave SII', quickViewClient.clave_sii);
    yPos += 5;

    // Representante Legal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Representante Legal', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addField('Nombre', quickViewClient.representante_legal);
    addField('RUT', quickViewClient.rut_representante);
    addField('Clave SII', quickViewClient.clave_sii_repr);
    addField('Clave Certificado', quickViewClient.clave_certificado);
    addField('Clave Única', quickViewClient.clave_unica);

    // Guardar PDF
    doc.save(`Vista_Simplificada_${quickViewClient.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

    toast({
      title: 'PDF generado',
      description: 'La vista simplificada se ha descargado correctamente',
    });
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
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Agenda de Clientes
              </h1>
            </div>
            {(userRole === 'master' || userRole === 'contador') && (
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
            <Building2 className="h-4 w-4 mr-2" />
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
                className={`border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden ${
                  !client.activo ? 'opacity-60' : ''
                }`}
              >
                {/* Área clickeable - toda la información */}
                <div 
                  onClick={() => handleClientClick(client)}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
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
                  <CardContent className="space-y-2">
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
                      
                      {/* Saldo de Honorarios */}
                      {client.saldo_total_honorarios > 0 && (
                        <div className="pt-2 border-t border-border">
                          <span className="text-muted-foreground">Saldo Honorarios:</span>{' '}
                          <span className={`font-bold ${
                            client.saldo_total_honorarios > 0 ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            ${client.saldo_total_honorarios.toLocaleString('es-CL')}
                          </span>
                        </div>
                      )}
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
                </div>

                {/* Botones de acción - NO clickeables con el card */}
                <CardContent className="pt-0">
                  <div className="flex gap-2 pt-4 border-t border-border">
                    {/* Botón de Vista Simplificada */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleQuickView(client, e)}
                      className="hover:bg-primary/10"
                      title="Vista Simplificada"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    {/* Botón de Descarga Ficha Completa */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleDownloadFullPDF(client, e)}
                      className="hover:bg-primary/10"
                      title="Descargar Ficha"
                    >
                      <Download className="h-3.5 w-3.5" />
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
                      title="Llamar"
                    >
                      <Phone className="h-3.5 w-3.5" />
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
                      title="Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRRHH(client.id);
                      }}
                      className="hover:bg-primary/10"
                      title="RRHH"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Quick View Dialog */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Vista Simplificada - {quickViewClient?.razon_social}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Datos de la Empresa */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary uppercase">Datos de la Empresa</h3>
              <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                <div>
                  <Label className="text-xs text-muted-foreground">RUT</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.rut || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clave SII</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.clave_sii || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Datos del Representante Legal */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary uppercase">Representante Legal</h3>
              <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.representante_legal || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">RUT</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.rut_representante || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clave SII</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.clave_sii_repr || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clave Certificado</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.clave_certificado || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clave Única</Label>
                  <p className="font-medium text-foreground">{quickViewClient?.clave_unica || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDownloadSimplifiedPDF}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button
                onClick={() => navigate(`/clients/${quickViewClient?.id}`)}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                Ver Detalles Completos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}