import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Button, Input } from "@nextui-org/react";
import { ArrowRight, Plus, Lightbulb, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getVoteCountsForProblems } from "@/lib/voteCounts";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [topVotedProblems, setTopVotedProblems] = useState<any[]>([]);
  const [savedProblems, setSavedProblems] = useState<any[]>([]);
  const [followedProblems, setFollowedProblems] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchTopVotedProblems();
    if (user) {
      fetchUserSavedProblems();
      fetchUserFollowedProblems();
    }
  }, [user]);


  // Home search dropdown (simple title search, no filters)
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("problems")
          .select("id,pid,title,domain")
          .ilike("title", `%${term}%`)
          .order("created_at", { ascending: false })
          .limit(8);
        if (error) throw error;
        if (!cancelled) setSearchResults(data || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const fetchTopVotedProblems = async () => {
    const { data } = await supabase
      .from("problems")
      .select(`
        id,
        pid,
        title,
        domain,
        upvotes,
        profiles:author_id (full_name)
      `)
      .order("upvotes", { ascending: false })
      .limit(10);
    const list = data || [];
    if (list.length > 0) {
      const counts = await getVoteCountsForProblems(list.map((p: any) => p.id));
      const merged = list
        .map((p: any) => ({ ...p, upvotes: Math.max(0, counts[p.id]?.up ?? 0), downvotes: Math.max(0, counts[p.id]?.down ?? 0) }))
        .sort((a: any, b: any) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
      setTopVotedProblems(merged);
    } else setTopVotedProblems([]);
  };

  // Realtime updates for top voted carousel
  useEffect(() => {
    const channel = supabase
      .channel("home-top-voted")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "problems" },
        () => {
          fetchTopVotedProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserSavedProblems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saves")
      .select(`
        problem_id,
        problems:problem_id (
          id,
          pid,
          title,
          domain
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    const unique = new Map<string, any>();
    (data || [])
      .map((s: any) => s.problems)
      .filter(Boolean)
      .forEach((p: any) => {
        if (p?.id) unique.set(p.id, p);
      });
    setSavedProblems(Array.from(unique.values()));
  };

  const fetchUserFollowedProblems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select(`
        problem_id,
        problems:problem_id (
          id,
          pid,
          title,
          domain
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    const unique = new Map<string, any>();
    (data || [])
      .map((f: any) => f.problems)
      .filter(Boolean)
      .forEach((p: any) => {
        if (p?.id) unique.set(p.id, p);
      });
    setFollowedProblems(Array.from(unique.values()));
  };

  return (
    <div className="min-h-screen">
      <NavigationNew />
      
      <main className="pt-20 pb-20">
        {/* Hero Search Section (home-only simple search dropdown) */}
        <section className="w-full mx-auto mb-6">
          <div className="relative py-10 mb-6">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 dark:from-black/80 dark:via-black/60 dark:to-black/80" />
            </div>

            <div className="relative max-w-4xl mx-auto text-center px-4">
              <h1 className="text-5xl font-bold mb-6 text-white">Discover Problems, Drive Solutions</h1>
              <p className="text-xl mb-8 text-white/90">
                Explore real-world challenges and contribute innovative solutions
              </p>

              <div className="glass rounded-2xl p-6">
                <div className="relative">
                  <Input
                    placeholder="Search problems..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    startContent={<Search className="h-5 w-5 text-muted-foreground" />}
                    size="lg"
                    variant="bordered"
                    isClearable
                  />

                  {searchTerm.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 z-50">
                      <div className="glass rounded-xl border border-border/60 overflow-hidden text-left">
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
                        ) : searchResults.length > 0 ? (
                          <div className="max-h-72 overflow-y-auto">
                            {searchResults.map((p) => (
                              <button
                                key={p.id}
                                className="w-full px-4 py-3 hover:bg-foreground/5 transition-colors flex items-start gap-3"
                                onClick={() => navigate(`/problem/${p.pid}`)}
                              >
                                <div className="text-xs font-mono text-muted-foreground mt-1">#{p.pid}</div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{p.domain}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground">No matches</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions 1 */}
        <section className="w-full mx-auto mb-10 max-w-full px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            <div className="glass glass-hover rounded-2xl p-4 cursor-pointer group" onClick={() => navigate("/contribute")}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Contribute a Problem</h3>
              <p className="text-muted-foreground">Share your research challenge with the community and get innovative solutions</p>
            </div>

            <div className="glass glass-hover rounded-2xl p-4 cursor-pointer group" onClick={() => navigate("/browse")}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <Lightbulb className="h-8 w-8 text-secondary" />
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Browse Problems</h3>
              <p className="text-muted-foreground">Explore real-world challenges and propose your innovative solutions</p>
            </div>
          </div>
        </section>

        {/* Quick Actions 2 - Saved & Following */}
        {user && (
          <section className="w-full mx-auto mb-16 max-w-7xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Bookmarked Problems</h3>
                  <Button variant="light" size="sm" onClick={() => navigate("/saved")}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[300px] overflow-hidden relative">
                  {savedProblems.length > 0 ? (
                    <div className="animate-scroll-up">
                      {[...savedProblems, ...savedProblems].map((problem, index) => (
                        <div
                          key={`${problem.id}-${index}`}
                          className="glass-hover p-4 rounded-lg cursor-pointer mb-3"
                          onClick={() => navigate(`/problem/${problem.pid}`)}
                        >
                          <div className="text-sm font-mono text-muted-foreground mb-1">#{problem.pid}</div>
                          <div className="font-medium text-sm line-clamp-2">{problem.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{problem.domain}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No saved problems yet
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Following</h3>
                  <Button variant="light" size="sm" onClick={() => navigate("/following")}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[300px] overflow-hidden relative">
                  {followedProblems.length > 0 ? (
                    <div className="animate-scroll-up">
                      {[...followedProblems, ...followedProblems].map((problem, index) => (
                        <div
                          key={`${problem.id}-${index}`}
                          className="glass-hover p-4 rounded-lg cursor-pointer mb-3"
                          onClick={() => navigate(`/problem/${problem.pid}`)}
                        >
                          <div className="text-sm font-mono text-muted-foreground mb-1">#{problem.pid}</div>
                          <div className="font-medium text-sm line-clamp-2">{problem.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{problem.domain}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No followed problems yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top Voted Section */}
        <section className="w-full mx-auto mb-10 overflow-hidden">
          <div className="flex items-center justify-between mb-8 max-w-full mx-auto px-12">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-blue-600">Top Voted Problems</h2>
              <p className="text-muted-foreground">Most popular research challenges from our community</p>
            </div>
            <Button color="primary" size="lg" onClick={() => navigate("/browse")}>
              View All Problems
            </Button>
          </div>
          
          <div className="relative overflow-hidden">
            {topVotedProblems.length > 0 ? (
              <div className="flex animate-scroll-left">
                {[...topVotedProblems, ...topVotedProblems].map((problem, index) => {
                  const originalIndex = index % topVotedProblems.length;
                  const isTop = originalIndex === 0;
                  return (
                    <div
                      key={`${problem.id}-${index}`}
                      className={[
                        "flex-shrink-0 w-80 mx-3 rounded-2xl p-6 cursor-pointer transition-transform",
                        "glass glass-hover",
                        isTop ? "border-2 border-orange-400 bg-orange-50/80 dark:bg-orange-900/30" : "",
                      ].join(" ")}
                      onClick={() => navigate(`/problem/${problem.pid}`)}
                    >
                      <div
                        className={[
                          "text-sm font-mono mb-2",
                          isTop ? "text-orange-500" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        #{problem.pid}
                      </div>
                      <h3
                        className={[
                          "font-bold text-lg line-clamp-3",
                          isTop ? "text-orange-900 dark:text-orange-200" : "",
                        ].join(" ")}
                      >
                        {problem.title}
                      </h3>
                      {typeof problem.upvotes === "number" && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          {problem.upvotes} upvotes
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No problems yet. Be the first to contribute!
              </div>
            )}
          </div>
        </section>

        {/* Vision Statement */}
        <section className="w-full mx-auto mb-4 max-w-7xl px-4">
          <div className="glass rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-6 gradient-text">Our Vision</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              SolutioNet.al envisions a world where every research problem finds its solution through 
              collaborative innovation. We're building a bridge between problem-finders and problem-solvers, 
              creating an ecosystem where ideas flourish, research accelerates, and real-world challenges 
              meet creative minds ready to tackle them.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="glass rounded-lg px-6 py-3">
                <div className="text-2xl font-bold text-primary">Open</div>
                <div className="text-sm text-muted-foreground">Collaboration</div>
              </div>
              <div className="glass rounded-lg px-6 py-3">
                <div className="text-2xl font-bold text-blue-500">Innovation</div>
                <div className="text-sm text-muted-foreground">Driven</div>
              </div>
              <div className="glass rounded-lg px-6 py-3">
                <div className="text-2xl font-bold text-secondary">Impact</div>
                <div className="text-sm text-muted-foreground">Focused</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
