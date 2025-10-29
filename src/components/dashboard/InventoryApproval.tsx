import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PendingOrder {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  items: Array<{
    description: string;
    quantity: number;
    product_id: string | null;
  }>;
}

export const InventoryApproval = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orders, error } = await supabase
        .from("sales_orders")
        .select(`
          id,
          order_number,
          order_date,
          total_amount,
          status
        `)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: items } = await supabase
            .from("sales_order_items")
            .select("description, quantity, product_id")
            .eq("sales_order_id", order.id);

          return {
            ...order,
            items: items || [],
          };
        })
      );

      setPendingOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .update({ status: "shipped" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order approved and marked as shipped!");
      fetchPendingOrders();
    } catch (error) {
      toast.error("Error approving order");
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order rejected and cancelled");
      fetchPendingOrders();
    } catch (error) {
      toast.error("Error rejecting order");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Stock Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Stock Approval
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingOrders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No pending orders for approval</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-primary mt-1">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Products:</p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground pl-2">
                        • {item.description} (Qty: {item.quantity})
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(order.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve & Ship
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(order.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
