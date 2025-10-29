import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Worker {
  id: string;
  client_id: string;
  rut: string;
  nombre: string;
  nacionalidad?: string | null;
  estado_civil?: string | null;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  email?: string | null;
  cargo?: string | null;
  tipo_plazo: string;
  fecha_termino: string | null;
  fecha_inicio: string | null;
  tipo_jornada: string;
  sucursal_id: string | null;
  afp?: string | null;
  salud?: string | null;
  banco?: string | null;
  tipo_cuenta?: string | null;
  numero_cuenta?: string | null;
  sueldo_base?: number | null;
  activo: boolean;
  clients?: { rut: string; razon_social: string };
  sucursales?: { nombre: string };
}

interface WorkerDetailDialogProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkerDetailDialog({ worker, isOpen, onClose }: WorkerDetailDialogProps) {
  if (!worker) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha Completa del Trabajador</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Nombre Completo</Label>
                <p className="font-medium">{worker.nombre}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">RUT</Label>
                <p className="font-medium">{worker.rut}</p>
              </div>
              {worker.nacionalidad && (
                <div>
                  <Label className="text-muted-foreground">Nacionalidad</Label>
                  <p className="font-medium">{worker.nacionalidad}</p>
                </div>
              )}
              {worker.estado_civil && (
                <div>
                  <Label className="text-muted-foreground">Estado Civil</Label>
                  <p className="font-medium">{worker.estado_civil}</p>
                </div>
              )}
              {worker.fecha_nacimiento && (
                <div>
                  <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                  <p className="font-medium">{format(new Date(worker.fecha_nacimiento), 'dd/MM/yyyy')}</p>
                </div>
              )}
              {worker.direccion && (
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{worker.direccion}</p>
                </div>
              )}
              {worker.ciudad && (
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="font-medium">{worker.ciudad}</p>
                </div>
              )}
              {worker.telefono && (
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{worker.telefono}</p>
                </div>
              )}
              {worker.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{worker.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información Laboral */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Información Laboral</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Empresa</Label>
                <p className="font-medium">{worker.clients?.razon_social}</p>
              </div>
              {worker.sucursales && (
                <div>
                  <Label className="text-muted-foreground">Sucursal</Label>
                  <p className="font-medium">{worker.sucursales.nombre}</p>
                </div>
              )}
              {worker.cargo && (
                <div>
                  <Label className="text-muted-foreground">Cargo</Label>
                  <p className="font-medium">{worker.cargo}</p>
                </div>
              )}
              {worker.fecha_inicio && (
                <div>
                  <Label className="text-muted-foreground">Fecha de Inicio</Label>
                  <p className="font-medium">{format(new Date(worker.fecha_inicio), 'dd/MM/yyyy')}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Tipo de Contrato</Label>
                <p className="font-medium">{worker.tipo_plazo === 'indefinido' ? 'Indefinido' : 'Plazo Fijo'}</p>
              </div>
              {worker.fecha_termino && (
                <div>
                  <Label className="text-muted-foreground">Fecha de Término</Label>
                  <p className="font-medium">{format(new Date(worker.fecha_termino), 'dd/MM/yyyy')}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Tipo de Jornada</Label>
                <p className="font-medium">
                  {worker.tipo_jornada === 'completa' ? 'Completa' : 
                   worker.tipo_jornada === 'parcial_30' ? 'Parcial 30hrs' : 'Parcial 20hrs'}
                </p>
              </div>
              {worker.sueldo_base && (
                <div>
                  <Label className="text-muted-foreground">Sueldo Base</Label>
                  <p className="font-medium">${Number(worker.sueldo_base).toLocaleString('es-CL')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Previsión Social */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Previsión Social</h3>
            <div className="grid grid-cols-2 gap-4">
              {worker.afp && (
                <div>
                  <Label className="text-muted-foreground">AFP</Label>
                  <p className="font-medium">{worker.afp}</p>
                </div>
              )}
              {worker.salud && (
                <div>
                  <Label className="text-muted-foreground">Sistema de Salud</Label>
                  <p className="font-medium">{worker.salud}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datos Bancarios */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Datos Bancarios</h3>
            <div className="grid grid-cols-2 gap-4">
              {worker.banco && (
                <div>
                  <Label className="text-muted-foreground">Banco</Label>
                  <p className="font-medium">{worker.banco}</p>
                </div>
              )}
              {worker.tipo_cuenta && (
                <div>
                  <Label className="text-muted-foreground">Tipo de Cuenta</Label>
                  <p className="font-medium">{worker.tipo_cuenta}</p>
                </div>
              )}
              {worker.numero_cuenta && (
                <div>
                  <Label className="text-muted-foreground">Número de Cuenta</Label>
                  <p className="font-medium">{worker.numero_cuenta}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Estado</h3>
            <div>
              <Label className="text-muted-foreground">Estado Actual</Label>
              <p className="font-medium">
                <span className={worker.activo ? 'text-green-600' : 'text-red-600'}>
                  {worker.activo ? 'Activo' : 'Inactivo'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
