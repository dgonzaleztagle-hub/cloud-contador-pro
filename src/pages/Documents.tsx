import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Upload, Trash2, FileText, Download, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import * as pdfjsLib from 'pdfjs-dist';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
}

interface FileRecord {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_category: string;
  periodo_mes: number | null;
  periodo_anio: number | null;
  descripcion: string | null;
  created_at: string;
  clients?: { rut: string; razon_social: string };
}

export default function Documents() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Configure pdf.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  // Filter state
  const [filterClientId, setFilterClientId] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('contabilidad');
  const [descripcion, setDescripcion] = useState('');
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(new Date().getFullYear());

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);

    // Load clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, rut, razon_social')
      .eq('activo', true)
      .order('razon_social');

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
      });
    } else {
      setClients(clientsData || []);
    }

    // Load files
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*, clients(rut, razon_social)')
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Error loading files:', filesError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los archivos',
      });
    } else {
      setFiles(filesData || []);
    }

    setLoadingData(false);
  };

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
    if (!selectedClientId || !selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un cliente y un archivo',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${selectedClientId}/${fileName}`;

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
        client_id: selectedClientId,
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
      setIsDialogOpen(false);
      loadData();
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
    setSelectedClientId('');
    setSelectedFile(null);
    setFileCategory('contabilidad');
    setDescripcion('');
    setMes(null);
    setAnio(new Date().getFullYear());
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (confirm('¿Estás seguro de eliminar este archivo?')) {
      try {
        // Delete from storage first
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase.from('files').delete().eq('id', id);

        if (dbError) {
          throw dbError;
        }

        toast({
          title: 'Archivo eliminado',
          description: 'El archivo se eliminó exitosamente',
        });
        loadData();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo eliminar el archivo',
        });
      }
    }
  };

  const handlePreview = async (filePath: string, fileName: string) => {
    setIsLoadingPreview(true);
    setIsPreviewOpen(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Si es PDF, renderizar la primera página como imagen
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await data.arrayBuffer();
        
        // Cargar el documento PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Obtener la primera página
        const page = await pdf.getPage(1);
        
        // Configurar el canvas para renderizar
        const scale = 2; // Mayor escala para mejor calidad
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('No se pudo crear el contexto del canvas');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar la página en el canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext as any).promise;
        
        // Convertir canvas a blob y crear URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setIsLoadingPreview(false);
          } else {
            throw new Error('No se pudo crear la imagen del PDF');
          }
        }, 'image/png', 1.0);
        
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // Para imágenes, mostrar directamente
        const url = URL.createObjectURL(data);
        setPreviewUrl(url);
        setIsLoadingPreview(false);
      } else {
        // Para otros tipos de archivo
        toast({
          variant: 'destructive',
          title: 'Tipo de archivo no soportado',
          description: 'Solo se pueden previsualizar PDFs e imágenes. Por favor, descarga el archivo.',
        });
        setIsPreviewOpen(false);
        setIsLoadingPreview(false);
      }
      
    } catch (error: any) {
      console.error('Error en previsualización:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo previsualizar el archivo',
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
    setIsPreviewOpen(false);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Descarga iniciada',
        description: 'El archivo se está descargando',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al descargar',
        description: error.message || 'No se pudo descargar el archivo',
      });
    }
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const categorias = {
    contabilidad: 'Contabilidad',
    f29: 'Declaración F29',
    rrhh: 'RRHH',
    facturacion: 'Facturación',
    otros: 'Otros',
  };

  const canModify = userRole === 'master' || userRole === 'contador';

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gestión de Documentos
              </h1>
            </div>
            {canModify && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
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

                    <div>
                      <Label>Descripción del Documento *</Label>
                      <Textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describe brevemente el documento (ej: Contrato de arriendo, Certificado de AFP, etc.)"
                        required
                        className="bg-input border-border min-h-[80px]"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {descripcion.length}/200 caracteres
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Mes (opcional)</Label>
                        <Select value={mes?.toString() || 'none'} onValueChange={(v) => setMes(v !== 'none' ? parseInt(v) : null)}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Sin período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin período</SelectItem>
                            {meses.map((m, i) => (
                              <SelectItem key={i} value={(i + 1).toString()}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Año (opcional)</Label>
                        <Input
                          type="number"
                          value={anio || ''}
                          onChange={(e) => setAnio(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="2025"
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Archivo * (máx. 20MB)</Label>
                      <Input
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        required
                        className="bg-input border-border"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        'Subir Archivo'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Documentos Almacenados ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros de búsqueda */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
                <div>
                  <Label>Cliente</Label>
                  <Select value={filterClientId} onValueChange={setFilterClientId}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {Array.from(new Set(files.map(f => f.client_id)))
                        .map(clientId => {
                          const file = files.find(f => f.client_id === clientId);
                          return file?.clients ? (
                            <SelectItem key={clientId} value={clientId}>
                              {file.clients.rut} - {file.clients.razon_social}
                            </SelectItem>
                          ) : null;
                        })
                        .filter(Boolean)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {Object.entries(categorias).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay documentos almacenados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files
                  .filter((file) => {
                    // Filtro por categoría
                    if (filterCategory !== 'all' && file.file_category !== filterCategory) return false;
                    
                    // Filtro por cliente
                    if (filterClientId !== 'all' && file.client_id !== filterClientId) return false;
                    
                    return true;
                  })
                  .map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary whitespace-nowrap flex-shrink-0">
                            {categorias[file.file_category as keyof typeof categorias] || file.file_category}
                          </span>
                          <h3 className="font-semibold text-foreground text-sm truncate" title={file.file_name}>
                            {file.file_name.length > 30 ? `${file.file_name.substring(0, 30)}...` : file.file_name}
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {file.descripcion && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground font-medium">Descripción</p>
                              <p className="text-sm text-foreground font-medium">
                                {file.descripcion}
                              </p>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Cliente:</span> {file.clients?.razon_social || 'Cliente'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">RUT:</span> {file.clients?.rut || 'N/A'}
                          </p>
                          {file.periodo_mes && file.periodo_anio && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Período:</span> {meses[file.periodo_mes - 1]} {file.periodo_anio}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Subido:</span> {new Date(file.created_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePreview(file.file_path, file.file_name)}
                        title="Previsualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file.file_path, file.file_name)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canModify && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(file.id, file.file_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Previsualización del Documento</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center overflow-auto max-h-[75vh] bg-muted/30 rounded-lg p-4">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generando previsualización...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded shadow-lg"
                />
              ) : (
                <p className="text-muted-foreground">No se pudo cargar la previsualización</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
