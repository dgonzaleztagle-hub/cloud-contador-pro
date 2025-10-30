import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Clock, CheckCircle2, FileText, Download, Eye, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrdenTrabajo {
  id: string;
  client_id: string;
  descripcion: string;
  estado: 'pendiente' | 'terminada';
  created_at: string;
  updated_at: string;
  clients?: {
    razon_social: string;
    rut: string;
  };
  ot_archivos?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
  }>;
}

export function OrdenesTrabajoSection() {
  const { toast } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrdenes();
  }, []);

  const loadOrdenes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          clients(razon_social, rut),
          ot_archivos(id, file_name, file_path, file_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrdenes((data || []) as OrdenTrabajo[]);
    } catch (error: any) {
      console.error('Error loading OT:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las órdenes de trabajo'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (otId: string, currentEstado: string) => {
    setUpdatingId(otId);
    try {
      const newEstado = currentEstado === 'pendiente' ? 'terminada' : 'pendiente';
      
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: newEstado })
        .eq('id', otId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `La orden fue marcada como ${newEstado}`
      });

      loadOrdenes();
    } catch (error: any) {
      console.error('Error updating estado:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Descarga completa',
        description: `Archivo ${fileName} descargado exitosamente`
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error al descargar',
        description: error.message || 'No se pudo descargar el archivo'
      });
    }
  };

  const viewFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // URL válida por 1 hora

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing file:', error);
      toast({
        variant: 'destructive',
        title: 'Error al visualizar',
        description: error.message || 'No se pudo visualizar el archivo'
      });
    }
  };

  const OrdenCard = ({ orden }: { orden: OrdenTrabajo }) => (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {orden.clients?.razon_social}
              <Badge variant={orden.estado === 'pendiente' ? 'default' : 'secondary'}>
                {orden.estado === 'pendiente' ? (
                  <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Terminada</>
                )}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              RUT: {orden.clients?.rut}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(orden.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor={`switch-${orden.id}`} className="text-xs text-muted-foreground">
              {orden.estado === 'pendiente' ? 'Marcar terminada' : 'Marcar pendiente'}
            </Label>
            <Switch
              id={`switch-${orden.id}`}
              checked={orden.estado === 'terminada'}
              onCheckedChange={() => toggleEstado(orden.id, orden.estado)}
              disabled={updatingId === orden.id}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">Descripción:</Label>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {orden.descripcion}
          </p>
        </div>

        {orden.ot_archivos && orden.ot_archivos.length > 0 && (
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Archivos adjuntos ({orden.ot_archivos.length}):
            </Label>
            <div className="space-y-2">
              {orden.ot_archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{archivo.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {archivo.file_type || 'Archivo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewFile(archivo.file_path, archivo.file_name)}
                      className="hover:bg-primary/10"
                      title="Ver archivo"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(archivo.file_path, archivo.file_name)}
                      className="hover:bg-primary/10"
                      title="Descargar archivo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente');
  const ordenesTerminadas = ordenes.filter(o => o.estado === 'terminada');

  // Agrupar órdenes por cliente
  const groupByClient = (ordenesArray: OrdenTrabajo[]) => {
    const grouped = ordenesArray.reduce((acc, orden) => {
      const clientId = orden.client_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: orden.clients || { razon_social: 'Cliente desconocido', rut: 'N/A' },
          ordenes: []
        };
      }
      acc[clientId].ordenes.push(orden);
      return acc;
    }, {} as Record<string, { client: { razon_social: string; rut: string }, ordenes: OrdenTrabajo[] }>);

    return Object.values(grouped);
  };

  const groupedPendientes = groupByClient(ordenesPendientes);
  const groupedTerminadas = groupByClient(ordenesTerminadas);

  const ClientGroupCard = ({ group, estado }: { group: { client: { razon_social: string; rut: string }, ordenes: OrdenTrabajo[] }, estado: 'pendiente' | 'terminada' }) => {
    const ordenesCount = group.ordenes.length;
    
    if (ordenesCount === 1) {
      // Si solo hay una orden, mostrarla directamente sin acordeón
      return <OrdenCard orden={group.ordenes[0]} />;
    }

    // Si hay múltiples órdenes, agruparlas en un acordeón
    return (
      <Card className="bg-card border-border">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="client-group" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-base">{group.client.razon_social}</p>
                    <p className="text-xs text-muted-foreground">RUT: {group.client.rut}</p>
                  </div>
                </div>
                <Badge variant={estado === 'pendiente' ? 'default' : 'secondary'} className="ml-2">
                  {ordenesCount} {ordenesCount === 1 ? 'orden' : 'órdenes'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-2">
              <div className="space-y-4">
                {group.ordenes.map((orden, idx) => (
                  <div key={orden.id}>
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        Orden #{idx + 1}
                      </Badge>
                    </div>
                    <Card className="bg-secondary/20 border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(orden.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`switch-${orden.id}`} className="text-xs text-muted-foreground">
                              {orden.estado === 'pendiente' ? 'Marcar terminada' : 'Marcar pendiente'}
                            </Label>
                            <Switch
                              id={`switch-${orden.id}`}
                              checked={orden.estado === 'terminada'}
                              onCheckedChange={() => toggleEstado(orden.id, orden.estado)}
                              disabled={updatingId === orden.id}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold">Descripción:</Label>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {orden.descripcion}
                          </p>
                        </div>

                        {orden.ot_archivos && orden.ot_archivos.length > 0 && (
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Archivos adjuntos ({orden.ot_archivos.length}):
                            </Label>
                            <div className="space-y-2">
                              {orden.ot_archivos.map((archivo) => (
                                <div
                                  key={archivo.id}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{archivo.file_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {archivo.file_type || 'Archivo'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => viewFile(archivo.file_path, archivo.file_name)}
                                      className="hover:bg-primary/10"
                                      title="Ver archivo"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadFile(archivo.file_path, archivo.file_name)}
                                      className="hover:bg-primary/10"
                                      title="Descargar archivo"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendientes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes ({ordenesPendientes.length})
          </TabsTrigger>
          <TabsTrigger value="terminadas" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Terminadas ({ordenesTerminadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4 mt-4">
          {groupedPendientes.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay órdenes de trabajo pendientes
              </CardContent>
            </Card>
          ) : (
            groupedPendientes.map((group, idx) => (
              <ClientGroupCard key={`pending-${idx}`} group={group} estado="pendiente" />
            ))
          )}
        </TabsContent>

        <TabsContent value="terminadas" className="space-y-4 mt-4">
          {groupedTerminadas.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay órdenes de trabajo terminadas
              </CardContent>
            </Card>
          ) : (
            groupedTerminadas.map((group, idx) => (
              <ClientGroupCard key={`completed-${idx}`} group={group} estado="terminada" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
