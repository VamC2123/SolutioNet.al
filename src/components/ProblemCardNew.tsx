import { Card, CardBody, CardFooter, Button, Chip } from "@nextui-org/react";
import { ArrowUpCircle, ArrowDownCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProblemCardNewProps {
  id: string;
  pid: string;
  title: string;
  domain: string;
  postedDate: string;
  author: string;
  upvotes: number;
  downvotes: number;
  onVoteChange?: () => void;
}

export const ProblemCardNew = ({
  id,
  pid,
  title,
  domain,
  postedDate,
  author,
  upvotes,
  downvotes,
  onVoteChange,
}: ProblemCardNewProps) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);

  useEffect(() => {
    if (user) {
      checkSavedStatus();
      checkVoteStatus();
    }
  }, [user, id]);

  // Keep local counts in sync with incoming props (floor at 0)
  useEffect(() => {
    setCurrentUpvotes(Math.max(0, upvotes ?? 0));
  }, [upvotes]);

  useEffect(() => {
    setCurrentDownvotes(Math.max(0, downvotes ?? 0));
  }, [downvotes]);

  // Realtime sync for vote counts (problems table is updated by DB trigger)
  useEffect(() => {
    const channel = supabase
      .channel(`problem-row-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "problems",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const next = payload.new as any;
          setCurrentUpvotes(Math.max(0, next?.upvotes ?? 0));
          setCurrentDownvotes(Math.max(0, next?.downvotes ?? 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const checkSavedStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("problem_id", id)
      .single();
    setIsSaved(!!data);
  };

  const checkVoteStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", user.id)
      .eq("problem_id", id)
      .single();
    setUserVote(data?.vote_type as 'up' | 'down' | null);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save problems");
      return;
    }

    if (isSaved) {
      await supabase
        .from("saves")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", id);
      setIsSaved(false);
      toast.success("Problem unsaved");
    } else {
      await supabase
        .from("saves")
        .insert({ user_id: user.id, problem_id: id });
      setIsSaved(true);
      toast.success("Problem saved");
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    if (userVote === voteType) {
      // Remove vote
      await supabase
        .from("votes")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", id);
      
      if (voteType === 'up') {
        setCurrentUpvotes(prev => Math.max(0, prev - 1));
      } else {
        setCurrentDownvotes(prev => Math.max(0, prev - 1));
      }
      setUserVote(null);
      toast.success("Vote removed");
    } else if (userVote) {
      await supabase
        .from("votes")
        .update({ vote_type: voteType })
        .eq("user_id", user.id)
        .eq("problem_id", id);
      if (voteType === 'up') {
        setCurrentUpvotes(prev => prev + 1);
        setCurrentDownvotes(prev => Math.max(0, prev - 1));
      } else {
        setCurrentDownvotes(prev => prev + 1);
        setCurrentUpvotes(prev => Math.max(0, prev - 1));
      }
      setUserVote(voteType);
      toast.success("Vote changed");
    } else {
      await supabase
        .from("votes")
        .insert({ user_id: user.id, problem_id: id, vote_type: voteType });
      if (voteType === 'up') {
        setCurrentUpvotes(prev => prev + 1);
      } else {
        setCurrentDownvotes(prev => prev + 1);
      }
      setUserVote(voteType);
      toast.success("Vote recorded");
    }

    if (onVoteChange) onVoteChange();
  };

  return (
    <Card className="glass w-full hover:scale-[1.02] transition-transform duration-300">
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-muted-foreground">#{pid}</span>
              <Chip size="sm" variant="flat" color="primary">
                {domain}
              </Chip>
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by {author}</span>
              <span>•</span>
              <span>{postedDate}</span>
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter className="px-6 pb-2 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className={[
              "bg-background/70 backdrop-blur border border-border/50 shadow-sm hover:shadow-md",
              userVote === "up" ? "text-primary" : "",
            ].join(" ")}
            onPress={() => handleVote('up')}
          >
            <ArrowUpCircle className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">{Math.max(0, currentUpvotes)}</span>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className={[
              "bg-background/70 backdrop-blur border border-border/50 shadow-sm hover:shadow-md",
              userVote === "down" ? "text-destructive" : "",
            ].join(" ")}
            onPress={() => handleVote('down')}
          >
            <ArrowDownCircle className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">{Math.max(0, currentDownvotes)}</span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleSave}
            className={isSaved ? "text-primary" : ""}
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </Button>
        </div>
        <Link to={`/problem/${pid}`}>
          <Button color="primary" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};