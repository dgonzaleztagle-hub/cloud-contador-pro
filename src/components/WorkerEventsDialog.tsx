import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WorkerEvent {
  id: string;
  event_type: string;
  event_date: string;
  cantidad: number;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface WorkerEventsDialogProps {
  workerId: string;
  clientId: string;
  workerName: string;
  eventType: 'atraso' | 'falta_completa' | 'falta_media' | 'permiso_horas' | 'permiso_medio_dia' | 'permiso_completo' | 'anticipo' | 'licencia_medica' | 'horas_extras';
  periodMes: number;
  periodAnio: number;
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

const eventTitles = {
  atraso: 'Atrasos',
  falta_completa: 'Faltas Día Completo',
  falta_media: 'Faltas Medio Día',
  permiso_horas: 'Permisos por Horas',
  permiso_medio_dia: 'Permisos Medio Día',
  permiso_completo: 'Permisos Día Completo',
  anticipo: 'Anticipos',
  licencia_medica: 'Licencias Médicas',
  horas_extras: 'Horas Extras'
};

const eventLabels = {
  atraso: 'Minutos',
  falta_completa: 'Días',
  falta_media: 'Medio Días',
  permiso_horas: 'Minutos',
  permiso_medio_dia: 'Medio Días',
  permiso_completo: 'Días',
  anticipo: 'Monto ($)',
  licencia_medica: 'Días',
  horas_extras: 'Horas'
};

export function WorkerEventsDialog({
  workerId,
  clientId,
  workerName,
  eventType,
  periodMes,
  periodAnio,
  isOpen,
  onClose,
  onEventAdded
}: WorkerEventsDialogProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<WorkerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [eventDate, setEventDate] = useState<Date>();
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [fechaFin, setFechaFin] = useState<Date>();

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('worker_events')
      .select('*')
      .eq('worker_id', workerId)
      .eq('event_type', eventType)
      .eq('periodo_mes', periodMes)
      .eq('periodo_anio', periodAnio)
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para licencias médicas, validar que se hayan seleccionado fechas de inicio y fin
    if (eventType === 'licencia_medica') {
      if (!fechaInicio || !fechaFin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Debes seleccionar fecha de inicio y fin de la licencia médica'
        });
        return;
      }
      
      if (fechaFin < fechaInicio) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La fecha de fin no puede ser anterior a la fecha de inicio'
        });
        return;
      }
    } else {
      if (!eventDate || !cantidad) return;
    }

    setIsSaving(true);
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // Si es licencia médica, crear eventos automáticamente por cada mes que abarque
      if (eventType === 'licencia_medica' && fechaInicio && fechaFin) {
        const totalDias = differenceInDays(fechaFin, fechaInicio) + 1;
        
        // Verificar si la licencia cruza meses
        const mesInicio = fechaInicio.getMonth();
        const anioInicio = fechaInicio.getFullYear();
        const mesFin = fechaFin.getMonth();
        const anioFin = fechaFin.getFullYear();
        
        const eventsToInsert = [];
        
        if (mesInicio === mesFin && anioInicio === anioFin) {
          // Licencia dentro del mismo mes
          eventsToInsert.push({
            worker_id: workerId,
            client_id: clientId,
            event_type: eventType,
            event_date: format(fechaInicio, 'yyyy-MM-dd'),
            periodo_mes: mesInicio + 1,
            periodo_anio: anioInicio,
            cantidad: totalDias,
            descripcion: descripcion || null,
            fecha_inicio: format(fechaInicio, 'yyyy-MM-dd'),
            fecha_fin: format(fechaFin, 'yyyy-MM-dd'),
            created_by: user?.id
          });
        } else {
          // Licencia cruza meses - dividir
          let currentDate = new Date(fechaInicio);
          
          while (currentDate <= fechaFin) {
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            const lastDayOfMonth = endOfMonth(currentDate);
            const endDate = fechaFin < lastDayOfMonth ? fechaFin : lastDayOfMonth;
            
            const diasEnEsteMes = differenceInDays(endDate, currentDate) + 1;
            
            eventsToInsert.push({
              worker_id: workerId,
              client_id: clientId,
              event_type: eventType,
              event_date: format(currentDate, 'yyyy-MM-dd'),
              periodo_mes: currentMonth,
              periodo_anio: currentYear,
              cantidad: diasEnEsteMes,
              descripcion: `${descripcion || 'Licencia médica'} (${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')})`,
              fecha_inicio: format(fechaInicio, 'yyyy-MM-dd'),
              fecha_fin: format(fechaFin, 'yyyy-MM-dd'),
              created_by: user?.id
            });
            
            // Avanzar al primer día del siguiente mes
            currentDate = startOfMonth(addMonths(currentDate, 1));
          }
        }
        
        const { error } = await supabase.from('worker_events').insert(eventsToInsert);
        
        if (error) throw error;
        
        toast({
          title: 'Licencia médica registrada',
          description: eventsToInsert.length > 1 
            ? `Se crearon ${eventsToInsert.length} registros (${totalDias} días totales)`
            : `Se registraron ${totalDias} días de licencia médica`
        });
        
        setFechaInicio(undefined);
        setFechaFin(undefined);
        setDescripcion('');
      } else {
        // Otros tipos de eventos (comportamiento normal)
        const { error } = await supabase.from('worker_events').insert({
          worker_id: workerId,
          client_id: clientId,
          event_type: eventType,
          event_date: format(eventDate!, 'yyyy-MM-dd'),
          periodo_mes: periodMes,
          periodo_anio: periodAnio,
          cantidad: parseFloat(cantidad),
          descripcion: descripcion || null,
          created_by: user?.id
        });

        if (error) throw error;

        toast({
          title: 'Evento agregado',
          description: 'El evento se ha registrado exitosamente'
        });
        
        setEventDate(undefined);
        setCantidad('');
        setDescripcion('');
      }
      
      loadEvents();
      onEventAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar el evento'
      });
    }
    
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;

    const { error } = await supabase.from('worker_events').delete().eq('id', id);
    if (!error) {
      toast({
        title: 'Evento eliminado',
        description: 'El registro se ha eliminado'
      });
      loadEvents();
      onEventAdded();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadEvents();
    }
    if (!open) {
      onClose();
    }
  };

  const totalCantidad = events.reduce((sum, e) => sum + Number(e.cantidad), 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {eventTitles[eventType]} - {workerName}
            <span className="text-sm text-muted-foreground ml-2">
              ({format(new Date(periodAnio, periodMes - 1), 'MMMM yyyy', { locale: es })})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para agregar evento */}
          <form onSubmit={handleAddEvent} className="space-y-4 p-4 border border-border rounded-lg bg-secondary/20">
            <h3 className="font-semibold text-sm">Agregar Nuevo Registro</h3>
            
            {eventType === 'licencia_medica' ? (
              // Formulario específico para licencias médicas con rango de fechas
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !fechaInicio && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaInicio ? format(fechaInicio, 'PPP', { locale: es }) : 'Fecha inicio'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fechaInicio}
                          onSelect={setFechaInicio}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !fechaFin && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaFin ? format(fechaFin, 'PPP', { locale: es }) : 'Fecha fin'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fechaFin}
                          onSelect={setFechaFin}
                          initialFocus
                          disabled={(date) => fechaInicio ? date < fechaInicio : false}
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {fechaInicio && fechaFin && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      Total: {differenceInDays(fechaFin, fechaInicio) + 1} días
                    </p>
                    {fechaInicio.getMonth() !== fechaFin.getMonth() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Esta licencia cruza meses. Se crearán registros automáticamente en cada período.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Formulario normal para otros tipos de eventos
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !eventDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{eventLabels[eventType]} *</Label>
                  <Input
                    type="number"
                    step={eventType === 'anticipo' ? '1' : '1'}
                    min="0"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="bg-input border-border"
                placeholder="Ej: Llegó tarde por tráfico"
              />
            </div>

            <Button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-primary to-accent">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Registro
                </>
              )}
            </Button>
          </form>

          {/* Lista de eventos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Registros del Mes</h3>
              <div className="text-sm font-semibold text-primary">
                Total: {eventType === 'anticipo' 
                  ? `$${totalCantidad.toLocaleString('es-CL')}`
                  : eventType === 'atraso' || eventType === 'permiso_horas'
                  ? `${totalCantidad} min`
                  : eventType === 'horas_extras'
                  ? `${totalCantidad} hrs`
                  : `${totalCantidad}`
                }
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay registros para este mes
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {event.fecha_inicio && event.fecha_fin 
                            ? `${format(new Date(event.fecha_inicio), 'dd/MM/yyyy')} - ${format(new Date(event.fecha_fin), 'dd/MM/yyyy')}`
                            : format(new Date(event.event_date), 'dd/MM/yyyy')
                          }
                        </span>
                        <span className="text-sm text-primary font-semibold">
                          {eventType === 'anticipo' 
                            ? `$${Number(event.cantidad).toLocaleString('es-CL')}`
                            : eventType === 'horas_extras'
                            ? `${event.cantidad} hrs`
                            : `${event.cantidad} ${eventLabels[eventType].toLowerCase()}`
                          }
                        </span>
                      </div>
                      {event.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1">{event.descripcion}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
