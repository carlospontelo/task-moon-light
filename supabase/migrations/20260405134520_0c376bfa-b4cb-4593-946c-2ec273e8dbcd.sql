
-- Create audit triggers on all sensitive tables
CREATE OR REPLACE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('task');

CREATE OR REPLACE TRIGGER audit_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('goal');

CREATE OR REPLACE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('expense');

CREATE OR REPLACE TRIGGER audit_habits
  AFTER INSERT OR UPDATE OR DELETE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('habit');

CREATE OR REPLACE TRIGGER audit_habit_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.habit_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('habit_entry');

CREATE OR REPLACE TRIGGER audit_custom_tags
  AFTER INSERT OR UPDATE OR DELETE ON public.custom_tags
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('custom_tag');

CREATE OR REPLACE TRIGGER audit_custom_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.custom_categories
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('custom_category');

CREATE OR REPLACE TRIGGER audit_custom_payment_methods
  AFTER INSERT OR UPDATE OR DELETE ON public.custom_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change('custom_payment_method');

-- Remove client-facing INSERT policy on audit_log
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;
