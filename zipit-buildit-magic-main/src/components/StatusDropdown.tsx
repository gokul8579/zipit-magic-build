import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  onEdit?: boolean;
}

export const StatusDropdown = ({ value, onChange, options, onEdit = false }: StatusDropdownProps) => {
  const currentOption = options.find(opt => opt.value === value);
  
  if (!onEdit && currentOption) {
    return (
      <Badge variant="outline" className={currentOption.color}>
        {currentOption.label}
      </Badge>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
