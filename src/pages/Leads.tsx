import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Phone, Mail, Building, UserPlus } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  interest_level: number | null;
  notes: string | null;
  created_at: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "other",
    status: "new",
    interest_level: 3,
    notes: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Error fetching leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("leads").insert([{
        ...formData,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Lead created successfully!");
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "other",
        status: "new",
        interest_level: 3,
        notes: "",
      });
      fetchLeads();
    } catch (error: any) {
      toast.error("Error creating lead");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      converted: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      website: "bg-blue-100 text-blue-800",
      referral: "bg-green-100 text-green-800",
      social: "bg-purple-100 text-purple-800",
      email: "bg-yellow-100 text-yellow-800",
      phone: "bg-orange-100 text-orange-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleConvertToCustomer = async (leadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const { error } = await supabase.from("customers").insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Lead converted to customer!");
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error converting lead");
    }
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          source: data.source,
          status: data.status,
          interest_level: data.interest_level ? parseInt(data.interest_level) : null,
          notes: data.notes,
        })
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast.success("Lead updated successfully!");
      fetchLeads();
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating lead");
    }
  };

  const detailFields: DetailField[] = selectedLead ? [
    { label: "Name", value: selectedLead.name, type: "text", fieldName: "name" },
    { label: "Email", value: selectedLead.email, type: "text", fieldName: "email" },
    { label: "Phone", value: selectedLead.phone, type: "text", fieldName: "phone" },
    { label: "Company", value: selectedLead.company, type: "text", fieldName: "company" },
    { 
      label: "Source", 
      value: selectedLead.source, 
      type: "select", 
      fieldName: "source",
      selectOptions: [
        { value: "call", label: "Call" },
        { value: "walk_in", label: "Walk-in" },
        { value: "website", label: "Website" },
        { value: "referral", label: "Referral" },
        { value: "campaign", label: "Campaign" },
        { value: "other", label: "Other" },
      ]
    },
    { 
      label: "Status", 
      value: selectedLead.status, 
      type: "select", 
      fieldName: "status",
      selectOptions: [
        { value: "new", label: "New" },
        { value: "contacted", label: "Contacted" },
        { value: "qualified", label: "Qualified" },
        { value: "lost", label: "Lost" },
        { value: "converted", label: "Converted" },
      ]
    },
    { label: "Interest Level (1-5)", value: selectedLead.interest_level, type: "number", fieldName: "interest_level" },
    { label: "Notes", value: selectedLead.notes, type: "textarea", fieldName: "notes" },
    { label: "Created", value: selectedLead.created_at, type: "date" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interest Level (1-5)</Label>
                <Input
                  id="interest"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.interest_level}
                  onChange={(e) => setFormData({ ...formData, interest_level: parseInt(e.target.value) })}
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
                <Button type="submit">Create Lead</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No leads yet. Click "Add Lead" to create your first lead.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow 
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleLeadClick(lead)}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.company && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {lead.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{lead.source.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)} variant="outline">
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {"⭐".repeat(lead.interest_level || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <DetailViewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Lead Details"
        fields={detailFields}
        onEdit={handleDetailEdit}
        actions={
          selectedLead && (
            <Button onClick={() => handleConvertToCustomer(selectedLead.id)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Customer
            </Button>
          )
        }
      />
    </div>
  );
};

export default Leads;