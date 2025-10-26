import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Plus, Trash2, Users, FileText, Download, Eye, Edit, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { WorkerEventsDialog } from '@/components/WorkerEventsDialog';
import { DocumentPreviewDialog } from '@/components/DocumentPreviewDialog';
import { useDocumentPreview } from '@/hooks/useDocumentPreview';
import jsPDF from 'jspdf';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaces
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
  tipo_plazo: string;
  fecha_termino: string | null;
  fecha_inicio: string | null;
  tipo_jornada: string;
  sucursal_id: string | null;
  contrato_pdf_path: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  clients?: { rut: string; razon_social: string };
  sucursales?: { nombre: string };
}

interface ContractAlert {
  worker_id: string;
  worker_name: string;
  worker_rut: string;
  client_name: string;
  fecha_termino: string;
  days_remaining?: number;
  days_expired?: number;
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
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterWorkerId, setFilterWorkerId] = useState<string>('all');
  const [fromClientView, setFromClientView] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  // Document preview hook
  const { previewUrl, previewContent, previewType, isPreviewOpen, isLoadingPreview, handlePreview, closePreview } = useDocumentPreview();
  
  // Worker Events
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<{ id: string; name: string } | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'atraso' | 'falta_completa' | 'falta_media' | 'permiso_horas' | 'permiso_medio_dia' | 'permiso_completo' | 'anticipo' | 'licencia_medica'>('atraso');
  const [eventTotals, setEventTotals] = useState<Record<string, any>>({});
  
  // Filtros de período
  const [viewMes, setViewMes] = useState(new Date().getMonth() + 1);
  const [viewAnio, setViewAnio] = useState(new Date().getFullYear());
  
  // Lista de todos los trabajadores únicos para el filtro
  const [allWorkers, setAllWorkers] = useState<{id: string; nombre: string; rut: string}[]>([]);

  // Contract alerts
  const [expiringContracts, setExpiringContracts] = useState<ContractAlert[]>([]);
  const [expiredContracts, setExpiredContracts] = useState<ContractAlert[]>([]);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [workerRut, setWorkerRut] = useState('');
  const [workerNombre, setWorkerNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [tipoplazo, setTipoPlazo] = useState('indefinido');
  const [fechaTermino, setFechaTermino] = useState('');
  const [tipoJornada, setTipoJornada] = useState('completa');
  const [sucursalId, setSucursalId] = useState('');
  const [nuevaSucursal, setNuevaSucursal] = useState('');
  const [mostrarNuevaSucursal, setMostrarNuevaSucursal] = useState(false);
  const [contratoPdf, setContratoPdf] = useState<File | null>(null);
  const [workerActivo, setWorkerActivo] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(location.search);
      const clientIdFromUrl = params.get('clientId');
      
      if (clientIdFromUrl) {
        setFilterClientId(clientIdFromUrl);
        setFromClientView(true);
      }
      
      loadData();
      loadContractAlerts();
    }
  }, [user, filterClientId, filterWorkerId, viewMes, viewAnio, showInactive]);

  const canModify = userRole === 'master' || userRole === 'admin';

  const loadAllWorkers = async (clientId: string) => {
    if (clientId === 'all') {
      setAllWorkers([]);
      return;
    }

    const { data, error } = await supabase
      .from('rrhh_workers')
      .select('id, nombre, rut')
      .eq('client_id', clientId)
      .order('nombre');

    if (!error && data) {
      setAllWorkers(data);
    }
  };

  const getEventTotal = (workerId: string, eventType: string): number => {
    const key = `${workerId}_${eventType}`;
    return eventTotals[key] || 0;
  };

  const openEventDialog = (workerId: string, workerName: string, eventType: any) => {
    setSelectedWorker({ id: workerId, name: workerName });
    setSelectedEventType(eventType);
    setIsEventDialogOpen(true);
  };

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, rut, razon_social')
        .eq('activo', true)
        .order('razon_social');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Cargar sucursales
      const { data: sucursalesData, error: sucursalesError } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .order('nombre');

      if (sucursalesError) throw sucursalesError;
      setSucursales(sucursalesData || []);

      // Cargar todos los trabajadores para el filtro
      if (filterClientId !== 'all') {
        await loadAllWorkers(filterClientId);
      }

      // Cargar trabajadores (fichas)
      let query = supabase
        .from('rrhh_workers')
        .select(`
          *,
          clients(rut, razon_social),
          sucursales(nombre)
        `)
        .order('nombre');

      // Filtrar por estado activo/inactivo
      if (!showInactive) {
        query = query.eq('activo', true);
      }

      // Aplicar filtro de cliente
      if (filterClientId !== 'all') {
        query = query.eq('client_id', filterClientId);
      }

      // Aplicar filtro de trabajador específico
      if (filterWorkerId !== 'all') {
        query = query.eq('id', filterWorkerId);
      }

      const { data: workersData, error: workersError } = await query;

      if (workersError) throw workersError;
      setWorkers(workersData || []);

      // Cargar eventos del período seleccionado para todos los trabajadores
      const { data: eventsData, error: eventsError } = await supabase
        .from('worker_events')
        .select('*')
        .eq('periodo_mes', viewMes)
        .eq('periodo_anio', viewAnio);

      if (eventsError) throw eventsError;

      // Calcular totales por trabajador y tipo de evento
      const totals: Record<string, any> = {};
      (eventsData || []).forEach(event => {
        const key = `${event.worker_id}_${event.event_type}`;
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += Number(event.cantidad);
      });

      setEventTotals(totals);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cargar los datos',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadContractAlerts = async () => {
    try {
      // Cargar contratos por vencer (próximos 30 días)
      const { data: expiringData, error: expiringError } = await supabase
        .rpc('get_expiring_contracts', { days_threshold: 30 });

      if (!expiringError) {
        setExpiringContracts(expiringData || []);
      }

      // Cargar contratos vencidos
      const { data: expiredData, error: expiredError } = await supabase
        .rpc('get_expired_contracts');

      if (!expiredError) {
        setExpiredContracts(expiredData || []);
      }
    } catch (error) {
      console.error('Error loading contract alerts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !workerRut || !workerNombre) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    setIsSaving(true);

    let finalSucursalId = sucursalId;

    // Si hay nueva sucursal, crearla primero
    if (mostrarNuevaSucursal && nuevaSucursal) {
      const { data: newSucursal, error: sucursalError } = await supabase
        .from('sucursales')
        .insert({ nombre: nuevaSucursal })
        .select()
        .single();

      if (sucursalError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo crear la nueva sucursal',
        });
        setIsSaving(false);
        return;
      }

      finalSucursalId = newSucursal.id;
      await loadData();
    }

    let contratoPdfPath = editingWorkerId ? workers.find(w => w.id === editingWorkerId)?.contrato_pdf_path : null;
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

    const workerData = {
      client_id: selectedClientId,
      rut: workerRut,
      nombre: workerNombre,
      fecha_inicio: fechaInicio || null,
      tipo_plazo: tipoplazo,
      fecha_termino: tipoplazo === 'fijo' ? fechaTermino : null,
      tipo_jornada: tipoJornada,
      sucursal_id: finalSucursalId || null,
      contrato_pdf_path: contratoPdfPath,
      activo: workerActivo,
    };

    let error;
    if (editingWorkerId) {
      const result = await supabase
        .from('rrhh_workers')
        .update(workerData)
        .eq('id', editingWorkerId);
      error = result.error;
    } else {
      const result = await supabase.from('rrhh_workers').insert(workerData);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: editingWorkerId ? 'No se pudo actualizar el trabajador' : 'No se pudo guardar el trabajador',
      });
    } else {
      toast({
        title: editingWorkerId ? 'Trabajador actualizado' : 'Trabajador guardado',
        description: editingWorkerId ? 'Los datos del trabajador se actualizaron exitosamente' : 'La ficha del trabajador se guardó exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
      loadContractAlerts();
    }
    setIsSaving(false);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setSelectedClientId(worker.client_id);
    setWorkerRut(worker.rut);
    setWorkerNombre(worker.nombre);
    setFechaInicio(worker.fecha_inicio || '');
    setTipoPlazo(worker.tipo_plazo);
    setFechaTermino(worker.fecha_termino || '');
    setTipoJornada(worker.tipo_jornada);
    setSucursalId(worker.sucursal_id || '');
    setWorkerActivo(worker.activo);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingWorkerId(null);
    setSelectedClientId('');
    setWorkerRut('');
    setWorkerNombre('');
    setFechaInicio('');
    setTipoPlazo('indefinido');
    setFechaTermino('');
    setTipoJornada('completa');
    setSucursalId('');
    setNuevaSucursal('');
    setMostrarNuevaSucursal(false);
    setContratoPdf(null);
    setWorkerActivo(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este trabajador? Se eliminarán también todos sus eventos registrados.')) {
      const { error } = await supabase.from('rrhh_workers').delete().eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo eliminar el trabajador',
        });
      } else {
        toast({
          title: 'Trabajador eliminado',
          description: 'El trabajador se eliminó exitosamente',
        });
        loadData();
        loadContractAlerts();
      }
    }
  };

  const toggleWorkerStatus = async (worker: Worker) => {
    const newStatus = !worker.activo;
    const { error } = await supabase
      .from('rrhh_workers')
      .update({ activo: newStatus })
      .eq('id', worker.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar el estado del trabajador',
      });
    } else {
      toast({
        title: newStatus ? 'Trabajador activado' : 'Trabajador desactivado',
        description: `${worker.nombre} ahora está ${newStatus ? 'activo' : 'inactivo'}`,
      });
      loadData();
      loadContractAlerts();
    }
  };

  const handleDownloadContract = async (worker: Worker) => {
    if (!worker.contrato_pdf_path) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Este trabajador no tiene un contrato subido',
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(worker.contrato_pdf_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrato_${worker.nombre}_${worker.rut}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Contrato descargado',
        description: 'El archivo se ha descargado correctamente',
      });
    } catch (error: any) {
      console.error('Error descargando contrato:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo descargar el contrato',
      });
    }
  };

  const handlePreviewContract = async (worker: Worker) => {
    if (!worker.contrato_pdf_path) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Este trabajador no tiene un contrato subido',
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(worker.contrato_pdf_path);

      if (error) throw error;

      const fileName = `Contrato_${worker.nombre}_${worker.rut}.pdf`;
      await handlePreview(data, fileName);
    } catch (error: any) {
      console.error('Error previsualizando contrato:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo previsualizar el contrato',
      });
    }
  };

  const exportToPDF = async (worker: Worker) => {
    const doc = new jsPDF();
    
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
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    const mesTexto = meses[viewMes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${viewAnio}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${worker.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TRABAJADOR: ${worker.nombre} - RUT: ${worker.rut}`, 105, 42, { align: 'center' });
    
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
    
    const totalAtrasos = getEventTotal(worker.id, 'atraso');
    const totalFaltasCompletas = getEventTotal(worker.id, 'falta_completa');
    const totalFaltasMedias = getEventTotal(worker.id, 'falta_media');
    const totalPermisosHoras = getEventTotal(worker.id, 'permiso_horas');
    const totalPermisosMedios = getEventTotal(worker.id, 'permiso_medio_dia');
    const totalPermisosCompletos = getEventTotal(worker.id, 'permiso_completo');
    const totalLicenciasMedicas = getEventTotal(worker.id, 'licencia_medica');
    const totalAnticipos = getEventTotal(worker.id, 'anticipo');

    addRow('ATRASOS', '', true, [52, 73, 94]);
    addRow('Minutos', `${totalAtrasos} min`);
    
    addRow('PERMISOS', '', true, [52, 73, 94]);
    addRow('Minutos', `${totalPermisosHoras} min`);
    addRow('Medio día', `${totalPermisosMedios}`);
    addRow('Día completo', `${totalPermisosCompletos}`);
    
    addRow('FALTAS', '', true, [52, 73, 94]);
    addRow('Medio día', `${totalFaltasMedias}`);
    addRow('Día completo', `${totalFaltasCompletas}`);
    
    addRow('LICENCIAS MÉDICAS', '', true, [52, 73, 94]);
    addRow('Días', `${totalLicenciasMedicas}`);
    
    addRow('ANTICIPOS', '', true, [52, 73, 94]);
    addRow('Monto', `$${totalAnticipos.toLocaleString('es-CL')}`);
    
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
    
    const fileName = `Informe_RRHH_${worker.rut}_${meses[viewMes - 1]}_${viewAnio}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF exportado',
      description: 'El informe se exportó correctamente',
    });
  };

  const previewPDF = async (worker: Worker) => {
    const doc = new jsPDF();
    
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
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    const mesTexto = meses[viewMes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${viewAnio}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`EMPRESA: ${worker.clients?.razon_social || 'N/A'}`, 105, 35, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TRABAJADOR: ${worker.nombre} - RUT: ${worker.rut}`, 105, 42, { align: 'center' });
    
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
    
    const totalAtrasos = getEventTotal(worker.id, 'atraso');
    const totalFaltasCompletas = getEventTotal(worker.id, 'falta_completa');
    const totalFaltasMedias = getEventTotal(worker.id, 'falta_media');
    const totalPermisosHoras = getEventTotal(worker.id, 'permiso_horas');
    const totalPermisosMedios = getEventTotal(worker.id, 'permiso_medio_dia');
    const totalPermisosCompletos = getEventTotal(worker.id, 'permiso_completo');
    const totalLicenciasMedicas = getEventTotal(worker.id, 'licencia_medica');
    const totalAnticipos = getEventTotal(worker.id, 'anticipo');

    addRow('ATRASOS', '', true, [52, 73, 94]);
    addRow('Minutos', `${totalAtrasos} min`);
    
    addRow('PERMISOS', '', true, [52, 73, 94]);
    addRow('Minutos', `${totalPermisosHoras} min`);
    addRow('Medio día', `${totalPermisosMedios}`);
    addRow('Día completo', `${totalPermisosCompletos}`);
    
    addRow('FALTAS', '', true, [52, 73, 94]);
    addRow('Medio día', `${totalFaltasMedias}`);
    addRow('Día completo', `${totalFaltasCompletas}`);
    
    addRow('LICENCIAS MÉDICAS', '', true, [52, 73, 94]);
    addRow('Días', `${totalLicenciasMedicas}`);
    
    addRow('ANTICIPOS', '', true, [52, 73, 94]);
    addRow('Monto', `$${totalAnticipos.toLocaleString('es-CL')}`);
    
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
    
    // Generar PDF como blob y usar el hook para previsualizar
    const pdfBlob = doc.output('blob');
    const fileName = `Informe_RRHH_${worker.rut}_${meses[viewMes - 1]}_${viewAnio}.pdf`;
    await handlePreview(pdfBlob, fileName);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fromClientView ? navigate(-1) : navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
                <p className="text-sm text-muted-foreground">Gestión de trabajadores y eventos mensuales</p>
              </div>
            </div>

            {canModify && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                    <Plus className="h-4 w-4" />
                    Nueva Ficha de Trabajador
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingWorkerId ? 'Editar Trabajador' : 'Nueva Ficha de Trabajador'}</DialogTitle>
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

                    <div>
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="bg-input border-border"
                      />
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
                      {editingWorkerId && workers.find(w => w.id === editingWorkerId)?.contrato_pdf_path && (
                        <div className="mb-2 p-2 bg-secondary/30 rounded border border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">📄 Contrato actual subido</span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const worker = workers.find(w => w.id === editingWorkerId);
                                  if (worker) handlePreviewContract(worker);
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const worker = workers.find(w => w.id === editingWorkerId);
                                  if (worker) handleDownloadContract(worker);
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setContratoPdf(e.target.files?.[0] || null)}
                        className="bg-input border-border"
                      />
                      {contratoPdf && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ Nuevo archivo seleccionado: {contratoPdf.name}
                        </p>
                      )}
                      {editingWorkerId && !contratoPdf && workers.find(w => w.id === editingWorkerId)?.contrato_pdf_path && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Si no selecciona un nuevo archivo, se mantendrá el contrato actual
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Estado del Trabajador</Label>
                      <Select value={workerActivo ? 'activo' : 'inactivo'} onValueChange={(v) => setWorkerActivo(v === 'activo')}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="activo">✓ Activo</SelectItem>
                          <SelectItem value="inactivo">⊗ Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Los trabajadores inactivos no generan alertas de contratos vencidos
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-accent">
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>{editingWorkerId ? 'Actualizar Ficha' : 'Guardar Ficha'}</>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Alertas de contratos */}
          {expiredContracts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Contratos vencidos ({expiredContracts.length}):</strong>
                <ul className="mt-2 space-y-1">
                  {expiredContracts.slice(0, 3).map((contract) => (
                    <li key={contract.worker_id} className="text-sm">
                      {contract.worker_name} ({contract.client_name}) - Vencido hace {contract.days_expired} días
                    </li>
                  ))}
                  {expiredContracts.length > 3 && (
                    <li className="text-sm italic">Y {expiredContracts.length - 3} más...</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {expiringContracts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Contratos por vencer ({expiringContracts.length}):</strong>
                <ul className="mt-2 space-y-1">
                  {expiringContracts.slice(0, 3).map((contract) => (
                    <li key={contract.worker_id} className="text-sm">
                      {contract.worker_name} ({contract.client_name}) - Vence en {contract.days_remaining} días
                    </li>
                  ))}
                  {expiringContracts.length > 3 && (
                    <li className="text-sm italic">Y {expiringContracts.length - 3} más...</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <Label>Cliente</Label>
              <Select value={filterClientId} onValueChange={(val) => {
                setFilterClientId(val);
                setFilterWorkerId('all');
              }}>
                <SelectTrigger className="w-full bg-input border-border">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trabajador</Label>
              <Select 
                value={filterWorkerId} 
                onValueChange={setFilterWorkerId}
                disabled={filterClientId === 'all'}
              >
                <SelectTrigger className="w-full bg-input border-border">
                  <SelectValue placeholder={filterClientId === 'all' ? 'Seleccione un cliente primero' : 'Todos los trabajadores'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los trabajadores</SelectItem>
                  {allWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.nombre} - {worker.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Mes</Label>
                <Select 
                  value={viewMes.toString()} 
                  onValueChange={(val) => setViewMes(parseInt(val))}
                >
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <SelectItem key={mes} value={mes.toString()}>
                        {format(new Date(2024, mes - 1), 'MMMM', { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Año</Label>
                <Select 
                  value={viewAnio.toString()} 
                  onValueChange={(val) => setViewAnio(parseInt(val))}
                >
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant={showInactive ? "default" : "outline"}
                onClick={() => setShowInactive(!showInactive)}
                className="w-full"
              >
                {showInactive ? 'Mostrando Todos' : 'Solo Activos'}
              </Button>
            </div>
          </div>

          {workers.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No hay fichas de trabajadores {showInactive ? '' : 'activos'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <Card key={worker.id} className={`bg-card border-border hover:border-primary/50 transition-all ${!worker.activo ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold">{worker.nombre}</div>
                          {!worker.activo && (
                            <span className="text-muted-foreground" title="Inactivo">
                              <PowerOff className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-normal">{worker.rut}</div>
                      </div>
                      {canModify && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWorkerStatus(worker)}
                            className="h-8 w-8 p-0"
                            title={worker.activo ? 'Desactivar' : 'Activar'}
                          >
                            {worker.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(worker)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(worker.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empresa:</span>
                        <span className="font-medium text-right">{worker.clients?.razon_social}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Período de visualización:</span>
                        <span className="font-medium">{meses[viewMes - 1]} {viewAnio}</span>
                      </div>
                      {worker.sucursales && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sucursal:</span>
                          <span className="font-medium text-right">{worker.sucursales.nombre}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium">{worker.tipo_plazo === 'indefinido' ? 'Indefinido' : 'Plazo Fijo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jornada:</span>
                        <span className="font-medium">
                          {worker.tipo_jornada === 'completa' ? 'Completa' : 
                           worker.tipo_jornada === 'parcial_30' ? 'Parcial 30hrs' : 'Parcial 20hrs'}
                        </span>
                      </div>
                      
                      {/* Sección de Contrato */}
                      {worker.contrato_pdf_path && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">📄 Contrato:</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewContract(worker)}
                                className="h-7 px-2 text-xs hover:bg-primary/10"
                                title="Vista previa del contrato"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadContract(worker)}
                                className="h-7 px-2 text-xs hover:bg-primary/10"
                                title="Descargar contrato"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {canModify && worker.activo && (
                        <div className="flex gap-2">
                          <Select 
                            onValueChange={(eventType: any) => openEventDialog(worker.id, worker.nombre, eventType)}
                          >
                            <SelectTrigger className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                              <SelectValue placeholder="+ Agregar Evento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="atraso">⏱️ Atraso</SelectItem>
                              <SelectItem value="permiso_horas">🕐 Permiso por Horas</SelectItem>
                              <SelectItem value="permiso_medio_dia">🌅 Permiso Medio Día</SelectItem>
                              <SelectItem value="permiso_completo">📅 Permiso Día Completo</SelectItem>
                              <SelectItem value="falta_media">⚠️ Falta Medio Día</SelectItem>
                              <SelectItem value="falta_completa">❌ Falta Día Completo</SelectItem>
                              <SelectItem value="licencia_medica">🏥 Licencia Médica</SelectItem>
                              <SelectItem value="anticipo">💰 Anticipo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <h4 className="text-sm font-semibold text-foreground pt-2">Resumen Mensual ({meses[viewMes - 1]} {viewAnio})</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'atraso')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">⏱️ Atrasos:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'atraso')} min</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'falta_completa')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">❌ Faltas Completas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'falta_completa')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'falta_media')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">⚠️ Faltas Medias:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'falta_media')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_horas')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">🕐 Permisos Horas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_horas')} min</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_medio_dia')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">🌅 Permisos Medios:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_medio_dia')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_completo')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">📅 Permisos Completos:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_completo')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'licencia_medica')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">🏥 Licencias Médicas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'licencia_medica')} días</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'anticipo')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left border border-border hover:border-primary/50"
                          title="Click para ver detalles y agregar más"
                        >
                          <span className="text-muted-foreground">💰 Anticipos:</span>
                          <span className="font-medium">${getEventTotal(worker.id, 'anticipo').toLocaleString('es-CL')}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(worker)}
                        className="flex-1 gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Vista Previa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(worker)}
                        className="flex-1 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedWorker && (
        <WorkerEventsDialog
          workerId={selectedWorker.id}
          workerName={selectedWorker.name}
          clientId={filterClientId !== 'all' ? filterClientId : workers.find(w => w.id === selectedWorker.id)?.client_id || ''}
          eventType={selectedEventType}
          periodMes={viewMes}
          periodAnio={viewAnio}
          isOpen={isEventDialogOpen}
          onClose={() => setIsEventDialogOpen(false)}
          onEventAdded={() => {
            loadData();
          }}
        />
      )}

      <DocumentPreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        previewUrl={previewUrl}
        previewContent={previewContent}
        previewType={previewType}
        isLoading={isLoadingPreview}
      />

      <Footer />
    </div>
  );
}
