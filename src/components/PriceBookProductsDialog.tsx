import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { formatIndianCurrency } from "@/lib/formatUtils";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

interface PriceBookItem {
  id: string;
  unit_price: number;
  product_id: string;
}

interface PriceBookProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceBookId: string | null;
  priceBookName: string;
}

export const PriceBookProductsDialog = ({
  open,
  onOpenChange,
  priceBookId,
  priceBookName,
}: PriceBookProductsDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Array<Product & { unit_price: number }>>([]);

  useEffect(() => {
    if (priceBookId && open) {
      fetchPriceBookProducts();
    }
  }, [priceBookId, open]);

  const fetchPriceBookProducts = async () => {
    try {
      setLoading(true);
      
      if (!priceBookId) {
        setProducts([]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProducts([]);
        return;
      }

      // Get price book items
      const { data: priceBookItems, error: itemsError } = await supabase
        .from("price_book_items")
        .select(`
          id,
          list_price,
          product_id
        `)
        .eq("price_book_id", priceBookId);

      if (itemsError) {
        console.error("Price book items error:", itemsError);
        throw itemsError;
      }

      if (!priceBookItems || priceBookItems.length === 0) {
        setProducts([]);
        return;
      }

      // Get product IDs
      const productIds = priceBookItems.map(item => item.product_id);

      // Fetch product details
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, quantity_in_stock")
        .in("id", productIds);

      if (productsError) {
        console.error("Products error:", productsError);
        throw productsError;
      }

      // Combine price book items with product data
      const combinedData = priceBookItems
        .map(item => {
          const product = productsData?.find(p => p.id === item.product_id);
          if (!product) return null;
          return {
            id: product.id,
            name: product.name,
            stock_quantity: product.quantity_in_stock || 0,
            unit_price: item.list_price || 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setProducts(combinedData);
    } catch (error) {
      console.error("Error fetching price book products:", error);
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Products in {priceBookName}</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Stock Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p>No products in this price book</p>
                      <p className="text-sm">Add products to this price book to see them here</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatIndianCurrency(product.unit_price)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
