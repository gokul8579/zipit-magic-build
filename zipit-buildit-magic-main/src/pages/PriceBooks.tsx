import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceBookProductsDialog } from "@/components/PriceBookProductsDialog";

interface PriceBook {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const PriceBooks = () => {
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [selectedPriceBook, setSelectedPriceBook] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPriceBooks();
  }, []);

  const fetchPriceBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("price_books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPriceBooks(data || []);
    } catch (error: any) {
      toast.error("Error fetching price books");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("price_books").insert([{
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Price book created successfully!");
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
      fetchPriceBooks();
    } catch (error: any) {
      toast.error("Error creating price book");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Price Books</h1>
          <p className="text-muted-foreground">Manage pricing variations for different customers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Price Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Price Book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Price Book Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Price Book</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : priceBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <p>No price books yet</p>
                    <p className="text-sm">Create a price book to manage custom pricing</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              priceBooks.map((priceBook) => (
                <TableRow 
                  key={priceBook.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => {
                    setSelectedPriceBook({ id: priceBook.id, name: priceBook.name });
                    setProductsDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{priceBook.name}</TableCell>
                  <TableCell>{priceBook.description || "-"}</TableCell>
                  <TableCell>
                    {priceBook.is_active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(priceBook.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PriceBookProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        priceBookId={selectedPriceBook?.id || null}
        priceBookName={selectedPriceBook?.name || ""}
      />
    </div>
  );
};

export default PriceBooks;
