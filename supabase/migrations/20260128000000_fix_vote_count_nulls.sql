-- Fix vote count updates when upvotes/downvotes are NULL
-- Also normalize existing NULL counters to 0

UPDATE public.problems
SET
  upvotes = COALESCE(upvotes, 0),
  downvotes = COALESCE(downvotes, 0)
WHERE upvotes IS NULL OR downvotes IS NULL;

CREATE OR REPLACE FUNCTION public.update_problem_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.problems
      SET upvotes = COALESCE(upvotes, 0) + 1
      WHERE id = NEW.problem_id;
    ELSE
      UPDATE public.problems
      SET downvotes = COALESCE(downvotes, 0) + 1
      WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE public.problems
      SET
        upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0),
        downvotes = COALESCE(downvotes, 0) + 1
      WHERE id = NEW.problem_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE public.problems
      SET
        upvotes = COALESCE(upvotes, 0) + 1,
        downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0)
      WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.problems
      SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0)
      WHERE id = OLD.problem_id;
    ELSE
      UPDATE public.problems
      SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0)
      WHERE id = OLD.problem_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

