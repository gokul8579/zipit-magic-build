import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, ShoppingCart, Eye, Trash2 } from "lucide-react";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { parseIndianNumber, formatIndianNumber } from "@/lib/formatUtils";
import { SearchFilter } from "@/components/SearchFilter";
import { DetailViewDialog } from "@/components/DetailViewDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  notes: string | null;
  created_at: string;
}

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [formData, setFormData] = useState({
    po_number: `PO-${Date.now()}`,
    vendor_id: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    status: "draft",
    tax_percent: "18",
    discount_amount: "0",
    notes: "",
  });
  const [lineItems, setLineItems] = useState([
    { product_id: "", description: "", quantity: 1, unit_price: 0, tax_percent: 18 }
  ]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchProducts();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch purchase orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
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

  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: "", description: "", quantity: 1, unit_price: 0, tax_percent: 18 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].description) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;

      const itemsWithAmounts = lineItems.map(item => {
        const quantity = parseFloat(item.quantity.toString()) || 0;
        const unitPrice = parseFloat(item.unit_price.toString()) || 0;
        const taxPercent = parseFloat(item.tax_percent.toString()) || 0;
        const lineTotal = quantity * unitPrice;
        const taxAmount = (lineTotal * taxPercent) / 100;

        subtotal += lineTotal;
        totalTax += taxAmount;

        return {
          product_id: item.product_id || null,
          description: item.description,
          quantity,
          unit_price: unitPrice,
          tax_amount: taxAmount,
          amount: lineTotal + taxAmount,
        };
      });

      const discount = parseFloat(formData.discount_amount) || 0;
      const totalAmount = subtotal + totalTax - discount;

      // Create purchase order
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert([{
          po_number: formData.po_number,
          vendor_id: formData.vendor_id,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          status: formData.status,
          subtotal,
          tax_amount: totalTax,
          discount_amount: discount,
          total_amount: totalAmount,
          notes: formData.notes || null,
          user_id: user.id,
        }])
        .select()
        .single();

      if (poError) throw poError;

      // Create line items
      const lineItemsToInsert = itemsWithAmounts.map(item => ({
        ...item,
        purchase_order_id: poData.id,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(lineItemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Purchase order created successfully!");
      setOpen(false);
      resetForm();
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      toast.error("Failed to create purchase order. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      po_number: `PO-${Date.now()}`,
      vendor_id: "",
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: "",
      status: "draft",
      tax_percent: "18",
      discount_amount: "0",
      notes: "",
    });
    setLineItems([{ product_id: "", description: "", quantity: 1, unit_price: 0, tax_percent: 18 }]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return "-";
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || "-";
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    if (filterField === "all") {
      return po.po_number.toLowerCase().includes(searchLower) ||
             getVendorName(po.vendor_id).toLowerCase().includes(searchLower) ||
             po.status.toLowerCase().includes(searchLower);
    } else if (filterField === "po_number") {
      return po.po_number.toLowerCase().includes(searchLower);
    } else if (filterField === "vendor") {
      return getVendorName(po.vendor_id).toLowerCase().includes(searchLower);
    } else if (filterField === "status") {
      return po.status.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="po_number">PO Number *</Label>
                    <Input
                      id="po_number"
                      value={formData.po_number}
                      onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor_id">Vendor *</Label>
                    <Select
                      value={formData.vendor_id}
                      onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_date">Order Date *</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Line Items *</Label>
                    <Button type="button" onClick={addLineItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="border p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Product</Label>
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => {
                                const product = products.find(p => p.id === value);
                                updateLineItem(index, "product_id", value);
                                if (product) {
                                  updateLineItem(index, "description", product.name);
                                  updateLineItem(index, "unit_price", product.unit_price || 0);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, "description", e.target.value)}
                              placeholder="Item description"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <IndianNumberInput
                              value={item.quantity.toString()}
                              onChange={(value) => updateLineItem(index, "quantity", parseIndianNumber(value) || 1)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price (₹) *</Label>
                            <IndianNumberInput
                              value={item.unit_price.toString()}
                              onChange={(value) => updateLineItem(index, "unit_price", parseIndianNumber(value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tax (%)</Label>
                            <Input
                              type="number"
                              value={item.tax_percent}
                              onChange={(e) => updateLineItem(index, "tax_percent", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total</Label>
                            <Input
                              value={formatIndianNumber(
                                (parseFloat(item.quantity.toString()) || 0) * 
                                (parseFloat(item.unit_price.toString()) || 0) * 
                                (1 + (parseFloat(item.tax_percent.toString()) || 0) / 100)
                              )}
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                    <IndianNumberInput
                      id="discount_amount"
                      value={formData.discount_amount}
                      onChange={(value) => setFormData({ ...formData, discount_amount: value })}
                      placeholder="0"
                    />
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
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Purchase Order</Button>
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
          { value: "all", label: "All Fields" },
          { value: "po_number", label: "PO Number" },
          { value: "vendor", label: "Vendor" },
          { value: "status", label: "Status" },
        ]}
        placeholder="Search purchase orders..."
      />

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredPurchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                    <p>No purchase orders found</p>
                    <p className="text-sm">Create your first purchase order to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>{getVendorName(po.vendor_id)}</TableCell>
                  <TableCell>{new Date(po.order_date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    {po.expected_delivery_date 
                      ? new Date(po.expected_delivery_date).toLocaleDateString('en-IN')
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(po.status)} variant="outline">
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatIndianNumber(po.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPO(po);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchaseOrders;