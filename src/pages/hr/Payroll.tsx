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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, DollarSign } from "lucide-react";
import { IndianNumberInput } from "@/components/ui/indian-number-input";
import { formatIndianCurrency } from "@/lib/formatUtils";
import { SearchFilter } from "@/components/SearchFilter";
import { PayrollAnalytics } from "@/components/PayrollAnalytics";

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string | null;
  status: string;
  notes: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  salary: number | null;
}

const Payroll = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [filteredPayroll, setFilteredPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("employee_id");
  const [formData, setFormData] = useState({
    employee_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: "",
    allowances: "",
    deductions: "",
    payment_date: "",
    notes: "",
    payment_frequency: "monthly",
  });

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = payroll.filter((record) => {
        const value = filterField === "employee_id"
          ? getEmployeeName(record.employee_id).toLowerCase()
          : filterField === "status"
          ? record.status.toLowerCase()
          : String(record[filterField as keyof PayrollRecord] || "").toLowerCase();
        return value.includes(searchTerm.toLowerCase());
      });
      setFilteredPayroll(filtered);
    } else {
      setFilteredPayroll(payroll);
    }
  }, [searchTerm, filterField, payroll]);

  const fetchPayroll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: false });

      if (error) throw error;
      setPayroll(data || []);
      setFilteredPayroll(data || []);
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
    setFormData({
      ...formData,
      employee_id: empId,
      basic_salary: emp?.salary?.toString() || "",
    });
  };

  const calculateSalary = () => {
    const basicSalary = parseFloat(formData.basic_salary) || 0;
    if (formData.payment_frequency === "daily") {
      return basicSalary / 30;
    } else if (formData.payment_frequency === "weekly") {
      return basicSalary / 4;
    }
    return basicSalary;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const calculatedSalary = calculateSalary();
      const allowances = parseFloat(formData.allowances) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const netSalary = calculatedSalary + allowances - deductions;

      const { error } = await supabase.from("payroll").insert([{
        employee_id: formData.employee_id,
        month: formData.month,
        year: formData.year,
        basic_salary: calculatedSalary,
        allowances,
        deductions,
        net_salary: netSalary,
        payment_date: formData.payment_date || null,
        notes: formData.notes || null,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Payroll processed successfully!");
      setOpen(false);
      setFormData({
        employee_id: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basic_salary: "",
        allowances: "",
        deductions: "",
        payment_date: "",
        notes: "",
        payment_frequency: "monthly",
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
                  <Label htmlFor="month">Month *</Label>
                  <Select value={formData.month.toString()} onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i+1} value={(i+1).toString()}>
                          {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_frequency">Payment Frequency *</Label>
                <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (Salary / 30)</SelectItem>
                    <SelectItem value="weekly">Weekly (Salary / 4)</SelectItem>
                    <SelectItem value="monthly">Monthly (Full Salary)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Monthly Base Salary (₹) *</Label>
                <IndianNumberInput
                  id="basic_salary"
                  value={formData.basic_salary}
                  onChange={(value) => setFormData({ ...formData, basic_salary: value })}
                  placeholder="0"
                  required
                />
                {formData.basic_salary && formData.payment_frequency !== "monthly" && (
                  <p className="text-sm text-green-600">
                    Calculated: {formatIndianCurrency(calculateSalary())}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances (₹)</Label>
                  <IndianNumberInput
                    id="allowances"
                    value={formData.allowances}
                    onChange={(value) => setFormData({ ...formData, allowances: value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions (₹)</Label>
                  <IndianNumberInput
                    id="deductions"
                    value={formData.deductions}
                    onChange={(value) => setFormData({ ...formData, deductions: value })}
                    placeholder="0"
                  />
                </div>
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

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterField={filterField}
            onFilterFieldChange={setFilterField}
            filterOptions={[
              { value: "employee_id", label: "Employee" },
              { value: "status", label: "Status" },
            ]}
            placeholder="Search payroll..."
          />

          <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredPayroll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                    <p>No payroll records found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayroll.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{getEmployeeName(record.employee_id)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(record.year, record.month - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </TableCell>
                  <TableCell>{formatIndianCurrency(record.basic_salary)}</TableCell>
                  <TableCell className="font-semibold">{formatIndianCurrency(record.net_salary)}</TableCell>
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
                          toast.success("Status updated!");
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
        </TabsContent>

        <TabsContent value="analytics">
          <PayrollAnalytics payroll={payroll} getEmployeeName={getEmployeeName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;
