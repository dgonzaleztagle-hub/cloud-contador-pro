import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';

// Configurar el worker de PDF.js globalmente
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export type PreviewType = 'image' | 'text' | null;

interface UseDocumentPreviewReturn {
  previewUrl: string | null;
  previewContent: string | null;
  previewType: PreviewType;
  isPreviewOpen: boolean;
  isLoadingPreview: boolean;
  handlePreview: (blob: Blob, fileName: string) => Promise<void>;
  closePreview: () => void;
}

/**
 * Hook personalizado para previsualizar documentos
 * Soporta: PDF, imágenes (jpg, png, gif, webp, bmp, svg) y texto (txt, log, md, csv)
 * 
 * @example
 * const { handlePreview, previewUrl, isPreviewOpen, closePreview } = useDocumentPreview();
 * 
 * // Usar con archivo descargado de Supabase
 * const { data } = await supabase.storage.from('documents').download(filePath);
 * await handlePreview(data, fileName);
 */
export const useDocumentPreview = (): UseDocumentPreviewReturn => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreview = async (blob: Blob, fileName: string) => {
    setIsLoadingPreview(true);
    setIsPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewContent(null);
    setPreviewType(null);

    try {
      const fileExtension = fileName.toLowerCase().split('.').pop();

      // Manejar archivos de texto plano
      if (fileExtension && ['txt', 'log', 'md', 'csv'].includes(fileExtension)) {
        const text = await blob.text();
        setPreviewContent(text);
        setPreviewType('text');
        setIsLoadingPreview(false);
        return;
      }

      // Manejar PDFs - renderizar todas las páginas
      if (fileExtension === 'pdf') {
        try {
          console.log('Iniciando renderizado de PDF...');
          const arrayBuffer = await blob.arrayBuffer();
          
          // Cargar el documento PDF
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          
          console.log(`PDF tiene ${numPages} página(s)`);
          
          // Array para almacenar los canvas de cada página
          const pageCanvases: HTMLCanvasElement[] = [];
          
          // Escala optimizada para visualización (menor para que quepa mejor)
          const scale = 1.5;
          
          // Renderizar cada página
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) {
              throw new Error('No se pudo crear el contexto del canvas');
            }
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Renderizar la página en el canvas
            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise;
            
            pageCanvases.push(canvas);
          }
          
          // Crear un canvas combinado con todas las páginas apiladas verticalmente
          const combinedCanvas = document.createElement('canvas');
          const combinedContext = combinedCanvas.getContext('2d');
          
          if (!combinedContext) {
            throw new Error('No se pudo crear el contexto del canvas combinado');
          }
          
          // Calcular dimensiones del canvas combinado
          const maxWidth = Math.max(...pageCanvases.map(c => c.width));
          const totalHeight = pageCanvases.reduce((sum, c) => sum + c.height, 0);
          const spacing = 20; // Espacio entre páginas
          
          combinedCanvas.width = maxWidth;
          combinedCanvas.height = totalHeight + (spacing * (numPages - 1));
          
          // Fondo blanco
          combinedContext.fillStyle = '#ffffff';
          combinedContext.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
          
          // Dibujar cada página en el canvas combinado
          let currentY = 0;
          for (const pageCanvas of pageCanvases) {
            combinedContext.drawImage(pageCanvas, 0, currentY);
            currentY += pageCanvas.height + spacing;
          }
          
          // Convertir canvas combinado a blob
          const imageBlob = await new Promise<Blob>((resolve, reject) => {
            combinedCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('No se pudo crear el blob'));
              }
            }, 'image/png', 0.95);
          });
          
          const url = URL.createObjectURL(imageBlob);
          setPreviewUrl(url);
          setPreviewType('image');
          setIsLoadingPreview(false);
          
        } catch (pdfError: any) {
          console.error('Error detallado renderizando PDF:', pdfError);
          throw new Error(`No se pudo renderizar el PDF: ${pdfError.message}`);
        }
        return;
      }

      // Manejar imágenes
      if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension)) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewType('image');
        setIsLoadingPreview(false);
        return;
      }

      // Para otros tipos de archivo
      toast({
        title: 'Previsualización no disponible',
        description: `Los archivos .${fileExtension} solo pueden descargarse.`,
      });
      setIsPreviewOpen(false);
      setIsLoadingPreview(false);
      
    } catch (error: any) {
      console.error('Error en previsualización:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo previsualizar el archivo. Intenta descargarlo.',
      });
      setIsPreviewOpen(false);
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewContent(null);
    setPreviewType(null);
    setIsPreviewOpen(false);
  };

  return {
    previewUrl,
    previewContent,
    previewType,
    isPreviewOpen,
    isLoadingPreview,
    handlePreview,
    closePreview,
  };
};
