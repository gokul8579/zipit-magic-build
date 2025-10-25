import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";

interface DailyLog {
  id: string;
  log_date: string;
  opening_stock: number;
  closing_stock: number;
  sales_amount: number;
  expense_amount: number;
  income_amount: number;
  number_of_sales: number;
  number_of_purchases: number;
  cash_in_hand: number;
  bank_balance: number;
  notes: string | null;
  created_at: string;
}

const DailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    opening_stock: "",
    closing_stock: "",
    sales_amount: "",
    expense_amount: "",
    income_amount: "",
    number_of_sales: "",
    number_of_purchases: "",
    cash_in_hand: "",
    bank_balance: "",
    notes: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Error fetching daily logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const logData = {
        user_id: user.id,
        log_date: formData.log_date,
        opening_stock: Number(formData.opening_stock) || 0,
        closing_stock: Number(formData.closing_stock) || 0,
        sales_amount: Number(formData.sales_amount) || 0,
        expense_amount: Number(formData.expense_amount) || 0,
        income_amount: Number(formData.income_amount) || 0,
        number_of_sales: Number(formData.number_of_sales) || 0,
        number_of_purchases: Number(formData.number_of_purchases) || 0,
        cash_in_hand: Number(formData.cash_in_hand) || 0,
        bank_balance: Number(formData.bank_balance) || 0,
        notes: formData.notes || null,
      };

      let error;
      if (editingLog) {
        const result = await supabase
          .from("daily_logs")
          .update(logData)
          .eq("id", editingLog.id);
        error = result.error;
      } else {
        const result = await supabase.from("daily_logs").insert([logData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingLog ? "Daily log updated successfully" : "Daily log added successfully");
      setOpen(false);
      setEditingLog(null);
      setFormData({
        log_date: new Date().toISOString().split('T')[0],
        opening_stock: "",
        closing_stock: "",
        sales_amount: "",
        expense_amount: "",
        income_amount: "",
        number_of_sales: "",
        number_of_purchases: "",
        cash_in_hand: "",
        bank_balance: "",
        notes: "",
      });
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Error saving daily log");
    }
  };

  const handleEdit = (log: DailyLog) => {
    setEditingLog(log);
    setFormData({
      log_date: log.log_date,
      opening_stock: log.opening_stock.toString(),
      closing_stock: log.closing_stock.toString(),
      sales_amount: log.sales_amount.toString(),
      expense_amount: log.expense_amount.toString(),
      income_amount: log.income_amount.toString(),
      number_of_sales: log.number_of_sales.toString(),
      number_of_purchases: log.number_of_purchases.toString(),
      cash_in_hand: log.cash_in_hand.toString(),
      bank_balance: log.bank_balance.toString(),
      notes: log.notes || "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Logs</h1>
          <p className="text-muted-foreground">Track your daily business metrics</p>
        </div>
        <Button onClick={() => {
          setEditingLog(null);
          setFormData({
            log_date: new Date().toISOString().split('T')[0],
            opening_stock: "",
            closing_stock: "",
            sales_amount: "",
            expense_amount: "",
            income_amount: "",
            number_of_sales: "",
            number_of_purchases: "",
            cash_in_hand: "",
            bank_balance: "",
            notes: "",
          });
          setOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Daily Log
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLog ? "Edit Daily Log" : "Add Daily Log"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="log_date" className="text-base font-semibold">Date *</Label>
              <Input
                id="log_date"
                type="date"
                value={formData.log_date}
                onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                required
              />
            </div>

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">Stock Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_stock">Opening Stock Value (₹)</Label>
                  <Input
                    id="opening_stock"
                    type="number"
                    step="0.01"
                    value={formData.opening_stock}
                    onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_stock">Closing Stock Value (₹)</Label>
                  <Input
                    id="closing_stock"
                    type="number"
                    step="0.01"
                    value={formData.closing_stock}
                    onChange={(e) => setFormData({ ...formData, closing_stock: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Sales & Revenue */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">Sales & Revenue</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales_amount">Total Sales Amount (₹)</Label>
                  <Input
                    id="sales_amount"
                    type="number"
                    step="0.01"
                    value={formData.sales_amount}
                    onChange={(e) => setFormData({ ...formData, sales_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_of_sales">Number of Sales Transactions</Label>
                  <Input
                    id="number_of_sales"
                    type="number"
                    value={formData.number_of_sales}
                    onChange={(e) => setFormData({ ...formData, number_of_sales: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income_amount">Total Income/Revenue (₹)</Label>
                  <Input
                    id="income_amount"
                    type="number"
                    step="0.01"
                    value={formData.income_amount}
                    onChange={(e) => setFormData({ ...formData, income_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Expenses & Purchases */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">Expenses & Purchases</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_amount">Total Expenses (₹)</Label>
                  <Input
                    id="expense_amount"
                    type="number"
                    step="0.01"
                    value={formData.expense_amount}
                    onChange={(e) => setFormData({ ...formData, expense_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_of_purchases">Number of Purchase Transactions</Label>
                  <Input
                    id="number_of_purchases"
                    type="number"
                    value={formData.number_of_purchases}
                    onChange={(e) => setFormData({ ...formData, number_of_purchases: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Cash & Banking */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">Cash & Banking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cash_in_hand">Cash in Hand (₹)</Label>
                  <Input
                    id="cash_in_hand"
                    type="number"
                    step="0.01"
                    value={formData.cash_in_hand}
                    onChange={(e) => setFormData({ ...formData, cash_in_hand: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_balance">Bank Balance (₹)</Label>
                  <Input
                    id="bank_balance"
                    type="number"
                    step="0.01"
                    value={formData.bank_balance}
                    onChange={(e) => setFormData({ ...formData, bank_balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for the day..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingLog ? "Update" : "Add"} Log</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead>Income</TableHead>
              <TableHead># Sales</TableHead>
              <TableHead>Closing Stock</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Bank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                    <p>No daily logs yet</p>
                    <p className="text-sm">Start tracking your daily business metrics</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(log)}
                >
                  <TableCell>{new Date(log.log_date).toLocaleDateString()}</TableCell>
                  <TableCell>₹{Number(log.sales_amount).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(log.expense_amount).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(log.income_amount).toLocaleString()}</TableCell>
                  <TableCell>{log.number_of_sales}</TableCell>
                  <TableCell>₹{Number(log.closing_stock).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(log.cash_in_hand).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(log.bank_balance).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DailyLogs;
