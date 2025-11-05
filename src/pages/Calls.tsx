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
import { Plus, Phone, Eye } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";

interface Call {
  id: string;
  title: string;
  call_type: string;
  status: string;
  scheduled_at: string | null;
  duration: number | null;
  notes: string | null;
  outcome: string | null;
}

const Calls = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
        call_type: "outbound",
    status: "scheduled",
    scheduled_at: "",
    notes: "",
  });

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast.error("Error fetching calls");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert local datetime to ISO format for proper storage
      const scheduledAtISO = formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null;

      const { error } = await supabase.from("calls").insert([{
        title: formData.title,
        call_type: formData.call_type as any,
        status: formData.status as any,
        scheduled_at: scheduledAtISO,
        notes: formData.notes || null,
        user_id: user.id,
      }]);

      if (error) {
        console.error("Error logging call:", error);
        throw error;
      }

      toast.success("Call logged successfully!");
      setOpen(false);
      setFormData({
        title: "",
        call_type: "outbound",
        status: "scheduled",
        scheduled_at: "",
        notes: "",
      });
      fetchCalls();
    } catch (error: any) {
      console.error("Error logging call:", error);
      toast.error(error.message || "Error logging call");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      missed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleStatusChange = async (callId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("calls")
        .update({ status: newStatus as any })
        .eq("id", callId);

      if (error) {
        console.error("Error updating status:", error);
        throw error;
      }

      toast.success("Status updated successfully!");
      fetchCalls();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Error updating status");
    }
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedCall) return;

    try {
      const { error } = await supabase
        .from("calls")
        .update({
          title: data.title,
          call_type: data.call_type as any,
          status: data.status as any,
          scheduled_at: data.scheduled_at || null,
          duration: data.duration ? parseInt(data.duration) : null,
          notes: data.notes,
          outcome: data.outcome,
        })
        .eq("id", selectedCall.id);

      if (error) {
        console.error("Error updating call:", error);
        throw error;
      }

      toast.success("Call updated successfully!");
      fetchCalls();
      setDetailOpen(false);
    } catch (error: any) {
      console.error("Error updating call:", error);
      toast.error(error.message || "Error updating call");
    }
  };

  const handleDetailDelete = async () => {
    if (!selectedCall) return;

    try {
      const { error } = await supabase
        .from("calls")
        .delete()
        .eq("id", selectedCall.id);

      if (error) {
        console.error("Error deleting call:", error);
        throw new Error("Failed to delete call. Please try again.");
      }

      toast.success("Call deleted successfully!");
      setDetailOpen(false);
      fetchCalls();
    } catch (error: any) {
      toast.error(error.message || "Error deleting call");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calls & Meetings</h1>
          <p className="text-muted-foreground">Schedule and track your calls and meetings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Call/Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Call/Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Subject *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="call_type">Type</Label>
                <Select value={formData.call_type} onValueChange={(value) => setFormData({ ...formData, call_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="outbound">Outbound Call</SelectItem>
                    <SelectItem value="inbound">Inbound Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Scheduled Time</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Phone className="h-12 w-12 text-muted-foreground/50" />
                    <p>No calls logged yet</p>
                    <p className="text-sm">Start logging your calls to track communication</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.title}</TableCell>
                  <TableCell className="capitalize">{call.call_type}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={call.status}
                      onValueChange={(value) => handleStatusChange(call.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge className={getStatusColor(call.status)} variant="outline">
                            {call.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {call.scheduled_at
                      ? new Date(call.scheduled_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {call.duration ? `${call.duration} min` : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCall(call);
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

      {selectedCall && (
        <DetailViewDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Call Details"
          fields={[
            { label: "Subject", value: selectedCall.title, type: "text", fieldName: "title" },
            { 
              label: "Type", 
              value: selectedCall.call_type, 
              type: "select",
              fieldName: "call_type",
              selectOptions: [
                { value: "call", label: "Call" },
                { value: "meeting", label: "Meeting" },
                { value: "outbound", label: "Outbound Call" },
                { value: "inbound", label: "Inbound Call" },
              ]
            },
            { 
              label: "Status", 
              value: selectedCall.status, 
              type: "select",
              fieldName: "status",
              selectOptions: [
                { value: "scheduled", label: "Scheduled" },
                { value: "completed", label: "Completed" },
                { value: "missed", label: "Missed" },
                { value: "cancelled", label: "Cancelled" },
              ]
            },
            { label: "Scheduled", value: selectedCall.scheduled_at || "", type: "datetime", fieldName: "scheduled_at" },
            { label: "Duration (min)", value: selectedCall.duration, type: "number", fieldName: "duration" },
            { label: "Notes", value: selectedCall.notes, type: "textarea", fieldName: "notes" },
            { label: "Outcome", value: selectedCall.outcome, type: "textarea", fieldName: "outcome" },
          ]}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
        />
      )}
    </div>
  );
};

export default Calls;
