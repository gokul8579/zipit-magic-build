import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Edit2, X } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatUtils";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
}

interface InvoiceData {
  invoice_number: string;
  date: string;
  due_date?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_postal_code?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  cgst_percent?: number;
  sgst_percent?: number;
}

interface CompanySettings {
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  logo_url?: string;
  tax_id?: string;
  gst_number?: string;
  brand_color?: string;
}

interface InvoiceTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  type?: "invoice" | "quotation";
}

export const InvoiceTemplate = ({ open, onOpenChange, invoiceData, type = "invoice" }: InvoiceTemplateProps) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<InvoiceData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchCompanySettings();
      setEditData(invoiceData);
    }
  }, [open, invoiceData]);

  const fetchCompanySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCompanySettings(data);
    } catch (error: any) {
      console.error("Error fetching company settings:", error);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${type === "invoice" ? "Invoice" : "Quotation"}_${editData?.invoice_number || ""}`,
  });

  const updateItemField = (index: number, field: keyof InvoiceItem, value: string | number) => {
    if (!editData) return;
    const newItems = [...editData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "quantity" || field === "unit_price") {
      const itemSubtotal = newItems[index].quantity * newItems[index].unit_price;
      const cgstPercent = editData.cgst_percent || 9;
      const sgstPercent = editData.sgst_percent || 9;
      
      newItems[index].cgst_amount = (itemSubtotal * cgstPercent) / 100;
      newItems[index].sgst_amount = (itemSubtotal * sgstPercent) / 100;
      newItems[index].amount = itemSubtotal + newItems[index].cgst_amount! + newItems[index].sgst_amount!;
    }

    const subtotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalCgst = newItems.reduce((sum, item) => sum + (item.cgst_amount || 0), 0);
    const totalSgst = newItems.reduce((sum, item) => sum + (item.sgst_amount || 0), 0);
    const taxAmount = totalCgst + totalSgst;
    const total = subtotal + taxAmount - editData.discount_amount;

    setEditData({
      ...editData,
      items: newItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    });
  };

  const addItem = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      items: [...editData.items, { description: "", quantity: 1, unit_price: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (!editData) return;
    const newItems = editData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + editData.tax_amount - editData.discount_amount;
    
    setEditData({
      ...editData,
      items: newItems,
      subtotal,
      total_amount: total,
    });
  };

  if (!editData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{type === "invoice" ? "Invoice" : "Quotation"} Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {type === "quotation" && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-muted-foreground">Template</span>
                <select
                  className="border rounded px-2 py-1 bg-background text-foreground"
                  onChange={(e) => (document.body.dataset.invoiceTemplate = e.target.value)}
                  defaultValue={document.body.dataset.invoiceTemplate || "t1"}
                >
                  <option value="t1">Classic</option>
                  <option value="t2">Minimal</option>
                  <option value="t3">Modern</option>
                  <option value="t4">Compact</option>
                  <option value="t5">Elegant</option>
                </select>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className={`bg-background p-8 space-y-6 text-foreground ${
          (document.body.dataset.invoiceTemplate || "t1") === "t2" ? "" : ""
        }`}>
          {/* Header */}
          <div className={`flex justify-between items-start border-b pb-6 ${
            (document.body.dataset.invoiceTemplate || "t1") === "t3" ? "border-primary" : ""
          }`}>
            <div>
              {companySettings?.logo_url && (
                <img src={companySettings.logo_url} alt="Company Logo" className="h-16 mb-2" />
              )}
              <h2 
                className="text-2xl font-bold" 
                style={{ color: companySettings?.brand_color || '#F9423A' }}
              >
                {companySettings?.company_name || "Your Company Name"}
              </h2>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                {companySettings?.address && <p>{companySettings.address}</p>}
                {(companySettings?.city || companySettings?.state || companySettings?.postal_code) && (
                  <p>
                    {[companySettings?.city, companySettings?.state, companySettings?.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {companySettings?.email && <p><span className="font-bold">Email:</span> {companySettings.email}</p>}
                {(companySettings as any)?.show_gst_number && companySettings?.gst_number && <p><span className="font-bold">GST No:</span> {companySettings.gst_number}</p>}
                {companySettings?.phone && <p><span className="font-bold">Phone:</span> {companySettings.phone}</p>}
                {(companySettings as any)?.show_tax_id && companySettings?.tax_id && <p>Tax ID: {companySettings.tax_id}</p>}
                {(companySettings as any)?.show_cin_number && (companySettings as any)?.cin_number && <p>CIN: {(companySettings as any).cin_number}</p>}
              </div>
            </div>
            <div className="text-right">
              <h1 
                className="text-3xl font-bold uppercase" 
                style={{ color: companySettings?.brand_color || '#F9423A' }}
              >
                {type === "invoice" ? "INVOICE" : "QUOTATION"}
              </h1>
              <div className="mt-4 space-y-1 text-sm">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editData.invoice_number}
                      onChange={(e) => setEditData({ ...editData, invoice_number: e.target.value })}
                      placeholder="Number"
                      className="text-right"
                    />
                    <Input
                      type="date"
                      value={editData.date}
                      onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                      className="text-right"
                    />
                    {editData.due_date && (
                      <Input
                        type="date"
                        value={editData.due_date}
                        onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                        className="text-right"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <p><span className="font-semibold">Number:</span> {editData.invoice_number}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(editData.date).toLocaleDateString()}</p>
                    {editData.due_date && (
                      <p><span className="font-semibold">Due Date:</span> {new Date(editData.due_date).toLocaleDateString()}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
            {isEditing ? (
              <div className="space-y-2 max-w-md">
                <Input
                  value={editData.customer_name}
                  onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                  placeholder="Customer Name"
                />
                <Input
                  value={editData.customer_email || ""}
                  onChange={(e) => setEditData({ ...editData, customer_email: e.target.value })}
                  placeholder="Email"
                />
                <Input
                  value={editData.customer_phone || ""}
                  onChange={(e) => setEditData({ ...editData, customer_phone: e.target.value })}
                  placeholder="Phone"
                />
                <Textarea
                  value={editData.customer_address || ""}
                  onChange={(e) => setEditData({ ...editData, customer_address: e.target.value })}
                  placeholder="Address"
                  rows={2}
                />
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <p className="font-medium">{editData.customer_name}</p>
                {editData.customer_email && <p>{editData.customer_email}</p>}
                {editData.customer_phone && <p>{editData.customer_phone}</p>}
                {editData.customer_address && <p>{editData.customer_address}</p>}
                {(editData.customer_city || editData.customer_state || editData.customer_postal_code) && (
                  <p>
                    {[editData.customer_city, editData.customer_state, editData.customer_postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-center w-20">Qty</th>
                  <th className="border p-2 text-right w-28">Unit Price</th>
                  <th className="border p-2 text-right w-24">Subtotal</th>
                  <th className="border p-2 text-right w-24">CGST</th>
                  <th className="border p-2 text-right w-24">SGST</th>
                  <th className="border p-2 text-right w-28">Total</th>
                  {isEditing && <th className="border p-2 w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {editData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      {isEditing ? (
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItemField(index, "description", e.target.value)}
                          rows={1}
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemField(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="text-center"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="border p-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItemField(index, "unit_price", parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      ) : (
                        formatIndianCurrency(item.unit_price)
                      )}
                    </td>
                    <td className="border p-2 text-right">
                      {formatIndianCurrency(item.quantity * item.unit_price)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatIndianCurrency(item.cgst_amount || 0)}
                      {editData.cgst_percent && <span className="text-xs text-muted-foreground"> ({editData.cgst_percent.toFixed(2)}%)</span>}
                    </td>
                    <td className="border p-2 text-right">
                      {formatIndianCurrency(item.sgst_amount || 0)}
                      {editData.sgst_percent && <span className="text-xs text-muted-foreground"> ({editData.sgst_percent.toFixed(2)}%)</span>}
                    </td>
                    <td 
                      className="border p-2 text-right font-bold" 
                      style={{ color: companySettings?.brand_color || '#F9423A' }}
                    >
                      {formatIndianCurrency(item.amount)}
                    </td>
                    {isEditing && (
                      <td className="border p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditing && (
              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                Add Item
              </Button>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span className="font-medium">{formatIndianCurrency(editData.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax:</span>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.tax_amount}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0;
                      setEditData({
                        ...editData,
                        tax_amount: tax,
                        total_amount: editData.subtotal + tax - editData.discount_amount,
                      });
                    }}
                    className="w-32 text-right"
                  />
                ) : (
                  <span className="font-medium">{formatIndianCurrency(editData.tax_amount)}</span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Discount:</span>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.discount_amount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setEditData({
                        ...editData,
                        discount_amount: discount,
                        total_amount: editData.subtotal + editData.tax_amount - discount,
                      });
                    }}
                    className="w-32 text-right"
                  />
                ) : (
                  <span className="font-medium">{formatIndianCurrency(editData.discount_amount)}</span>
                )}
              </div>
              <div 
                className="flex justify-between py-3 border-t-2" 
                style={{ borderColor: companySettings?.brand_color || '#F9423A' }}
              >
                <span className="text-lg font-bold">Total:</span>
                <span 
                  className="text-lg font-bold" 
                  style={{ color: companySettings?.brand_color || '#F9423A' }}
                >
                  {formatIndianCurrency(editData.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(editData.notes || isEditing) && (
            <div>
              <h3 className="font-semibold mb-2">Notes:</h3>
              {isEditing ? (
                <Textarea
                  value={editData.notes || ""}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any notes here..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editData.notes}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-8">
            <p>Thank you for your business!</p>
            {companySettings?.email && <p>For inquiries, contact us at {companySettings.email}</p>}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (type === "quotation" && (editData as any).quotation_id) {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;

                  // Delete existing items
                  await supabase
                    .from("quotation_items")
                    .delete()
                    .eq("quotation_id", (editData as any).quotation_id);

                  // Insert updated items
                  const itemsToInsert = editData.items.map((item) => ({
                    quotation_id: (editData as any).quotation_id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: item.amount,
                    cgst_amount: item.cgst_amount || 0,
                    sgst_amount: item.sgst_amount || 0,
                  }));

                  const { error: itemsError } = await supabase
                    .from("quotation_items")
                    .insert(itemsToInsert);

                  if (itemsError) throw itemsError;

                  // Update quotation totals
                  const { error } = await supabase
                    .from("quotations")
                    .update({
                      total_amount: editData.total_amount,
                      tax_amount: editData.tax_amount,
                      discount_amount: editData.discount_amount,
                      notes: editData.notes,
                    })
                    .eq("id", (editData as any).quotation_id);

                  if (error) throw error;
                  
                  setIsEditing(false);
                  toast.success("Quotation updated successfully");
                  
                  // Callback to refresh quotations list
                  if ((window as any).__onQuotationUpdate) {
                    (window as any).__onQuotationUpdate();
                  }
                } catch (error) {
                  toast.error("Error updating quotation");
                  console.error(error);
                }
              } else {
                setIsEditing(false);
                toast.success("Changes saved to preview");
              }
            }}>
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
