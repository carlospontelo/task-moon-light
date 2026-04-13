
CREATE TABLE public.expense_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT true,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expense_id, month)
);

ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.expense_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.expense_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.expense_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.expense_payments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_expense_payments_lookup ON public.expense_payments(expense_id, month);

ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_payments;
