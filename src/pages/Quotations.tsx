import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";
import { formatLocalDate, formatLocalDateTime } from "@/lib/dateUtils";
import { QuotationProductSelector } from "@/components/QuotationProductSelector";
import { SearchFilter } from "@/components/SearchFilter";

interface Quotation {
  id: string;
  quotation_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  valid_until: string | null;
  customer_id: string | null;
  tax_amount: number;
  discount_amount: number;
  notes: string | null;
  cgst_percent: number;
  sgst_percent: number;
}

const Quotations = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    quotation_number: `QUO-${Date.now()}`,
    customer_id: "",
    deal_id: "",
    status: "draft",
    valid_until: "",
    cgst_percent: "9",
    sgst_percent: "9",
    discount_amount: "0",
    notes: "",
  });
  const [lineItems, setLineItems] = useState([
    { type: "new", product_id: "", description: "", quantity: 1, unit_price: 0, cgst_percent: 9, sgst_percent: 9 }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
    fetchDeals();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("deals")
        .select("id, title")
        .eq("user_id", user.id);

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      console.error("Error fetching deals:", error);
    }
  };

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
    } catch (error: any) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchQuotations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error: any) {
      toast.error("Error fetching quotations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate totals with per-item CGST/SGST
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;

      lineItems.forEach(item => {
        const itemSubtotal = item.quantity * item.unit_price;
        subtotal += itemSubtotal;
        const itemCgst = (itemSubtotal * (item.cgst_percent || 0)) / 100;
        const itemSgst = (itemSubtotal * (item.sgst_percent || 0)) / 100;
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      });

      const taxAmount = totalCgst + totalSgst;
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Calculate average percentages for the header
      const avgCgstPercent = subtotal > 0 ? (totalCgst / subtotal) * 100 : 0;
      const avgSgstPercent = subtotal > 0 ? (totalSgst / subtotal) * 100 : 0;

      const { data: quotation, error } = await supabase.from("quotations").insert({
        quotation_number: formData.quotation_number,
        customer_id: formData.customer_id || null,
        deal_id: formData.deal_id || null,
        status: formData.status as any,
        valid_until: formData.valid_until || null,
        cgst_percent: avgCgstPercent,
        sgst_percent: avgSgstPercent,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        notes: formData.notes,
        user_id: user.id,
      } as any).select().single();

      if (error) {
        if (error.code === '23505') {
          toast.error("A quotation with this number already exists");
        } else if (error.code === '23503') {
          toast.error("Invalid customer or deal selected");
        } else {
          toast.error("Failed to create quotation. Please check all fields.");
        }
        throw error;
      }

      // Insert line items with CGST/SGST
      if (quotation && lineItems.length > 0) {
        const items = lineItems.map(item => {
          const itemSubtotal = item.quantity * item.unit_price;
          const itemCgst = (itemSubtotal * (item.cgst_percent || 0)) / 100;
          const itemSgst = (itemSubtotal * (item.sgst_percent || 0)) / 100;
          return {
            quotation_id: quotation.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cgst_amount: itemCgst,
            sgst_amount: itemSgst,
            amount: itemSubtotal + itemCgst + itemSgst,
          };
        });
        
        const { error: itemsError } = await supabase.from("quotation_items").insert(items);
        if (itemsError) throw itemsError;
      }

      toast.success("Quotation created successfully!");
      setCreateOpen(false);
      setFormData({
        quotation_number: `QUO-${Date.now()}`,
        customer_id: "",
        deal_id: "",
        status: "draft",
        valid_until: "",
        cgst_percent: "9",
        sgst_percent: "9",
        discount_amount: "0",
        notes: "",
      });
      setLineItems([{ type: "new", product_id: "", description: "", quantity: 1, unit_price: 0, cgst_percent: 9, sgst_percent: 9 }]);
      fetchQuotations();
    } catch (error: any) {
      console.error("Quotation creation error:", error);
    }
  };

  const handleQuotationClick = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailOpen(true);
  };

  const handleViewInvoice = async (quotation: Quotation) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotation.id);

      if (itemsError) throw itemsError;

      let customerData = null;
      if (quotation.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", quotation.customer_id)
          .single();
        customerData = customer;
      }

      const invoiceData = {
        invoice_number: quotation.quotation_number,
        quotation_id: quotation.id,
        date: quotation.created_at,
        due_date: quotation.valid_until,
        customer_name: customerData?.name || "Customer Name",
        customer_email: customerData?.email,
        customer_phone: customerData?.phone,
        customer_address: customerData?.address,
        customer_city: customerData?.city,
        customer_state: customerData?.state,
        customer_postal_code: customerData?.postal_code,
        items: items?.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          cgst_amount: Number(item.cgst_amount || 0),
          sgst_amount: Number(item.sgst_amount || 0),
          amount: Number(item.amount),
        })) || [],
        subtotal: Number(quotation.total_amount) - Number(quotation.tax_amount) + Number(quotation.discount_amount),
        tax_amount: Number(quotation.tax_amount),
        discount_amount: Number(quotation.discount_amount),
        total_amount: Number(quotation.total_amount),
        notes: quotation.notes,
        cgst_percent: Number(quotation.cgst_percent || 0),
        sgst_percent: Number(quotation.sgst_percent || 0),
      };

      setInvoiceDialogOpen(true);
      (window as any).__invoiceData = invoiceData;
      (window as any).__onQuotationUpdate = fetchQuotations;
    } catch (error) {
      toast.error("Error loading quotation details");
    }
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedQuotation) return;

    try {
      const { error } = await supabase
        .from("quotations")
        .update({
          status: data.status,
          valid_until: data.valid_until || null,
          tax_amount: parseFloat(data.tax_amount) || 0,
          discount_amount: parseFloat(data.discount_amount) || 0,
          notes: data.notes,
        })
        .eq("id", selectedQuotation.id);

      if (error) throw error;

      toast.success("Quotation updated successfully!");
      fetchQuotations();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating quotation");
    }
  };

  const detailFields: DetailField[] = selectedQuotation ? [
    { label: "Quotation Number", value: selectedQuotation.quotation_number, type: "text" },
    { 
      label: "Status", 
      value: selectedQuotation.status, 
      type: "select", 
      fieldName: "status",
      selectOptions: [
        { value: "draft", label: "Draft" },
        { value: "sent", label: "Sent" },
        { value: "accepted", label: "Accepted" },
        { value: "rejected", label: "Rejected" },
      ]
    },
    { label: "Total Amount", value: `₹${Number(selectedQuotation.total_amount).toLocaleString()}`, type: "text" },
    { label: "Tax Amount (₹)", value: selectedQuotation.tax_amount, type: "number", fieldName: "tax_amount" },
    { label: "Discount Amount (₹)", value: selectedQuotation.discount_amount, type: "number", fieldName: "discount_amount" },
    { label: "Valid Until", value: selectedQuotation.valid_until || "", type: "date", fieldName: "valid_until" },
    { label: "Notes", value: selectedQuotation.notes || "", type: "textarea", fieldName: "notes" },
    { label: "Created", value: selectedQuotation.created_at, type: "date" },
  ] : [];

  const filteredQuotations = quotations.filter(q =>
    q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotations & Billing</h1>
          <p className="text-muted-foreground">Manage your quotes and invoices</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Quotation</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quotation_number">Quotation Number *</Label>
                <Input
                  id="quotation_number"
                  value={formData.quotation_number}
                  onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal_id">Deal</Label>
                  <Select value={formData.deal_id} onValueChange={(value) => setFormData({ ...formData, deal_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  />
                </div>
              </div>
              
              <QuotationProductSelector items={lineItems} onChange={setLineItems} />

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
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Quotation</Button>
              </div>
            </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <SearchFilter value={searchTerm} onChange={setSearchTerm} placeholder="Search quotations..." />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <p>No quotations yet</p>
                    <p className="text-sm">Click "Create Quotation" to add your first quotation</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow 
                  key={quotation.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleQuotationClick(quotation)}
                >
                  <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quotation.status)} variant="outline">
                      {quotation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{Number(quotation.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{formatLocalDateTime(quotation.created_at)}</TableCell>
                  <TableCell>{formatLocalDate(quotation.valid_until)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInvoice(quotation)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InvoiceTemplate
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        invoiceData={(window as any).__invoiceData}
        type="quotation"
      />

      <DetailViewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Quotation Details"
        fields={detailFields}
        onEdit={handleDetailEdit}
        actions={
          selectedQuotation && (
            <Button onClick={() => handleViewInvoice(selectedQuotation)}>
              <FileText className="h-4 w-4 mr-2" />
              View Invoice
            </Button>
          )
        }
      />
    </div>
  );
};

export default Quotations;