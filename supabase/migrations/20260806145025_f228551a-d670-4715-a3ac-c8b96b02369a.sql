CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON public.registrations (user_id);
CREATE INDEX IF NOT EXISTS hackathon_results_user_id_idx ON public.hackathon_results (user_id);
CREATE INDEX IF NOT EXISTS squads_hackathon_id_idx ON public.squads (hackathon_id);
CREATE INDEX IF NOT EXISTS squads_leader_id_idx ON public.squads (leader_id);
CREATE INDEX IF NOT EXISTS squad_members_user_id_idx ON public.squad_members (user_id);
CREATE INDEX IF NOT EXISTS messages_student_created_at_idx ON public.messages (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS allowed_emails_lower_email_idx ON public.allowed_emails (lower(email));