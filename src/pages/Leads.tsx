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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Phone, Mail, Building, UserPlus, Download, Calendar as CalendarIcon } from "lucide-react";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";
import { SearchFilter } from "@/components/SearchFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { exportToCSV } from "@/lib/csvExport";
import { formatLocalDate } from "@/lib/dateUtils";
import { format } from "date-fns";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesInterest = interestFilter === "all" || lead.interest_level?.toString() === interestFilter;
    const matchesDate = !dateFilter || new Date(lead.created_at).toDateString() === dateFilter.toDateString();
    
    return matchesSearch && matchesSource && matchesInterest && matchesDate;
  });

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

      const { error: customerError } = await supabase.from("customers").insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        user_id: user.id,
      });

      if (customerError) throw customerError;

      // Update lead status to qualified
      const { error: leadError } = await supabase
        .from("leads")
        .update({ status: "qualified" })
        .eq("id", leadId);

      if (leadError) throw leadError;

      toast.success("Lead converted to customer and marked as qualified!");
      setDetailOpen(false);
      fetchLeads();
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

  const handleDeleteClick = (leadId: string) => {
    setLeadToDelete(leadId);
    setDeleteDialogOpen(true);
  };

  const handleDetailDelete = async () => {
    if (!selectedLead) return;
    handleDeleteClick(selectedLead.id);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadToDelete);

      if (error) throw error;

      toast.success("Lead deleted successfully!");
      fetchLeads();
      setDetailOpen(false);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    } catch (error: any) {
      toast.error("Error deleting lead");
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredLeads.map(lead => ({
      Name: lead.name,
      Email: lead.email || "",
      Phone: lead.phone || "",
      Company: lead.company || "",
      Source: lead.source,
      Status: lead.status,
      Interest: lead.interest_level || "",
      Created: formatLocalDate(lead.created_at),
    }));

    exportToCSV(exportData, `leads-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Leads exported successfully!");
  };

  const leadsByDate = leads.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

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
    { label: "Created", value: formatLocalDate(selectedLead.created_at), type: "date" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
      </div>

      <SearchFilter value={searchTerm} onChange={setSearchTerm} placeholder="Search leads..." />

      <div className="flex gap-2 flex-wrap">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="walk_in">Walk-in</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="campaign">Campaign</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={interestFilter} onValueChange={setInterestFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by interest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Interest Levels</SelectItem>
            <SelectItem value="1">⭐ (1)</SelectItem>
            <SelectItem value="2">⭐⭐ (2)</SelectItem>
            <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                setDateFilter(date);
                setShowCalendar(false);
              }}
              modifiers={{
                hasLeads: (date) => {
                  const dateStr = date.toDateString();
                  return !!leadsByDate[dateStr];
                }
              }}
              modifiersStyles={{
                hasLeads: {
                  fontWeight: 'bold',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                }
              }}
            />
            {dateFilter && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateFilter(undefined);
                    setShowCalendar(false);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="border rounded-lg overflow-x-auto">
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
              filteredLeads.map((lead) => (
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
        onDelete={handleDetailDelete}
        actions={
          selectedLead && (
            <Button onClick={() => handleConvertToCustomer(selectedLead.id)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Customer
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
      />
    </div>
  );
};

export default Leads;
