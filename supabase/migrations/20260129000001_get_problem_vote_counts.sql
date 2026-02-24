-- RPC to return accurate vote counts from votes table (for list pages so reload shows correct counts)
CREATE OR REPLACE FUNCTION public.get_problem_vote_counts(problem_ids uuid[])
RETURNS TABLE (problem_id uuid, up_count bigint, down_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id AS problem_id,
    COALESCE(up.c, 0)::bigint AS up_count,
    COALESCE(down.c, 0)::bigint AS down_count
  FROM unnest(problem_ids) AS p(id)
  LEFT JOIN (
    SELECT v.problem_id, count(*)::bigint AS c
    FROM public.votes v
    WHERE v.problem_id = ANY(problem_ids) AND v.vote_type = 'up'
    GROUP BY v.problem_id
  ) up ON up.problem_id = p.id
  LEFT JOIN (
    SELECT v.problem_id, count(*)::bigint AS c
    FROM public.votes v
    WHERE v.problem_id = ANY(problem_ids) AND v.vote_type = 'down'
    GROUP BY v.problem_id
  ) down ON down.problem_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
