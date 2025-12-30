import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface SearchFilterProps {
  onSearchChange: (query: string) => void;
  onStatusFilter: (status: string | null) => void;
  onCategoryFilter: (category: string | null) => void;
  activeStatusFilter: string | null;
  activeCategoryFilter: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "healthy", label: "Healthy" },
  { value: "running", label: "Running" },
  { value: "unhealthy", label: "Unhealthy" },
  { value: "exited", label: "Exited" },
  { value: "paused", label: "Paused" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "aiml", label: "AI/ML" },
  { value: "application", label: "Application" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "frontend", label: "Frontend" },
  { value: "monitoring", label: "Monitoring" },
  { value: "val", label: "Val Autonomy" },
  { value: "blockchain", label: "Blockchain" },
  { value: "game", label: "Game" },
  { value: "other", label: "Other" },
];

export default function SearchFilter({
  onSearchChange,
  onStatusFilter,
  onCategoryFilter,
  activeStatusFilter,
  activeCategoryFilter,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearchChange("");
  };

  const hasActiveFilters = activeStatusFilter || activeCategoryFilter;

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flow-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search containers..."
          className="w-64 pl-9 pr-8 py-1.5 bg-flow-surface border border-flow-border rounded-lg text-sm text-white placeholder-flow-muted focus:outline-none focus:border-flow-accent transition-colors"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-flow-muted hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          showFilters || hasActiveFilters
            ? "bg-flow-accent/20 text-flow-accent"
            : "bg-flow-surface border border-flow-border text-flow-muted hover:text-white"
        }`}
      >
        <Filter className="w-4 h-4" />
        Filter
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-flow-accent" />
        )}
      </button>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={activeStatusFilter || "all"}
            onChange={(e) =>
              onStatusFilter(e.target.value === "all" ? null : e.target.value)
            }
            className="px-3 py-1.5 bg-flow-surface border border-flow-border rounded-lg text-sm text-white focus:outline-none focus:border-flow-accent transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={activeCategoryFilter || "all"}
            onChange={(e) =>
              onCategoryFilter(e.target.value === "all" ? null : e.target.value)
            }
            className="px-3 py-1.5 bg-flow-surface border border-flow-border rounded-lg text-sm text-white focus:outline-none focus:border-flow-accent transition-colors cursor-pointer"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                onStatusFilter(null);
                onCategoryFilter(null);
              }}
              className="px-2 py-1.5 text-flow-muted hover:text-white text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
