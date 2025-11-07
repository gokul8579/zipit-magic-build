import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export interface DetailField {
  label: string;
  value: string | number | null | undefined;
  type?: "text" | "badge" | "date" | "datetime" | "currency" | "number" | "textarea" | "select";
  badgeColor?: string;
  fieldName?: string;
  selectOptions?: { value: string; label: string }[];
}

interface DetailViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: DetailField[];
  onEdit?: (updatedData: Record<string, any>) => Promise<void>;
  onDelete?: () => Promise<void>;
  actions?: React.ReactNode;
}

export const DetailViewDialog = ({ open, onOpenChange, title, fields, onEdit, onDelete, actions }: DetailViewDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  
  const handleEditToggle = () => {
    if (!isEditing) {
      // Initialize edit data with current values
      const data: Record<string, any> = {};
      fields.forEach(field => {
        if (field.fieldName) {
          data[field.fieldName] = field.value || "";
        }
      });
      setEditData(data);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (onEdit) {
      await onEdit(editData);
      setIsEditing(false);
      onOpenChange(false);
    }
  };

  const renderValue = (field: DetailField) => {
    if (!field.value && field.value !== 0) return "-";
    
    switch (field.type) {
      case "badge":
        return (
          <Badge variant="outline" className={field.badgeColor}>
            {field.value}
          </Badge>
        );
      case "date":
        return new Date(field.value as string).toLocaleDateString();
      case "datetime":
        return new Date(field.value as string).toLocaleString();
      case "currency":
        return `₹${Number(field.value).toLocaleString()}`;
      case "select":
        // For select fields, find the label for the value
        const option = field.selectOptions?.find(opt => opt.value === field.value);
        return option?.label || field.value;
      default:
        return field.value;
    }
  };

  const renderEditField = (field: DetailField) => {
    if (!field.fieldName) return null;

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={editData[field.fieldName] || ""}
            onChange={(e) => setEditData({ ...editData, [field.fieldName!]: e.target.value })}
            rows={3}
          />
        );
      case "select":
        return (
          <Select
            value={editData[field.fieldName] || ""}
            onValueChange={(value) => setEditData({ ...editData, [field.fieldName!]: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.selectOptions?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            value={editData[field.fieldName] || ""}
            onChange={(e) => setEditData({ ...editData, [field.fieldName!]: e.target.value })}
          />
        );
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={editData[field.fieldName] || ""}
            onChange={(e) => setEditData({ ...editData, [field.fieldName!]: e.target.value })}
          />
        );
      case "currency":
      case "number":
        return (
          <Input
            type="number"
            step="0.01"
            value={editData[field.fieldName] || ""}
            onChange={(e) => setEditData({ ...editData, [field.fieldName!]: e.target.value })}
          />
        );
      default:
        return (
          <Input
            value={editData[field.fieldName] || ""}
            onChange={(e) => setEditData({ ...editData, [field.fieldName!]: e.target.value })}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          )}
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <div key={index} className="space-y-1">
              <Label className="text-muted-foreground text-sm">{field.label}</Label>
              {isEditing ? (
                renderEditField(field)
              ) : (
                <div className="font-medium">{renderValue(field)}</div>
              )}
            </div>
          ))}
        </div>
        {isEditing && onEdit && (
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div>
              {onDelete && (
                <Button variant="destructive" onClick={async () => {
                  if (confirm("Are you sure you want to delete this item?")) {
                    await onDelete();
                    onOpenChange(false);
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEditToggle}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {!isEditing && actions && (
          <div className="flex justify-start gap-2 pt-4 border-t">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
