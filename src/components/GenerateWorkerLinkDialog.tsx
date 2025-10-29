import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  razon_social: string;
}

interface GenerateWorkerLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}

export default function GenerateWorkerLinkDialog({
  open,
  onOpenChange,
  clients
}: GenerateWorkerLinkDialogProps) {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState('');
  const [daysValid, setDaysValid] = useState('1'); // Changed to 24 hours (1 day)
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Debes seleccionar un cliente",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Generar token único
      const token = crypto.randomUUID();
      
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(daysValid));

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      // Insertar token en la base de datos
      const { error } = await supabase
        .from('worker_registration_tokens')
        .insert({
          client_id: selectedClient,
          token: token,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      // Generar enlace completo
      const link = `${window.location.origin}/registro-trabajador/${token}`;
      setGeneratedLink(link);

      toast({
        title: "Enlace generado",
        description: "El enlace ha sido generado exitosamente"
      });
    } catch (error) {
      console.error('Error generating link:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el enlace",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "El enlace ha sido copiado al portapapeles"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setSelectedClient('');
    setDaysValid('30');
    setGeneratedLink('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generar Enlace de Registro</DialogTitle>
          <DialogDescription>
            Crea un enlace único para que nuevos trabajadores completen su ficha de ingreso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={selectedClient}
              onValueChange={setSelectedClient}
              disabled={!!generatedLink}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccione un cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Duración del Enlace</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="365"
              value={daysValid}
              onChange={(e) => setDaysValid(e.target.value)}
              disabled={!!generatedLink}
            />
            <p className="text-xs text-muted-foreground">
              El enlace expirará después de {daysValid} {daysValid === '1' ? 'día (24 horas)' : 'días'}
            </p>
          </div>

          {!generatedLink ? (
            <Button
              onClick={generateLink}
              disabled={generating || !selectedClient}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Enlace'
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Enlace Generado</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparte este enlace con los nuevos trabajadores de {clients.find(c => c.id === selectedClient)?.razon_social}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
