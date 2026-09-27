-- 1. Data de conclusão das tarefas
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_task_completed_at ON public.tasks;
CREATE TRIGGER trg_set_task_completed_at
BEFORE INSERT OR UPDATE OF status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_at ON public.tasks(user_id, completed_at);

-- 2. Entradas e investimentos
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'investment')),
  description text,
  amount integer NOT NULL CHECK (amount >= 0),
  month text NOT NULL,
  recurring boolean NOT NULL DEFAULT false,
  series_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Users can insert own finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Users can update own finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Users can delete own finance entries" ON public.finance_entries;

CREATE POLICY "Users can view own finance entries" ON public.finance_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance entries" ON public.finance_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance entries" ON public.finance_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance entries" ON public.finance_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_finance_entries_user_month ON public.finance_entries(user_id, month);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'finance_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_entries;
  END IF;
END $$;