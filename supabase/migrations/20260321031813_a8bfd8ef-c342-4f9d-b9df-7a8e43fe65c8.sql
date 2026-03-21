
-- Habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Habit entries (one per habit per day)
CREATE TABLE public.habit_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit entries" ON public.habit_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit entries" ON public.habit_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit entries" ON public.habit_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit entries" ON public.habit_entries FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for habit_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_entries;
