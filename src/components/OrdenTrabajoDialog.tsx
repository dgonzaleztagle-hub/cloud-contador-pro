import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrdenTrabajoDialogProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrdenTrabajoDialog({
  clientId,
  clientName,
  isOpen,
  onClose,
  onSuccess
}: OrdenTrabajoDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descripcion.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes ingresar una descripción de la orden de trabajo'
      });
      return;
    }

    setIsSaving(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // Crear la orden de trabajo
      const { data: ot, error: otError } = await supabase
        .from('ordenes_trabajo')
        .insert({
          client_id: clientId,
          descripcion: descripcion.trim(),
          created_by: user?.id
        })
        .select()
        .single();

      if (otError) throw otError;

      // Subir archivos si existen
      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const archivo = selectedFiles[i];
          const fileName = `ot/${ot.id}/${Date.now()}_${archivo.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, archivo);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }

          // Guardar referencia del archivo
          await supabase.from('ot_archivos').insert({
            ot_id: ot.id,
            file_name: archivo.name,
            file_path: fileName,
            file_type: archivo.type,
            uploaded_by: user?.id
          });
        }
      }

      toast({
        title: 'Orden de Trabajo creada',
        description: 'Tu orden de trabajo ha sido enviada exitosamente'
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating OT:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la orden de trabajo'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setDescripcion('');
    setSelectedFiles(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="descripcion">Descripción del Trabajo *</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={6}
              placeholder="Describe detalladamente el trabajo que necesitas..."
              required
              className="bg-input border-border"
            />
          </div>

          <div>
            <Label htmlFor="archivos">Archivos Adjuntos (opcional)</Label>
            <Input
              id="archivos"
              type="file"
              onChange={handleFileSelect}
              multiple
              className="bg-input border-border"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} seleccionado{selectedFiles.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Orden de Trabajo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
