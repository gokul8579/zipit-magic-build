import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Eye, Users } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Department {
  id: string;
  name: string;
  description: string | null;
  head_of_department: string | null;
  created_at: string;
}

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    employee_id: "",
    role: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    head_of_department: "",
  });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      toast.error("Error fetching departments");
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
        .select("id, first_name, last_name")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("departments").insert([{
        ...formData,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Department created successfully!");
      setOpen(false);
      setFormData({ name: "", description: "", head_of_department: "" });
      fetchDepartments();
    } catch (error: any) {
      toast.error("Error creating department");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("department_members").insert({
        department_id: selectedDeptId,
        employee_id: memberFormData.employee_id,
        role: memberFormData.role || null,
        user_id: user.id,
      } as any);

      if (error) throw error;

      toast.success("Member added successfully!");
      setMemberFormData({ employee_id: "", role: "" });
    } catch (error: any) {
      toast.error("Error adding member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage organizational departments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head_of_department">Head of Department</Label>
                <Input
                  id="head_of_department"
                  value={formData.head_of_department}
                  onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Head of Department</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    <p>No departments yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.head_of_department || "-"}</TableCell>
                  <TableCell>{dept.description || "-"}</TableCell>
                  <TableCell>{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDept(dept);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeptId(dept.id);
                          setMembersDialogOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee *</Label>
              <Select 
                value={memberFormData.employee_id} 
                onValueChange={(value) => setMemberFormData({ ...memberFormData, employee_id: value })} 
                required
              >
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
            <div className="space-y-2">
              <Label htmlFor="role">Role (Optional)</Label>
              <Input
                id="role"
                value={memberFormData.role}
                onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                placeholder="e.g., Team Lead, Developer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMembersDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedDept && (
        <DetailViewDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Department Details"
          fields={[
            { label: "Department Name", value: selectedDept.name, type: "text", fieldName: "name" },
            { label: "Head of Department", value: selectedDept.head_of_department, type: "text", fieldName: "head_of_department" },
            { label: "Description", value: selectedDept.description, type: "textarea", fieldName: "description" },
            { label: "Created", value: selectedDept.created_at, type: "date" },
          ]}
          onEdit={async (data) => {
            try {
              const { error } = await supabase
                .from("departments")
                .update({
                  name: data.name,
                  head_of_department: data.head_of_department || null,
                  description: data.description || null,
                })
                .eq("id", selectedDept.id);

              if (error) throw error;
              toast.success("Department updated successfully!");
              fetchDepartments();
              setDetailOpen(false);
            } catch (error: any) {
              toast.error("Failed to update department");
            }
          }}
          onDelete={async () => {
            try {
              const { error } = await supabase
                .from("departments")
                .delete()
                .eq("id", selectedDept.id);

              if (error) throw error;
              toast.success("Department deleted successfully!");
              setDetailOpen(false);
              fetchDepartments();
            } catch (error: any) {
              toast.error("Failed to delete department");
            }
          }}
        />
      )}
    </div>
  );
};

export default Departments;