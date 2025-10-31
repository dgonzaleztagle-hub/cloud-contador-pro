import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HistoricalIndicatorsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [indicatorType, setIndicatorType] = useState<'uf' | 'utm'>('uf');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valor: string; fecha: string } | null>(null);

  const handleSearch = async () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      if (indicatorType === 'uf') {
        // Buscar UF del día seleccionado
        const { data, error } = await supabase
          .from('uf_diaria')
          .select('valor, fecha')
          .eq('fecha', format(selectedDate, 'yyyy-MM-dd'))
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('No hay datos de UF disponibles para esta fecha');
          } else {
            throw error;
          }
          return;
        }

        if (data) {
          setResult({
            valor: data.valor.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            fecha: format(new Date(data.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
          });
        }
      } else {
        // Buscar UTM del mes seleccionado
        const mes = selectedDate.getMonth() + 1;
        const anio = selectedDate.getFullYear();

        const { data, error } = await supabase
          .from('utm_mensual')
          .select('valor, mes, anio')
          .eq('mes', mes)
          .eq('anio', anio)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('No hay datos de UTM disponibles para este mes');
          } else {
            throw error;
          }
          return;
        }

        if (data) {
          setResult({
            valor: data.valor.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            fecha: format(selectedDate, "MMMM 'de' yyyy", { locale: es })
          });
        }
      }
    } catch (error) {
      console.error('Error buscando indicador:', error);
      toast.error('Error al buscar el indicador');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Resetear estado al cerrar
      setSelectedDate(undefined);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
          <TrendingUp className="h-4 w-4 mr-2" />
          Indicadores Anteriores
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Consultar Indicadores Históricos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Selector de tipo de indicador */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Indicador</label>
            <Select value={indicatorType} onValueChange={(value: 'uf' | 'utm') => {
              setIndicatorType(value);
              setResult(null);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uf">UF (Unidad de Fomento) - Diaria</SelectItem>
                <SelectItem value="utm">UTM (Unidad Tributaria Mensual) - Mensual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {indicatorType === 'uf' 
                ? 'Selecciona un día específico para ver el valor de la UF'
                : 'Selecciona cualquier día del mes para ver el valor de la UTM'}
            </p>
          </div>

          {/* Calendario */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Selecciona {indicatorType === 'uf' ? 'el día' : 'el mes'}
            </label>
            <div className="flex justify-center p-3 border rounded-lg bg-background">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date > new Date()}
                initialFocus
                locale={es}
                className={cn("pointer-events-auto")}
              />
            </div>
          </div>

          {/* Botón de búsqueda */}
          <Button 
            onClick={handleSearch}
            disabled={!selectedDate || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <CalendarIcon className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Consultar Valor
              </>
            )}
          </Button>

          {/* Resultado */}
          {result && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {indicatorType === 'uf' ? 'UF' : 'UTM'} del {result.fecha}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ${result.valor}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
