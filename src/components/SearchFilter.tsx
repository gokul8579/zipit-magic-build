import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterField: string;
  onFilterFieldChange: (value: string) => void;
  filterOptions: { value: string; label: string }[];
  placeholder?: string;
}

export const SearchFilter = ({
  searchTerm,
  onSearchChange,
  filterField,
  onFilterFieldChange,
  filterOptions,
  placeholder = "Search...",
}: SearchFilterProps) => {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filterField} onValueChange={onFilterFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by..." />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
