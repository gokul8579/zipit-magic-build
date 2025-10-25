import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";
import { SearchFilter } from "@/components/SearchFilter";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  catalogue: string | null;
  description: string | null;
  unit_price: number;
  stock_quantity: number;
  cost_price: number;
  active: boolean;
  created_at: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [catalogueDialogOpen, setCatalogueDialogOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [catalogues, setCatalogues] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("name");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    catalogue: "",
    description: "",
    unit_price: "",
    stock_quantity: "",
    cost_price: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCatalogues();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("product_categories")
        .select("name")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      setCategories((data || []).map((c: any) => c.name));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCatalogues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("product_catalogues")
        .select("name")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      setCatalogues((data || []).map((c: any) => c.name));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("products").insert([{
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category || null,
        catalogue: formData.catalogue || null,
        description: formData.description || null,
        unit_price: parseFloat(formData.unit_price),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Product created successfully!");
      setOpen(false);
      setFormData({
        name: "",
        sku: "",
        category: "",
        catalogue: "",
        description: "",
        unit_price: "",
        stock_quantity: "",
        cost_price: "",
      });
      fetchProducts();
    } catch (error: any) {
      toast.error("Error creating product");
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          sku: data.sku || null,
          category: data.category || null,
          catalogue: data.catalogue || null,
          description: data.description || null,
          unit_price: parseFloat(data.unit_price),
          stock_quantity: parseInt(data.stock_quantity) || 0,
          cost_price: parseFloat(data.cost_price) || 0,
          active: data.active === "true" || data.active === true,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast.success("Product updated successfully!");
      fetchProducts();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating product");
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    switch (filterField) {
      case "name":
        return product.name.toLowerCase().includes(searchLower);
      case "sku":
        return product.sku?.toLowerCase().includes(searchLower) ?? false;
      case "category":
        return product.category?.toLowerCase().includes(searchLower) ?? false;
      default:
        return true;
    }
  });

  const detailFields: DetailField[] = selectedProduct ? [
    { label: "Name", value: selectedProduct.name, type: "text", fieldName: "name" },
    { label: "SKU", value: selectedProduct.sku, type: "text", fieldName: "sku" },
    { 
      label: "Category", 
      value: selectedProduct.category, 
      type: "select", 
      fieldName: "category",
      selectOptions: categories.map(c => ({ value: c, label: c }))
    },
    { 
      label: "Catalogue", 
      value: selectedProduct.catalogue, 
      type: "select", 
      fieldName: "catalogue",
      selectOptions: catalogues.map(c => ({ value: c, label: c }))
    },
    { label: "Description", value: selectedProduct.description, type: "textarea", fieldName: "description" },
    { label: "Unit Price", value: selectedProduct.unit_price, type: "currency", fieldName: "unit_price" },
    { label: "Stock Quantity", value: selectedProduct.stock_quantity, type: "number", fieldName: "stock_quantity" },
    { label: "Cost Price", value: selectedProduct.cost_price, type: "currency", fieldName: "cost_price" },
    { 
      label: "Status", 
      value: selectedProduct.active ? "true" : "false", 
      type: "select", 
      fieldName: "active",
      selectOptions: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ]
    },
    { label: "Created", value: selectedProduct.created_at, type: "date" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            Create Category
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="catalogue">Catalogue</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCatalogueDialogOpen(true)}>New</Button>
                </div>
                <Select value={formData.catalogue} onValueChange={(v) => setFormData({ ...formData, catalogue: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select catalogue" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogues.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price (₹) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price (₹)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (document.getElementById('new_category_name') as HTMLInputElement).value.trim();
              if (!name) return;
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { error } = await supabase.from('product_categories').insert({ name, user_id: user.id } as any);
                if (error) throw error;
                toast.success('Category created');
                setCategoryDialogOpen(false);
                fetchCategories();
              } catch (err) {
                toast.error('Error creating category');
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_category_name">Category Name</Label>
                <Input id="new_category_name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={catalogueDialogOpen} onOpenChange={setCatalogueDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Catalogue</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (document.getElementById('new_catalogue_name') as HTMLInputElement).value.trim();
              if (!name) return;
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { error } = await supabase.from('product_catalogues').insert({ name, user_id: user.id } as any);
                if (error) throw error;
                toast.success('Catalogue created');
                setCatalogueDialogOpen(false);
                fetchCatalogues();
              } catch (err) {
                toast.error('Error creating catalogue');
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_catalogue_name">Catalogue Name</Label>
                <Input id="new_catalogue_name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCatalogueDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterField={filterField}
        onFilterFieldChange={setFilterField}
        filterOptions={[
          { value: "name", label: "Name" },
          { value: "sku", label: "SKU" },
          { value: "category", label: "Category" },
        ]}
        placeholder="Search products..."
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                    <p>No products found</p>
                    <p className="text-sm">Add your first product to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleProductClick(product)}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>₹{Number(product.unit_price).toFixed(2)}</TableCell>
                  <TableCell>{product.stock_quantity || 0}</TableCell>
                  <TableCell>
                    {product.active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DetailViewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Product Details"
        fields={detailFields}
        onEdit={handleDetailEdit}
      />
    </div>
  );
};

export default Products;
