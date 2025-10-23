import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientDialogProps {
  onClientCreated: () => void;
}

export function ClientDialog({ onClientCreated }: ClientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    razon_social: '',
    nombre_fantasia: '',
    giro: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    telefono: '',
    correo: '',
    clave_sii_encrypted: '',
    clave_unica_encrypted: '',
    certificado_digital_encrypted: '',
    rep_legal_nombre: '',
    rep_legal_rut: '',
    rep_legal_telefono: '',
    rep_legal_correo: '',
    contador_asignado: '',
    tipo_contribuyente: '',
    regimen_tributario: '',
    activo: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('clients')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado exitosamente',
      });

      setIsOpen(false);
      setFormData({
        rut: '',
        razon_social: '',
        nombre_fantasia: '',
        giro: '',
        direccion: '',
        comuna: '',
        ciudad: '',
        telefono: '',
        correo: '',
        clave_sii_encrypted: '',
        clave_unica_encrypted: '',
        certificado_digital_encrypted: '',
        rep_legal_nombre: '',
        rep_legal_rut: '',
        rep_legal_telefono: '',
        rep_legal_correo: '',
        contador_asignado: '',
        tipo_contribuyente: '',
        regimen_tributario: '',
        activo: true,
      });
      onClientCreated();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12.345.678-9"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                <Input
                  id="nombre_fantasia"
                  value={formData.nombre_fantasia}
                  onChange={(e) => setFormData({ ...formData, nombre_fantasia: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_contribuyente">Tipo Contribuyente</Label>
                <Input
                  id="tipo_contribuyente"
                  value={formData.tipo_contribuyente}
                  onChange={(e) => setFormData({ ...formData, tipo_contribuyente: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="giro">Giro</Label>
              <Textarea
                id="giro"
                value={formData.giro}
                onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                className="bg-input border-border"
                rows={2}
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+56912345678"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="cliente@email.com"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input
                  id="comuna"
                  value={formData.comuna}
                  onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Claves y Certificados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Claves SII y Certificados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clave_sii">Clave SII</Label>
                <Input
                  id="clave_sii"
                  type="password"
                  value={formData.clave_sii_encrypted}
                  onChange={(e) => setFormData({ ...formData, clave_sii_encrypted: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clave_unica">Clave Única</Label>
                <Input
                  id="clave_unica"
                  type="password"
                  value={formData.clave_unica_encrypted}
                  onChange={(e) => setFormData({ ...formData, clave_unica_encrypted: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regimen_tributario">Régimen Tributario</Label>
                <Input
                  id="regimen_tributario"
                  value={formData.regimen_tributario}
                  onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value })}
                  placeholder="PRO PYME GRAL 14D"
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Representante Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Representante Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rep_legal_nombre">Nombre</Label>
                <Input
                  id="rep_legal_nombre"
                  value={formData.rep_legal_nombre}
                  onChange={(e) => setFormData({ ...formData, rep_legal_nombre: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rep_legal_rut">RUT</Label>
                <Input
                  id="rep_legal_rut"
                  value={formData.rep_legal_rut}
                  onChange={(e) => setFormData({ ...formData, rep_legal_rut: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rep_legal_telefono">Teléfono</Label>
                <Input
                  id="rep_legal_telefono"
                  value={formData.rep_legal_telefono}
                  onChange={(e) => setFormData({ ...formData, rep_legal_telefono: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rep_legal_correo">Correo</Label>
                <Input
                  id="rep_legal_correo"
                  type="email"
                  value={formData.rep_legal_correo}
                  onChange={(e) => setFormData({ ...formData, rep_legal_correo: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="activo">Cliente activo</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
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
                'Crear Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
