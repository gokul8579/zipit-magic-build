import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import Pipeline from "./pages/Pipeline";
import Tasks from "./pages/Tasks";
import Quotations from "./pages/Quotations";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import Vendors from "./pages/Vendors";
import PriceBooks from "./pages/PriceBooks";
import SalesOrders from "./pages/SalesOrders";
import PurchaseOrders from "./pages/PurchaseOrders";
import Calls from "./pages/Calls";
import Reports from "./pages/Reports";
import CompanySettings from "./pages/CompanySettings";
import Employees from "./pages/hr/Employees";
import Departments from "./pages/hr/Departments";
import Attendance from "./pages/hr/Attendance";
import Leave from "./pages/hr/Leave";
import Payroll from "./pages/hr/Payroll";
import DailyLogs from "./pages/DailyLogs";
import Analytics from "./pages/Analytics";
import Papers from "./pages/Papers";
import NotFound from "./pages/NotFound";
import { InventoryStockApproval } from "./components/InventoryStockApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory-approval" element={<div className="p-6"><InventoryStockApproval /></div>} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="products" element={<Products />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="price-books" element={<PriceBooks />} />
            <Route path="sales-orders" element={<SalesOrders />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="calls" element={<Calls />} />
            <Route path="reports" element={<Reports />} />
            <Route path="hr/employees" element={<Employees />} />
            <Route path="hr/departments" element={<Departments />} />
            <Route path="hr/attendance" element={<Attendance />} />
            <Route path="hr/leave" element={<Leave />} />
            <Route path="hr/payroll" element={<Payroll />} />
            <Route path="daily-logs" element={<DailyLogs />} />
            <Route path="monthly-analytics" element={<Analytics />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="papers" element={<Papers />} />
            <Route path="company-settings" element={<CompanySettings />} />
            <Route path="settings" element={<CompanySettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
