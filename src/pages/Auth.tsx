import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';
import logo from '@/assets/logo.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if not loading and user is authenticated
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error de autenticación',
          description: error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas'
            : error.message,
        });
      } else {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Bienvenido a Plus Contable',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ha ocurrido un error. Por favor intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary to-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-24 w-24 flex items-center justify-center">
              <img src={logo} alt="Plus Contable" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Plus Contable
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Ingresa a tu cuenta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input border-border"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>Iniciar sesión</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
}
