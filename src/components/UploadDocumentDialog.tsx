import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  preselectedClientId?: string;
  onUploadSuccess: () => void;
}

const categorias = {
  contabilidad: 'Contabilidad',
  f29: 'Declaración F29',
  rrhh: 'RRHH',
  facturacion: 'Facturación',
  otros: 'Otros',
};

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function UploadDocumentDialog({
  open,
  onOpenChange,
  clients,
  preselectedClientId,
  onUploadSuccess,
}: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('contabilidad');
  const [descripcion, setDescripcion] = useState('');
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Archivo muy grande',
          description: 'El archivo no puede superar los 20MB',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientId = preselectedClientId || selectedClientId;
    
    if (!clientId || !selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un cliente y un archivo',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save file metadata to database
      const { error: dbError } = await supabase.from('files').insert({
        client_id: clientId,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type || 'application/octet-stream',
        file_category: fileCategory,
        descripcion: descripcion || null,
        periodo_mes: mes,
        periodo_anio: anio,
        uploaded_by: user?.id,
      });

      if (dbError) {
        // If DB insert fails, try to delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw dbError;
      }

      toast({
        title: 'Archivo subido',
        description: 'El archivo se subió exitosamente',
      });
      
      resetForm();
      onOpenChange(false);
      onUploadSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir archivo',
        description: error.message || 'No se pudo subir el archivo',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    if (!preselectedClientId) {
      setSelectedClientId('');
    }
    setSelectedFile(null);
    setFileCategory('contabilidad');
    setDescripcion('');
    setMes(null);
    setAnio(new Date().getFullYear());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectedClientId && clients && (
            <div>
              <Label>Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.rut} - {client.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Categoría</Label>
            <Select value={fileCategory} onValueChange={setFileCategory}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categorias).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mes</Label>
              <Select 
                value={mes?.toString() || ''} 
                onValueChange={(v) => setMes(v ? parseInt(v) : null)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Seleccionar (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {meses.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={anio || ''}
                onChange={(e) => setAnio(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="2024"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del documento (opcional)"
              className="bg-input border-border"
              rows={3}
            />
          </div>

          <div>
            <Label>Archivo *</Label>
            <Input
              type="file"
              onChange={handleFileSelect}
              className="bg-input border-border"
              required
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Tamaño máximo: 20MB
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Subir Archivo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
