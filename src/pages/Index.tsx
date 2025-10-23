import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Users, Shield, FileText } from 'lucide-react';
import { Footer } from '@/components/Footer';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getSession());
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex flex-col">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 flex-1">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
              <Calculator className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Plus Contable
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Sistema Contable Chileno Profesional en la Nube
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg"
            >
              Crear Cuenta
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:shadow-primary/5 transition-all">
              <TrendingUp className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Declaraciones F29</h3>
              <p className="text-sm text-muted-foreground">
                Cálculo automático de impuestos y remanentes
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:shadow-primary/5 transition-all">
              <Users className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Gestión de Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Agenda completa con datos de contacto
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:shadow-primary/5 transition-all">
              <FileText className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Recursos Humanos</h3>
              <p className="text-sm text-muted-foreground">
                Control de trabajadores y descuentos
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:shadow-primary/5 transition-all">
              <Shield className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Seguridad Total</h3>
              <p className="text-sm text-muted-foreground">
                Datos encriptados y roles de usuario
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 p-8 rounded-2xl bg-card border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Sistema Profesional Chileno
            </h2>
            <p className="text-muted-foreground mb-4">
              Plus Contable es un sistema contable completo diseñado específicamente para la normativa chilena, 
              con gestión de F29, recursos humanos, documentos PDF y control administrativo total.
            </p>
            <ul className="text-left text-sm text-muted-foreground space-y-2 max-w-2xl mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Cálculo automático de IVA, PPM, honorarios y remanentes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Datos en tiempo real: UF, UTM y Dólar observado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Control de usuarios con roles: Master, Admin, Cliente y Viewer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Almacenamiento seguro de PDFs y certificados digitales</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
