-- Add custom PID column to problems table
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS pid TEXT UNIQUE;

-- Create a sequence for problem IDs
CREATE SEQUENCE IF NOT EXISTS problem_id_seq START WITH 1;

-- Create function to generate PIDs
CREATE OR REPLACE FUNCTION generate_pid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pid IS NULL THEN
    NEW.pid := 'P' || nextval('problem_id_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate PIDs
DROP TRIGGER IF EXISTS set_problem_pid ON public.problems;
CREATE TRIGGER set_problem_pid
  BEFORE INSERT ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION generate_pid();

-- Update existing problems with PIDs
DO $$
DECLARE
  prob RECORD;
  counter INTEGER := 1;
BEGIN
  FOR prob IN SELECT id FROM public.problems WHERE pid IS NULL ORDER BY created_at
  LOOP
    UPDATE public.problems SET pid = 'P' || counter WHERE id = prob.id;
    counter := counter + 1;
  END LOOP;
  
  -- Update the sequence to continue from the last number
  PERFORM setval('problem_id_seq', counter);
END $$;

-- Make pid NOT NULL after setting values
ALTER TABLE public.problems ALTER COLUMN pid SET NOT NULL;