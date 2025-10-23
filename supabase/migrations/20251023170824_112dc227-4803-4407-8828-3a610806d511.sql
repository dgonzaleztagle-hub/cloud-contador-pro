-- Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'client', 'viewer');

-- Tabla de perfiles de usuario con roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Master can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Master can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Master can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Master can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Tabla de clientes (con todos los campos del Excel)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  giro TEXT,
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,
  telefono TEXT,
  correo TEXT,
  clave_sii_encrypted TEXT,
  clave_unica_encrypted TEXT,
  certificado_digital_encrypted TEXT,
  rep_legal_nombre TEXT,
  rep_legal_rut TEXT,
  rep_legal_telefono TEXT,
  rep_legal_correo TEXT,
  contador_asignado TEXT,
  inicio_actividades DATE,
  tipo_contribuyente TEXT,
  regimen_tributario TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
CREATE POLICY "Master and Admin can view all clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Clients can view own data"
  ON public.clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Master and Admin can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can update clients"
  ON public.clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can delete clients"
  ON public.clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

-- Tabla de declaraciones F29
CREATE TABLE public.f29_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER NOT NULL CHECK (periodo_anio >= 2020),
  iva_ventas NUMERIC(15,2) NOT NULL DEFAULT 0,
  iva_compras NUMERIC(15,2) NOT NULL DEFAULT 0,
  remanente_anterior NUMERIC(15,2) NOT NULL DEFAULT 0,
  remanente_proximo NUMERIC(15,2) NOT NULL DEFAULT 0,
  iva_neto NUMERIC(15,2) NOT NULL DEFAULT 0,
  ppm NUMERIC(15,2) NOT NULL DEFAULT 0,
  honorarios NUMERIC(15,2) NOT NULL DEFAULT 0,
  retencion_2cat NUMERIC(15,2) NOT NULL DEFAULT 0,
  impuesto_unico NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_impuestos NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_general NUMERIC(15,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, periodo_mes, periodo_anio)
);

ALTER TABLE public.f29_declarations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para f29_declarations
CREATE POLICY "Master and Admin can view all F29"
  ON public.f29_declarations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Clients can view own F29"
  ON public.f29_declarations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = f29_declarations.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Master and Admin can insert F29"
  ON public.f29_declarations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can update F29"
  ON public.f29_declarations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can delete F29"
  ON public.f29_declarations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

-- Tabla de trabajadores RRHH
CREATE TABLE public.rrhh_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rut TEXT NOT NULL,
  plazo_contrato DATE,
  anticipo NUMERIC(12,2) DEFAULT 0,
  faltas NUMERIC(12,2) DEFAULT 0,
  permisos NUMERIC(12,2) DEFAULT 0,
  atrasos NUMERIC(12,2) DEFAULT 0,
  periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER NOT NULL CHECK (periodo_anio >= 2020),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, rut, periodo_mes, periodo_anio)
);

ALTER TABLE public.rrhh_workers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rrhh_workers
CREATE POLICY "Master and Admin can view all RRHH"
  ON public.rrhh_workers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Clients can view own RRHH"
  ON public.rrhh_workers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = rrhh_workers.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Master and Admin can insert RRHH"
  ON public.rrhh_workers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can update RRHH"
  ON public.rrhh_workers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can delete RRHH"
  ON public.rrhh_workers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

-- Tabla de archivos
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_category TEXT NOT NULL,
  periodo_mes INTEGER CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER CHECK (periodo_anio >= 2020),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para files
CREATE POLICY "Master and Admin can view all files"
  ON public.files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Clients can view own files"
  ON public.files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = files.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Master and Admin can upload files"
  ON public.files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can delete files"
  ON public.files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('master', 'admin')
    )
  );

-- Trigger para actualizar updated_at en profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rrhh_updated_at
  BEFORE UPDATE ON public.rrhh_workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();