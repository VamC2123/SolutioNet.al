import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { SearchSectionNew } from "@/components/SearchSectionNew";
import { ProblemCardNew } from "@/components/ProblemCardNew";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@nextui-org/react";
import { generateEmbedding, cosineSimilarity } from "@/lib/mlService";
import { getVoteCountsForProblems } from "@/lib/voteCounts";

export default function Browse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Set<string>>(new Set(["All Domains"]));
  const [sortBy, setSortBy] = useState<Set<string>>(new Set(["newest"]));
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmbedding, setSearchEmbedding] = useState<number[] | null>(null);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("problems")
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `);

      // Apply domain filter
      const domain = Array.from(selectedDomain)[0];
      if (domain && domain !== "All Domains") {
        query = query.eq("domain", domain);
      }

      // Apply sorting
      const sort = Array.from(sortBy)[0];
      switch (sort) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most-voted":
          query = query.order("upvotes", { ascending: false });
          break;
        case "least-voted":
          query = query.order("upvotes", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      const list = data || [];
      if (list.length > 0) {
        const counts = await getVoteCountsForProblems(list.map((p: any) => p.id));
        setProblems(
          list.map((p: any) => ({
            ...p,
            upvotes: Math.max(0, counts[p.id]?.up ?? 0),
            downvotes: Math.max(0, counts[p.id]?.down ?? 0),
          }))
        );
      } else setProblems(list);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount + whenever filters/sort change
  useEffect(() => {
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, sortBy]);

  // Realtime refresh (vote counts / new problems / edits)
  useEffect(() => {
    const channel = supabase
      .channel("browse-problems")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "problems" },
        () => {
          fetchProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Generate embedding for search term when it changes
  useEffect(() => {
    const generateSearchEmbedding = async () => {
      if (!searchTerm.trim()) {
        setSearchEmbedding(null);
        return;
      }

      setIsGeneratingEmbedding(true);
      try {
        const embedding = await generateEmbedding(searchTerm);
        setSearchEmbedding(embedding);
      } catch (error) {
        console.error("Error generating search embedding:", error);
        setSearchEmbedding(null);
      } finally {
        setIsGeneratingEmbedding(false);
      }
    };

    const timeoutId = setTimeout(() => {
      generateSearchEmbedding();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter and rank problems
  const filteredProblems = useMemo(() => {
    if (!searchTerm.trim()) {
      return problems;
    }

    // First, filter by basic text matching
    let filtered = problems.filter((problem) =>
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.abstract?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If we have embeddings, enhance ranking with semantic similarity
    if (searchEmbedding && filtered.length > 0) {
      // Generate embeddings for each problem's searchable text
      const scoredProblems = filtered.map((problem) => {
        const searchableText = `${problem.title} ${problem.description || ''} ${problem.abstract || ''} ${problem.domain}`;
        
        // For now, use a simple text-based similarity score
        // In production, you'd want to cache problem embeddings
        const words = searchTerm.toLowerCase().split(/\s+/);
        const problemWords = searchableText.toLowerCase().split(/\s+/);
        
        // Calculate word overlap score
        let wordMatchScore = 0;
        words.forEach(word => {
          if (word.length > 2 && problemWords.includes(word)) {
            wordMatchScore += 1;
          }
        });
        
        // Calculate substring matches (for partial word matches)
        let substringScore = 0;
        words.forEach(word => {
          if (word.length > 2) {
            problemWords.forEach(pWord => {
              if (pWord.includes(word) || word.includes(pWord)) {
                substringScore += 0.5;
              }
            });
          }
        });

        // Combine scores
        const relevanceScore = wordMatchScore * 2 + substringScore * 0.5;
        
        // Boost for exact title match
        if (problem.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { ...problem, relevanceScore: relevanceScore + 10 };
        }
        
        // Boost for domain match
        if (problem.domain.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { ...problem, relevanceScore: relevanceScore + 5 };
        }

        return { ...problem, relevanceScore };
      });

      // Sort by relevance score
      scoredProblems.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Fallback to upvotes if scores are equal
        return (b.upvotes || 0) - (a.upvotes || 0);
      });

      return scoredProblems;
    }

    // Fallback: sort by upvotes if no embedding
    return filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }, [problems, searchTerm, searchEmbedding]);

  return (
    <div className="min-h-screen">
      <NavigationNew />
      
      <main className="pt-20">
        <SearchSectionNew
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="max-w-full mx-auto pb-20 px-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {searchTerm ? `Results for "${searchTerm}"` : "All Problems"}
            </h2>
            {isGeneratingEmbedding && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                <span>Enhancing search...</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProblems.map((problem) => (
                <ProblemCardNew
                  key={problem.id}
                  id={problem.id}
                  pid={problem.pid}
                  title={problem.title}
                  domain={problem.domain}
                  upvotes={problem.upvotes}
                  downvotes={problem.downvotes}
                  author={problem.profiles?.full_name || "Unknown"}
                  postedDate={new Date(problem.created_at).toLocaleDateString()}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No problems found matching your criteria</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
