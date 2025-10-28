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
import { Plus, Users, Eye } from "lucide-react";
import { DetailViewDialog } from "@/components/DetailViewDialog";
import { SearchFilter } from "@/components/SearchFilter";
import { IndianNumberInput } from "@/components/ui/indian-number-input";

interface Employee {
  id: string;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  position: string | null;
  hire_date: string | null;
  salary: number | null;
  status: string;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("first_name");
  const [formData, setFormData] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    position: "",
    hire_date: "",
    salary: "",
    status: "active",
    address: "",
    emergency_contact: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter((emp) => {
        const value = filterField === "first_name" 
          ? `${emp.first_name} ${emp.last_name}`.toLowerCase()
          : filterField === "department_id"
          ? getDepartmentName(emp.department_id).toLowerCase()
          : String(emp[filterField as keyof Employee] || "").toLowerCase();
        return value.includes(searchTerm.toLowerCase());
      });
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, filterField, employees]);

  const fetchEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error: any) {
      toast.error("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      toast.error("Error fetching departments");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("employees").insert([{
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        department_id: formData.department_id || null,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Employee added successfully!");
      setOpen(false);
      setFormData({
        employee_code: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department_id: "",
        position: "",
        hire_date: "",
        salary: "",
        status: "active",
        address: "",
        emergency_contact: "",
      });
      fetchEmployees();
    } catch (error: any) {
      toast.error("Error adding employee");
    }
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from("employees")
        .update({
          employee_code: data.employee_code,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          department_id: data.department_id,
          position: data.position,
          hire_date: data.hire_date,
          salary: data.salary ? parseFloat(data.salary) : null,
          status: data.status,
          address: data.address,
          emergency_contact: data.emergency_contact,
        })
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      toast.success("Employee updated successfully!");
      fetchEmployees();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating employee");
    }
  };

  const handleDetailDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      toast.success("Employee deleted successfully!");
      fetchEmployees();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error deleting employee");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "-";
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your workforce</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_code">Employee Code *</Label>
                  <Input
                    id="employee_code"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
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
                <div className="space-y-2">
                  <Label htmlFor="department_id">Department</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Monthly Salary (₹)</Label>
                  <IndianNumberInput
                    id="salary"
                    value={formData.salary}
                    onChange={(value) => setFormData({ ...formData, salary: value })}
                    placeholder="0"
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
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="Name & Phone"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Employee</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterField={filterField}
        onFilterFieldChange={setFilterField}
        filterOptions={[
          { value: "first_name", label: "Name" },
          { value: "employee_code", label: "Employee Code" },
          { value: "department_id", label: "Department" },
          { value: "position", label: "Position" },
        ]}
        placeholder="Search employees..."
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <p>No employees found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee_code}</TableCell>
                  <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                  <TableCell>{getDepartmentName(employee.department_id)}</TableCell>
                  <TableCell>{employee.position || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
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

      {selectedEmployee && (
        <DetailViewDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
          fields={[
            { label: "Employee Code", value: selectedEmployee.employee_code, type: "text", fieldName: "employee_code" },
            { label: "First Name", value: selectedEmployee.first_name, type: "text", fieldName: "first_name" },
            { label: "Last Name", value: selectedEmployee.last_name, type: "text", fieldName: "last_name" },
            { label: "Email", value: selectedEmployee.email, type: "text", fieldName: "email" },
            { label: "Phone", value: selectedEmployee.phone, type: "text", fieldName: "phone" },
            { 
              label: "Department", 
              value: selectedEmployee.department_id, 
              type: "select", 
              fieldName: "department_id",
              selectOptions: departments.map(d => ({ value: d.id, label: d.name }))
            },
            { label: "Position", value: selectedEmployee.position, type: "text", fieldName: "position" },
            { label: "Hire Date", value: selectedEmployee.hire_date, type: "date", fieldName: "hire_date" },
            { label: "Salary (₹)", value: selectedEmployee.salary, type: "currency", fieldName: "salary" },
            { 
              label: "Status", 
              value: selectedEmployee.status, 
              type: "select", 
              fieldName: "status",
              selectOptions: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]
            },
            { label: "Address", value: selectedEmployee.address, type: "textarea", fieldName: "address" },
            { label: "Emergency Contact", value: selectedEmployee.emergency_contact, type: "text", fieldName: "emergency_contact" },
          ]}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
        />
      )}
    </div>
  );
};

export default Employees;
