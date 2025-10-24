import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  const canEditPasswords = userRole === 'master' || userRole === 'admin';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

            {/* Formulario en 2 columnas como el Excel original */}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rut">Rut</Label>
                  <Input
                    id="rut"
                    value={formData.rut || ''}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clave_sii">Clave Sii</Label>
                  <Input
                    id="clave_sii"
                    type={canEditPasswords ? 'text' : 'password'}
                    value={formData.clave_sii || ''}
                    onChange={(e) => setFormData({ ...formData, clave_sii: e.target.value })}
                    placeholder={canEditPasswords ? '' : '••••••••'}
                    readOnly={!canEditPasswords}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clave_certificado">Clave Certificado</Label>
                  <Input
                    id="clave_certificado"
                    type={canEditPasswords ? 'text' : 'password'}
                    value={formData.clave_certificado || ''}
                    onChange={(e) => setFormData({ ...formData, clave_certificado: e.target.value })}
                    placeholder={canEditPasswords ? '' : '••••••••'}
                    readOnly={!canEditPasswords}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fono">Fono</Label>
                  <Input
                    id="fono"
                    value={formData.fono || ''}
                    onChange={(e) => setFormData({ ...formData, fono: e.target.value })}
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
                  <Label htmlFor="cod_actividad">Código Actividad</Label>
                  <Input
                    id="cod_actividad"
                    value={formData.cod_actividad || ''}
                    onChange={(e) => setFormData({ ...formData, cod_actividad: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacion_1">Observación 1</Label>
                  <Textarea
                    id="observacion_1"
                    value={formData.observacion_1 || ''}
                    onChange={(e) => setFormData({ ...formData, observacion_1: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacion_2">Observación 2</Label>
                  <Textarea
                    id="observacion_2"
                    value={formData.observacion_2 || ''}
                    onChange={(e) => setFormData({ ...formData, observacion_2: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacion_3">Observación 3</Label>
                  <Textarea
                    id="observacion_3"
                    value={formData.observacion_3 || ''}
                    onChange={(e) => setFormData({ ...formData, observacion_3: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regimen_tributario">Régimen Tributario</Label>
                  <Input
                    id="regimen_tributario"
                    value={formData.regimen_tributario || ''}
                    onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contabilidad">Contabilidad</Label>
                  <Input
                    id="contabilidad"
                    value={formData.contabilidad || ''}
                    onChange={(e) => setFormData({ ...formData, contabilidad: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representante_legal">Representante Legal</Label>
                  <Input
                    id="representante_legal"
                    value={formData.representante_legal || ''}
                    onChange={(e) => setFormData({ ...formData, representante_legal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rut_representante">RUT Representante</Label>
                  <Input
                    id="rut_representante"
                    value={formData.rut_representante || ''}
                    onChange={(e) => setFormData({ ...formData, rut_representante: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clave_sii_repr">Clave SII Representante</Label>
                  <Input
                    id="clave_sii_repr"
                    type={canEditPasswords ? 'text' : 'password'}
                    value={formData.clave_sii_repr || ''}
                    onChange={(e) => setFormData({ ...formData, clave_sii_repr: e.target.value })}
                    placeholder={canEditPasswords ? '' : '••••••••'}
                    readOnly={!canEditPasswords}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clave_unica">Clave Única</Label>
                  <Input
                    id="clave_unica"
                    type={canEditPasswords ? 'text' : 'password'}
                    value={formData.clave_unica || ''}
                    onChange={(e) => setFormData({ ...formData, clave_unica: e.target.value })}
                    placeholder={canEditPasswords ? '' : '••••••••'}
                    readOnly={!canEditPasswords}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previred">Previred</Label>
                  <Input
                    id="previred"
                    value={formData.previred || ''}
                    onChange={(e) => setFormData({ ...formData, previred: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portal_electronico">Portal Eléctronico</Label>
                  <Input
                    id="portal_electronico"
                    value={formData.portal_electronico || ''}
                    onChange={(e) => setFormData({ ...formData, portal_electronico: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_incorporacion">Fecha Incorporación</Label>
                  <Input
                    id="fecha_incorporacion"
                    type="date"
                    value={formData.fecha_incorporacion || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_incorporacion: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    value={formData.valor || ''}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <Input
                    id="region"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {!canEditPasswords && (
              <p className="text-sm text-muted-foreground text-center">
                Solo los usuarios master y admin pueden ver y editar las claves
              </p>
            )}

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
                    'Guardar'
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