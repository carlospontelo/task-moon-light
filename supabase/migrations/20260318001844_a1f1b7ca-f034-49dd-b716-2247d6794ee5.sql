
-- Add pinned column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

-- Add sort_order column to custom_tags
ALTER TABLE public.custom_tags ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Set initial sort_order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS rn
  FROM public.custom_tags
)
UPDATE public.custom_tags SET sort_order = ordered.rn FROM ordered WHERE public.custom_tags.id = ordered.id;
