import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  unit_price: number;
}

interface LineItem {
  type: "existing" | "new";
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  cgst_percent: number;
  sgst_percent: number;
}

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export const SalesOrderProductSelector2 = ({ items, onChange }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_price")
        .eq("user_id", user.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addLineItem = () => {
    onChange([...items, { type: "new", product_id: "", description: "", quantity: 1, unit_price: 0, cgst_percent: 9, sgst_percent: 9 }]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If type changed to existing and a product is selected, auto-fill
    if (field === "product_id" && newItems[index].type === "existing" && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unit_price = product.unit_price;
      }
    }
    
    onChange(newItems);
  };

  const removeLineItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Line Items</Label>
        <Button type="button" size="sm" onClick={addLineItem} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>
      
      {items.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <div className="flex justify-between items-start gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              <div className="space-y-2">
                <Label className="text-xs">Item Type</Label>
                <Select 
                  value={item.type} 
                  onValueChange={(v: "existing" | "new") => updateLineItem(index, "type", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">Existing Product</SelectItem>
                    <SelectItem value="new">New Product/Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {item.type === "existing" && (
                <div className="space-y-2">
                  <Label className="text-xs">Select Product</Label>
                  <Select 
                    value={item.product_id} 
                    onValueChange={(v) => updateLineItem(index, "product_id", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.unit_price.toLocaleString('en-IN')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLineItem(index)}
              className="ml-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs">Description *</Label>
              <Input
                className="h-9"
                placeholder="Product/Service"
                value={item.description}
                onChange={(e) => updateLineItem(index, "description", e.target.value)}
                disabled={item.type === "existing" && !!item.product_id}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Quantity *</Label>
              <IndianNumberInput
                className="h-9"
                value={item.quantity}
                onNumericChange={(v) => updateLineItem(index, "quantity", v || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Unit Price (₹) *</Label>
              <IndianNumberInput
                className="h-9"
                value={item.unit_price}
                onNumericChange={(v) => updateLineItem(index, "unit_price", v || 0)}
                disabled={item.type === "existing" && !!item.product_id}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">CGST (%)</Label>
              <Input
                className="h-9"
                type="number"
                step="0.01"
                value={item.cgst_percent}
                onChange={(e) => updateLineItem(index, "cgst_percent", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">SGST (%)</Label>
              <Input
                className="h-9"
                type="number"
                step="0.01"
                value={item.sgst_percent}
                onChange={(e) => updateLineItem(index, "sgst_percent", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Subtotal</Label>
              <Input
                className="h-9 font-medium"
                value={`₹${(item.quantity * item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Total (with tax)</Label>
              <Input
                className="h-9 font-bold"
                value={`₹${(() => {
                  const subtotal = item.quantity * item.unit_price;
                  const cgst = (subtotal * item.cgst_percent) / 100;
                  const sgst = (subtotal * item.sgst_percent) / 100;
                  return (subtotal + cgst + sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}`}
                disabled
              />
            </div>
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <p className="text-sm">No items added yet</p>
          <p className="text-xs mt-1">Click "Add Item" to start</p>
        </div>
      )}
    </div>
  );
};
