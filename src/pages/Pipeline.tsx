import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, IndianRupee, FileText } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DetailViewDialog, DetailField } from "@/components/DetailViewDialog";

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  notes: string | null;
  customer_id: string | null;
}

interface DraggableDealProps {
  deal: Deal;
  onClick: () => void;
}

const DraggableDeal = ({ deal, onClick }: DraggableDealProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = 
    deal.stage === "closed_won" ? "bg-green-100 border-green-300" : 
    deal.stage === "closed_lost" ? "bg-red-100 border-red-300" : 
    "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3 border rounded-lg hover:bg-accent cursor-move transition-colors ${bgColor}`}
    >
      <div className="font-medium text-sm">{deal.title}</div>
      {deal.value && (
        <div className="text-sm text-muted-foreground">
          ₹{Number(deal.value).toLocaleString()}
        </div>
      )}
      {deal.probability !== null && (
        <div className="text-xs text-muted-foreground">
          {deal.probability}% probability
        </div>
      )}
    </div>
  );
};

// Droppable column wrapper to allow dropping deals into any stage
const StageColumn = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id, data: { stageId: id } });
  return (
    <div data-stage-id={id} ref={setNodeRef} className={isOver ? "bg-accent/20 rounded-lg" : undefined}>
      {children}
    </div>
  );
};

