import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Package, DollarSign, Phone } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    totalCustomers: 0,
    totalDeals: 0,
    dealsWon: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCalls: 0,
    completedCalls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all stats in parallel
      const [
        { data: leads },
        { data: customers },
        { data: deals },
        { data: products },
        { data: calls },
      ] = await Promise.all([
        supabase.from("leads").select("status").eq("user_id", user.id),
        supabase.from("customers").select("id").eq("user_id", user.id),
        supabase.from("deals").select("stage, value").eq("user_id", user.id),
        supabase.from("products").select("id").eq("user_id", user.id),
        supabase.from("calls").select("status").eq("user_id", user.id),
      ]);

      const convertedLeads = leads?.filter((l) => l.status === "converted").length || 0;
      const wonDeals = deals?.filter((d) => d.stage === "closed_won") || [];
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const completedCalls = calls?.filter((c) => c.status === "completed").length || 0;

      setStats({
        totalLeads: leads?.length || 0,
        convertedLeads,
        totalCustomers: customers?.length || 0,
        totalDeals: deals?.length || 0,
        dealsWon: wonDeals.length,
        totalRevenue,
        totalProducts: products?.length || 0,
        totalCalls: calls?.length || 0,
        completedCalls,
      });
    } catch (error: any) {
      toast.error("Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = stats.totalLeads > 0 
    ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) 
    : "0.0";

  const winRate = stats.totalDeals > 0 
    ? ((stats.dealsWon / stats.totalDeals) * 100).toFixed(1) 
    : "0.0";

  const callCompletionRate = stats.totalCalls > 0 
    ? ((stats.completedCalls / stats.totalCalls) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Track your business performance</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.convertedLeads} converted ({conversionRate}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDeals}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.dealsWon} won ({winRate}% win rate)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From won deals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">In catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedCalls} completed ({callCompletionRate}%)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lead Conversion Rate</span>
                <span className="text-2xl font-bold text-primary">{conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deal Win Rate</span>
                <span className="text-2xl font-bold text-primary">{winRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Call Completion Rate</span>
                <span className="text-2xl font-bold text-primary">{callCompletionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Deal Value</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{stats.dealsWon > 0 ? (stats.totalRevenue / stats.dealsWon).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// UserPlus icon import for the component
import { UserPlus } from "lucide-react";

export default Reports;
