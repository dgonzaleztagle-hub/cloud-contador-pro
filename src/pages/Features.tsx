import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  DollarSign, 
  Users, 
  Briefcase,
  Calendar,
  Shield,
  Bell,
  TrendingUp,
  Coins,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  UserCog,
  Database,
  Eye
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Funcionalidades del Sistema</h1>
            <p className="text-muted-foreground">Guía completa de todas las características disponibles</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Sistema de Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Sistema de Roles y Permisos</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Control de acceso basado en roles</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <Badge className="w-fit mb-2">master</Badge>
                    <CardTitle className="text-lg">Administrador Principal</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Acceso completo al sistema</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Gestión de usuarios</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Configuración global</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Edición de claves</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <Badge className="w-fit mb-2" variant="secondary">admin</Badge>
                    <CardTitle className="text-lg">Contador</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Gestión de clientes</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Declaraciones (F29, F22)</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Control RRHH</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Edición de claves</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-muted">
                  <CardHeader>
                    <Badge className="w-fit mb-2" variant="outline">client</Badge>
                    <CardTitle className="text-lg">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Ver sus propios datos</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Consultar declaraciones</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Ver honorarios</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Registrar trabajadores</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-muted">
                  <CardHeader>
                    <Badge className="w-fit mb-2" variant="outline">viewer</Badge>
                    <CardTitle className="text-lg">Visualizador</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Solo lectura</p>
                    <p className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Consultar información</p>
                    <p className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Sin permisos de edición</p>
                    <p className="text-muted-foreground text-xs italic mt-2">Ideal para supervisores</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Agenda de Clientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Agenda de Clientes</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Gestión completa de empresas y contactos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Datos de la Empresa
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />RUT, razón social y giro</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Dirección completa y contacto</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Claves SII visibles sin enmascarar</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Régimen tributario y contabilidad</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />RCV (Registro Compras/Ventas)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Representante Legal y Socios
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Datos completos del representante</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Hasta 3 socios registrados</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Claves SII de cada socio</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Información colapsable</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    Espacio de Trabajo
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Accesos directos: SII, MIDT, Previred</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Estado actual de F29</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Atajos a módulos del cliente</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Botón copiar para todas las claves</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Gestión de Documentos
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Subida de PDFs por cliente</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Organización por categoría</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Visualización en línea</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Filtros por período y tipo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo F29 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Coins className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Declaraciones F29</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Gestión mensual de IVA y otros impuestos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Cálculos Automáticos
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />IVA Ventas vs IVA Compras</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />PPM (Pagos Provisionales Mensuales)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Retenciones 2da categoría</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Honorarios e impuesto único</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Remanentes con ajuste UTM</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Declaraciones Fuera de Plazo
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Corrección monetaria automática</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Interés moratorio calculado</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Multas según tabla SII</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Condonaciones aplicables</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Estados y Sincronización
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                      <span className="text-xs">Sin declarar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Declarado</Badge>
                      <span className="text-xs">Presentado en SII</span>
                    </li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Sincronización automática SII</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Última actualización visible</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Integración Honorarios
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Estado independiente por honorarios</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Sincronización con módulo honorarios</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Alertas de saldos pendientes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo F22 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Declaraciones Juradas F22</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">DJ anuales por Año Tributario</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Tipos de DJ (8 principales)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1887</Badge>
                      <span>Sueldos y remuneraciones (15 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1879</Badge>
                      <span>Honorarios y retenciones (15 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1947</Badge>
                      <span>Renta líquida y capital propio (29 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1926</Badge>
                      <span>Balance general (29 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1948</Badge>
                      <span>Capital propio simplificado (29 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1943</Badge>
                      <span>Rentas SAC (29 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1835</Badge>
                      <span>Imp. adicional exterior (15 marzo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1909</Badge>
                      <span>Aportes y retiros socios (29 marzo)</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Sistema de Alertas
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="destructive">Vencida</Badge>
                      <span className="text-xs">Días de atraso visibles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">7 días</Badge>
                      <span className="text-xs">Próximas a vencer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">15 días</Badge>
                      <span className="text-xs">Alerta temprana</span>
                    </li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Panel de alertas en vista principal</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Contadores por DJ y cliente</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Funcionalidades Clave
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Pre-carga masiva por régimen tributario</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Ocultar DJ no aplicables</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Vista por cliente o por DJ</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Acceso directo al SII</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Claves SII visibles en tabla</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Estados del Ciclo
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
                        <Clock className="h-3 w-3" />Pendiente
                      </Badge>
                      <span className="text-xs">Sin presentar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Declarada</Badge>
                      <span className="text-xs">Presentada en SII</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Aceptada</Badge>
                      <span className="text-xs">Recibida y aprobada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="destructive">Observada</Badge>
                      <span className="text-xs">Con observaciones SII</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Honorarios */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Control de Honorarios</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Seguimiento mensual de pagos profesionales</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Gestión de Honorarios
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Monto mensual del período</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Saldo pendiente anterior arrastrado</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Total con saldo acumulado</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Monto pagado y saldo actual</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Fecha de pago registrable</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Estados de Pago
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                      <span className="text-xs">Sin pagar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Parcial</Badge>
                      <span className="text-xs">Pago parcial</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Pagado</Badge>
                      <span className="text-xs">Completamente pagado</span>
                    </li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Sincronización automática con F29</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Resumen total con saldos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo RRHH */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Recursos Humanos</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Gestión completa de personal</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    Ficha del Trabajador
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Datos personales completos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Información contractual (plazo, jornada)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Previsión: AFP, Salud, APV</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Datos bancarios para pagos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Generación de contratos Word/PDF</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Eventos y Novedades
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Atrasos, faltas, permisos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Horas extras y bonos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Licencias médicas</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Historial por trabajador y período</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Vista de resumen mensual</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Alertas y Notificaciones
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Contratos por vencer (30 días)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Trabajadores próximos a terminar</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Panel de notificaciones en header</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    Registro Online
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Link temporal para trabajador</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Formulario público con validación</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Completación de datos administrativos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Expiración de tokens de seguridad</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Cotizaciones Previsionales */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Cotizaciones Previsionales</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Control mensual de cotizaciones por empresa</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Gestión por Empresa
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Control por período (mes/año)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Monto total de cotizaciones</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Monto pagado registrado</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Fechas de declaración y pago</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Detalle por Trabajador
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Monto individual por trabajador</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Estado de pago individual</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Fecha de pago por trabajador</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Vinculación con ficha RRHH</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Estados de Cotizaciones
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                      <span className="text-xs">Sin pagar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">Declarado</Badge>
                      <span className="text-xs">Declarado sin pago</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pago Parcial</Badge>
                      <span className="text-xs">Parcialmente pagado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Pago Total</Badge>
                      <span className="text-xs">Completamente pagado</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Funcionalidades Adicionales
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Historial completo por empresa</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Filtros por período y estado</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Observaciones por período</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Integración con calendario tributario</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores Económicos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Indicadores Económicos en Tiempo Real</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Actualización automática de valores económicos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Unidad de Fomento (UF)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Actualización diaria automática</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Visible en header del dashboard</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Usado para ajustes en declaraciones</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Unidad Tributaria Mensual (UTM)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Actualización mensual automática</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Base de datos histórica</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Usado en ajuste de remanentes F29</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Dólar Observado (USD)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Valor en tiempo real</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Actualización cada hora</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Disponible en dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
