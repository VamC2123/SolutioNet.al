-- =============================================================================
-- SolutioNet — full database schema (SINGLE SOURCE OF TRUTH)
-- =============================================================================
-- Apply this file only (Supabase SQL Editor on a new project, or psql).
-- Do not rely on separate migration fragments for new installs — everything
-- needed for the app lives here, including handle_new_user() with profile
-- metadata (bio, social URLs) from signup.
--
-- Historical migration snapshots under supabase/migrations/ are legacy only;
-- for a fresh database, use this file.
--
-- Run this once on a NEW empty Supabase project (SQL Editor), then import CSVs.
--
-- CSV import order (respect foreign keys):
--   1) auth.users — usually you do NOT import; users re-register, OR use Supabase
--      migration tools. profiles.id must match auth.users.id.
--   2) public.profiles
--   3) public.problems
--   4) public.votes, public.saves, public.follows, public.comments,
--      public.comment_votes, public.solutions
--
-- After importing problems, ensure pid values are unique (trigger only runs on INSERT).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    bio,
    github_url,
    linkedin_url,
    twitter_url
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'bio', '')), ''),
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'github_url', '')), ''),
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'linkedin_url', '')), ''),
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'twitter_url', '')), '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pid text UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  abstract text NOT NULL,
  proposed_solution text NOT NULL,
  domain text NOT NULL,
  tags text[] DEFAULT '{}',
  external_links jsonb,
  social_links jsonb,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Problems are viewable by everyone"
  ON public.problems FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create problems"
  ON public.problems FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own problems"
  ON public.problems FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own problems"
  ON public.problems FOR DELETE
  USING (auth.uid() = author_id);

CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves"
  ON public.saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save problems"
  ON public.saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
  ON public.saves FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
  ON public.follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow problems"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment votes viewable by everyone" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment vote" ON public.comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comment vote" ON public.comment_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment vote" ON public.comment_votes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.solutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abstract text NOT NULL,
  detailed_solution_url text NOT NULL,
  domain text NOT NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solutions are viewable by everyone"
ON public.solutions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create solutions"
ON public.solutions FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own solutions"
ON public.solutions FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own solutions"
ON public.solutions FOR DELETE USING (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- Functions & triggers: timestamps
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at
  BEFORE UPDATE ON public.solutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Problem vote counts (from votes table)
-- -----------------------------------------------------------------------------

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

CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_problem_vote_counts();

-- -----------------------------------------------------------------------------
-- Auto pid (P1, P2, …) — max-based to avoid duplicate key on bulk import
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_pid()
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

DROP TRIGGER IF EXISTS set_problem_pid ON public.problems;
CREATE TRIGGER set_problem_pid
  BEFORE INSERT ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_pid();

ALTER TABLE public.problems ALTER COLUMN pid SET NOT NULL;

-- -----------------------------------------------------------------------------
-- Comment vote counts
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(COALESCE(upvotes, 0) + 1, 0) WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = GREATEST(COALESCE(downvotes, 0) + 1, 0) WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE public.comments SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0), downvotes = GREATEST(COALESCE(downvotes, 0) + 1, 0) WHERE id = NEW.comment_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(COALESCE(upvotes, 0) + 1, 0), downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comment_vote_counts_trigger ON public.comment_votes;
CREATE TRIGGER update_comment_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counts();

-- -----------------------------------------------------------------------------
-- RPC (optional; app primarily counts via votes table)
-- -----------------------------------------------------------------------------

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

GRANT EXECUTE ON FUNCTION public.get_problem_vote_counts(uuid[]) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime (live updates in the app)
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.problems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
