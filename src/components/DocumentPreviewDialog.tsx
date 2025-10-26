import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { PreviewType } from '@/hooks/useDocumentPreview';

interface DocumentPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string | null;
  previewContent: string | null;
  previewType: PreviewType;
  isLoading: boolean;
}

/**
 * Componente para mostrar la previsualización de documentos
 * Soporta imágenes y texto
 */
export const DocumentPreviewDialog = ({
  isOpen,
  onClose,
  previewUrl,
  previewContent,
  previewType,
  isLoading,
}: DocumentPreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Previsualización del Documento</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center overflow-auto max-h-[75vh] bg-muted/30 rounded-lg p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando previsualización...</p>
            </div>
          ) : previewType === 'image' && previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto rounded shadow-lg"
            />
          ) : previewType === 'text' && previewContent ? (
            <div className="w-full max-w-3xl bg-background border border-border rounded-lg p-6 font-mono text-sm">
              <pre className="whitespace-pre-wrap break-words text-foreground">
                {previewContent}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground">No se pudo cargar la previsualización</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
