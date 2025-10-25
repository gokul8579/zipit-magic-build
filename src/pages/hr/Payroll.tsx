import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, DollarSign, Eye } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_pay: number;
  gross_salary: number;
  net_salary: number;
  payment_date: string | null;
  payment_method: string | null;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  salary: number | null;
}

const Payroll = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [periodType, setPeriodType] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [formData, setFormData] = useState({
    employee_id: "",
    pay_period_start: "",
    pay_period_end: "",
    basic_salary: "",
    allowances: "",
    deductions: "",
    overtime_pay: "",
    payment_date: "",
    payment_method: "bank_transfer",
    notes: "",
  });

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  const fetchPayroll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .eq("user_id", user.id)
        .order("pay_period_end", { ascending: false });

      if (error) throw error;
      setPayroll(data || []);
    } catch (error: any) {
      toast.error("Error fetching payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, salary")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast.error("Error fetching employees");
    }
  };

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    const today = new Date();
    let startDate = "";
    let endDate = "";
    
    if (periodType === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (periodType === "weekly") {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      startDate = startOfWeek.toISOString().split('T')[0];
      endDate = endOfWeek.toISOString().split('T')[0];
    } else {
      startDate = today.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }
    
    setFormData({
      ...formData,
      employee_id: empId,
      basic_salary: emp?.salary?.toString() || "",
      pay_period_start: startDate,
      pay_period_end: endDate,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const basicSalary = parseFloat(formData.basic_salary);
      const allowances = parseFloat(formData.allowances) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const overtimePay = parseFloat(formData.overtime_pay) || 0;
      const grossSalary = basicSalary + allowances + overtimePay;
      const netSalary = grossSalary - deductions;

      const { error } = await supabase.from("payroll").insert([{
        employee_id: formData.employee_id,
        pay_period_start: formData.pay_period_start,
        pay_period_end: formData.pay_period_end,
        basic_salary: basicSalary,
        allowances,
        deductions,
        overtime_pay: overtimePay,
        gross_salary: grossSalary,
        net_salary: netSalary,
        payment_date: formData.payment_date || null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Payroll processed successfully!");
      setOpen(false);
      setFormData({
        employee_id: "",
        pay_period_start: "",
        pay_period_end: "",
        basic_salary: "",
        allowances: "",
        deductions: "",
        overtime_pay: "",
        payment_date: "",
        payment_method: "bank_transfer",
        notes: "",
      });
      fetchPayroll();
    } catch (error: any) {
      toast.error("Error creating payroll");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "-";
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage employee salaries and payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Process Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payroll</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pay Period Type *</Label>
                <div className="flex gap-2">
                  {(["monthly", "weekly", "daily"] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={periodType === type ? "default" : "outline"}
                      onClick={() => setPeriodType(type)}
                      className="flex-1"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Select value={formData.employee_id} onValueChange={handleEmployeeChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {`${emp.first_name} ${emp.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_period_start">Period Start *</Label>
                  <Input
                    id="pay_period_start"
                    type="date"
                    value={formData.pay_period_start}
                    onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_period_end">Period End *</Label>
                  <Input
                    id="pay_period_end"
                    type="date"
                    value={formData.pay_period_end}
                    onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary (₹) *</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  step="0.01"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances (₹)</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime_pay">Overtime Pay (₹)</Label>
                  <Input
                    id="overtime_pay"
                    type="number"
                    step="0.01"
                    value={formData.overtime_pay}
                    onChange={(e) => setFormData({ ...formData, overtime_pay: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions (₹)</Label>
                  <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Process Payroll</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Gross Salary</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : payroll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                    <p>No payroll records yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payroll.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{getEmployeeName(record.employee_id)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(record.pay_period_start).toLocaleDateString()} - {new Date(record.pay_period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₹{Number(record.basic_salary).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(record.gross_salary).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(record.deductions).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-success">₹{Number(record.net_salary).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{record.payment_method?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={record.status}
                      onValueChange={async (value) => {
                        try {
                          const { error } = await supabase
                            .from("payroll")
                            .update({ status: value as any })
                            .eq("id", record.id);
                          
                          if (error) throw error;
                          toast.success("Status updated successfully!");
                          fetchPayroll();
                        } catch (error: any) {
                          toast.error("Error updating status");
                        }
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPayroll(record);
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

      {selectedPayroll && (
        <DetailViewDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Payroll Details"
          fields={[
            { label: "Employee", value: getEmployeeName(selectedPayroll.employee_id) },
            { label: "Pay Period", value: `${new Date(selectedPayroll.pay_period_start).toLocaleDateString()} - ${new Date(selectedPayroll.pay_period_end).toLocaleDateString()}` },
            { label: "Basic Salary", value: `₹${Number(selectedPayroll.basic_salary).toLocaleString()}` },
            { label: "Allowances", value: `₹${Number(selectedPayroll.allowances).toLocaleString()}` },
            { label: "Overtime Pay", value: `₹${Number(selectedPayroll.overtime_pay).toLocaleString()}` },
            { label: "Gross Salary", value: `₹${Number(selectedPayroll.gross_salary).toLocaleString()}` },
            { label: "Deductions", value: `₹${Number(selectedPayroll.deductions).toLocaleString()}` },
            { label: "Net Salary", value: `₹${Number(selectedPayroll.net_salary).toLocaleString()}` },
            { label: "Payment Method", value: selectedPayroll.payment_method?.replace('_', ' ') || "-" },
            { label: "Payment Date", value: selectedPayroll.payment_date, type: "date" },
            { label: "Status", value: selectedPayroll.status, type: "badge", badgeColor: getStatusColor(selectedPayroll.status) },
          ]}
        />
      )}
    </div>
  );
};

export default Payroll;