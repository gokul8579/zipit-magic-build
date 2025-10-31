import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { SearchFilter } from "@/components/SearchFilter";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { formatIndianCurrency } from "@/lib/formatUtils";
import { DateFilter } from "@/components/DateFilter";

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

interface ExpenseItem {
  description: string;
  amount: string;
}

const DailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [previousDayLog, setPreviousDayLog] = useState<DailyLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("log_date");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([{ description: "", amount: "" }]);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    opening_stock: "",
    closing_stock: "",
    sales_amount: "",
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

  useEffect(() => {
    let filtered = logs;
    
    if (startDate && endDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.log_date);
        return logDate >= new Date(startDate) && logDate <= new Date(endDate);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((log) => {
        const value = String(log[filterField as keyof DailyLog] || "").toLowerCase();
        return value.includes(searchTerm.toLowerCase());
      });
    }
    
    setFilteredLogs(filtered);
  }, [searchTerm, filterField, logs, startDate, endDate]);

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
      setFilteredLogs(data || []);
    } catch (error: any) {
      toast.error("Error fetching daily logs");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalExpense = () => {
    return expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalExpense = calculateTotalExpense();
      const expenseDetails = expenseItems
        .filter(item => item.description && item.amount)
        .map(item => `${item.description}: ₹${item.amount}`)
        .join("; ");

      const logData = {
        user_id: user.id,
        log_date: formData.log_date,
        opening_stock: Number(formData.opening_stock) || 0,
        closing_stock: Number(formData.closing_stock) || 0,
        sales_amount: Number(formData.sales_amount) || 0,
        expense_amount: totalExpense,
        income_amount: Number(formData.income_amount) || 0,
        number_of_sales: Number(formData.number_of_sales) || 0,
        number_of_purchases: Number(formData.number_of_purchases) || 0,
        cash_in_hand: Number(formData.cash_in_hand) || 0,
        bank_balance: Number(formData.bank_balance) || 0,
        notes: formData.notes ? `${formData.notes}\nExpenses: ${expenseDetails}` : `Expenses: ${expenseDetails}`,
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
      resetForm();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Error saving daily log");
    }
  };

  const resetForm = () => {
    setFormData({
      log_date: new Date().toISOString().split('T')[0],
      opening_stock: "",
      closing_stock: "",
      sales_amount: "",
      income_amount: "",
      number_of_sales: "",
      number_of_purchases: "",
      cash_in_hand: "",
      bank_balance: "",
      notes: "",
    });
    setExpenseItems([{ description: "", amount: "" }]);
    setPreviousDayLog(null);
  };

  const handleViewLog = (log: DailyLog) => {
    setEditingLog(log);
    setViewMode(true);
    fetchPreviousDayLog(log.log_date);
    setFormData({
      log_date: log.log_date,
      opening_stock: log.opening_stock.toString(),
      closing_stock: log.closing_stock.toString(),
      sales_amount: log.sales_amount.toString(),
      income_amount: log.income_amount.toString(),
      number_of_sales: log.number_of_sales.toString(),
      number_of_purchases: log.number_of_purchases.toString(),
      cash_in_hand: log.cash_in_hand.toString(),
      bank_balance: log.bank_balance.toString(),
      notes: log.notes || "",
    });
    
    // Parse expense items from notes
    const expenseMatch = log.notes?.match(/Expenses: (.+)/);
    if (expenseMatch) {
      const expenseStr = expenseMatch[1];
      const items = expenseStr.split("; ").map(item => {
        const [description, amount] = item.split(": ₹");
        return { description, amount: amount || "" };
      }).filter(item => item.description);
      if (items.length > 0) {
        setExpenseItems(items);
      }
    }
    setOpen(true);
  };

  const handleEdit = () => {
    setViewMode(false);
  };

  const handleDelete = async () => {
    if (!editingLog) return;
    try {
      const { error } = await supabase
        .from("daily_logs")
        .delete()
        .eq("id", editingLog.id);

      if (error) throw error;
      toast.success("Daily log deleted successfully");
      setOpen(false);
      setEditingLog(null);
      fetchLogs();
    } catch (error) {
      toast.error("Error deleting log");
    }
  };

  const fetchPreviousDayLog = async (currentDate: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      const previousDate = date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", previousDate)
        .maybeSingle();

      if (!error && data) {
        setPreviousDayLog(data);
      } else {
        setPreviousDayLog(null);
      }
    } catch (error) {
      setPreviousDayLog(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingLog(null);
    setViewMode(false);
    const today = new Date().toISOString().split('T')[0];
    fetchPreviousDayLog(today);
    resetForm();
    setOpen(true);
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { description: "", amount: "" }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...expenseItems];
    updated[index][field] = value;
    setExpenseItems(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Logs</h1>
          <p className="text-muted-foreground">Track your daily business metrics</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Log
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterField={filterField}
          onFilterFieldChange={setFilterField}
          filterOptions={[
            { value: "log_date", label: "Date" },
            { value: "sales_amount", label: "Sales" },
          ]}
          placeholder="Search logs..."
        />
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setViewMode(true); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? "View" : (editingLog ? "Edit" : "Add")} Daily Log
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={viewMode}>
            <div className="space-y-2">
              <Label htmlFor="log_date">Date *</Label>
              <Input
                id="log_date"
                type="date"
                value={formData.log_date}
                onChange={(e) => {
                  setFormData({ ...formData, log_date: e.target.value });
                  fetchPreviousDayLog(e.target.value);
                }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening_stock">Opening Stock (₹)</Label>
                <IndianNumberInput
                  id="opening_stock"
                  value={formData.opening_stock}
                  onChange={(value) => setFormData({ ...formData, opening_stock: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.opening_stock)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing_stock">Closing Stock (₹)</Label>
                <IndianNumberInput
                  id="closing_stock"
                  value={formData.closing_stock}
                  onChange={(value) => setFormData({ ...formData, closing_stock: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.closing_stock)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_amount">Sales Amount (₹)</Label>
                <IndianNumberInput
                  id="sales_amount"
                  value={formData.sales_amount}
                  onChange={(value) => setFormData({ ...formData, sales_amount: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.sales_amount)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="income_amount">Income Amount (₹)</Label>
                <IndianNumberInput
                  id="income_amount"
                  value={formData.income_amount}
                  onChange={(value) => setFormData({ ...formData, income_amount: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.income_amount)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Expenses</Label>
                <Button type="button" size="sm" variant="outline" onClick={addExpenseItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Expense
                </Button>
              </div>
              {expenseItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Expense description"
                    value={item.description}
                    onChange={(e) => updateExpenseItem(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  <IndianNumberInput
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(value) => updateExpenseItem(index, "amount", value)}
                    className="w-40"
                  />
                  {expenseItems.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExpenseItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-sm font-medium">
                Total Expense: {formatIndianCurrency(calculateTotalExpense())}
              </p>
              {previousDayLog && (
                <p className="text-xs text-green-600">
                  Previous: {formatIndianCurrency(previousDayLog.expense_amount)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number_of_sales">Number of Sales</Label>
                <Input
                  id="number_of_sales"
                  type="number"
                  value={formData.number_of_sales}
                  onChange={(e) => setFormData({ ...formData, number_of_sales: e.target.value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {previousDayLog.number_of_sales}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_purchases">Number of Purchases</Label>
                <Input
                  id="number_of_purchases"
                  type="number"
                  value={formData.number_of_purchases}
                  onChange={(e) => setFormData({ ...formData, number_of_purchases: e.target.value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {previousDayLog.number_of_purchases}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_in_hand">Cash in Hand (₹)</Label>
                <IndianNumberInput
                  id="cash_in_hand"
                  value={formData.cash_in_hand}
                  onChange={(value) => setFormData({ ...formData, cash_in_hand: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.cash_in_hand)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_balance">Bank Balance (₹)</Label>
                <IndianNumberInput
                  id="bank_balance"
                  value={formData.bank_balance}
                  onChange={(value) => setFormData({ ...formData, bank_balance: value })}
                />
                {previousDayLog && (
                  <p className="text-xs text-green-600">
                    Previous: {formatIndianCurrency(previousDayLog.bank_balance)}
                  </p>
                )}
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
              {viewMode && editingLog && (
                <>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                  <Button type="button" onClick={handleEdit}>
                    Edit
                  </Button>
                </>
              )}
              {!viewMode && (
                <>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingLog ? "Update" : "Add"} Log</Button>
                </>
              )}
            </div>
            </fieldset>
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
              <TableHead>Cash</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                    <p>No daily logs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => handleViewLog(log)}>
                  <TableCell className="font-medium">{new Date(log.log_date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatIndianCurrency(log.sales_amount)}</TableCell>
                  <TableCell>{formatIndianCurrency(log.expense_amount)}</TableCell>
                  <TableCell>{formatIndianCurrency(log.income_amount)}</TableCell>
                  <TableCell>{formatIndianCurrency(log.cash_in_hand)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleViewLog(log)}>
                      View
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

export default DailyLogs;
