import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Plus, Eye } from "lucide-react";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesOrder {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  total_amount: number;
  expected_delivery_date: string | null;
  customer_id: string | null;
  tax_amount: number;
  discount_amount: number;
  notes: string | null;
}

const SalesOrders = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    order_number: `SO-${Date.now()}`,
    customer_id: "",
    status: "draft",
    order_date: new Date().toISOString().slice(0,10),
    delivery_date: "",
    cgst_percent: "9",
    sgst_percent: "9",
    tax_amount: "0",
    discount_amount: "0",
    notes: "",
  });
  const [lineItems, setLineItems] = useState([
    { product_id: "", description: "", quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Error fetching sales orders");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-yellow-100 text-yellow-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleViewOrder = async (order: SalesOrder) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from("sales_order_items")
        .select("*")
        .eq("sales_order_id", order.id);

      if (itemsError) throw itemsError;

      let customerData = null;
      if (order.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", order.customer_id)
          .single();
        customerData = customer;
      }

      const invoiceData = {
        invoice_number: order.order_number,
        date: order.order_date,
        due_date: order.expected_delivery_date,
        customer_name: customerData?.name || "Customer Name",
        customer_email: customerData?.email,
        customer_phone: customerData?.phone,
        customer_address: customerData?.address,
        items: items?.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          amount: Number(item.amount),
        })) || [],
        subtotal: Number(order.total_amount) - Number(order.tax_amount) + Number(order.discount_amount),
        tax_amount: Number(order.tax_amount),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),
        notes: order.notes,
      };

      setSelectedOrder(invoiceData);
      setInvoiceDialogOpen(true);
    } catch (error) {
      toast.error("Error loading order details");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sales Order
          </Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
              const cgstPercent = parseFloat(formData.cgst_percent) || 0;
              const sgstPercent = parseFloat(formData.sgst_percent) || 0;
              const cgstAmount = (subtotal * cgstPercent) / 100;
              const sgstAmount = (subtotal * sgstPercent) / 100;
              const taxAmount = cgstAmount + sgstAmount;
              const discount = parseFloat(formData.discount_amount) || 0;
              const total = subtotal + taxAmount - discount;

              const { data: order, error } = await supabase.from("sales_orders").insert({
                order_number: formData.order_number,
                customer_id: formData.customer_id || null,
                status: formData.status as any,
                order_date: formData.order_date,
                delivery_date: formData.delivery_date || null,
                cgst_percent: cgstPercent,
                sgst_percent: sgstPercent,
                subtotal: subtotal,
                tax_amount: taxAmount,
                discount_amount: discount,
                total_amount: total,
                notes: formData.notes,
                user_id: user.id,
              } as any).select().single();

              if (error) throw error;

              if (order && lineItems.length > 0) {
                const items = lineItems.map(item => {
                  const itemTotal = item.quantity * item.unit_price;
                  const itemCgst = (itemTotal * cgstPercent) / 100;
                  const itemSgst = (itemTotal * sgstPercent) / 100;
                  return {
                    sales_order_id: order.id,
                    product_id: item.product_id || null,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    cgst_amount: itemCgst,
                    sgst_amount: itemSgst,
                    amount: itemTotal + itemCgst + itemSgst,
                  };
                });
                
                const { error: itemsErr } = await supabase.from("sales_order_items").insert(items);
                if (itemsErr) throw itemsErr;
              }

              toast.success("Sales order created successfully!");
              setCreateOpen(false);
              setFormData({
                order_number: `SO-${Date.now()}`,
                customer_id: "",
                status: "draft",
                order_date: new Date().toISOString().slice(0,10),
                delivery_date: "",
                cgst_percent: "9",
                sgst_percent: "9",
                tax_amount: "0",
                discount_amount: "0",
                notes: "",
              });
              setLineItems([{ product_id: "", description: "", quantity: 1, unit_price: 0 }]);
              fetchOrders();
            } catch (err) {
              toast.error("Error creating sales order");
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order_number">Order Number *</Label>
              <Input id="order_number" value={formData.order_number} onChange={(e) => setFormData({ ...formData, order_number: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer</Label>
                <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input id="order_date" type="date" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input id="delivery_date" type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_amount">Tax Amount (₹)</Label>
                <Input id="tax_amount" type="number" step="0.01" value={formData.tax_amount} onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                <Input id="discount_amount" type="number" step="0.01" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Line Items</Label>
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Input placeholder="Product/Service" value={item.description} onChange={(e) => { const ni=[...lineItems]; ni[index].description=e.target.value; setLineItems(ni); }} required />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => { const ni=[...lineItems]; ni[index].quantity=parseFloat(e.target.value)||1; setLineItems(ni); }} required />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" step="0.01" placeholder="Price (₹)" value={item.unit_price} onChange={(e) => { const ni=[...lineItems]; ni[index].unit_price=parseFloat(e.target.value)||0; setLineItems(ni); }} required />
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}>Remove</Button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { product_id: "", description: "", quantity: 1, unit_price: 0 }])}>Add Item</Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create Order</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Total Amount</TableHead>
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
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                    <p>No sales orders yet</p>
                    <p className="text-sm">Orders will appear here once created</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)} variant="outline">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.expected_delivery_date
                      ? new Date(order.expected_delivery_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>₹{Number(order.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
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
        invoiceData={selectedOrder}
        type="invoice"
      />
    </div>
  );
};

export default SalesOrders;
