import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SearchFilterProps {
  value?: string;
  searchTerm?: string;
  onChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  filterField?: string;
  onFilterFieldChange?: (value: string) => void;
  filterOptions?: { value: string; label: string }[];
}

export const SearchFilter = ({
  value,
  searchTerm,
  onChange,
  onSearchChange,
  placeholder = "Search...",
}: SearchFilterProps) => {
  const term = value ?? searchTerm ?? "";
  const handleChange = onChange ?? onSearchChange ?? (() => {});
  const [localSearch, setLocalSearch] = useState(term);

  const debouncedSearch = useDebouncedCallback((val: string) => {
    handleChange(val);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  useEffect(() => {
    setLocalSearch(term);
  }, [term]);

  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={localSearch}
        onChange={handleSearchChange}
        className="pl-9"
      />
    </div>
  );
};
