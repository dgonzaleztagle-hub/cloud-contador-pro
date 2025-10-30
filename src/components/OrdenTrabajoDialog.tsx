import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      if (selectedFiles.length > 0) {
        for (const archivo of selectedFiles) {
          const fileExt = archivo.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `ot/${ot.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, archivo);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }

          // Guardar referencia del archivo
          await supabase.from('ot_archivos').insert({
            ot_id: ot.id,
            file_name: archivo.name,
            file_path: filePath,
            file_type: archivo.type || 'application/octet-stream',
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
    setSelectedFiles([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevenir que el diálogo se cierre al abrir selector de archivos en móvil
          if (isSaving) {
            e.preventDefault();
          }
        }}
      >
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
            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} seleccionado{selectedFiles.length > 1 ? 's' : ''}:
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg border border-border"
                  >
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
