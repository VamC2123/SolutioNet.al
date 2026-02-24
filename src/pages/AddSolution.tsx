import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Card, CardBody, Input, Textarea, Button, Select, SelectItem, Chip } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const domains = [
  "Technology",
  "Healthcare",
  "Education",
  "Environment",
  "Finance",
  "Transportation",
  "Agriculture",
  "Energy",
  "Social Issues",
  "Other",
];

export default function AddSolution() {
  const { id: pid } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<{ id: string; pid: string; title: string } | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);
  const [abstract, setAbstract] = useState("");
  const [detailedSolutionUrl, setDetailedSolutionUrl] = useState("");
  const [domain, setDomain] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!pid) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("id, pid, title")
        .eq("pid", pid)
        .single();
      if (error || !data) {
        toast.error("Problem not found");
        navigate("/browse");
        return;
      }
      setProblem(data);
      setProblemLoading(false);
    };
    load();
  }, [pid, navigate]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!problem?.id || !abstract.trim() || !detailedSolutionUrl.trim() || !domain.size) {
      toast.error("Please fill in abstract, solution URL, and domain");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("solutions").insert({
        problem_id: problem.id,
        author_id: user.id,
        abstract: abstract.trim(),
        detailed_solution_url: detailedSolutionUrl.trim(),
        domain: Array.from(domain)[0],
        tags: tags.length > 0 ? tags : null,
      });
      if (error) throw error;
      toast.success("Solution submitted");
      navigate(`/problem/${problem.pid}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit solution");
    } finally {
      setLoading(false);
    }
  };

  if (problemLoading || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavigationNew />
      <main className="pt-24 pb-20">
        <div className="max-w-full mx-auto px-12">
          <h1 className="text-4xl font-bold mb-2">Add Solution</h1>
          <p className="text-muted-foreground mb-8">Problem: #{problem.pid} – {problem.title}</p>

          <Card className="glass">
            <CardBody className="p-8 space-y-6">
              <Textarea
                label="Abstract"
                placeholder="Summarize your solution..."
                value={abstract}
                onValueChange={setAbstract}
                variant="bordered"
                isRequired
                minRows={4}
              />
              <Input
                label="Detailed solution URL"
                placeholder="https://..."
                value={detailedSolutionUrl}
                onValueChange={setDetailedSolutionUrl}
                variant="bordered"
                isRequired
              />
              <Select
                label="Domain"
                placeholder="Select domain"
                selectedKeys={domain}
                onSelectionChange={(keys) => setDomain(keys as Set<string>)}
                variant="bordered"
                isRequired
              >
                {domains.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </Select>
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tags"
                    value={tagInput}
                    onValueChange={setTagInput}
                    variant="bordered"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button variant="bordered" onPress={handleAddTag} isIconOnly>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Chip key={tag} onClose={() => handleRemoveTag(tag)} variant="bordered">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                  Submit Solution
                </Button>
                <Button variant="bordered" onPress={() => navigate(`/problem/${problem.pid}`)}>
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
