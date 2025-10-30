import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [isFilesSectionOpen, setIsFilesSectionOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setArchivos(prev => [...prev, ...newFiles]);
      // Reset input value para permitir subir el mismo archivo de nuevo si se elimina
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
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
      if (archivos.length > 0) {
        for (const archivo of archivos) {
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

      setDescripcion('');
      setArchivos([]);
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDescripcion('');
      setArchivos([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción del Trabajo *</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={isMobile ? 4 : 6}
              placeholder="Describe detalladamente el trabajo que necesitas..."
              required
              className="bg-input border-border"
            />
          </div>

          <Collapsible open={isFilesSectionOpen} onOpenChange={setIsFilesSectionOpen}>
            <div className="space-y-2">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Archivos Adjuntos (opcional)
                  </span>
                  {archivos.length > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {archivos.length}
                    </span>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-3 pt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  id="file-upload"
                  accept="*/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar Archivos
                </Button>

                {archivos.length > 0 && (
                  <div className="space-y-2">
                    {archivos.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-secondary/30 rounded border border-border"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

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
