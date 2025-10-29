import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, UserCog, UserPlus, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

type AppRole = 'master' | 'admin' | 'viewer';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface Client {
  id: string;
  razon_social: string;
  rut: string;
}

export default function AdminUsers() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    console.log('AdminUsers - User:', user?.email, 'Role:', userRole, 'Loading:', loading);
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && userRole !== 'master') {
      console.log('Access denied - Role is not master:', userRole);
      toast({
        variant: 'destructive',
        title: 'Acceso denegado',
        description: 'Solo el Master puede acceder a esta página',
      });
      navigate('/dashboard');
    }
  }, [user, userRole, loading, navigate, toast]);

  useEffect(() => {
    if (user && userRole === 'master') {
      loadUsers();
      loadClients();
    }
  }, [user, userRole]);

  const loadClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('clients')
      .select('id, razon_social, rut')
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    if (error) {
      console.error('Error loading clients:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las empresas',
      });
    } else {
      setClients(data || []);
    }
    setLoadingClients(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
      });
    } else {
      setUsers(data || []);
    }
    setLoadingUsers(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que si es viewer (cliente), se haya seleccionado una empresa
    if (newRole === 'viewer' && !selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar una empresa para el cliente',
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar a la edge function para crear usuario sin afectar la sesión actual
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            fullName: newFullName,
            role: newRole,
            clientId: selectedClientId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      toast({
        title: 'Usuario creado',
        description: `Usuario ${newEmail} creado exitosamente con rol ${newRole}`,
      });

      // Reset form
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('viewer');
      setSelectedClientId('');
      setIsDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear usuario',
        description: error.message || 'Ocurrió un error al crear el usuario',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No puedes eliminar tu propia cuenta',
      });
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el usuario ${email}?`)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No session found');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al eliminar usuario');
        }

        toast({
          title: 'Usuario eliminado',
          description: `Usuario ${email} eliminado exitosamente`,
        });
        loadUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo eliminar el usuario',
        });
      }
    }
  };

  const handleCleanupOrphans = async () => {
    if (!confirm('¿Estás seguro de eliminar usuarios huérfanos? Esto eliminará usuarios que existen en autenticación pero no tienen perfil.')) {
      return;
    }

    setIsCleaningOrphans(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-orphan-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al limpiar usuarios huérfanos');
      }

      toast({
        title: 'Limpieza completada',
        description: `Se eliminaron ${result.deletedUsers?.length || 0} usuarios huérfanos`,
      });
      
      loadUsers();
    } catch (error: any) {
      console.error('Error cleaning orphan users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo limpiar los usuarios huérfanos',
      });
    } finally {
      setIsCleaningOrphans(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole as any }) // Cast temporalmente hasta que se actualicen los tipos
      .eq('id', userId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el rol',
      });
    } else {
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido actualizado',
      });
      loadUsers();
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gestión de Usuarios
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupOrphans}
                disabled={isCleaningOrphans}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {isCleaningOrphans ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Huérfanos
                  </>
                )}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crea una nueva cuenta de usuario con el rol especificado
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="admin">Contador</SelectItem>
                        <SelectItem value="viewer">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newRole === 'viewer' && (
                    <div className="space-y-2">
                      <Label htmlFor="client">Empresa *</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Selecciona una empresa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingClients ? (
                            <SelectItem value="loading" disabled>
                              Cargando empresas...
                            </SelectItem>
                          ) : clients.length === 0 ? (
                            <SelectItem value="no-clients" disabled>
                              No hay empresas disponibles
                            </SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.razon_social} - {client.rut}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        El usuario tendrá acceso a la información de esta empresa
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isCreating || (newRole === 'viewer' && !selectedClientId)}
                    className="w-full bg-gradient-to-r from-primary to-accent"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Usuario'
                    )}
                  </Button>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userProfile) => (
                <div
                  key={userProfile.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {userProfile.full_name || 'Sin nombre'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creado: {new Date(userProfile.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select
                      value={userProfile.role}
                      onValueChange={(value) => handleUpdateRole(userProfile.id, value as AppRole)}
                      disabled={userProfile.id === user?.id}
                    >
                      <SelectTrigger className="w-32 bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="admin">Contador</SelectItem>
                        <SelectItem value="viewer">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(userProfile.id, userProfile.email)}
                      disabled={userProfile.id === user?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
