import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
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
  nombre_fantasia: string | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  telefono: string | null;
  correo: string | null;
  giro: string | null;
  regimen_tributario: string | null;
  tipo_contribuyente: string | null;
  inicio_actividades: string | null;
  contador_asignado: string | null;
  rep_legal_nombre: string | null;
  rep_legal_rut: string | null;
  rep_legal_telefono: string | null;
  rep_legal_correo: string | null;
  clave_sii_encrypted: string | null;
  clave_unica_encrypted: string | null;
  certificado_digital_encrypted: string | null;
  activo: boolean;
}

interface ClientEditDialogProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
  userRole?: string | null;
}

export function ClientEditDialog({ client, isOpen, onClose, onClientUpdated, userRole }: ClientEditDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>(client || {});

  // Update formData when client changes
  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

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
      onClientUpdated();
      onClose();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!client) return;

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
      onClientUpdated();
      onClose();
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estado */}
            <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted">
              <Switch
                id="activo"
                checked={formData.activo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Cliente Activo</Label>
            </div>

            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT *</Label>
                  <Input
                    id="rut"
                    value={formData.rut || ''}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                  <Input
                    id="nombre_fantasia"
                    value={formData.nombre_fantasia || ''}
                    onChange={(e) => setFormData({ ...formData, nombre_fantasia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giro">Giro</Label>
                  <Input
                    id="giro"
                    value={formData.giro || ''}
                    onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regimen_tributario">Régimen Tributario</Label>
                  <Input
                    id="regimen_tributario"
                    value={formData.regimen_tributario || ''}
                    onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_contribuyente">Tipo Contribuyente</Label>
                  <Input
                    id="tipo_contribuyente"
                    value={formData.tipo_contribuyente || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_contribuyente: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inicio_actividades">Inicio de Actividades</Label>
                  <Input
                    id="inicio_actividades"
                    type="date"
                    value={formData.inicio_actividades || ''}
                    onChange={(e) => setFormData({ ...formData, inicio_actividades: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contador_asignado">Contador Asignado</Label>
                  <Input
                    id="contador_asignado"
                    value={formData.contador_asignado || ''}
                    onChange={(e) => setFormData({ ...formData, contador_asignado: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comuna">Comuna</Label>
                  <Input
                    id="comuna"
                    value={formData.comuna || ''}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad || ''}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.correo || ''}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Representante Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Representante Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rep_legal_nombre">Nombre</Label>
                  <Input
                    id="rep_legal_nombre"
                    value={formData.rep_legal_nombre || ''}
                    onChange={(e) => setFormData({ ...formData, rep_legal_nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep_legal_rut">RUT</Label>
                  <Input
                    id="rep_legal_rut"
                    value={formData.rep_legal_rut || ''}
                    onChange={(e) => setFormData({ ...formData, rep_legal_rut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep_legal_telefono">Teléfono</Label>
                  <Input
                    id="rep_legal_telefono"
                    value={formData.rep_legal_telefono || ''}
                    onChange={(e) => setFormData({ ...formData, rep_legal_telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep_legal_correo">Correo</Label>
                  <Input
                    id="rep_legal_correo"
                    type="email"
                    value={formData.rep_legal_correo || ''}
                    onChange={(e) => setFormData({ ...formData, rep_legal_correo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Claves SII */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Claves SII y Certificados</h3>
              {userRole !== 'master' && userRole !== 'admin' && (
                <p className="text-sm text-muted-foreground">
                  Solo los usuarios master y admin pueden ver las claves completas
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clave_sii_encrypted">Clave SII</Label>
                  <Input
                    id="clave_sii_encrypted"
                    type={(userRole === 'master' || userRole === 'admin') ? 'text' : 'password'}
                    value={formData.clave_sii_encrypted || ''}
                    onChange={(e) => setFormData({ ...formData, clave_sii_encrypted: e.target.value })}
                    placeholder={(userRole === 'master' || userRole === 'admin') ? '' : '••••••••'}
                    readOnly={userRole !== 'master' && userRole !== 'admin'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clave_unica_encrypted">Clave Única</Label>
                  <Input
                    id="clave_unica_encrypted"
                    type={(userRole === 'master' || userRole === 'admin') ? 'text' : 'password'}
                    value={formData.clave_unica_encrypted || ''}
                    onChange={(e) => setFormData({ ...formData, clave_unica_encrypted: e.target.value })}
                    placeholder={(userRole === 'master' || userRole === 'admin') ? '' : '••••••••'}
                    readOnly={userRole !== 'master' && userRole !== 'admin'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificado_digital_encrypted">Certificado Digital</Label>
                  <Input
                    id="certificado_digital_encrypted"
                    type={(userRole === 'master' || userRole === 'admin') ? 'text' : 'password'}
                    value={formData.certificado_digital_encrypted || ''}
                    onChange={(e) => setFormData({ ...formData, certificado_digital_encrypted: e.target.value })}
                    placeholder={(userRole === 'master' || userRole === 'admin') ? '' : '••••••••'}
                    readOnly={userRole !== 'master' && userRole !== 'admin'}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Cliente
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente "{client.razon_social}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
