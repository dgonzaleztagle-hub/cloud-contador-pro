import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientDialogProps {
  onClientCreated: () => void;
}

export function ClientDialog({ onClientCreated }: ClientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Catálogos
  const [regiones, setRegiones] = useState<Array<{ id: string; nombre: string }>>([]);
  const [ciudades, setCiudades] = useState<Array<{ id: string; nombre: string; region_id: string }>>([]);
  const [ciudadesFiltradas, setCiudadesFiltradas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [giros, setGiros] = useState<Array<{ id: string; nombre: string; cod_actividad: string | null }>>([]);
  const [regimenesTributarios, setRegimenesTributarios] = useState<Array<{ id: string; nombre: string }>>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    rut: '',
    razon_social: '',
    valor: '',
    clave_sii: '',
    clave_certificado: '',
    direccion: '',
    ciudad: '',
    region: '',
    email: '',
    fono: '',
    cod_actividad: '',
    giro: '',
    regimen_tributario: '',
    contabilidad: '',
    fecha_incorporacion: '',
    representante_legal: '',
    rut_representante: '',
    clave_sii_repr: '',
    clave_unica: '',
    previred: '',
    portal_electronico: '',
    observacion_1: '',
    observacion_2: '',
    observacion_3: '',
    activo: true,
    saldo_honorarios_pendiente: 0,
  });

  // Form state
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedGiro, setSelectedGiro] = useState('');
  const [isNewGiro, setIsNewGiro] = useState(false);

  useEffect(() => {
    loadCatalogos();
  }, []);

  useEffect(() => {
    if (selectedRegionId) {
      const filtered = ciudades.filter(c => c.region_id === selectedRegionId);
      setCiudadesFiltradas(filtered);
      // Limpiar ciudad si cambió la región
      if (formData.ciudad && !filtered.find(c => c.nombre === formData.ciudad)) {
        setFormData({ ...formData, ciudad: '' });
      }
    } else {
      setCiudadesFiltradas([]);
    }
  }, [selectedRegionId, ciudades]);

  const loadCatalogos = async () => {
    // Cargar regiones
    const { data: regionesData } = await supabase
      .from('regiones')
      .select('id, nombre')
      .order('orden');
    if (regionesData) setRegiones(regionesData);

    // Cargar ciudades
    const { data: ciudadesData } = await supabase
      .from('ciudades')
      .select('id, nombre, region_id')
      .order('nombre');
    if (ciudadesData) setCiudades(ciudadesData);

    // Cargar giros
    const { data: girosData } = await supabase
      .from('giros')
      .select('id, nombre, cod_actividad')
      .order('nombre');
    if (girosData) setGiros(girosData);

    // Cargar regímenes tributarios
    const { data: regimenesData } = await supabase
      .from('regimenes_tributarios')
      .select('id, nombre')
      .order('nombre');
    if (regimenesData) setRegimenesTributarios(regimenesData);
  };

  const handleGiroChange = (giroNombre: string) => {
    setSelectedGiro(giroNombre);
    
    if (giroNombre === 'new') {
      setIsNewGiro(true);
      setFormData({ ...formData, giro: '', cod_actividad: '' });
    } else {
      setIsNewGiro(false);
      const giro = giros.find(g => g.nombre === giroNombre);
      if (giro) {
        setFormData({ 
          ...formData, 
          giro: giro.nombre, 
          cod_actividad: giro.cod_actividad || '' 
        });
      }
    }
  };

  const handleRegimenChange = async (regimenNombre: string) => {
    // Si el régimen no existe, agregarlo a la BD
    const existingRegimen = regimenesTributarios.find(r => r.nombre === regimenNombre);
    
    if (!existingRegimen && regimenNombre.trim()) {
      const { data, error } = await supabase
        .from('regimenes_tributarios')
        .insert({ nombre: regimenNombre })
        .select()
        .single();
      
      if (!error && data) {
        setRegimenesTributarios([...regimenesTributarios, data]);
      }
    }
    
    setFormData({ ...formData, regimen_tributario: regimenNombre });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Si es un giro nuevo, primero guardarlo en la tabla de giros
      if (isNewGiro && formData.giro.trim()) {
        await supabase
          .from('giros')
          .insert({ nombre: formData.giro, cod_actividad: formData.cod_actividad || null });
      }

      const { error } = await supabase
        .from('clients')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado exitosamente',
      });

      setIsOpen(false);
      setFormData({
        rut: '',
        razon_social: '',
        valor: '',
        clave_sii: '',
        clave_certificado: '',
        direccion: '',
        ciudad: '',
        region: '',
        email: '',
        fono: '',
        cod_actividad: '',
        giro: '',
        regimen_tributario: '',
        contabilidad: '',
        fecha_incorporacion: '',
        representante_legal: '',
        rut_representante: '',
        clave_sii_repr: '',
        clave_unica: '',
        previred: '',
        portal_electronico: '',
        observacion_1: '',
        observacion_2: '',
        observacion_3: '',
        activo: true,
        saldo_honorarios_pendiente: 0,
      });
      setSelectedRegionId('');
      setSelectedGiro('');
      setIsNewGiro(false);
      onClientCreated();
      loadCatalogos(); // Recargar catálogos por si se agregaron nuevos
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica de la Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información Básica de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12.345.678-9"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              
              {/* Giro - PRIMERO */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="giro">Giro</Label>
                <Select value={selectedGiro} onValueChange={handleGiroChange}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar giro existente o crear nuevo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-[300px] overflow-y-auto z-50">
                    <SelectItem value="new" className="font-semibold text-primary">+ Crear nuevo giro</SelectItem>
                    {giros.length > 0 && (
                      <div className="my-1 border-t border-border" />
                    )}
                    {giros.map((giro) => (
                      <SelectItem key={giro.id} value={giro.nombre}>
                        {giro.nombre}
                      </SelectItem>
                    ))}
                    {giros.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No hay giros disponibles
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {isNewGiro && (
                  <Input
                    placeholder="Escribir nuevo giro"
                    value={formData.giro}
                    onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                    className="bg-input border-border mt-2"
                  />
                )}
              </div>
              
              {/* Código Actividad - se carga automáticamente del giro */}
              <div className="space-y-2">
                <Label htmlFor="cod_actividad">Código Actividad</Label>
                <Input
                  id="cod_actividad"
                  value={formData.cod_actividad}
                  onChange={(e) => setFormData({ ...formData, cod_actividad: e.target.value })}
                  className="bg-input border-border"
                  readOnly={!isNewGiro}
                  placeholder={isNewGiro ? "Código opcional" : "Se carga del giro"}
                />
              </div>
              
              {/* Régimen Tributario - con lista y permite nuevos */}
              <div className="space-y-2">
                <Label htmlFor="regimen_tributario">Régimen Tributario</Label>
                <Select 
                  value={formData.regimen_tributario} 
                  onValueChange={handleRegimenChange}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar régimen" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {regimenesTributarios.map((regimen) => (
                      <SelectItem key={regimen.id} value={regimen.nombre}>
                        {regimen.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contabilidad">Contabilidad</Label>
                <Input
                  id="contabilidad"
                  value={formData.contabilidad}
                  onChange={(e) => setFormData({ ...formData, contabilidad: e.target.value })}
                  placeholder="Completa, Simplificada"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_incorporacion">Fecha Incorporación</Label>
                <Input
                  id="fecha_incorporacion"
                  type="date"
                  value={formData.fecha_incorporacion}
                  onChange={(e) => setFormData({ ...formData, fecha_incorporacion: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Ubicación y Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Ubicación y Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              
              {/* Región - PRIMERO con lista precargada */}
              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Select 
                  value={selectedRegionId}
                  onValueChange={(value) => {
                    setSelectedRegionId(value);
                    const region = regiones.find(r => r.id === value);
                    if (region) {
                      setFormData({ ...formData, region: region.nombre });
                    }
                  }}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {regiones.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Ciudad - se carga según región */}
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Select 
                  value={formData.ciudad}
                  onValueChange={(value) => setFormData({ ...formData, ciudad: value })}
                  disabled={!selectedRegionId}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder={selectedRegionId ? "Seleccionar ciudad" : "Primero seleccione región"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {ciudadesFiltradas.map((ciudad) => (
                      <SelectItem key={ciudad.id} value={ciudad.nombre}>
                        {ciudad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fono">Fono</Label>
                <Input
                  id="fono"
                  value={formData.fono}
                  onChange={(e) => setFormData({ ...formData, fono: e.target.value })}
                  placeholder="+56912345678"
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Representante Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Representante Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="representante_legal">Representante Legal</Label>
                <Input
                  id="representante_legal"
                  value={formData.representante_legal}
                  onChange={(e) => setFormData({ ...formData, representante_legal: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut_representante">RUT Representante</Label>
                <Input
                  id="rut_representante"
                  value={formData.rut_representante}
                  onChange={(e) => setFormData({ ...formData, rut_representante: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Claves y Certificados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Claves y Certificados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clave_sii">Clave SII</Label>
                <Input
                  id="clave_sii"
                  type="password"
                  value={formData.clave_sii}
                  onChange={(e) => setFormData({ ...formData, clave_sii: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clave_certificado">Clave Certificado</Label>
                <Input
                  id="clave_certificado"
                  type="password"
                  value={formData.clave_certificado}
                  onChange={(e) => setFormData({ ...formData, clave_certificado: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clave_sii_repr">Clave SII Repr.</Label>
                <Input
                  id="clave_sii_repr"
                  type="password"
                  value={formData.clave_sii_repr}
                  onChange={(e) => setFormData({ ...formData, clave_sii_repr: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clave_unica">Clave Única</Label>
                <Input
                  id="clave_unica"
                  type="password"
                  value={formData.clave_unica}
                  onChange={(e) => setFormData({ ...formData, clave_unica: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previred">Previred</Label>
                <Input
                  id="previred"
                  value={formData.previred}
                  onChange={(e) => setFormData({ ...formData, previred: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal_electronico">Portal Electrónico</Label>
                <Input
                  id="portal_electronico"
                  value={formData.portal_electronico}
                  onChange={(e) => setFormData({ ...formData, portal_electronico: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="activo">Cliente activo</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}