const stages = [
  { value: "enquiry", label: "Enquiry", color: "bg-blue-100 text-blue-800" },
  { value: "proposal", label: "Proposal", color: "bg-yellow-100 text-yellow-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    stage: "enquiry",
    value: "",
    probability: "50",
    expected_close_date: "",
    expected_profit: "",
    notes: "",
    lead_id: "",
    customer_id: "",
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  useEffect(() => {
    fetchDeals();
    fetchLeadsAndCustomers();
  }, []);

  const fetchLeadsAndCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [leadsData, customersData] = await Promise.all([
        supabase.from("leads").select("id, name").eq("user_id", user.id),
        supabase.from("customers").select("id, name").eq("user_id", user.id)
      ]);

      setLeads(leadsData.data || []);
      setCustomers(customersData.data || []);
    } catch (error) {
      console.error("Error fetching leads/customers:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      toast.error("Error fetching deals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("deals").insert([{
        title: formData.title,
        stage: formData.stage,
        value: formData.value ? parseFloat(formData.value) : null,
        probability: parseInt(formData.probability),
        expected_close_date: formData.expected_close_date || null,
        expected_profit: formData.expected_profit ? parseFloat(formData.expected_profit) : null,
        notes: formData.notes,
        lead_id: formData.lead_id || null,
        customer_id: formData.customer_id || null,
        user_id: user.id,
      }] as any);

      if (error) throw error;

      toast.success("Deal created successfully!");
      setOpen(false);
      setFormData({
        title: "",
        stage: "enquiry",
        value: "",
        probability: "50",
        expected_close_date: "",
        expected_profit: "",
        notes: "",
        lead_id: "",
        customer_id: "",
      });
      fetchDeals();
    } catch (error: any) {
      toast.error("Error creating deal");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);

    if (!over) return;

    const dealId = active.id as string;
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    // Prefer container stage id from droppable data
    let newStage: string | null = (over.data?.current as any)?.stageId || null;
    if (!newStage) {
      const overId = over.id as string;
      if (stages.some((s) => s.value === overId)) {
        newStage = overId;
      } else {
        const overDeal = deals.find((d) => d.id === overId);
        if (overDeal) newStage = overDeal.stage;
      }
    }

    if (!newStage || deal.stage === newStage) return;

    const validStages = ["enquiry", "proposal", "negotiation", "closed_won", "closed_lost"];
    if (!validStages.includes(newStage)) return;

    try {
      const { error } = await supabase
        .from("deals")
        .update({ stage: newStage as any })
        .eq("id", dealId);

      if (error) throw error;

      setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, stage: newStage as string } : d));
      toast.success(`Deal moved to ${stages.find(s => s.value === newStage)?.label}!`);
    } catch (error: any) {
      toast.error("Error moving deal");
    }
  };

  const handleDealClick = (deal: Deal) => {
    // Always get the latest deal data from state
    const latestDeal = deals.find(d => d.id === deal.id) || deal;
    setSelectedDeal(latestDeal);
    setDetailOpen(true);
  };

  const handleCreateQuotation = async (dealId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deal = deals.find(d => d.id === dealId);
      if (!deal) return;

      const quotationNumber = `QUO-${Date.now()}`;
      
      const { error } = await supabase.from("quotations").insert({
        quotation_number: quotationNumber,
        deal_id: dealId,
        customer_id: deal.customer_id,
        status: "draft",
        total_amount: deal.value || 0,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Quotation created successfully!");
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error creating quotation");
    }
  };

  const handleDetailEdit = async (data: Record<string, any>) => {
    if (!selectedDeal) return;

    try {
      const { error } = await supabase
        .from("deals")
        .update({
          title: data.title,
          stage: data.stage,
          value: data.value ? parseFloat(data.value) : null,
          probability: data.probability ? parseInt(data.probability) : null,
          expected_close_date: data.expected_close_date || null,
          notes: data.notes,
        })
        .eq("id", selectedDeal.id);

      if (error) throw error;

      // Update local state immediately
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === selectedDeal.id 
          ? { ...d, ...data, value: data.value ? parseFloat(data.value) : null, probability: data.probability ? parseInt(data.probability) : null }
          : d
      ));
      setSelectedDeal({ ...selectedDeal, ...data, value: data.value ? parseFloat(data.value) : null, probability: data.probability ? parseInt(data.probability) : null });

      toast.success("Deal updated successfully!");
      setDetailOpen(false);
    } catch (error: any) {
      toast.error("Error updating deal");
    }
  };

  const dealsByStage = stages.map((stage) => ({
    ...stage,
    deals: deals.filter((deal) => deal.stage === stage.value),
    totalValue: deals
      .filter((deal) => deal.stage === stage.value)
      .reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
  }));

  const activeDeal = activeDealId ? deals.find(d => d.id === activeDealId) : null;

  const detailFields: DetailField[] = selectedDeal ? [
    { label: "Title", value: selectedDeal.title, type: "text", fieldName: "title" },
    { 
      label: "Stage", 
      value: selectedDeal.stage, 
      type: "select",
      fieldName: "stage",
      selectOptions: stages.map(s => ({ value: s.value, label: s.label }))
    },
    { label: "Value (₹)", value: selectedDeal.value?.toString() || "", type: "number", fieldName: "value" },
    { label: "Probability (%)", value: selectedDeal.probability?.toString() || "", type: "number", fieldName: "probability" },
    { label: "Expected Close Date", value: selectedDeal.expected_close_date || "", type: "date", fieldName: "expected_close_date" },
    { label: "Notes", value: selectedDeal.notes || "", type: "textarea", fieldName: "notes" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track your deals through each stage</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Deal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Related Lead (Optional)</Label>
                  <Select value={formData.lead_id || "none"} onValueChange={(value) => setFormData({ ...formData, lead_id: value === "none" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Related Customer (Optional)</Label>
                  <Select value={formData.customer_id || "none"} onValueChange={(value) => setFormData({ ...formData, customer_id: value === "none" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Deal Value (₹)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_close_date">Expected Close Date</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_profit">Expected Profit (₹)</Label>
                  <Input
                    id="expected_profit"
                    type="number"
                    step="0.01"
                    value={formData.expected_profit}
                    onChange={(e) => setFormData({ ...formData, expected_profit: e.target.value })}
                  />
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Deal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dealsByStage.map((stage) => (
            <SortableContext key={stage.value} items={stage.deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              <StageColumn id={stage.value}>
                <Card className="flex flex-col" id={stage.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <Badge className={stage.color} variant="outline">
                        {stage.label}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        {stage.deals.length}
                      </span>
                    </CardTitle>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {stage.totalValue.toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : stage.deals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No deals</p>
                    ) : (
                      stage.deals.map((deal) => (
                        <DraggableDeal
                          key={deal.id}
                          deal={deal}
                          onClick={() => handleDealClick(deal)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </StageColumn>
            </SortableContext>
          ))}
        </div>
        <DragOverlay>
          {activeDeal && (
            <div className="p-3 border rounded-lg bg-card shadow-lg">
              <div className="font-medium text-sm">{activeDeal.title}</div>
              {activeDeal.value && (
                <div className="text-sm text-muted-foreground">
                  ₹{Number(activeDeal.value).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <DetailViewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Deal Details"
        fields={detailFields}
        onEdit={handleDetailEdit}
        actions={
          selectedDeal && (
            <Button onClick={() => handleCreateQuotation(selectedDeal.id)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          )
        }
      />
    </div>
  );
};

export default Pipeline;