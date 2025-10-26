import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Trash2, Users, FileText, Download, Eye, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { WorkerEventsDialog } from '@/components/WorkerEventsDialog';
import { DocumentPreviewDialog } from '@/components/DocumentPreviewDialog';
import { useDocumentPreview } from '@/hooks/useDocumentPreview';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
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
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterWorkerId, setFilterWorkerId] = useState<string>('all');
  const [fromClientView, setFromClientView] = useState(false);
  
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

  // Descuentos (legacy - mantenidos para compatibilidad)
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
      loadAllWorkers();
    }
  }, [user, viewMes, viewAnio, filterClientId, filterWorkerId]);

  useEffect(() => {
    const state = location.state as { clientId?: string };
    if (state?.clientId) {
      setFilterClientId(state.clientId);
      setFromClientView(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadWorkerEvents = async () => {
    if (filterClientId === 'all') return;

    const { data, error } = await supabase
      .from('worker_events')
      .select('*')
      .eq('client_id', filterClientId)
      .eq('periodo_mes', viewMes)
      .eq('periodo_anio', viewAnio);

    if (!error && data) {
      const totals: Record<string, any> = {};
      data.forEach((event: any) => {
        if (!totals[event.worker_id]) {
          totals[event.worker_id] = {
            atraso: 0,
            falta_completa: 0,
            falta_media: 0,
            permiso_horas: 0,
            permiso_medio_dia: 0,
            permiso_completo: 0,
            anticipo: 0,
            licencia_medica: 0
          };
        }
        totals[event.worker_id][event.event_type] += Number(event.cantidad);
      });
      setEventTotals(totals);
    }
  };

  const loadAllWorkers = async () => {
    if (filterClientId === 'all') {
      setAllWorkers([]);
      return;
    }

    // Obtener todos los trabajadores únicos del cliente seleccionado
    const { data, error } = await supabase
      .from('rrhh_workers')
      .select('id, nombre, rut')
      .eq('client_id', filterClientId)
      .order('nombre');

    if (!error && data) {
      // Eliminar duplicados por RUT (trabajadores que aparecen en varios meses)
      const uniqueWorkers = data.reduce((acc: any[], worker) => {
        if (!acc.find(w => w.rut === worker.rut)) {
          acc.push(worker);
        }
        return acc;
      }, []);
      setAllWorkers(uniqueWorkers);
    }
  };

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

    // Load workers for the selected period
    let workersQuery = supabase
      .from('rrhh_workers')
      .select('*, clients(rut, razon_social), sucursales(nombre)')
      .eq('periodo_mes', viewMes)
      .eq('periodo_anio', viewAnio);

    if (filterClientId !== 'all') {
      workersQuery = workersQuery.eq('client_id', filterClientId);
    }

    const { data: workersData, error: workersError } = await workersQuery.order('created_at', { ascending: false });

    if (workersError) {
      console.error('Error loading workers:', workersError);
    } else {
      let filteredWorkers = workersData || [];
      
      // Aplicar filtro adicional por trabajador si está seleccionado
      if (filterWorkerId !== 'all') {
        filteredWorkers = filteredWorkers.filter(w => w.id === filterWorkerId);
      }
      
      setWorkers(filteredWorkers);
    }

    await loadWorkerEvents();
    setLoadingData(false);
  };

  const openEventDialog = (workerId: string, workerName: string, eventType: any) => {
    setSelectedWorker({ id: workerId, name: workerName });
    setSelectedEventType(eventType);
    setIsEventDialogOpen(true);
  };

  const getEventTotal = (workerId: string, eventType: string) => {
    return eventTotals[workerId]?.[eventType] || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let finalSucursalId = sucursalId;

    if (mostrarNuevaSucursal && nuevaSucursal.trim()) {
      const { data: newSucursal, error: sucursalError } = await supabase
        .from('sucursales')
        .insert({ nombre: nuevaSucursal })
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
        description: editingWorkerId ? 'Los datos del trabajador se actualizaron exitosamente' : 'El registro del trabajador se guardó exitosamente',
      });
      resetForm();
      setIsDialogOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setSelectedClientId(worker.client_id);
    setWorkerRut(worker.rut);
    setWorkerNombre(worker.nombre);
    setMes(worker.periodo_mes);
    setAnio(worker.periodo_anio);
    setTipoPlazo(worker.tipo_plazo);
    setFechaTermino(worker.fecha_termino || '');
    setTipoJornada(worker.tipo_jornada);
    setSucursalId(worker.sucursal_id || '');
    setAtrasosHoras(worker.atrasos_horas.toString());
    setAtrasosMinutos(worker.atrasos_minutos.toString());
    setPermisosHoras(worker.permisos_horas.toString());
    setPermisosMinutos(worker.permisos_minutos.toString());
    setPermisosMedioDia(worker.permisos_medio_dia.toString());
    setPermisosDiaCompleto(worker.permisos_dia_completo.toString());
    setFaltasDiaCompleto(worker.faltas_dia_completo.toString());
    setFaltasMedioDia(worker.faltas_medio_dia.toString());
    setAnticipoMonto(worker.anticipo_monto.toString());
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingWorkerId(null);
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
    const mesTexto = meses[worker.periodo_mes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${worker.periodo_anio}`, 105, 25, { align: 'center' });
    
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
    
    const fileName = `Informe_RRHH_${worker.rut}_${meses[worker.periodo_mes - 1]}_${worker.periodo_anio}.pdf`;
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
    const mesTexto = meses[worker.periodo_mes - 1].toUpperCase();
    doc.text(`INFORME DESCUENTOS ${mesTexto} ${worker.periodo_anio}`, 105, 25, { align: 'center' });
    
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
    const fileName = `Informe_RRHH_${worker.rut}_${meses[worker.periodo_mes - 1]}_${worker.periodo_anio}.pdf`;
    await handlePreview(pdfBlob, fileName);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const canModify = userRole === 'master' || userRole === 'contador';
  const canAddEvents = userRole === 'master' || userRole === 'contador' || userRole === 'cliente';

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
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                    <DialogTitle>{editingWorkerId ? 'Editar Trabajador' : 'Nuevo Registro de Trabajador'}</DialogTitle>
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
                          <>{editingWorkerId ? 'Actualizar Registro' : 'Guardar Registro'}</>
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
          {/* Filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <Label>Cliente</Label>
              <Select value={filterClientId} onValueChange={(val) => {
                setFilterClientId(val);
                setFilterWorkerId('all'); // Reset worker filter when client changes
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
          </div>

          {workers.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No hay registros de trabajadores para el período seleccionado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <Card key={worker.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-bold">{worker.nombre}</div>
                        <div className="text-sm text-muted-foreground font-normal">{worker.rut}</div>
                      </div>
                      {canModify && (
                        <div className="flex gap-1">
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
                        <span className="text-muted-foreground">Período:</span>
                        <span className="font-medium">{meses[worker.periodo_mes - 1]} {worker.periodo_anio}</span>
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
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Resumen Mensual</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'atraso')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Atrasos:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'atraso')} min</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'falta_completa')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Faltas Completas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'falta_completa')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'falta_media')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Faltas Medias:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'falta_media')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_horas')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Permisos Horas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_horas')} min</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_medio_dia')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Permisos Medios:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_medio_dia')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'permiso_completo')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Permisos Completos:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'permiso_completo')}</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'licencia_medica')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Licencias Médicas:</span>
                          <span className="font-medium">{getEventTotal(worker.id, 'licencia_medica')} días</span>
                        </button>
                        <button
                          onClick={() => openEventDialog(worker.id, worker.nombre, 'anticipo')}
                          className="flex justify-between p-2 bg-secondary/30 hover:bg-secondary/50 rounded transition-colors cursor-pointer text-left"
                        >
                          <span className="text-muted-foreground">Anticipos:</span>
                          <span className="font-medium">${getEventTotal(worker.id, 'anticipo').toLocaleString('es-CL')}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(worker)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vista Previa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(worker)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
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

      {selectedWorker && filterClientId !== 'all' && (
        <WorkerEventsDialog
          workerId={selectedWorker.id}
          clientId={filterClientId}
          workerName={selectedWorker.name}
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
