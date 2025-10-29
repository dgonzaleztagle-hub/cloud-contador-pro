-- Crear tabla de órdenes de trabajo
CREATE TABLE public.ordenes_trabajo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'terminada')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de archivos de órdenes de trabajo
CREATE TABLE public.ot_archivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ot_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_archivos ENABLE ROW LEVEL SECURITY;

-- Políticas para ordenes_trabajo

-- Clientes pueden ver sus propias OT
CREATE POLICY "Clients can view own OT"
ON public.ordenes_trabajo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = ordenes_trabajo.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Clientes pueden crear OT para su propia empresa
CREATE POLICY "Clients can create own OT"
ON public.ordenes_trabajo
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = ordenes_trabajo.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Master y Admin pueden ver todas las OT
CREATE POLICY "Master and Admin can view all OT"
ON public.ordenes_trabajo
FOR SELECT
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Master y Admin pueden actualizar OT (cambiar estado)
CREATE POLICY "Master and Admin can update OT"
ON public.ordenes_trabajo
FOR UPDATE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Master y Admin pueden eliminar OT
CREATE POLICY "Master and Admin can delete OT"
ON public.ordenes_trabajo
FOR DELETE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Políticas para ot_archivos

-- Clientes pueden ver archivos de sus propias OT
CREATE POLICY "Clients can view own OT files"
ON public.ot_archivos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes_trabajo ot
    JOIN public.clients c ON c.id = ot.client_id
    WHERE ot.id = ot_archivos.ot_id
    AND c.user_id = auth.uid()
  )
);

-- Clientes pueden subir archivos a sus propias OT
CREATE POLICY "Clients can upload files to own OT"
ON public.ot_archivos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ordenes_trabajo ot
    JOIN public.clients c ON c.id = ot.client_id
    WHERE ot.id = ot_archivos.ot_id
    AND c.user_id = auth.uid()
  )
);

-- Master y Admin pueden ver todos los archivos de OT
CREATE POLICY "Master and Admin can view all OT files"
ON public.ot_archivos
FOR SELECT
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Master y Admin pueden eliminar archivos de OT
CREATE POLICY "Master and Admin can delete OT files"
ON public.ot_archivos
FOR DELETE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_ordenes_trabajo_updated_at
BEFORE UPDATE ON public.ordenes_trabajo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_ordenes_trabajo_client_id ON public.ordenes_trabajo(client_id);
CREATE INDEX idx_ordenes_trabajo_estado ON public.ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_trabajo_created_at ON public.ordenes_trabajo(created_at DESC);
CREATE INDEX idx_ot_archivos_ot_id ON public.ot_archivos(ot_id);