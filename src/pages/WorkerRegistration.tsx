import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { validateRut, formatRut } from '@/lib/rutValidator';
import { RutInput } from '@/components/ui/rut-input';

export default function WorkerRegistration() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    rut: '',
    nacionalidad: '',
    estado_civil: '',
    fecha_nacimiento: undefined as Date | undefined,
    direccion: '',
    ciudad: '',
    afp: '',
    salud: '',
    fecha_inicio: undefined as Date | undefined,
    cargo: '',
    telefono: '',
    banco: '',
    tipo_cuenta: '',
    numero_cuenta: '',
    email: ''
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('worker_registration_tokens')
        .select('*, clients(razon_social)')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Enlace inválido",
          description: "Este enlace ha expirado o no es válido.",
          variant: "destructive"
        });
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setClientId(data.client_id);
        setClientName(data.clients?.razon_social || '');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar RUT
    if (!validateRut(formData.rut)) {
      toast({
        variant: 'destructive',
        title: 'RUT inválido',
        description: 'Por favor ingrese un RUT válido',
      });
      return;
    }
    
    setSubmitting(true);

    try {
      // Construir nombre completo
      const nombreCompleto = `${formData.primer_nombre} ${formData.segundo_nombre} ${formData.apellido_paterno} ${formData.apellido_materno}`.trim();

      const { error } = await supabase
        .from('rrhh_workers')
        .insert({
          client_id: clientId,
          nombre: nombreCompleto,
          rut: formData.rut,
          primer_nombre: formData.primer_nombre,
          segundo_nombre: formData.segundo_nombre,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          nacionalidad: formData.nacionalidad,
          estado_civil: formData.estado_civil,
          fecha_nacimiento: formData.fecha_nacimiento?.toISOString().split('T')[0],
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          afp: formData.afp,
          salud: formData.salud,
          fecha_inicio: formData.fecha_inicio?.toISOString().split('T')[0],
          cargo: formData.cargo,
          telefono: formData.telefono,
          banco: formData.banco,
          tipo_cuenta: formData.tipo_cuenta,
          numero_cuenta: formData.numero_cuenta,
          email: formData.email,
          formulario_completado: true,
          datos_admin_completados: false,
          activo: true,
          tipo_plazo: 'indefinido',
          tipo_jornada: 'completa'
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "¡Registro exitoso!",
        description: "Tus datos han sido enviados correctamente.",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el formulario. Por favor, intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Enlace no válido</CardTitle>
            <CardDescription>
              Este enlace ha expirado o no es válido. Por favor, contacta con tu empleador para obtener un nuevo enlace.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>¡Registro Completado!</CardTitle>
            <CardDescription>
              Tus datos han sido enviados exitosamente a {clientName}. Pronto recibirás noticias sobre los siguientes pasos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Ficha de Ingreso Personal</CardTitle>
            <CardDescription>
              Completa tus datos para {clientName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos personales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Datos Personales</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer_nombre">Primer Nombre *</Label>
                    <Input
                      id="primer_nombre"
                      required
                      value={formData.primer_nombre}
                      onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="segundo_nombre">Segundo Nombre *</Label>
                    <Input
                      id="segundo_nombre"
                      required
                      value={formData.segundo_nombre}
                      onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
                    <Input
                      id="apellido_paterno"
                      required
                      value={formData.apellido_paterno}
                      onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apellido_materno">Apellido Materno *</Label>
                    <Input
                      id="apellido_materno"
                      required
                      value={formData.apellido_materno}
                      onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut">Cédula de Identidad (RUT) *</Label>
                    <RutInput
                      id="rut"
                      required
                      value={formData.rut}
                      onChange={(value) => setFormData({ ...formData, rut: value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                    <Input
                      id="nacionalidad"
                      required
                      placeholder="Chilena"
                      value={formData.nacionalidad}
                      onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado_civil">Estado Civil *</Label>
                  <Select
                    required
                    value={formData.estado_civil}
                    onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soltero">Soltero</SelectItem>
                      <SelectItem value="Casado">Casado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Nacimiento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fecha_nacimiento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.fecha_nacimiento ? (
                          format(formData.fecha_nacimiento, "PPP", { locale: es })
                        ) : (
                          "Seleccione una fecha"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.fecha_nacimiento}
                        onSelect={(date) => setFormData({ ...formData, fecha_nacimiento: date })}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    required
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>
              </div>

              {/* Previsión */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previsión</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="afp">A.F.P *</Label>
                    <Select
                      required
                      value={formData.afp}
                      onValueChange={(value) => setFormData({ ...formData, afp: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Capital">Capital</SelectItem>
                        <SelectItem value="Cuprum">Cuprum</SelectItem>
                        <SelectItem value="Habitat">Habitat</SelectItem>
                        <SelectItem value="PlanVital">PlanVital</SelectItem>
                        <SelectItem value="ProVida">ProVida</SelectItem>
                        <SelectItem value="Modelo">Modelo</SelectItem>
                        <SelectItem value="Uno">Uno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salud">Salud *</Label>
                    <Select
                      required
                      value={formData.salud}
                      onValueChange={(value) => setFormData({ ...formData, salud: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fonasa">Fonasa</SelectItem>
                        <SelectItem value="Isapre">Isapre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Información laboral */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Laboral</h3>
                
                <div className="space-y-2">
                  <Label>Fecha de Ingreso *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fecha_inicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.fecha_inicio ? (
                          format(formData.fecha_inicio, "PPP", { locale: es })
                        ) : (
                          "Seleccione una fecha"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.fecha_inicio}
                        onSelect={(date) => setFormData({ ...formData, fecha_inicio: date })}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    required
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Datos bancarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Datos Bancarios</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco *</Label>
                  <Input
                    id="banco"
                    required
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_cuenta">Tipo de Cuenta *</Label>
                    <Select
                      required
                      value={formData.tipo_cuenta}
                      onValueChange={(value) => setFormData({ ...formData, tipo_cuenta: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cuenta Rut">Cuenta Rut</SelectItem>
                        <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                        <SelectItem value="Cuenta Vista">Cuenta Vista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="numero_cuenta">Número de Cuenta *</Label>
                    <Input
                      id="numero_cuenta"
                      required
                      value={formData.numero_cuenta}
                      onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Formulario'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
