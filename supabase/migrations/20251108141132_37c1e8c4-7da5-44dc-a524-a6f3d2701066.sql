-- Create profiles table
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create problems table
CREATE TABLE public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  abstract text NOT NULL,
  proposed_solution text NOT NULL,
  domain text NOT NULL,
  tags text[] DEFAULT '{}',
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Problems policies
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

-- Create votes table
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Votes policies
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

-- Create saves table
CREATE TABLE public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Saves policies
CREATE POLICY "Users can view their own saves"
  ON public.saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save problems"
  ON public.saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
  ON public.saves FOR DELETE
  USING (auth.uid() = user_id);

-- Create follows table
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Users can view their own follows"
  ON public.follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow problems"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update problem vote counts
CREATE OR REPLACE FUNCTION public.update_problem_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.problems SET upvotes = upvotes + 1 WHERE id = NEW.problem_id;
    ELSE
      UPDATE public.problems SET downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE public.problems SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE public.problems SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.problems SET upvotes = upvotes - 1 WHERE id = OLD.problem_id;
    ELSE
      UPDATE public.problems SET downvotes = downvotes - 1 WHERE id = OLD.problem_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_problem_vote_counts();