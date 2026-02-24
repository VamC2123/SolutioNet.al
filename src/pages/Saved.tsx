import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { ProblemCardNew } from "@/components/ProblemCardNew";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { getVoteCountsForProblems } from "@/lib/voteCounts";

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedProblems, setSavedProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchSavedProblems();
  }, [user]);

  // Keep saved tiles in sync with vote changes
  useEffect(() => {
    const channel = supabase
      .channel("saved-problems-votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "problems" },
        () => {
          fetchSavedProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSavedProblems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("saves")
      .select(`
        problem_id,
        problems (
          *,
          profiles:author_id (
            full_name
          )
        )
      `)
      .eq("user_id", user!.id);
    const list = (data?.map((s: any) => s.problems) || []).filter(Boolean);
    if (list.length > 0) {
      const counts = await getVoteCountsForProblems(list.map((p: any) => p.id));
      setSavedProblems(
        list.map((p: any) => ({
          ...p,
          upvotes: Math.max(0, counts[p.id]?.up ?? 0),
          downvotes: Math.max(0, counts[p.id]?.down ?? 0),
        }))
      );
    } else setSavedProblems([]);
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <NavigationNew />
      
      <main className="pt-24">
        <div className="max-w-full mx-auto px-12 pb-20">
          <div className="mb-12">
            <h1 className="text-2xl font-bold mb-2 gradient-text">Saved Problems</h1>
            <p className="text-muted-foreground">Your bookmarked research challenges</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : savedProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedProblems.map((problem) => (
                <ProblemCardNew
                  key={problem.id}
                  id={problem.id}
                  pid={problem.pid}
                  title={problem.title}
                  domain={problem.domain}
                  author={problem.profiles?.full_name || "Unknown"}
                  postedDate={new Date(problem.created_at).toLocaleDateString()}
                  upvotes={problem.upvotes}
                  downvotes={problem.downvotes}
                  onVoteChange={fetchSavedProblems}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No saved problems yet</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Saved;