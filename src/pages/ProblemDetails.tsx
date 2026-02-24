import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Button, Chip, Avatar, Divider, Textarea, Card, CardBody, Spinner, Input } from "@nextui-org/react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, Bookmark, BookmarkCheck, UserPlus, UserMinus, Send, Trash2, Plus, ChevronDown, ChevronUp, Link as LinkIcon, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { summarizeSolutions, isMockMode, getRelatedProblemsRanked } from "@/lib/mlService";
import { Link as RouterLink } from "react-router-dom";
import { getVoteCountsForProblem } from "@/lib/voteCounts";

const ProblemDetails = () => {
  const { id: pid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [isAddSolutionOpen, setIsAddSolutionOpen] = useState(false);
  const [solutionAbstract, setSolutionAbstract] = useState("");
  const [solutionUrl, setSolutionUrl] = useState("");
  const [solutionTags, setSolutionTags] = useState<string[]>([]);
  const [solutionTagInput, setSolutionTagInput] = useState("");
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentVotes, setCommentVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(null);
  const [solutionsExpanded, setSolutionsExpanded] = useState(false);
  const [relatedProblems, setRelatedProblems] = useState<Array<{ id: string; pid: string; title: string; domain: string }>>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    fetchProblemDetails();
  }, [pid]);

  useEffect(() => {
    if (user && problem) {
      checkSavedStatus();
      checkFollowStatus();
      checkVoteStatus();
    }
  }, [user, problem]);

  useEffect(() => {
    if (!problem?.id) return;

    // Real-time sync for comments
    const commentsChannel = supabase
      .channel(`comments-${problem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `problem_id=eq.${problem.id}`
        },
        () => {
          fetchComments(problem.id);
        }
      )
      .subscribe();

    // Real-time sync for problem votes
    const votesChannel = supabase
      .channel(`votes-${problem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `problem_id=eq.${problem.id}`
        },
        () => {
          fetchProblemDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [problem?.id]);

  useEffect(() => {
    if (!problem?.id) return;

    // Real-time sync for problem row updates (vote counts)
    const problemChannel = supabase
      .channel(`problem-${problem.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "problems",
          filter: `id=eq.${problem.id}`,
        },
        (payload) => {
          const next = payload.new as any;
          setProblem((prev: any) => (prev ? { ...prev, ...next } : next));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(problemChannel);
    };
  }, [problem?.id]);

  useEffect(() => {
    if (!problem?.id || !pid) return;
    let cancelled = false;
    setRelatedLoading(true);
    (async () => {
      try {
        const { data: candidates } = await supabase
          .from("problems")
          .select("id, pid, title, domain, tags")
          .neq("id", problem.id)
          .limit(30);
        if (cancelled) return;
        const list = candidates ?? [];
        const ranked = await getRelatedProblemsRanked(
          { id: problem.id, title: problem.title, domain: problem.domain, tags: problem.tags ?? [] },
          list,
          8
        );
        if (!cancelled) setRelatedProblems(ranked);
      } catch (e) {
        if (!cancelled) setRelatedProblems([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [problem?.id, problem?.title, problem?.domain, problem?.tags, pid]);

  const fetchProblemDetails = async () => {
    if (!pid) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("problems")
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("pid", pid)
        .single();

      if (error) throw error;
      const counts = await getVoteCountsForProblem(data.id);
      setProblem({
        ...data,
        upvotes: Math.max(0, counts.up),
        downvotes: Math.max(0, counts.down),
      });
      await Promise.all([
        fetchComments(data.id),
        fetchSolutions(data.id),
      ]);
    } catch (error) {
      console.error("Error fetching problem:", error);
      toast.error("Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const refreshVoteCounts = async (problemId: string) => {
    try {
      const counts = await getVoteCountsForProblem(problemId);
      setProblem((p: any) =>
        p && p.id === problemId
          ? { ...p, upvotes: Math.max(0, counts.up), downvotes: Math.max(0, counts.down) }
          : p
      );
    } catch (error) {
      console.error("Failed to refresh vote counts:", error);
    }
  };

  const fetchComments = async (problemId?: string) => {
    const id = problemId ?? problem?.id;
    if (!id) return;
    const { data, error } = await supabase
      .from("comments")
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .eq("problem_id", id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("fetchComments:", error);
      setComments([]);
      return;
    }
    setComments(data || []);
    if (user) {
      const ids = (data || []).map((c: any) => c.id);
      if (ids.length > 0) {
        try {
          const { data: votes } = await supabase
            .from("comment_votes")
            .select("comment_id, vote_type")
            .eq("user_id", user.id)
            .in("comment_id", ids);
          const map: Record<string, 'up' | 'down' | null> = {};
          (votes || []).forEach((v: any) => { map[v.comment_id] = v.vote_type; });
          setCommentVotes(map);
        } catch {
          setCommentVotes({});
        }
      }
    }
  };

  const fetchSolutions = async (problemId?: string) => {
    const id = problemId ?? problem?.id;
    if (!id) return;
    const { data } = await supabase
      .from("solutions")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("problem_id", id)
      .order("created_at", { ascending: false });
    setSolutions(data || []);
  };

  const checkSavedStatus = async () => {
    if (!problem?.id) return;
    const { data } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", user!.id)
      .eq("problem_id", problem.id)
      .single();
    setIsSaved(!!data);
  };

  const checkFollowStatus = async () => {
    if (!problem?.id) return;
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user!.id)
      .eq("problem_id", problem.id)
      .single();
    setIsFollowing(!!data);
  };

  const checkVoteStatus = async () => {
    if (!problem?.id) return;
    const { data } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", user!.id)
      .eq("problem_id", problem.id)
      .single();
    setUserVote(data?.vote_type as 'up' | 'down' | null);
  };

  const handleSave = async () => {
    if (!user || !problem?.id) {
      toast.error("Please login to save problems");
      return;
    }

    if (isSaved) {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("problem_id", problem.id);
      setIsSaved(false);
      toast.success("Problem unsaved");
    } else {
      await supabase.from("saves").insert({ user_id: user.id, problem_id: problem.id });
      setIsSaved(true);
      toast.success("Problem saved");
    }
  };

  const handleFollow = async () => {
    if (!user || !problem?.id) {
      toast.error("Please login to follow problems");
      return;
    }

    if (isFollowing) {
      await supabase.from("follows").delete().eq("user_id", user.id).eq("problem_id", problem.id);
      setIsFollowing(false);
      toast.success("Unfollowed problem");
    } else {
      await supabase.from("follows").insert({ user_id: user.id, problem_id: problem.id });
      setIsFollowing(true);
      toast.success("Following problem");
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || !problem?.id) {
      toast.error("Please login to vote");
      return;
    }

    try {
      const prevVote = userVote;
      const prevUp = (problem.upvotes ?? 0) as number;
      const prevDown = (problem.downvotes ?? 0) as number;

      if (userVote === voteType) {
        const { error } = await supabase.from("votes").delete().eq("user_id", user.id).eq("problem_id", problem.id);
        if (error) throw error;
        setUserVote(null);
        // optimistic count update
        setProblem((p: any) =>
          p
            ? {
                ...p,
                upvotes: voteType === "up" ? Math.max(prevUp - 1, 0) : prevUp,
                downvotes: voteType === "down" ? Math.max(prevDown - 1, 0) : prevDown,
              }
            : p
        );
        toast.success("Vote removed");
      } else if (userVote) {
        const { error } = await supabase.from("votes").update({ vote_type: voteType }).eq("user_id", user.id).eq("problem_id", problem.id);
        if (error) throw error;
        setUserVote(voteType);
        // optimistic count update (switch)
        setProblem((p: any) => {
          if (!p) return p;
          const up = (p.upvotes ?? 0) as number;
          const down = (p.downvotes ?? 0) as number;
          if (prevVote === "up" && voteType === "down") {
            return { ...p, upvotes: Math.max(up - 1, 0), downvotes: down + 1 };
          }
          if (prevVote === "down" && voteType === "up") {
            return { ...p, upvotes: up + 1, downvotes: Math.max(down - 1, 0) };
          }
          return p;
        });
        toast.success("Vote changed");
      } else {
        const { error } = await supabase.from("votes").insert({ user_id: user.id, problem_id: problem.id, vote_type: voteType });
        if (error) throw error;
        setUserVote(voteType);
        // optimistic count update
        setProblem((p: any) =>
          p
            ? {
                ...p,
                upvotes: voteType === "up" ? (p.upvotes ?? 0) + 1 : p.upvotes ?? 0,
                downvotes: voteType === "down" ? (p.downvotes ?? 0) + 1 : p.downvotes ?? 0,
              }
            : p
        );
        toast.success("Vote recorded");
      }
      // Refresh counts from authoritative votes table so a reload always shows real totals
      await refreshVoteCounts(problem.id);
    } catch (error: any) {
      console.error("Vote error:", error);
      toast.error("Failed to record vote");
      if (problem?.id) refreshVoteCounts(problem.id);
    }
  };

  const handlePostComment = async (parentId?: string | null) => {
    if (!user || !problem?.id) {
      toast.error("Please login to comment");
      return;
    }
    const text = parentId ? replyContent : comment;
    if (!text.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    await supabase.from("comments").insert({
      user_id: user.id,
      problem_id: problem.id,
      content: text,
      ...(parentId ? { parent_id: parentId } : {}),
    });
    if (parentId) {
      setReplyContent("");
      setReplyingToId(null);
    } else setComment("");
    toast.success("Comment posted");
    fetchComments();
  };

  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    const current = commentVotes[commentId];
    const applyOptimistic = (deltaUp: number, deltaDown: number) => {
      setComments((prev) =>
        prev.map((c: any) =>
          c.id !== commentId
            ? c
            : {
                ...c,
                upvotes: Math.max(0, (c.upvotes ?? 0) + deltaUp),
                downvotes: Math.max(0, (c.downvotes ?? 0) + deltaDown),
              }
        )
      );
    };
    try {
      if (current === voteType) {
        await supabase.from("comment_votes").delete().eq("comment_id", commentId).eq("user_id", user.id);
        setCommentVotes((prev) => ({ ...prev, [commentId]: null }));
        applyOptimistic(voteType === "up" ? -1 : 0, voteType === "down" ? -1 : 0);
      } else if (current) {
        await supabase.from("comment_votes").update({ vote_type: voteType }).eq("comment_id", commentId).eq("user_id", user.id);
        setCommentVotes((prev) => ({ ...prev, [commentId]: voteType }));
        if (current === "up" && voteType === "down") applyOptimistic(-1, 1);
        else if (current === "down" && voteType === "up") applyOptimistic(1, -1);
      } else {
        await supabase.from("comment_votes").insert({ comment_id: commentId, user_id: user.id, vote_type: voteType });
        setCommentVotes((prev) => ({ ...prev, [commentId]: voteType }));
        applyOptimistic(voteType === "up" ? 1 : 0, voteType === "down" ? 1 : 0);
      }
      setTimeout(() => fetchComments(problem?.id), 400);
    } catch (e) {
      toast.error("Failed to update vote");
      fetchComments(problem?.id);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    toast.success("Comment deleted");
    fetchComments();
  };

  const handleDeleteProblem = async () => {
    if (!problem?.id) return;
    if (window.confirm("Are you sure you want to delete this problem?")) {
      await supabase.from("problems").delete().eq("id", problem.id);
      toast.success("Problem deleted");
      navigate("/browse");
    }
  };

  const handleAddSolution = () => {
    if (!user) {
      toast.error("Please login to add a solution");
      navigate("/auth");
      return;
    }
    setIsAddSolutionOpen(true);
  };

  const handleAddSolutionTag = () => {
    if (solutionTagInput.trim() && !solutionTags.includes(solutionTagInput.trim())) {
      setSolutionTags([...solutionTags, solutionTagInput.trim()]);
      setSolutionTagInput("");
    }
  };

  const handleRemoveSolutionTag = (tag: string) => {
    setSolutionTags(solutionTags.filter((t) => t !== tag));
  };

  const handleSubmitSolution = async () => {
    if (!solutionAbstract.trim() || !solutionUrl.trim()) {
      toast.error("Please fill abstract and solution URL");
      return;
    }
    if (!user || !problem?.id) return;
    setIsSubmittingSolution(true);
    try {
      const { error } = await supabase.from("solutions").insert({
        problem_id: problem.id,
        author_id: user.id,
        abstract: solutionAbstract,
        detailed_solution_url: solutionUrl,
        domain: problem.domain,
        tags: solutionTags,
      });
      if (error) throw error;
      toast.success("Solution submitted");
      setIsAddSolutionOpen(false);
      setSolutionAbstract("");
      setSolutionUrl("");
      setSolutionTags([]);
      setSolutionTagInput("");
      fetchSolutions();
      setAiSummary(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setIsSubmittingSolution(false);
    }
  };

  const handleSummarizeSolutions = async () => {
    if (solutions.length === 0) {
      toast.error("No solutions to summarize");
      return;
    }
    setIsSummarizing(true);
    try {
      const abstracts = solutions.map((s) => s.abstract).filter(Boolean);
      const summary = await summarizeSolutions(abstracts);
      setAiSummary(summary);
      toast.success("Summary generated");
    } catch (e) {
      toast.error("Failed to summarize");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!problem) {
    return <p className="text-center py-20">Problem not found</p>;
  }

  const isAuthor = user?.id === problem.author_id;

  return (
    <div className="min-h-screen bg-background">
      <NavigationNew />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="glass">
                <CardBody className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">#{problem.pid}</span>
                        <Chip size="sm" color="primary" variant="flat">
                          {problem.domain}
                        </Chip>
                        {problem.tags?.map((tag: string) => (
                          <Chip key={tag} size="sm" variant="bordered">{tag}</Chip>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(problem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
                    
                    {isAuthor && (
                      <Button color="danger" variant="light" onPress={handleDeleteProblem}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Problem
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card className="glass">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Problem Statement</h2>
                  <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
                </CardBody>
              </Card>

              <Card className="glass">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Abstract</h2>
                  <p className="text-muted-foreground leading-relaxed">{problem.abstract}</p>
                </CardBody>
              </Card>

              <Card className="glass">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Proposed Solution</h2>
                  <p className="text-muted-foreground leading-relaxed">{problem.proposed_solution}</p>
                </CardBody>
              </Card>

              {solutions.length > 0 && (
                <Card className="glass">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Other Solutions</h2>
                      <Button color="primary" size="sm" onPress={handleAddSolution} startContent={<Plus className="h-4 w-4" />}>
                        Add Solution
                      </Button>
                    </div>
                    {!solutionsExpanded ? (
                      <div className="space-y-2">
                        <div className="glass-hover p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground line-clamp-2">{solutions[0]?.abstract}</p>
                          <Button variant="flat" size="sm" className="mt-2" onPress={() => setSolutionsExpanded(true)} endContent={<ChevronDown className="h-4 w-4" />}>
                            Show more
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isMockMode() && (
                          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                            Demo mode: set VITE_OPENAI_API_KEY for real AI summaries.
                          </div>
                        )}
                        <Card className="bg-primary/5 border border-primary/20">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Summary</span>
                              {!aiSummary && (
                                <Button size="sm" color="primary" variant="flat" onPress={handleSummarizeSolutions} isLoading={isSummarizing}>
                                  Summarize
                                </Button>
                              )}
                            </div>
                            {aiSummary ? (
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSummary}</div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">Click Summarize to generate an overview of all solutions.</p>
                            )}
                          </CardBody>
                        </Card>
                        {solutions.map((sol) => (
                          <div key={sol.id} className="glass-hover p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar name={sol.profiles?.full_name?.[0]} size="sm" />
                                <span className="font-medium text-sm">{sol.profiles?.full_name || "User"}</span>
                                <Chip size="sm" variant="flat">{sol.domain}</Chip>
                              </div>
                              <Button isIconOnly size="sm" variant="light" onPress={() => setExpandedSolutionId(expandedSolutionId === sol.id ? null : sol.id)}>
                                {expandedSolutionId === sol.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{sol.abstract}</p>
                            {expandedSolutionId === sol.id && (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <p className="text-sm">{sol.abstract}</p>
                                <a href={sol.detailed_solution_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary text-sm">
                                  <LinkIcon className="h-4 w-4" /> View solution
                                </a>
                                {sol.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {sol.tags.map((t: string) => (
                                      <Chip key={t} size="sm" variant="flat">{t}</Chip>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <Button variant="flat" size="sm" onPress={() => setSolutionsExpanded(false)}>Show less</Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
              {solutions.length === 0 && (
                <Card className="glass">
                  <CardBody className="p-6">
                    <h2 className="text-xl font-semibold mb-2">Other Solutions</h2>
                    <p className="text-muted-foreground text-sm mb-4">No solutions yet. Be the first to add one.</p>
                    <Button color="primary" onPress={handleAddSolution} startContent={<Plus className="h-4 w-4" />}>Add Solution</Button>
                  </CardBody>
                </Card>
              )}

              <Card className="glass">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Comments</h2>
                  
                  <div className="flex gap-2 mb-6">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onValueChange={setComment}
                      variant="bordered"
                      minRows={2}
                    />
                    <Button color="primary" onPress={() => handlePostComment()}>
                      <Send className="mr-2 h-4 w-4" />
                      Post Comment
                    </Button>
                  </div>

                  <Divider className="my-2" />

                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      (() => {
                        const roots = comments.filter((c: any) => !c.parent_id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        return roots.map((c: any) => {
                          const replies = comments.filter((r: any) => r.parent_id === c.id);
                          return (
                            <div key={c.id}>
                              <div className={c.parent_id ? "ml-6 pl-4 border-l-2 border-border/50" : ""}>
                                <div className="glass-hover p-4 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <Avatar name={c.profiles?.full_name?.[0]} size="sm" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                        <span className="font-semibold text-sm">{c.profiles?.full_name || "User"}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                          {user?.id === c.user_id && (
                                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteComment(c.id)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-muted-foreground text-sm">{c.content}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                          <Button isIconOnly size="sm" variant="light" className={commentVotes[c.id] === "up" ? "text-primary" : ""} onPress={() => handleCommentVote(c.id, "up")}>
                                            <ArrowUp className="h-4 w-4" />
                                          </Button>
                                          <span className="text-xs min-w-[1rem]">{Math.max(0, c.upvotes ?? 0)}</span>
                                          <Button isIconOnly size="sm" variant="light" className={commentVotes[c.id] === "down" ? "text-destructive" : ""} onPress={() => handleCommentVote(c.id, "down")}>
                                            <ArrowDown className="h-4 w-4" />
                                          </Button>
                                          <span className="text-xs min-w-[1rem]">{Math.max(0, c.downvotes ?? 0)}</span>
                                        </div>
                                        {!c.parent_id && (
                                          <Button size="sm" variant="light" onPress={() => setReplyingToId(replyingToId === c.id ? null : c.id)}>
                                            Reply
                                          </Button>
                                        )}
                                      </div>
                                      {replyingToId === c.id && (
                                        <div className="mt-3 flex gap-2">
                                          <Textarea size="sm" placeholder="Write a reply..." value={replyContent} onValueChange={setReplyContent} minRows={1} className="flex-1" />
                                          <Button size="sm" color="primary" onPress={() => handlePostComment(c.id)}>Post</Button>
                                          <Button size="sm" variant="light" onPress={() => { setReplyingToId(null); setReplyContent(""); }}>Cancel</Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {replies.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {replies.map((r: any) => (
                                    <div key={r.id} className="ml-6 pl-4 border-l-2 border-border/50">
                                      <div className="glass-hover p-3 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <Avatar name={r.profiles?.full_name?.[0]} size="sm" className="flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                              <span className="font-medium text-sm">{r.profiles?.full_name || "User"}</span>
                                              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                                              {user?.id === r.user_id && (
                                                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteComment(r.id)}><Trash2 className="h-3 w-3" /></Button>
                                              )}
                                            </div>
                                            <p className="text-muted-foreground text-sm mt-0.5">{r.content}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Button isIconOnly size="sm" variant="light" className={commentVotes[r.id] === "up" ? "text-primary" : ""} onPress={() => handleCommentVote(r.id, "up")}><ArrowUp className="h-3 w-3" /></Button>
                                              <span className="text-xs">{Math.max(0, r.upvotes ?? 0)}</span>
                                              <Button isIconOnly size="sm" variant="light" className={commentVotes[r.id] === "down" ? "text-destructive" : ""} onPress={() => handleCommentVote(r.id, "down")}><ArrowDown className="h-3 w-3" /></Button>
                                              <span className="text-xs">{Math.max(0, r.downvotes ?? 0)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <Card className="glass">
                <CardTitle className="text-lg text-muted-foreground pt-1 px-2 flex justify-center"> <u>Author Details</u></CardTitle>
                <CardBody className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar 
                      src={problem.profiles?.avatar_url}
                      name={problem.profiles?.full_name?.[0]}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{problem.profiles?.full_name || "Unknown"}</h3>
                    </div>
                  </div>

                  <Divider className="my-2" />

                  <div className="flex items-center justify-center gap-2 ">
                    <div className="flex items-center justify-between glass-hover p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Upvote</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.max(0, problem.upvotes ?? 0)}</span>
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
                            <ArrowUp className="h-5 w-5 text-primary" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between glass-hover p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Downvote</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.max(0, problem.downvotes ?? 0)}</span>
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
                            <ArrowDown className="h-5 w-5 text-destructive " />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="bordered" className="w-full" onPress={handleSave}>
                      {isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                      {isSaved ? "Saved" : "Save Problem"}
                    </Button>
                    <Button color="primary" className="w-full" onPress={handleFollow}>
                      {isFollowing ? <UserMinus className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    <Button variant="bordered" className="w-full" onPress={handleAddSolution}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Solution
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {problem.external_links && problem.external_links.length > 0 && (
                <Card className="glass">
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-lg mb-4">External Links</h3>
                    <div className="space-y-2">
                      {problem.external_links.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span className="text-sm text-primary">{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {problem.social_links && problem.social_links.length > 0 && (
                <Card className="glass">
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Share</h3>
                    <div className="space-y-2">
                      {problem.social_links.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span className="text-sm text-secondary">{link.platform}</span>
                        </a>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card className="glass">
                <CardBody className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Related problems</h3>
                  {relatedLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : relatedProblems.length > 0 ? (
                    <div className="space-y-2">
                      {relatedProblems.map((p) => (
                        <RouterLink key={p.id} to={`/problem/${p.pid}`}>
                          <div className="p-3 rounded-lg glass-hover transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                            <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                            <Chip size="sm" variant="flat" className="mt-1">{p.domain}</Chip>
                          </div>
                        </RouterLink>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No related problems found.</p>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={isAddSolutionOpen} onOpenChange={setIsAddSolutionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Solution</DialogTitle>
            <DialogDescription>Share your solution for this problem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea label="Abstract" placeholder="Brief summary of your solution..." value={solutionAbstract} onValueChange={setSolutionAbstract} variant="bordered" minRows={3} isRequired />
            <Input label="Solution URL" placeholder="https://..." value={solutionUrl} onValueChange={setSolutionUrl} variant="bordered" startContent={<LinkIcon className="h-4 w-4 text-muted-foreground" />} isRequired />
            <div>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Add tag" value={solutionTagInput} onValueChange={setSolutionTagInput} variant="bordered" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSolutionTag())} />
                <Button isIconOnly color="primary" onPress={handleAddSolutionTag}><Plus className="h-5 w-5" /></Button>
              </div>
              {solutionTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {solutionTags.map((tag) => (
                    <Chip key={tag} onClose={() => handleRemoveSolutionTag(tag)} variant="flat" color="primary">{tag}</Chip>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button color="primary" onPress={handleSubmitSolution} isLoading={isSubmittingSolution} className="flex-1">Submit</Button>
              <Button variant="bordered" onPress={() => setIsAddSolutionOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProblemDetails;
