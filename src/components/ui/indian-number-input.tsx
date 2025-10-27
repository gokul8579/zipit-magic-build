import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatIndianNumber, parseIndianNumber } from "@/lib/formatUtils";

export interface IndianNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string) => void;
  onNumericChange?: (value: number) => void;
}

const IndianNumberInput = React.forwardRef<HTMLInputElement, IndianNumberInputProps>(
  ({ className, value, onChange, onNumericChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const numValue = typeof value === 'string' ? parseIndianNumber(value) : value;
        setDisplayValue(formatIndianNumber(numValue));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Allow empty input
      if (input === "") {
        setDisplayValue("");
        onChange?.("");
        onNumericChange?.(0);
        return;
      }

      // Remove all non-digit characters except decimal point
      const cleaned = input.replace(/[^\d.]/g, "");
      
      // Parse and validate
      const numValue = parseFloat(cleaned);
      if (!isNaN(numValue)) {
        const formatted = formatIndianNumber(numValue);
        setDisplayValue(formatted);
        onChange?.(numValue.toString());
        onNumericChange?.(numValue);
      }
    };

    return (
      <Input
        ref={ref}
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

IndianNumberInput.displayName = "IndianNumberInput";

export { IndianNumberInput };
