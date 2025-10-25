import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            onClick={action.onClick}
            className="w-full justify-start h-auto py-3"
          >
            <action.icon className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">{action.label}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
