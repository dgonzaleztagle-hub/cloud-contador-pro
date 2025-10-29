import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientOTSection } from '@/components/ClientOTSection';
import logo from '@/assets/logo.png';

export default function MisOrdenesTrabajoPage() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<{ id: string; razon_social: string } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && userRole && userRole !== 'viewer') {
      navigate('/dashboard');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'viewer') {
      loadClientData();
    }
  }, [user, userRole]);

  const loadClientData = async () => {
    try {
      setLoadingData(true);
      
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, razon_social')
        .eq('user_id', user?.id)
        .eq('activo', true)
        .maybeSingle();

      if (clientError) {
        console.error('Error loading client data:', clientError);
        throw clientError;
      }
      
      if (!client) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se encontró información de cliente asociada a tu cuenta.'
        });
        setLoadingData(false);
        return;
      }

      setClientData(client);
    } catch (error: any) {
      console.error('Error loading client data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos'
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No se encontró información de cliente</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/client-workspace')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Mis Órdenes de Trabajo</h1>
              <p className="text-sm text-muted-foreground">{clientData.razon_social}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Historial Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientOTSection 
              clientId={clientData.id}
              clientName={clientData.razon_social}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}