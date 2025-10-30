import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Truck } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";
import { SearchFilter } from "@/components/SearchFilter";

interface Vendor {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("name");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast.error("Error fetching vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("vendors").insert([{
        ...formData,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Vendor created successfully!");
      setOpen(false);
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        notes: "",
      });
      fetchVendors();
    } catch (error: any) {
      toast.error("Error creating vendor");
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailOpen(true);
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
          notes: data.notes,
        })
        .eq("id", selectedVendor.id);

      if (error) throw error;

      toast.success("Vendor updated successfully!");
      fetchVendors();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating vendor");
    }
  };

  const handleDetailDelete = async () => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", selectedVendor.id);

      if (error) throw error;

      toast.success("Vendor deleted successfully!");
      setDetailOpen(false);
      fetchVendors();
    } catch (error: any) {
      toast.error("Error deleting vendor");
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const searchLower = searchTerm.toLowerCase();
    switch (filterField) {
      case "name":
        return vendor.name.toLowerCase().includes(searchLower);
      case "company":
        return vendor.company?.toLowerCase().includes(searchLower) ?? false;
      case "email":
        return vendor.email?.toLowerCase().includes(searchLower) ?? false;
      case "city":
        return vendor.city?.toLowerCase().includes(searchLower) ?? false;
      default:
        return true;
    }
  });

  const detailFields: DetailField[] = selectedVendor ? [
    { label: "Name", value: selectedVendor.name, type: "text", fieldName: "name" },
    { label: "Company", value: selectedVendor.company, type: "text", fieldName: "company" },
    { label: "Email", value: selectedVendor.email, type: "text", fieldName: "email" },
    { label: "Phone", value: selectedVendor.phone, type: "text", fieldName: "phone" },
    { label: "Address", value: selectedVendor.address, type: "textarea", fieldName: "address" },
    { label: "City", value: selectedVendor.city, type: "text", fieldName: "city" },
    { label: "State", value: selectedVendor.state, type: "text", fieldName: "state" },
    { label: "Postal Code", value: selectedVendor.postal_code, type: "text", fieldName: "postal_code" },
    { label: "Country", value: selectedVendor.country, type: "text", fieldName: "country" },
    { label: "Notes", value: selectedVendor.notes, type: "textarea", fieldName: "notes" },
    { label: "Created", value: selectedVendor.created_at, type: "date" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Vendor</Button>
              </div>
            </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterField={filterField}
        onFilterFieldChange={setFilterField}
        filterOptions={[
          { value: "name", label: "Name" },
          { value: "company", label: "Company" },
          { value: "email", label: "Email" },
          { value: "city", label: "City" },
        ]}
        placeholder="Search vendors..."
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-12 w-12 text-muted-foreground/50" />
                    <p>No vendors found</p>
                    <p className="text-sm">Add your first vendor to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleVendorClick(vendor)}
                >
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.company || "-"}</TableCell>
                  <TableCell>{vendor.email || "-"}</TableCell>
                  <TableCell>{vendor.phone || "-"}</TableCell>
                  <TableCell>
                    {vendor.city && vendor.country
                      ? `${vendor.city}, ${vendor.country}`
                      : vendor.city || vendor.country || "-"}
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
          title="Vendor Details"
          fields={detailFields}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
        />
    </div>
  );
};

export default Vendors;
