-- Realtime for comments (so comment vote count updates and replies are live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
