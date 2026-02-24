import { Input, Select, SelectItem } from "@nextui-org/react";
import { Search } from "lucide-react";
import { isMockMode } from "@/lib/mlService";

interface SearchSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDomain: Set<string>;
  onDomainChange: (keys: Set<string>) => void;
  sortBy: Set<string>;
  onSortChange: (keys: Set<string>) => void;
}

const domains = [
  "All Domains",
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

const sortOptions = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "most-voted", label: "Most Voted" },
  { key: "least-voted", label: "Least Voted" },
];

export const SearchSectionNew = ({
  searchTerm,
  onSearchChange,
  selectedDomain,
  onDomainChange,
  sortBy,
  onSortChange,
}: SearchSectionProps) => {
  const showAiWarning = isMockMode();

  return (
    <div className="relative py-10 mb-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 dark:from-black/80 dark:via-black/60 dark:to-black/80" />
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 text-white">
          Discover Problems, Drive Solutions
        </h1>
        <p className="text-xl mb-8 text-white/90">
          Explore real-world challenges and contribute innovative solutions
        </p>
        
        <div className="glass rounded-2xl p-6 space-y-4">
          <Input
            placeholder="Search problems..."
            value={searchTerm}
            onValueChange={onSearchChange}
            startContent={<Search className="h-5 w-5 text-muted-foreground" />}
            size="lg"
            variant="bordered"
          />

          {showAiWarning && searchTerm.trim().length > 0 && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-left">
              <div className="text-sm font-semibold text-warning">AI search is in demo mode</div>
              <div className="text-xs text-muted-foreground">
                Set <span className="font-mono">VITE_OPENAI_API_KEY</span> to enable real embeddings. Until then,
                semantic ranking may be unreliable.
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              placeholder="Select domain"
              selectedKeys={selectedDomain}
              onSelectionChange={(keys) => onDomainChange(keys as Set<string>)}
              variant="bordered"
            >
              {domains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </Select>
            
            <Select
              placeholder="Sort by"
              selectedKeys={sortBy}
              onSelectionChange={(keys) => onSortChange(keys as Set<string>)}
              variant="bordered"
            >
              {sortOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
