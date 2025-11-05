import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DepartmentMember {
  id: string;
  employee_id: string;
  role: string | null;
  employee: {
    first_name: string;
    last_name: string;
    position: string | null;
  };
}

interface DepartmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string | null;
  departmentName: string;
  headOfDepartment: string | null;
}

export const DepartmentDetailDialog = ({
  open,
  onOpenChange,
  departmentId,
  departmentName,
  headOfDepartment,
}: DepartmentDetailDialogProps) => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && departmentId) {
      fetchMembers();
    }
  }, [open, departmentId]);

  const fetchMembers = async () => {
    if (!departmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select(`
          id,
          employee_id,
          role,
          employees:employee_id (
            first_name,
            last_name,
            position
          )
        `)
        .eq("department_id", departmentId);

      if (error) throw error;

      const formattedMembers = (data || []).map((item: any) => ({
        id: item.id,
        employee_id: item.employee_id,
        role: item.role,
        employee: {
          first_name: item.employees?.first_name || "",
          last_name: item.employees?.last_name || "",
          position: item.employees?.position || null,
        },
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{departmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Department Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">
                {headOfDepartment || <span className="text-muted-foreground">Not assigned</span>}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No team members assigned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-base">
                              {member.employee.first_name} {member.employee.last_name}
                            </p>
                            {member.employee.position && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {member.employee.position}
                              </p>
                            )}
                          </div>
                          {member.role && (
                            <Badge variant="secondary" className="ml-2">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
