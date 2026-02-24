-- Comment replies: parent_id on comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Comment vote counts on comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS downvotes integer NOT NULL DEFAULT 0;

-- comment_votes table (like/dislike per comment)
CREATE TABLE IF NOT EXISTS public.comment_votes (
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

-- Trigger to keep comment upvotes/downvotes in sync (floor at 0)
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

-- Backfill existing comments
UPDATE public.comments SET upvotes = 0, downvotes = 0 WHERE upvotes IS NULL OR downvotes IS NULL;
