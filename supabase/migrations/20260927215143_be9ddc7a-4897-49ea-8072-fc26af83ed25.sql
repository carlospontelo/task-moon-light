GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;
REVOKE EXECUTE ON FUNCTION public.log_audit_change() FROM PUBLIC, anon, authenticated;