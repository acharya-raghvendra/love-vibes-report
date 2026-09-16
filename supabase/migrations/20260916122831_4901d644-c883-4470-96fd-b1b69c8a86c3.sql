create policy "Admins can read all report languages"
on public.report_languages
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';