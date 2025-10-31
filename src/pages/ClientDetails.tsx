import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/ui/password-input';
import { Loader2, ArrowLeft, Trash2, Download, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { OrdenTrabajoDialog } from '@/components/OrdenTrabajoDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isOTDialogOpen, setIsOTDialogOpen] = useState(false);

  const canModify = userRole === 'master' || userRole === 'contador';
  const canEditPasswords = userRole === 'master';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadClient();
    }
  }, [user, id]);

  const loadClient = async () => {
    if (!id) return;
    
    setLoadingClient(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading client:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el cliente',
        variant: 'destructive',
      });
      navigate('/clients');
    } else {
      setClient(data);
      setFormData(data);
    }
    setLoadingClient(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !canModify) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('clients')
      .update(formData)
      .eq('id', client.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cliente',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cliente actualizado',
        description: 'Los datos del cliente se han actualizado correctamente',
      });
      loadClient();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!client || !canModify) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado correctamente',
      });
      navigate('/clients');
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleDownloadPDF = () => {
    if (!client) return;

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
    addField('Saldo Honorarios Pendiente', client.saldo_honorarios_pendiente.toString());
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
    yPos += 5;

    // Accesos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Accesos', 15, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

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
      description: 'La ficha del cliente se ha descargado correctamente',
    });
  };

  if (loading || loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return null;
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
                onClick={() => navigate('/clients')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
              </Button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {client.razon_social}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'viewer' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsOTDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Nueva Orden de Trabajo
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              {canModify && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Cliente
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estado */}
          <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted">
            <Switch
              id="activo"
              checked={formData.activo ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              disabled={!canModify}
            />
            <Label htmlFor="activo">Cliente Activo</Label>
          </div>

          {/* Formulario en 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social || ''}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  required
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">Rut</Label>
                <Input
                  id="rut"
                  value={formData.rut || ''}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (Mensualidad)</Label>
                <Input
                  id="valor"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saldo_honorarios_pendiente">Saldo Honorarios Pendiente</Label>
                <Input
                  id="saldo_honorarios_pendiente"
                  type="number"
                  value={formData.saldo_honorarios_pendiente || 0}
                  onChange={(e) => setFormData({ ...formData, saldo_honorarios_pendiente: parseFloat(e.target.value) || 0 })}
                  disabled={!canModify}
                />
                <p className="text-xs text-muted-foreground">
                  Saldo de honorarios anteriores al sistema. Este monto se suma a los honorarios pendientes de las declaraciones F29.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clave_sii">Clave Sii</Label>
                <PasswordInput
                  id="clave_sii"
                  value={formData.clave_sii || ''}
                  onChange={(e) => setFormData({ ...formData, clave_sii: e.target.value })}
                  readOnly={!canEditPasswords}
                  disabled={!canEditPasswords}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clave_certificado">Clave Certificado</Label>
                <PasswordInput
                  id="clave_certificado"
                  value={formData.clave_certificado || ''}
                  onChange={(e) => setFormData({ ...formData, clave_certificado: e.target.value })}
                  readOnly={!canEditPasswords}
                  disabled={!canEditPasswords}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad || ''}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fono">Fono</Label>
                <Input
                  id="fono"
                  value={formData.fono || ''}
                  onChange={(e) => setFormData({ ...formData, fono: e.target.value })}
                  disabled={!canModify}
                />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cod_actividad">Código Actividad</Label>
                <Input
                  id="cod_actividad"
                  value={formData.cod_actividad || ''}
                  onChange={(e) => setFormData({ ...formData, cod_actividad: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="giro">Giro</Label>
                <Input
                  id="giro"
                  value={formData.giro || ''}
                  onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regimen_tributario">Régimen Tributario</Label>
                <Input
                  id="regimen_tributario"
                  value={formData.regimen_tributario || ''}
                  onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contabilidad">Contabilidad</Label>
                <Input
                  id="contabilidad"
                  value={formData.contabilidad || ''}
                  onChange={(e) => setFormData({ ...formData, contabilidad: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_incorporacion">Fecha Incorporación</Label>
                <Input
                  id="fecha_incorporacion"
                  type="date"
                  value={formData.fecha_incorporacion || ''}
                  onChange={(e) => setFormData({ ...formData, fecha_incorporacion: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representante_legal">Representante Legal</Label>
                <Input
                  id="representante_legal"
                  value={formData.representante_legal || ''}
                  onChange={(e) => setFormData({ ...formData, representante_legal: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut_representante">Rut Representante</Label>
                <Input
                  id="rut_representante"
                  value={formData.rut_representante || ''}
                  onChange={(e) => setFormData({ ...formData, rut_representante: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clave_sii_repr">Clave Sii Representante</Label>
                <PasswordInput
                  id="clave_sii_repr"
                  value={formData.clave_sii_repr || ''}
                  onChange={(e) => setFormData({ ...formData, clave_sii_repr: e.target.value })}
                  readOnly={!canEditPasswords}
                  disabled={!canEditPasswords}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clave_unica">Clave Única</Label>
                <PasswordInput
                  id="clave_unica"
                  value={formData.clave_unica || ''}
                  onChange={(e) => setFormData({ ...formData, clave_unica: e.target.value })}
                  readOnly={!canEditPasswords}
                  disabled={!canEditPasswords}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previred">Previred</Label>
                <Input
                  id="previred"
                  value={formData.previred || ''}
                  onChange={(e) => setFormData({ ...formData, previred: e.target.value })}
                  disabled={!canModify}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal_electronico">Portal Electrónico</Label>
                <Input
                  id="portal_electronico"
                  value={formData.portal_electronico || ''}
                  onChange={(e) => setFormData({ ...formData, portal_electronico: e.target.value })}
                  disabled={!canModify}
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Observaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="observacion_1">Observación 1</Label>
                <Textarea
                  id="observacion_1"
                  value={formData.observacion_1 || ''}
                  onChange={(e) => setFormData({ ...formData, observacion_1: e.target.value })}
                  rows={3}
                  disabled={!canModify}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacion_2">Observación 2</Label>
                <Textarea
                  id="observacion_2"
                  value={formData.observacion_2 || ''}
                  onChange={(e) => setFormData({ ...formData, observacion_2: e.target.value })}
                  rows={3}
                  disabled={!canModify}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacion_3">Observación 3</Label>
                <Textarea
                  id="observacion_3"
                  value={formData.observacion_3 || ''}
                  onChange={(e) => setFormData({ ...formData, observacion_3: e.target.value })}
                  rows={3}
                  disabled={!canModify}
                />
              </div>
            </div>
          </div>

          {canModify && (
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/clients')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          )}
        </form>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el cliente "{client?.razon_social}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Orden de Trabajo Dialog */}
      <OrdenTrabajoDialog
        clientId={client?.id || ''}
        clientName={client?.razon_social || ''}
        isOpen={isOTDialogOpen}
        onClose={() => setIsOTDialogOpen(false)}
        onSuccess={() => {
          toast({
            title: 'Orden de Trabajo enviada',
            description: 'Tu solicitud ha sido recibida correctamente'
          });
        }}
      />

      <Footer />
    </div>
  );
}
