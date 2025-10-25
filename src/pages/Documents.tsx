import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Upload, Trash2, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

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

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('contabilidad');
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

  const canModify = userRole === 'master' || userRole === 'admin';

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
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay documentos almacenados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{file.file_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {file.clients?.razon_social || 'Cliente'} • {categorias[file.file_category as keyof typeof categorias] || file.file_category}
                        </p>
                        {file.periodo_mes && file.periodo_anio && (
                          <p className="text-xs text-muted-foreground">
                            Período: {meses[file.periodo_mes - 1]} {file.periodo_anio}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Subido: {new Date(file.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file.file_path, file.file_name)}
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
      </main>
      <Footer />
    </div>
  );
}
