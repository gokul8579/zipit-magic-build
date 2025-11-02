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

import { SalesOrderProductSelector2 } from "@/components/SalesOrderProductSelector2";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchFilter } from "@/components/SearchFilter";

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
  payment_status?: string;
  cgst_percent?: number;
  sgst_percent?: number;
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
    payment_status: "pending",
    order_date: new Date().toISOString().slice(0,10),
    delivery_date: "",
    cgst_percent: "9",
    sgst_percent: "9",
    tax_amount: "0",
    discount_amount: "0",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<any[]>([
    { type: "new", product_id: "", description: "", quantity: 1, unit_price: 0, cgst_percent: 9, sgst_percent: 9 }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        subtotal: Number(order.total_amount) - Number(order.tax_amount) + Number(order.discount_amount),
        tax_amount: Number(order.tax_amount),
        discount_amount: Number(order.discount_amount),
        total_amount: Number(order.total_amount),
        notes: order.notes,
        cgst_percent: Number(order.cgst_percent || 0),
        sgst_percent: Number(order.sgst_percent || 0),
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

      <SearchFilter value={searchTerm} onChange={setSearchTerm} placeholder="Search sales orders..." />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // Calculate totals from items with per-product tax
              let subtotal = 0;
              let totalCgst = 0;
              let totalSgst = 0;
              
              lineItems.forEach(item => {
                const itemSubtotal = item.quantity * item.unit_price;
                const itemCgst = (itemSubtotal * (item.cgst_percent || 0)) / 100;
                const itemSgst = (itemSubtotal * (item.sgst_percent || 0)) / 100;
                subtotal += itemSubtotal;
                totalCgst += itemCgst;
                totalSgst += itemSgst;
              });

              const taxAmount = totalCgst + totalSgst;
              const discount = parseFloat(formData.discount_amount) || 0;
              const total = subtotal + taxAmount - discount;

              const avgCgstPercent = subtotal > 0 ? (totalCgst / subtotal) * 100 : 0;
              const avgSgstPercent = subtotal > 0 ? (totalSgst / subtotal) * 100 : 0;

              const { data: order, error } = await supabase.from("sales_orders").insert({
                order_number: formData.order_number,
                customer_id: formData.customer_id || null,
                status: formData.status as any,
                payment_status: formData.payment_status as any,
                order_date: formData.order_date,
                expected_delivery_date: formData.delivery_date || null,
                cgst_percent: avgCgstPercent,
                sgst_percent: avgSgstPercent,
                subtotal: subtotal,
                tax_amount: taxAmount,
                discount_amount: discount,
                total_amount: total,
                notes: formData.notes,
                user_id: user.id,
              } as any).select().single();

              if (error) {
                if (error.code === '23505') {
                  toast.error("A sales order with this number already exists");
                } else if (error.code === '23503') {
                  toast.error("Invalid customer selected");
                } else {
                  toast.error("Failed to create sales order. Please check all fields.");
                }
                throw error;
              }

              if (order && lineItems.length > 0) {
                const items = lineItems.map(item => {
                  const itemSubtotal = item.quantity * item.unit_price;
                  const itemCgst = (itemSubtotal * (item.cgst_percent || 0)) / 100;
                  const itemSgst = (itemSubtotal * (item.sgst_percent || 0)) / 100;
                  return {
                    sales_order_id: order.id,
                    product_id: item.product_id || null,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    cgst_amount: itemCgst,
                    sgst_amount: itemSgst,
                    amount: itemSubtotal + itemCgst + itemSgst,
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
                payment_status: "pending",
                order_date: new Date().toISOString().slice(0,10),
                delivery_date: "",
                cgst_percent: "9",
                sgst_percent: "9",
                tax_amount: "0",
                discount_amount: "0",
                notes: "",
              });
              setLineItems([{ type: "new", product_id: "", description: "", quantity: 1, unit_price: 0, cgst_percent: 9, sgst_percent: 9 }]);
              fetchOrders();
            } catch (err: any) {
              console.error("Error creating sales order:", err);
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
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
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
                <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                <Input id="discount_amount" type="number" step="0.01" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })} />
              </div>
            </div>

            <SalesOrderProductSelector2 items={lineItems} onChange={setLineItems} />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create Order</Button>
            </div>
          </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Status</TableHead>
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
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select 
                      value={order.status} 
                      onValueChange={async (value: string) => {
                        try {
                          const { error } = await supabase
                            .from("sales_orders")
                            .update({ status: value as any })
                            .eq("id", order.id);
                          if (error) throw error;
                          toast.success("Status updated");
                          fetchOrders();
                        } catch (error) {
                          toast.error("Error updating status");
                        }
                      }}
                    >
                      <SelectTrigger className={`h-8 ${getStatusColor(order.status)}`}>
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
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select 
                      value={order.payment_status || "pending"} 
                      onValueChange={async (value) => {
                        try {
                          const { error } = await supabase
                            .from("sales_orders")
                            .update({ payment_status: value })
                            .eq("id", order.id);
                          if (error) throw error;
                          toast.success("Payment status updated");
                          fetchOrders();
                        } catch (error) {
                          toast.error("Error updating payment status");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
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
