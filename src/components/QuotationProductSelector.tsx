import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianNumberInput } from "@/components/ui/indian-number-input";

interface QuotationItem {
  type: string;
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  cgst_percent: number;
  sgst_percent: number;
}

interface QuotationProductSelectorProps {
  items: QuotationItem[];
  onChange: (items: QuotationItem[]) => void;
}

export const QuotationProductSelector = ({ items, onChange }: QuotationProductSelectorProps) => {
  const [products, setProducts] = useState<any[]>([]);

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

  const addItem = () => {
    onChange([...items, {
      type: "new",
      product_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      cgst_percent: 9,
      sgst_percent: 9,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        description: selectedProduct.name,
        unit_price: Number(selectedProduct.unit_price) || 0,
      };
      onChange(newItems);
    } else {
      updateItem(index, "product_id", "");
    }
  };

  return (
    <div className="space-y-3">
      <Label>Line Items</Label>
      {items.map((item, index) => {
        const subtotal = item.quantity * item.unit_price;
        const cgst = (subtotal * (item.cgst_percent || 0)) / 100;
        const sgst = (subtotal * (item.sgst_percent || 0)) / 100;
        const total = subtotal + cgst + sgst;

        return (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Select Product (Optional)</Label>
                <Select
                  value={item.product_id}
                  onValueChange={(value) => handleProductSelect(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ₹{Number(product.unit_price).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Product/Service"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (₹) *</Label>
                <IndianNumberInput
                  value={item.unit_price}
                  onChange={(value) => updateItem(index, "unit_price", value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CGST %</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cgst_percent}
                  onChange={(e) => updateItem(index, "cgst_percent", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>SGST %</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.sgst_percent}
                  onChange={(e) => updateItem(index, "sgst_percent", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <Label className="text-xs">Subtotal</Label>
                <div className="font-medium">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <Label className="text-xs">CGST</Label>
                <div className="font-medium">₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <Label className="text-xs">SGST</Label>
                <div className="font-medium">₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <Label className="text-xs">Total</Label>
                <div className="font-semibold text-primary">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            {items.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
              >
                Remove Item
              </Button>
            )}
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Add Item
      </Button>
    </div>
  );
};
