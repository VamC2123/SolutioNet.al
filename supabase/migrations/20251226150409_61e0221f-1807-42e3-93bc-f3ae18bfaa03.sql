-- Create solutions table
CREATE TABLE public.solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abstract TEXT NOT NULL,
  detailed_solution_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Solutions are viewable by everyone" 
ON public.solutions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create solutions" 
ON public.solutions 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own solutions" 
ON public.solutions 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own solutions" 
ON public.solutions 
FOR DELETE 
USING (auth.uid() = author_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_solutions_updated_at
BEFORE UPDATE ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();