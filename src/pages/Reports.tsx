import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, Target, DollarSign, Calendar, UserPlus, Package, Phone } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Reports = () => {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case "day":
          startDate.setDate(now.getDate() - 1);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch all data in parallel
      const [leads, customers, deals, salesOrders, dailyLogs, calls, products] = await Promise.all([
        supabase.from("leads").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("customers").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("deals").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("sales_orders").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", startDate.toISOString().split('T')[0]),
        supabase.from("calls").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
        supabase.from("products").select("*").eq("user_id", user.id),
      ]);

      const wonDeals = deals.data?.filter(d => d.stage === "closed_won") || [];
      const lostDeals = deals.data?.filter(d => d.stage === "closed_lost") || [];
      const activeDeals = deals.data?.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost") || [];
      const convertedLeads = leads.data?.filter(l => l.status === "converted") || [];

      const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const completedOrders = salesOrders.data?.filter(o => o.status === "delivered") || [];
      const pendingOrders = salesOrders.data?.filter(o => o.status !== "delivered" && o.status !== "cancelled") || [];
      const completedCalls = calls.data?.filter(c => c.status === "completed") || [];
      
      const conversionRate = leads.count && customers.count 
        ? Math.min((customers.count / leads.count) * 100, 100)
        : 0;

      // Lead sources
      const leadSourceCounts: Record<string, number> = {};
      leads.data?.forEach(lead => {
        leadSourceCounts[lead.source] = (leadSourceCounts[lead.source] || 0) + 1;
      });

      // Deal stages
      const dealStageCounts: Record<string, number> = {};
      deals.data?.forEach(deal => {
        dealStageCounts[deal.stage] = (dealStageCounts[deal.stage] || 0) + 1;
      });

      // Daily logs aggregation
      const totalExpenses = dailyLogs.data?.reduce((sum, log) => sum + Number(log.expense_amount || 0), 0) || 0;
      const totalIncome = dailyLogs.data?.reduce((sum, log) => sum + Number(log.income_amount || 0), 0) || 0;
      const totalSales = dailyLogs.data?.reduce((sum, log) => sum + Number(log.sales_amount || 0), 0) || 0;

      setReportData({
        summary: {
          totalLeads: leads.count || 0,
          convertedLeads: convertedLeads.length,
          totalCustomers: customers.count || 0,
          totalDeals: deals.count || 0,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          activeDeals: activeDeals.length,
          totalRevenue,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          conversionRate,
          totalExpenses,
          totalIncome,
          totalSales,
          totalCalls: calls.count || 0,
          completedCalls: completedCalls.length,
          totalProducts: products.count || 0,
        },
        leadsBySource: Object.entries(leadSourceCounts).map(([name, value]) => ({ 
          name: name.replace('_', ' ').toUpperCase(), 
          value 
        })),
        dealsByStage: Object.entries(dealStageCounts).map(([name, value]) => ({ 
          name: name.replace('_', ' ').toUpperCase(), 
          value 
        })),
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Error loading report data");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const reportContent = `
CRM ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Period: ${period.toUpperCase()}
${'='.repeat(80)}

SUMMARY STATISTICS
${'='.repeat(80)}
Total Leads: ${reportData.summary.totalLeads}
Converted Leads: ${reportData.summary.convertedLeads}
Total Customers: ${reportData.summary.totalCustomers}
Conversion Rate: ${reportData.summary.conversionRate.toFixed(2)}%

Total Deals: ${reportData.summary.totalDeals}
Won Deals: ${reportData.summary.wonDeals}
Lost Deals: ${reportData.summary.lostDeals}
Active Deals: ${reportData.summary.activeDeals}

Total Revenue: ₹${reportData.summary.totalRevenue.toLocaleString('en-IN')}
Average Deal Value: ₹${reportData.summary.wonDeals > 0 ? (reportData.summary.totalRevenue / reportData.summary.wonDeals).toLocaleString('en-IN') : 0}

Sales Orders:
Completed Orders: ${reportData.summary.completedOrders}
Pending Orders: ${reportData.summary.pendingOrders}

Calls & Meetings:
Total Calls: ${reportData.summary.totalCalls}
Completed Calls: ${reportData.summary.completedCalls}
Completion Rate: ${reportData.summary.totalCalls > 0 ? ((reportData.summary.completedCalls / reportData.summary.totalCalls) * 100).toFixed(2) : 0}%

Products:
Total Products: ${reportData.summary.totalProducts}

Financial Summary (from Daily Logs):
Total Sales: ₹${reportData.summary.totalSales.toLocaleString('en-IN')}
Total Income: ₹${reportData.summary.totalIncome.toLocaleString('en-IN')}
Total Expenses: ₹${reportData.summary.totalExpenses.toLocaleString('en-IN')}
Net Profit: ₹${(reportData.summary.totalIncome - reportData.summary.totalExpenses).toLocaleString('en-IN')}

${'='.repeat(80)}
LEADS BY SOURCE
${'='.repeat(80)}
${reportData.leadsBySource.length > 0 ? reportData.leadsBySource.map((s: any) => `${s.name}: ${s.value}`).join('\n') : 'No data available'}

${'='.repeat(80)}
DEALS BY STAGE
${'='.repeat(80)}
${reportData.dealsByStage.length > 0 ? reportData.dealsByStage.map((s: any) => `${s.name}: ${s.value}`).join('\n') : 'No data available'}

${'='.repeat(80)}
End of Report
${'='.repeat(80)}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-report-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const COLORS = ['#F9423A', '#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const conversionRate = reportData?.summary.totalLeads > 0 
    ? ((reportData.summary.convertedLeads / reportData.summary.totalLeads) * 100).toFixed(1) 
    : "0.0";

  const winRate = reportData?.summary.totalDeals > 0 
    ? ((reportData.summary.wonDeals / reportData.summary.totalDeals) * 100).toFixed(1) 
    : "0.0";

  const callCompletionRate = reportData?.summary.totalCalls > 0 
    ? ((reportData.summary.completedCalls / reportData.summary.totalCalls) * 100).toFixed(1) 
    : "0.0";

  if (loading) {
    return <div className="text-center py-12">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and data visualization</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadReport} disabled={!reportData}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.convertedLeads} converted ({conversionRate}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deals Overview</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.wonDeals}</div>
                <p className="text-xs text-muted-foreground">
                  Won / {reportData.summary.activeDeals} Active / {reportData.summary.lostDeals} Lost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">From won deals ({winRate}% win rate)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Orders</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.completedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{reportData.summary.totalSales.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">From daily logs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(reportData.summary.totalIncome - reportData.summary.totalExpenses).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Income - Expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalCalls}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.completedCalls} completed ({callCompletionRate}%)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {reportData.leadsBySource.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.leadsBySource}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {reportData.leadsBySource.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {reportData.dealsByStage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deals by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.dealsByStage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#F9423A" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance Summary */}
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
                  ₹{reportData.summary.wonDeals > 0 ? (reportData.summary.totalRevenue / reportData.summary.wonDeals).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;