-- Enable realtime for problems and profiles tables for live count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.problems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
