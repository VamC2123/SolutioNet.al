import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Card, CardBody, Input, Textarea, Button, Select, SelectItem, Chip, Spinner } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";

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

export default function Contribute() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [abstract, setAbstract] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddExternalLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      setExternalLinks([...externalLinks, { title: linkTitle.trim(), url: linkUrl.trim() }]);
      setLinkTitle("");
      setLinkUrl("");
    }
  };

  const handleRemoveExternalLink = (index: number) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  const handleAddSocialLink = () => {
    if (socialPlatform.trim() && socialUrl.trim()) {
      setSocialLinks([...socialLinks, { platform: socialPlatform.trim(), url: socialUrl.trim() }]);
      setSocialPlatform("");
      setSocialUrl("");
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !domain.size || !description || !abstract || !proposedSolution) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("problems")
        .insert({
          title,
          domain: Array.from(domain)[0],
          description,
          abstract,
          proposed_solution: proposedSolution,
          tags,
          external_links: externalLinks,
          social_links: socialLinks,
          author_id: user.id,
        } as any)
        .select('*')
        .single();

      if (error) throw error;

      toast.success("Problem submitted successfully!");
      navigate(`/problem/${data.pid}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit problem");
    } finally {
      setLoading(false);
    }
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
      
      <main className="pt-24 pb-20">
        <div className="max-w-full mx-auto px-12">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Contribute a Problem</h1>
          
          <Card className="glass">
            <CardBody className="p-8 space-y-6 font-bold">
              <Input
                label="Problem Title"
                placeholder="Enter a clear, descriptive title"
                value={title}
                onValueChange={setTitle}
                variant="bordered"
                isRequired
                size="lg"
              />

              <Select
                label="Domain"
                placeholder="Select a domain"
                selectedKeys={domain}
                onSelectionChange={(keys) => setDomain(keys as Set<string>)}
                variant="bordered"
                isRequired
              >
                {domains.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </Select>

              <Textarea
                label="Problem Description"
                placeholder="Describe the problem in detail..."
                value={description}
                onValueChange={setDescription}
                variant="bordered"
                isRequired
                minRows={4}
              />

              <Textarea
                label="Abstract"
                placeholder="Provide a brief summary of the problem..."
                value={abstract}
                onValueChange={setAbstract}
                variant="bordered"
                isRequired
                minRows={3}
              />

              <Textarea
                label="Proposed Solution"
                placeholder="Describe your proposed solution or approach..."
                value={proposedSolution}
                onValueChange={setProposedSolution}
                variant="bordered"
                isRequired
                minRows={4}
              />

              <div>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add tags (e.g., AI, blockchain, sustainability)"
                    value={tagInput}
                    onValueChange={setTagInput}
                    variant="bordered"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    onPress={handleAddTag}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        onClose={() => handleRemoveTag(tag)}
                        variant="flat"
                        color="primary"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">External Links</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Link title (e.g., GitHub Repo)"
                      value={linkTitle}
                      onValueChange={setLinkTitle}
                      variant="bordered"
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={linkUrl}
                      onValueChange={setLinkUrl}
                      variant="bordered"
                      className="flex-1"
                    />
                    <Button
                      isIconOnly
                      color="primary"
                      onPress={handleAddExternalLink}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {externalLinks.length > 0 && (
                    <div className="space-y-2">
                      {externalLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <span className="flex-1 text-sm">{link.title}: {link.url}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleRemoveExternalLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Social Media Links</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Platform (e.g., Twitter, LinkedIn)"
                      value={socialPlatform}
                      onValueChange={setSocialPlatform}
                      variant="bordered"
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={socialUrl}
                      onValueChange={setSocialUrl}
                      variant="bordered"
                      className="flex-1"
                    />
                    <Button
                      isIconOnly
                      color="primary"
                      onPress={handleAddSocialLink}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {socialLinks.length > 0 && (
                    <div className="space-y-2">
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <span className="flex-1 text-sm">{link.platform}: {link.url}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleRemoveSocialLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleSubmit}
                  isLoading={loading}
                  className="flex-1"
                >
                  Submit Problem
                </Button>
                <Button
                  variant="bordered"
                  size="lg"
                  onPress={() => navigate("/browse")}
                >
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
