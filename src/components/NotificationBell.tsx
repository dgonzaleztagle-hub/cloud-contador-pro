import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ContractAlert {
  worker_id: string;
  worker_name: string;
  worker_rut: string;
  client_name: string;
  fecha_termino: string;
  days_remaining?: number;
  days_expired?: number;
}


interface Notification {
  id: string;
  type: 'f29' | 'cotizaciones' | 'f22' | 'contrato_vencido' | 'contrato_por_vencer';
  title: string;
  message: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkNotifications();
  }, []);

  const checkNotifications = async () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const notifs: Notification[] = [];

    // Cargar contratos vencidos y por vencer
    try {
      // Contratos vencidos
      const { data: expiredContracts } = await supabase
        .rpc('get_expired_contracts');

      if (expiredContracts && expiredContracts.length > 0) {
        expiredContracts.forEach((contract: ContractAlert) => {
          notifs.push({
            id: `contract-expired-${contract.worker_id}`,
            type: 'contrato_vencido',
            title: 'Contrato Vencido',
            message: `${contract.worker_name} (${contract.client_name}) - Vencido hace ${contract.days_expired} días`,
            date: new Date(contract.fecha_termino),
            priority: 'high'
          });
        });
      }

      // Contratos por vencer (próximos 30 días)
      const { data: expiringContracts } = await supabase
        .rpc('get_expiring_contracts', { days_threshold: 30 });

      if (expiringContracts && expiringContracts.length > 0) {
        expiringContracts.forEach((contract: ContractAlert) => {
          const priority = contract.days_remaining && contract.days_remaining <= 7 ? 'high' : 'medium';
          notifs.push({
            id: `contract-expiring-${contract.worker_id}`,
            type: 'contrato_por_vencer',
            title: 'Contrato por Vencer',
            message: `${contract.worker_name} (${contract.client_name}) - Vence en ${contract.days_remaining} días`,
            date: new Date(contract.fecha_termino),
            priority
          });
        });
      }
    } catch (error) {
      console.error('Error cargando notificaciones de contratos:', error);
    }

    // Notificaciones de cotizaciones (día 10)
    if (currentDay >= 8 && currentDay <= 10) {
      notifs.push({
        id: 'cot-declaracion',
        type: 'cotizaciones',
        title: 'Declaración de Cotizaciones',
        message: `Fecha tope: ${currentDay === 10 ? 'HOY' : `${10 - currentDay} días`} - Declaración sin pago`,
        date: new Date(today.getFullYear(), currentMonth - 1, 10),
        priority: currentDay === 10 ? 'high' : 'medium'
      });
    }

    // Notificaciones de cotizaciones (día 13)
    if (currentDay >= 11 && currentDay <= 13) {
      notifs.push({
        id: 'cot-pago',
        type: 'cotizaciones',
        title: 'Pago de Cotizaciones',
        message: `Fecha tope: ${currentDay === 13 ? 'HOY' : `${13 - currentDay} días`} - Declarar y pagar`,
        date: new Date(today.getFullYear(), currentMonth - 1, 13),
        priority: currentDay === 13 ? 'high' : 'medium'
      });
    }

    // F29 no electrónicos (día 12)
    if (currentDay >= 10 && currentDay <= 12) {
      notifs.push({
        id: 'f29-no-elect',
        type: 'f29',
        title: 'F29 No Electrónicos',
        message: `Fecha tope: ${currentDay === 12 ? 'HOY' : `${12 - currentDay} días`} - Facturadores no electrónicos`,
        date: new Date(today.getFullYear(), currentMonth - 1, 12),
        priority: currentDay === 12 ? 'high' : 'medium'
      });
    }

    // F29 electrónicos (día 20)
    if (currentDay >= 18 && currentDay <= 20) {
      notifs.push({
        id: 'f29-elect',
        type: 'f29',
        title: 'F29 Electrónicos',
        message: `Fecha tope: ${currentDay === 20 ? 'HOY' : `${20 - currentDay} días`} - Facturadores electrónicos`,
        date: new Date(today.getFullYear(), currentMonth - 1, 20),
        priority: currentDay === 20 ? 'high' : 'medium'
      });
    }

    // F29 sin movimientos (día 28)
    if (currentDay >= 26 && currentDay <= 28) {
      notifs.push({
        id: 'f29-sin-mov',
        type: 'f29',
        title: 'F29 Sin Movimientos',
        message: `Fecha tope: ${currentDay === 28 ? 'HOY' : `${28 - currentDay} días`}`,
        date: new Date(today.getFullYear(), currentMonth - 1, 28),
        priority: currentDay === 28 ? 'high' : 'low'
      });
    }

    // Notificaciones de F22 (marzo)
    if (currentMonth === 3) {
      // DJ hasta 15 de marzo
      if (currentDay >= 13 && currentDay <= 15) {
        notifs.push({
          id: 'f22-15-marzo',
          type: 'f22',
          title: 'Declaraciones Juradas',
          message: `Vencen ${currentDay === 15 ? 'HOY' : `en ${15 - currentDay} días`}: DJ 1887, 1879, 1835`,
          date: new Date(today.getFullYear(), 2, 15),
          priority: currentDay === 15 ? 'high' : 'medium'
        });
      }

      // DJ hasta 29 de marzo
      if (currentDay >= 27 && currentDay <= 29) {
        notifs.push({
          id: 'f22-29-marzo',
          type: 'f22',
          title: 'Declaraciones Juradas',
          message: `Vencen ${currentDay === 29 ? 'HOY' : `en ${29 - currentDay} días`}: DJ 1947, 1926, 1948, 1943, 1909`,
          date: new Date(today.getFullYear(), 2, 29),
          priority: currentDay === 29 ? 'high' : 'medium'
        });
      }
    }

    // Ordenar por prioridad y fecha
    notifs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.date.getTime() - b.date.getTime();
    });

    setNotifications(notifs);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'f29':
        return '📋';
      case 'cotizaciones':
        return '💼';
      case 'f22':
        return '📄';
      case 'contrato_vencido':
        return '⚠️';
      case 'contrato_por_vencer':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          <p className="text-xs text-muted-foreground">
            {notifications.length} {notifications.length === 1 ? 'recordatorio' : 'recordatorios'}
          </p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex gap-3">
                    <div className="text-2xl">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <Badge 
                          variant="secondary" 
                          className={`ml-2 h-2 w-2 p-0 rounded-full ${getPriorityColor(notif.priority)}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(notif.date, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
