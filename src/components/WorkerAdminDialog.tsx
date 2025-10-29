import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Sucursal {
  id: string;
  nombre: string;
}

interface WorkerAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  onSaved: () => void;
}

export default function WorkerAdminDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  onSaved
}: WorkerAdminDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  
  const [formData, setFormData] = useState({
    sucursal_admin: '',
    tipo_plazo: 'indefinido',
    fecha_inicio: '',
    fecha_termino: '',
    funciones: '',
    tipo_jornada: 'completa',
    horario_laboral: '',
    turnos_rotativos: false,
    clausulas_especiales: ''
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, workerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar sucursales
      const { data: sucursalesData } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .order('nombre');
      
      setSucursales(sucursalesData || []);

      // Cargar datos existentes del trabajador
      const { data: workerData } = await supabase
        .from('rrhh_workers')
        .select('*')
        .eq('id', workerId)
        .single();

      if (workerData) {
        setFormData({
          sucursal_admin: workerData.sucursal_admin || '',
          tipo_plazo: workerData.tipo_plazo || 'indefinido',
          fecha_inicio: workerData.fecha_inicio || '',
          fecha_termino: workerData.fecha_termino || '',
          funciones: workerData.funciones || '',
          tipo_jornada: workerData.tipo_jornada || 'completa',
          horario_laboral: workerData.horario_laboral || '',
          turnos_rotativos: workerData.turnos_rotativos || false,
          clausulas_especiales: workerData.clausulas_especiales || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rrhh_workers')
        .update({
          sucursal_admin: formData.sucursal_admin,
          tipo_plazo: formData.tipo_plazo,
          fecha_inicio: formData.fecha_inicio,
          fecha_termino: formData.fecha_termino,
          funciones: formData.funciones,
          tipo_jornada: formData.tipo_jornada,
          horario_laboral: formData.horario_laboral,
          turnos_rotativos: formData.turnos_rotativos,
          clausulas_especiales: formData.clausulas_especiales,
          datos_admin_completados: true
        })
        .eq('id', workerId);

      if (error) throw error;

      toast({
        title: "Datos guardados",
        description: "Los datos administrativos se han guardado correctamente"
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completar Datos Administrativos - {workerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información del Contrato</h3>
              
              <div className="space-y-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select
                  value={formData.sucursal_admin}
                  onValueChange={(value) => setFormData({ ...formData, sucursal_admin: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((suc) => (
                      <SelectItem key={suc.id} value={suc.nombre}>
                        {suc.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_plazo">Tipo de Plazo</Label>
                  <Select
                    value={formData.tipo_plazo}
                    onValueChange={(value) => setFormData({ ...formData, tipo_plazo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="fijo">Plazo Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_jornada">Tipo de Jornada</Label>
                  <Select
                    value={formData.tipo_jornada}
                    onValueChange={(value) => setFormData({ ...formData, tipo_jornada: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completa">Jornada Completa</SelectItem>
                      <SelectItem value="parcial">Jornada Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>

                {formData.tipo_plazo === 'fijo' && (
                  <div className="space-y-2">
                    <Label htmlFor="fecha_termino">Fecha de Término</Label>
                    <Input
                      id="fecha_termino"
                      type="date"
                      value={formData.fecha_termino}
                      onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="funciones">Funciones del Cargo</Label>
                <Textarea
                  id="funciones"
                  placeholder="Describa las funciones principales del cargo..."
                  value={formData.funciones}
                  onChange={(e) => setFormData({ ...formData, funciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horario de Trabajo</h3>

              <div className="space-y-2">
                <Label htmlFor="horario_laboral">Horario Laboral</Label>
                <Textarea
                  id="horario_laboral"
                  placeholder="Ej: Lunes a Viernes de 9:00 a 18:00 hrs"
                  value={formData.horario_laboral}
                  onChange={(e) => setFormData({ ...formData, horario_laboral: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="turnos_rotativos"
                  checked={formData.turnos_rotativos}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, turnos_rotativos: checked as boolean })
                  }
                />
                <Label htmlFor="turnos_rotativos" className="font-normal cursor-pointer">
                  Turnos Rotativos
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cláusulas Especiales</h3>
              
              <div className="space-y-2">
                <Label htmlFor="clausulas_especiales">Cláusulas Especiales (opcional)</Label>
                <Textarea
                  id="clausulas_especiales"
                  placeholder="Ingrese cualquier cláusula especial del contrato..."
                  value={formData.clausulas_especiales}
                  onChange={(e) => setFormData({ ...formData, clausulas_especiales: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
