import { Home, Users, Target, ListChecks, FileText, BarChart3, UserCircle, LogOut, Package, BookOpen, Phone, Settings, UserCog, Calendar, DollarSign, ClipboardList, TrendingUp, File } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const salesItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Leads", url: "/dashboard/leads", icon: Target },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Sales Pipeline", url: "/dashboard/pipeline", icon: BarChart3 },
  { title: "Tasks", url: "/dashboard/tasks", icon: ListChecks },
  { title: "Sales Orders", url: "/dashboard/sales-orders", icon: FileText },
];

const productsItems = [
  { title: "Products", url: "/dashboard/products", icon: Package },
  { title: "Price Books", url: "/dashboard/price-books", icon: BookOpen },
  { title: "Vendors", url: "/dashboard/vendors", icon: Users },
];

const hrItems = [
  { title: "Employees", url: "/dashboard/hr/employees", icon: UserCog },
  { title: "Departments", url: "/dashboard/hr/departments", icon: Users },
  { title: "Attendance", url: "/dashboard/hr/attendance", icon: Calendar },
  { title: "Leave", url: "/dashboard/hr/leave", icon: ClipboardList },
  { title: "Payroll", url: "/dashboard/hr/payroll", icon: DollarSign },
];

const documentsItems = [
  { title: "Quotations", url: "/dashboard/quotations", icon: FileText },
  { title: "Papers", url: "/dashboard/papers", icon: File },
];

const activityItems = [
  { title: "Calls & Meetings", url: "/dashboard/calls", icon: Phone },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
];

const dailyOpsItems = [
  { title: "Daily Logs", url: "/dashboard/daily-logs", icon: Calendar },
  { title: "Monthly Analytics", url: "/dashboard/monthly-analytics", icon: TrendingUp },
];

const settingsItems = [
  { title: "Company Settings", url: "/dashboard/company-settings", icon: Settings },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">SalesHub CRM</span>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Sales & CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Products & Vendors</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {productsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Activities & Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>HR Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hrItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Daily Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dailyOpsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => isActive ? "flex items-center gap-3 bg-sidebar-accent text-sidebar-accent-foreground" : "flex items-center gap-3"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/dashboard/profile" className="flex items-center gap-3">
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="flex items-center gap-3 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}