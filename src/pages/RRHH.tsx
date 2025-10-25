import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Trash2, Users, FileText, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

interface Client {
  id: string;
  rut: string;
  razon_social: string;
}

interface Sucursal {
  id: string;
  nombre: string;
}

interface Worker {
  id: string;
  client_id: string;
  rut: string;
  nombre: string;
  periodo_mes: number;
  periodo_anio: number;
  tipo_plazo: string;
  fecha_termino: string | null;
  tipo_jornada: string;
  sucursal_id: string | null;
  contrato_pdf_path: string | null;
  atrasos_horas: number;
  atrasos_minutos: number;
  permisos_horas: number;
  permisos_minutos: number;
  permisos_medio_dia: number;
  permisos_dia_completo: number;
  faltas_dia_completo: number;
  faltas_medio_dia: number;
  anticipo_monto: number;
  created_at: string;
  clients?: { rut: string; razon_social: string };
  sucursales?: { nombre: string };
}

export default function RRHH() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fromClientView, setFromClientView] = useState(false); // Indica si viene desde vista de cliente

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [workerRut, setWorkerRut] = useState('');
  const [workerNombre, setWorkerNombre] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [tipoplazo, setTipoPlazo] = useState('indefinido');
  const [fechaTermino, setFechaTermino] = useState('');
  const [tipoJornada, setTipoJornada] = useState('completa');
  const [sucursalId, setSucursalId] = useState('');
  const [nuevaSucursal, setNuevaSucursal] = useState('');
  const [mostrarNuevaSucursal, setMostrarNuevaSucursal] = useState(false);
  const [contratoPdf, setContratoPdf] = useState<File | null>(null);
  
  // Descuentos
  const [atrasosHoras, setAtrasosHoras] = useState('0');
  const [atrasosMinutos, setAtrasosMinutos] = useState('0');
  const [permisosHoras, setPermisosHoras] = useState('0');
  const [permisosMinutos, setPermisosMinutos] = useState('0');
  const [permisosMedioDia, setPermisosMedioDia] = useState('0');
  const [permisosDiaCompleto, setPermisosDiaCompleto] = useState('0');
  const [faltasDiaCompleto, setFaltasDiaCompleto] = useState('0');
  const [faltasMedioDia, setFaltasMedioDia] = useState('0');
  const [anticipoMonto, setAnticipoMonto] = useState('0');

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

  useEffect(() => {
    // Si viene desde Clients con un clientId, establecer el filtro
    const state = location.state as { clientId?: string };
    if (state?.clientId) {
      setFilterClientId(state.clientId);
      setFromClientView(true);
      // Limpiar el state después de usarlo
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    } else {
      setClients(clientsData || []);
    }

    // Load sucursales
    const { data: sucursalesData, error: sucursalesError } = await supabase
      .from('sucursales')
      .select('*')
      .order('nombre');

    if (sucursalesError) {
      console.error('Error loading sucursales:', sucursalesError);
    } else {
      setSucursales(sucursalesData || []);
    }

    // Load workers
    const { data: workersData, error: workersError } = await supabase
      .from('rrhh_workers')
      .select('*, clients(rut, razon_social), sucursales(nombre)')
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes', { ascending: false });

    if (workersError) {
      console.error('Error loading workers:', workersError);
    } else {
      setWorkers(workersData || []);
    }

    setLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !workerRut || !workerNombre) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Completa todos los campos obligatorios',
      });
      return;
    }

    if (tipoplazo === 'fijo' && !fechaTermino) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes especificar la fecha de término para contrato de plazo fijo',
      });
      return;
    }

    setIsSaving(true);

    let finalSucursalId = sucursalId;

    // Crear nueva sucursal si se especificó
    if (mostrarNuevaSucursal && nuevaSucursal.trim()) {
      const { data: newSucursal, error: sucursalError } = await supabase
        .from('sucursales')
        .insert({ nombre: nuevaSucursal.trim() })
        .select()
        .single();

      if (sucursalError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo crear la sucursal',
        });
        setIsSaving(false);
        return;
      }

      finalSucursalId = newSucursal.id;
      await loadData(); // Recargar sucursales
    }

    // Subir contrato PDF si existe
    let contratoPdfPath = null;
    if (contratoPdf) {
      const fileName = `${selectedClientId}/${workerRut}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, contratoPdf);

      if (uploadError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo subir el contrato',
        });
        setIsSaving(false);
        return;
      }

      contratoPdfPath = fileName;
    }

    const { error } = await supabase.from('rrhh_workers').insert({
      client_id: selectedClientId,
      rut: workerRut,
      nombre: workerNombre,
      periodo_mes: mes,
      periodo_anio: anio,
      tipo_plazo: tipoplazo,
      fecha_termino: tipoplazo === 'fijo' ? fechaTermino : null,
      tipo_jornada: tipoJornada,
      sucursal_id: finalSucursalId || null,
      contrato_pdf_path: contratoPdfPath,
      atrasos_horas: parseInt(atrasosHoras) || 0,
      atrasos_minutos: parseInt(atrasosMinutos) || 0,
      permisos_horas: parseInt(permisosHoras) || 0,
      permisos_minutos: parseInt(permisosMinutos) || 0,
      permisos_medio_dia: parseInt(permisosMedioDia) || 0,
      permisos_dia_completo: parseInt(permisosDiaCompleto) || 0,
      faltas_dia_completo: parseInt(faltasDiaCompleto) || 0,
      faltas_medio_dia: parseInt(faltasMedioDia) || 0,
      anticipo_monto: parseFloat(anticipoMonto) || 0,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el trabajador',
      });
    } else {
      toast({
        title: 'Trabajador guardado',
        description: 'El registro del trabajador se guardó exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setWorkerRut('');
    setWorkerNombre('');
    setTipoPlazo('indefinido');
    setFechaTermino('');
    setTipoJornada('completa');
    setSucursalId('');
    setNuevaSucursal('');
    setMostrarNuevaSucursal(false);
    setContratoPdf(null);
    setAtrasosHoras('0');
    setAtrasosMinutos('0');
    setPermisosHoras('0');
    setPermisosMinutos('0');
    setPermisosMedioDia('0');
    setPermisosDiaCompleto('0');
    setFaltasDiaCompleto('0');
    setFaltasMedioDia('0');
    setAnticipoMonto('0');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const { error } = await supabase.from('rrhh_workers').delete().eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar el registro',
        });
      } else {
        toast({
          title: 'Registro eliminado',
          description: 'El registro se eliminó exitosamente',
        });
        loadData();
      }
    }
  };

  const exportToPDF = async (worker: Worker) => {
    const doc = new jsPDF();
    
    // Logo
    try {
      const logoImg = new Image();
      logoImg.src = '/logo-pdf.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      }
    } catch (e) {
      console.log('Logo no disponible');
    }
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    const mesTexto = meses[worker.periodo_mes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${worker.periodo_anio}`, 105, 25, { align: 'center' });
    
    // Empresa y trabajador
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${worker.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TRABAJADOR: ${worker.nombre} - RUT: ${worker.rut}`, 105, 42, { align: 'center' });
    
    // Tabla
    const startY = 55;
    const tableWidth = 120;
    const leftMargin = (210 - tableWidth) / 2;
    const rightCol = leftMargin + tableWidth;
    const labelCol = leftMargin + 5;
    const valueCol = rightCol - 5;
    
    let currentY = startY;
    const rowHeight = 8;
    
    const addRow = (label: string, value: string | number, isBold = false, fillColor?: [number, number, number]) => {
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.rect(leftMargin, currentY, tableWidth, rowHeight, 'F');
      }
      
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(fillColor ? 255 : 0);
      doc.text(label, labelCol, currentY + 5.5);
      
      const valueText = typeof value === 'number' ? value.toLocaleString('es-CL') : value;
      doc.text(valueText, valueCol, currentY + 5.5, { align: 'right' });
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.1);
      doc.rect(leftMargin, currentY, tableWidth, rowHeight);
      
      currentY += rowHeight;
      doc.setTextColor(0);
    };
    
    // Secciones
    addRow('ATRASOS', '', true, [52, 73, 94]);
    addRow('Horas', `${worker.atrasos_horas} hrs`);
    addRow('Minutos', `${worker.atrasos_minutos} min`);
    
    addRow('PERMISOS', '', true, [52, 73, 94]);
    addRow('Horas', `${worker.permisos_horas} hrs`);
    addRow('Minutos', `${worker.permisos_minutos} min`);
    addRow('Medio día', `${worker.permisos_medio_dia}`);
    addRow('Día completo', `${worker.permisos_dia_completo}`);
    
    addRow('FALTAS', '', true, [52, 73, 94]);
    addRow('Medio día', `${worker.faltas_medio_dia}`);
    addRow('Día completo', `${worker.faltas_dia_completo}`);
    
    addRow('ANTICIPOS', '', true, [52, 73, 94]);
    addRow('Monto', `$${worker.anticipo_monto.toLocaleString('es-CL')}`);
    
    // Información de la empresa
    currentY += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('PLUS CONTABLE LTDA', 105, currentY, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Joel Carvajal Rantul', 105, currentY + 7, { align: 'center' });
    
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Contador General y Auditor', 105, currentY + 13, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 102, 204);
    doc.text('pluscontableltda@gmail.com', 105, currentY + 19, { align: 'center' });
    
    const fileName = `Informe_RRHH_${worker.rut}_${meses[worker.periodo_mes - 1]}_${worker.periodo_anio}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF exportado',
      description: 'El informe se exportó correctamente',
    });
  };

  const previewPDF = async (worker: Worker) => {
    const doc = new jsPDF();
    
    // Logo
    try {
      const logoImg = new Image();
      logoImg.src = '/logo-pdf.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      }
    } catch (e) {
      console.log('Logo no disponible');
    }
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    const mesTexto = meses[worker.periodo_mes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${worker.periodo_anio}`, 105, 25, { align: 'center' });
    
    // Empresa y trabajador
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${worker.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TRABAJADOR: ${worker.nombre} - RUT: ${worker.rut}`, 105, 42, { align: 'center' });
    
    // Tabla
    const startY = 55;
    const tableWidth = 120;
    const leftMargin = (210 - tableWidth) / 2;
    const rightCol = leftMargin + tableWidth;
    const labelCol = leftMargin + 5;
    const valueCol = rightCol - 5;
    
    let currentY = startY;
    const rowHeight = 8;
    
    const addRow = (label: string, value: string | number, isBold = false, fillColor?: [number, number, number]) => {
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.rect(leftMargin, currentY, tableWidth, rowHeight, 'F');
      }
      
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(fillColor ? 255 : 0);
      doc.text(label, labelCol, currentY + 5.5);
      
      const valueText = typeof value === 'number' ? value.toLocaleString('es-CL') : value;
      doc.text(valueText, valueCol, currentY + 5.5, { align: 'right' });
      
      doc.setDrawColor(100);
      doc.setLineWidth(0.1);
      doc.rect(leftMargin, currentY, tableWidth, rowHeight);
      
      currentY += rowHeight;
      doc.setTextColor(0);
    };
    
    // Secciones
    addRow('ATRASOS', '', true, [52, 73, 94]);
    addRow('Horas', `${worker.atrasos_horas} hrs`);
    addRow('Minutos', `${worker.atrasos_minutos} min`);
    
    addRow('PERMISOS', '', true, [52, 73, 94]);
    addRow('Horas', `${worker.permisos_horas} hrs`);
    addRow('Minutos', `${worker.permisos_minutos} min`);
    addRow('Medio día', `${worker.permisos_medio_dia}`);
    addRow('Día completo', `${worker.permisos_dia_completo}`);
    
    addRow('FALTAS', '', true, [52, 73, 94]);
    addRow('Medio día', `${worker.faltas_medio_dia}`);
    addRow('Día completo', `${worker.faltas_dia_completo}`);
    
    addRow('ANTICIPOS', '', true, [52, 73, 94]);
    addRow('Monto', `$${worker.anticipo_monto.toLocaleString('es-CL')}`);
    
    // Información de la empresa
    currentY += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('PLUS CONTABLE LTDA', 105, currentY, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Joel Carvajal Rantul', 105, currentY + 7, { align: 'center' });
    
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Contador General y Auditor', 105, currentY + 13, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 102, 204);
    doc.text('pluscontableltda@gmail.com', 105, currentY + 19, { align: 'center' });
    
    // Convertir PDF a imagen usando canvas
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Configurar pdf.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const scale = 2;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      if (context) {
        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        const imageUrl = canvas.toDataURL('image/png');
        setPreviewUrl(imageUrl);
        setIsPreviewOpen(true);
      }
      
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar la previsualización',
      });
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setIsPreviewOpen(false);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const canModify = userRole === 'master' || userRole === 'admin';

  const filteredWorkers = filterClientId === 'all' 
    ? workers 
    : workers.filter(w => w.client_id === filterClientId);

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
                {fromClientView && filterClientId !== 'all' 
                  ? `RRHH - ${clients.find(c => c.id === filterClientId)?.razon_social || 'Cliente'}`
                  : 'Recursos Humanos'
                }
              </h1>
            </div>
            {canModify && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Trabajador
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nuevo Registro de Trabajador</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Cliente *</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.rut} - {client.razon_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>RUT Trabajador *</Label>
                        <Input
                          value={workerRut}
                          onChange={(e) => setWorkerRut(e.target.value)}
                          placeholder="12345678-9"
                          required
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <Label>Nombre Completo *</Label>
                        <Input
                          value={workerNombre}
                          onChange={(e) => setWorkerNombre(e.target.value)}
                          placeholder="Juan Pérez"
                          required
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Plazo del Contrato *</Label>
                        <Select value={tipoplazo} onValueChange={(v) => {
                          setTipoPlazo(v);
                          if (v === 'indefinido') setFechaTermino('');
                        }}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border z-50">
                            <SelectItem value="indefinido">Indefinido</SelectItem>
                            <SelectItem value="fijo">Plazo Fijo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {tipoplazo === 'fijo' && (
                        <div>
                          <Label>Fecha de Término *</Label>
                          <Input
                            type="date"
                            value={fechaTermino}
                            onChange={(e) => setFechaTermino(e.target.value)}
                            required
                            className="bg-input border-border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Tipo de Jornada *</Label>
                      <Select value={tipoJornada} onValueChange={setTipoJornada}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="completa">Completa</SelectItem>
                          <SelectItem value="parcial_30">Parcial 30 hrs</SelectItem>
                          <SelectItem value="parcial_20">Parcial 20 hrs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Sucursal de Trabajo</Label>
                      <div className="space-y-2">
                        {!mostrarNuevaSucursal ? (
                          <>
                            <Select value={sucursalId} onValueChange={setSucursalId}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue placeholder="Seleccionar sucursal" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border z-50">
                                {sucursales.map((suc) => (
                                  <SelectItem key={suc.id} value={suc.id}>
                                    {suc.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setMostrarNuevaSucursal(true)}
                              className="w-full"
                            >
                              + Agregar Nueva Sucursal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Input
                              value={nuevaSucursal}
                              onChange={(e) => setNuevaSucursal(e.target.value)}
                              placeholder="Nombre de la nueva sucursal"
                              className="bg-input border-border"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMostrarNuevaSucursal(false);
                                setNuevaSucursal('');
                              }}
                              className="w-full"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Contrato PDF</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setContratoPdf(e.target.files?.[0] || null)}
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Mes</Label>
                        <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border z-50">
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
                          value={anio}
                          onChange={(e) => setAnio(parseInt(e.target.value))}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Informes de Descuentos</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Atrasos</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Horas</Label>
                              <Input
                                type="number"
                                min="0"
                                value={atrasosHoras}
                                onChange={(e) => setAtrasosHoras(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Minutos</Label>
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={atrasosMinutos}
                                onChange={(e) => setAtrasosMinutos(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Permisos</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Horas</Label>
                              <Input
                                type="number"
                                min="0"
                                value={permisosHoras}
                                onChange={(e) => setPermisosHoras(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Minutos</Label>
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={permisosMinutos}
                                onChange={(e) => setPermisosMinutos(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Medios Días</Label>
                              <Input
                                type="number"
                                min="0"
                                value={permisosMedioDia}
                                onChange={(e) => setPermisosMedioDia(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Días Completos</Label>
                              <Input
                                type="number"
                                min="0"
                                value={permisosDiaCompleto}
                                onChange={(e) => setPermisosDiaCompleto(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Faltas</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Días Completos</Label>
                              <Input
                                type="number"
                                min="0"
                                value={faltasDiaCompleto}
                                onChange={(e) => setFaltasDiaCompleto(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Medios Días</Label>
                              <Input
                                type="number"
                                min="0"
                                value={faltasMedioDia}
                                onChange={(e) => setFaltasMedioDia(e.target.value)}
                                className="bg-input border-border"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Anticipos ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={anticipoMonto}
                            onChange={(e) => setAnticipoMonto(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Registro'
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
        {/* Solo mostrar filtro si NO viene desde vista de cliente */}
        {!fromClientView && (
          <div className="mb-4">
            <Label>Filtrar por Cliente</Label>
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger className="bg-input border-border max-w-md">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.rut} - {client.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Trabajadores Registrados ({filteredWorkers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay trabajadores registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{worker.nombre}</h3>
                        <span className="text-sm text-muted-foreground">{worker.rut}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {worker.clients?.razon_social || 'Cliente'} • {meses[worker.periodo_mes - 1]} {worker.periodo_anio}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Contrato:</span>
                          <span className="ml-1 font-medium text-foreground">
                            {worker.tipo_plazo === 'fijo' ? 'Plazo Fijo' : 'Indefinido'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Jornada:</span>
                          <span className="ml-1 font-medium text-foreground">
                            {worker.tipo_jornada === 'completa' ? 'Completa' : worker.tipo_jornada === 'parcial_30' ? '30 hrs' : '20 hrs'}
                          </span>
                        </div>
                        {worker.sucursales && (
                          <div>
                            <span className="text-muted-foreground">Sucursal:</span>
                            <span className="ml-1 font-medium text-foreground">{worker.sucursales.nombre}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2 pt-2 border-t border-border">
                        <div>
                          <span className="text-muted-foreground">Atrasos:</span>
                          <span className="ml-1 font-medium">{worker.atrasos_horas}h {worker.atrasos_minutos}m</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Permisos:</span>
                          <span className="ml-1 font-medium">{worker.permisos_horas}h {worker.permisos_minutos}m + {worker.permisos_dia_completo}d + {worker.permisos_medio_dia}½d</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faltas:</span>
                          <span className="ml-1 font-medium">{worker.faltas_dia_completo}d + {worker.faltas_medio_dia}½d</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Anticipo:</span>
                          <span className="ml-1 font-medium">${worker.anticipo_monto.toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(worker)}
                        className="text-primary hover:text-primary"
                        title="Previsualizar PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(worker)}
                        className="text-primary hover:text-primary"
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canModify && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(worker.id)}
                          title="Eliminar Trabajador"
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
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Previsualización - RRHH</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center overflow-auto max-h-[70vh] bg-gray-50 p-4 rounded">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview RRHH"
                  className="max-w-full h-auto rounded shadow-lg border"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}