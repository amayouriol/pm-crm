CREATE TABLE public.program_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  responsable text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_progreso','hecha')),
  fecha date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.program_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  fecha date NOT NULL,
  hora text NOT NULL DEFAULT '',
  etapa text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX program_events_fecha_idx ON public.program_events (fecha);

REVOKE ALL ON public.program_tasks FROM anon, authenticated;
REVOKE ALL ON public.program_events FROM anon, authenticated;
GRANT ALL ON public.program_tasks TO service_role;
GRANT ALL ON public.program_events TO service_role;

ALTER TABLE public.program_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_events ENABLE ROW LEVEL SECURITY;