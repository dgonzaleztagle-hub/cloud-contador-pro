import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Copy, 
  FileText, 
  Calculator, 
  Users, 
  DollarSign,
  ExternalLink,
  Upload,
  Edit,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ClientEditDialog } from "@/components/ClientEditDialog";
import { useAuth } from "@/contexts/AuthContext";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";
import { ClientOTSection } from "@/components/ClientOTSection";

interface Client {
  id: string;
  rut: string;
  razon_social: string;
  valor: string | null;
  clave_sii: string | null;
  clave_certificado: string | null;
  direccion: string | null;
  ciudad: string | null;
  email: string | null;
  fono: string | null;
  cod_actividad: string | null;
  giro: string | null;
  regimen_tributario: string | null;
  contabilidad: string | null;
  fecha_incorporacion: string | null;
  representante_legal: string | null;
  rut_representante: string | null;
  clave_sii_repr: string | null;
  clave_unica: string | null;
  previred: string | null;
  portal_electronico: string | null;
  region: string | null;
  observacion_1: string | null;
  observacion_2: string | null;
  observacion_3: string | null;
  activo: boolean;
  saldo_honorarios_pendiente: number;
  socio_1_nombre: string | null;
  socio_1_rut: string | null;
  socio_1_clave_sii: string | null;
  socio_2_nombre: string | null;
  socio_2_rut: string | null;
  socio_2_clave_sii: string | null;
  socio_3_nombre: string | null;
  socio_3_rut: string | null;
  socio_3_clave_sii: string | null;
  rcv_ventas: number;
  rcv_compras: number;
}

interface F29Status {
  mes: number;
  anio: number;
  estado: string;
}

const externalLinks = [
  { name: "MIDT", url: "https://midt.dirtrab.cl/welcome", icon: ExternalLink },
  { name: "SII", url: "https://homer.sii.cl/", icon: ExternalLink },
  { name: "Registro Empresas", url: "https://www.registrodeempresasysociedades.cl/", icon: ExternalLink },
  { name: "Previred", url: "https://www.previred.com/", icon: ExternalLink },
];

const moduleShortcuts = [
  { name: "F29", path: "/f29", icon: FileText },
  { name: "Honorarios", path: "/honorarios", icon: DollarSign },
  { name: "RRHH", path: "/rrhh", icon: Users },
  { name: "Documentos", path: "/documents", icon: FileText },
];

export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [f29Status, setF29Status] = useState<F29Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showSocios, setShowSocios] = useState(false);

  const handleBack = () => {
    // Si es viewer (cliente), volver a su dashboard
    if (userRole === 'viewer') {
      navigate('/client-workspace');
    } else {
      // Si es master/admin, volver a la lista de clientes
      navigate('/clients');
    }
  };

  useEffect(() => {
    if (id) {
      loadClient();
      loadF29Status();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información del cliente",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadF29Status = async () => {
    try {
      const { data, error } = await supabase
        .from("f29_declarations")
        .select("periodo_mes, periodo_anio, estado_declaracion")
        .eq("client_id", id)
        .order("periodo_anio", { ascending: false })
        .order("periodo_mes", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setF29Status({
          mes: data.periodo_mes,
          anio: data.periodo_anio,
          estado: data.estado_declaracion,
        });
      }
    } catch (error) {
      console.error("Error loading F29 status:", error);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${fieldName} copiado al portapapeles`,
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.razon_social}</h1>
            <p className="text-muted-foreground">RUT: {client.rut}</p>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Modificar Ficha
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>RUT Empresa</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.rut || "Sin información"} readOnly />
                    {client.rut && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.rut, "RUT Empresa")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Clave SII Empresa</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.clave_sii || "Sin información"} readOnly />
                    {client.clave_sii && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.clave_sii!, "Clave SII")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.direccion || "Sin información"} readOnly />
                    {client.direccion && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.direccion!, "Dirección")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.fono || "Sin información"} readOnly />
                    {client.fono && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.fono!, "Teléfono")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Correo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.email || "Sin información"} readOnly />
                    {client.email && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.email!, "Correo")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Representante Legal */}
          <Card>
            <CardHeader>
              <CardTitle>Representante Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.representante_legal || "Sin información"} readOnly />
                    {client.representante_legal && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.representante_legal!, "Nombre Representante")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>RUT</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.rut_representante || "Sin información"} readOnly />
                    {client.rut_representante && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.rut_representante!, "RUT Representante")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Clave SII Representante</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.clave_sii_repr || "Sin información"} readOnly />
                    {client.clave_sii_repr && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.clave_sii_repr!, "Clave SII Representante")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Clave Única del Representante</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={client.clave_unica || "Sin información"} readOnly />
                    {client.clave_unica && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(client.clave_unica!, "Clave Única")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Socios Card - Collapsible */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información de Socios</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSocios(!showSocios)}
                >
                  {showSocios ? (
                    <>
                      Ocultar <ChevronUp className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Mostrar <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showSocios && (
              <CardContent className="space-y-4">
                {[1, 2, 3].map((num) => {
                  const nombre = client[`socio_${num}_nombre` as keyof Client];
                  const rut = client[`socio_${num}_rut` as keyof Client];
                  const claveSii = client[`socio_${num}_clave_sii` as keyof Client];
                  
                  if (!nombre && !rut) return null;

                  return (
                    <div key={num}>
                      <h4 className="font-semibold mb-2">Socio {num}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={nombre as string || "Sin información"} readOnly />
                            {nombre && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(nombre as string, `Nombre Socio ${num}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>RUT</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={rut as string || "Sin información"} readOnly />
                            {rut && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(rut as string, `RUT Socio ${num}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Clave SII</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={claveSii as string || "Sin información"} readOnly />
                            {claveSii && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(claveSii as string, `Clave SII Socio ${num}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      {num < 3 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
                {!client.socio_1_nombre && !client.socio_1_rut && (
                  <p className="text-muted-foreground text-sm">No hay información de socios registrada</p>
                )}
              </CardContent>
            )}
          </Card>

          {/* RCV Data Card */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Compras y Ventas (RCV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ventas</Label>
                  <Input 
                    value={`$${(client.rcv_ventas || 0).toLocaleString("es-CL")}`} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Compras</Label>
                  <Input 
                    value={`$${(client.rcv_compras || 0).toLocaleString("es-CL")}`} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Órdenes de Trabajo Section */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientOTSection 
                clientId={client.id} 
                clientName={client.razon_social}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* F29 Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado F29</CardTitle>
            </CardHeader>
            <CardContent>
              {f29Status ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Período:</span>{" "}
                    {f29Status.mes}/{f29Status.anio}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Estado:</span>{" "}
                    <span className={
                      f29Status.estado === "declarado" 
                        ? "text-green-600" 
                        : "text-yellow-600"
                    }>
                      {f29Status.estado}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin declaraciones registradas</p>
              )}
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accesos Directos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {externalLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => window.open(link.url, "_blank")}
                >
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Module Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Módulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {moduleShortcuts.map((module) => (
                <Button
                  key={module.name}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => window.open(module.path, "_blank")}
                >
                  <module.icon className="h-4 w-4 mr-2" />
                  {module.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subir Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setUploadDialogOpen(true)} 
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientEditDialog
        client={client}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onClientUpdated={() => {
          loadClient();
          setEditDialogOpen(false);
        }}
        userRole={userRole}
      />

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        clients={[client]}
        preselectedClientId={client.id}
        onUploadSuccess={() => {
          toast({
            title: "Éxito",
            description: "El documento se subió correctamente"
          });
        }}
      />
    </div>
  );
}
