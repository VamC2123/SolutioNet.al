-- Generate unique pid on insert: use max existing P-number + 1 to avoid duplicate key
CREATE OR REPLACE FUNCTION generate_pid()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.pid IS NULL OR NEW.pid = '' THEN
    SELECT COALESCE(MAX(
      CASE WHEN pid ~ '^P[0-9]+$' THEN NULLIF(SUBSTRING(pid FROM 2), '')::INTEGER ELSE NULL END
    ), 0) + 1 INTO next_num FROM public.problems;
    NEW.pid := 'P' || next_num::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
