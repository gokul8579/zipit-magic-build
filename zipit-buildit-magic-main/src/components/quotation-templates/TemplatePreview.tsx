import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface TemplatePreviewProps {
  templateId: string;
  selected: boolean;
  onSelect: () => void;
}

export const TemplatePreview = ({ templateId, selected, onSelect }: TemplatePreviewProps) => {
  const templates = {
    t1: {
      name: "Modern Professional",
      preview: (
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-white p-4 border rounded">
          <div className="text-xs font-bold text-blue-900 mb-2">COMPANY NAME</div>
          <div className="text-[8px] text-gray-600">Invoice #12345</div>
          <div className="mt-4 space-y-1">
            <div className="h-1 bg-blue-200 rounded w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded w-2/3"></div>
            <div className="h-1 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="mt-4 pt-2 border-t border-blue-100">
            <div className="text-[8px] font-bold text-blue-900">Total: ₹0.00</div>
          </div>
        </div>
      ),
    },
    t2: {
      name: "Classic Minimal",
      preview: (
        <div className="w-full h-48 bg-white p-4 border-2 border-gray-800 rounded">
          <div className="text-xs font-bold mb-2">INVOICE</div>
          <div className="text-[8px] text-gray-600 mb-4">#12345</div>
          <div className="space-y-1">
            <div className="h-1 bg-gray-800 rounded w-full"></div>
            <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            <div className="h-1 bg-gray-300 rounded w-2/3"></div>
          </div>
          <div className="mt-4 pt-2 border-t-2 border-gray-800">
            <div className="text-[8px] font-bold">TOTAL: ₹0.00</div>
          </div>
        </div>
      ),
    },
    t3: {
      name: "Elegant Corporate",
      preview: (
        <div className="w-full h-48 bg-gradient-to-b from-purple-50 via-white to-white p-4 border rounded shadow-sm">
          <div className="flex justify-between mb-2">
            <div className="text-xs font-bold text-purple-900">Company</div>
            <div className="text-[8px] text-purple-600">INV-12345</div>
          </div>
          <div className="space-y-1 mt-4">
            <div className="h-1 bg-purple-200 rounded w-full"></div>
            <div className="h-1 bg-purple-100 rounded w-4/5"></div>
            <div className="h-1 bg-gray-200 rounded w-3/5"></div>
          </div>
          <div className="mt-4 pt-2 border-t border-purple-200">
            <div className="text-[8px] font-bold text-purple-900">Grand Total: ₹0.00</div>
          </div>
        </div>
      ),
    },
    t4: {
      name: "Bold Business",
      preview: (
        <div className="w-full h-48 bg-white p-4 border-l-4 border-orange-500 rounded shadow">
          <div className="text-xs font-bold text-orange-900 mb-1">INVOICE</div>
          <div className="text-[8px] text-gray-500 mb-3">#12345 | Date: 01/01/2024</div>
          <div className="space-y-1">
            <div className="h-1 bg-orange-500 rounded w-full"></div>
            <div className="h-1 bg-orange-200 rounded w-4/5"></div>
            <div className="h-1 bg-gray-200 rounded w-3/5"></div>
          </div>
          <div className="mt-4 bg-orange-50 p-2 rounded">
            <div className="text-[8px] font-bold text-orange-900">Total Due: ₹0.00</div>
          </div>
        </div>
      ),
    },
    t5: {
      name: "Clean Tech",
      preview: (
        <div className="w-full h-48 bg-gray-50 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <div className="text-xs font-bold">INVOICE</div>
          </div>
          <div className="text-[8px] text-gray-500 mb-3">Document #12345</div>
          <div className="space-y-1">
            <div className="h-1 bg-green-500 rounded w-full"></div>
            <div className="h-1 bg-green-300 rounded w-3/4"></div>
            <div className="h-1 bg-gray-300 rounded w-2/3"></div>
          </div>
          <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-300">
            <div className="text-[8px] font-bold">Amount Due</div>
            <div className="text-[8px] font-bold text-green-600">₹0.00</div>
          </div>
        </div>
      ),
    },
  };

  const template = templates[templateId as keyof typeof templates];

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm">{template.name}</h3>
          {selected && (
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>
        {template.preview}
      </div>
    </Card>
  );
};
