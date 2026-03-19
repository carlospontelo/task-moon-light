
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS board_group text NOT NULL DEFAULT 'today';

-- Migrate existing pinned tasks
UPDATE public.tasks SET board_group = 'pinned' WHERE pinned = true;
