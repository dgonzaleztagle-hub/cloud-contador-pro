import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, CheckCircle2, FileText, Download, Eye, Plus, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrdenTrabajoDialog } from './OrdenTrabajoDialog';

interface OrdenTrabajo {
  id: string;
  client_id: string;
  descripcion: string;
  estado: 'pendiente' | 'terminada';
  folio: number;
  comentario_cierre?: string | null;
  created_at: string;
  updated_at: string;
  ot_archivos?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
  }>;
}

interface ClientOTSectionProps {
  clientId: string;
  clientName: string;
}

export function ClientOTSection({ clientId, clientName }: ClientOTSectionProps) {
  const { toast } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadOrdenes();
  }, [clientId]);

  const loadOrdenes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          ot_archivos(id, file_name, file_path, file_type)
        `)
        .eq('client_id', clientId)
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
        .createSignedUrl(filePath, 3600);

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
              <Badge variant="outline" className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {orden.folio}
              </Badge>
              Orden de Trabajo
              <Badge variant={orden.estado === 'pendiente' ? 'default' : 'secondary'}>
                {orden.estado === 'pendiente' ? (
                  <><Clock className="h-3 w-3 mr-1" /> En Proceso</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Terminada</>
                )}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Enviada el {format(new Date(orden.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
            {orden.estado === 'terminada' && (
              <p className="text-xs text-muted-foreground">
                Completada el {format(new Date(orden.updated_at), "dd 'de' MMMM yyyy", { locale: es })}
              </p>
            )}
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

        {orden.comentario_cierre && (
          <div className="bg-secondary/30 p-3 rounded-lg border border-border">
            <Label className="text-sm font-semibold">Comentario de cierre:</Label>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {orden.comentario_cierre}
            </p>
          </div>
        )}

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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mis Órdenes de Trabajo</h3>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendientes" className="gap-2">
            <Clock className="h-4 w-4" />
            En Proceso ({ordenesPendientes.length})
          </TabsTrigger>
          <TabsTrigger value="terminadas" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Terminadas ({ordenesTerminadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4 mt-4">
          {ordenesPendientes.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tienes órdenes de trabajo en proceso</p>
                <p className="text-sm mt-2">Crea una nueva orden para solicitar servicios</p>
              </CardContent>
            </Card>
          ) : (
            ordenesPendientes.map(orden => (
              <OrdenCard key={orden.id} orden={orden} />
            ))
          )}
        </TabsContent>

        <TabsContent value="terminadas" className="space-y-4 mt-4">
          {ordenesTerminadas.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tienes órdenes de trabajo terminadas</p>
              </CardContent>
            </Card>
          ) : (
            ordenesTerminadas.map(orden => (
              <OrdenCard key={orden.id} orden={orden} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <OrdenTrabajoDialog
        clientId={clientId}
        clientName={clientName}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={loadOrdenes}
      />
    </div>
  );
}