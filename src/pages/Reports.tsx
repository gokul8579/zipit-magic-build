import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, Users, Target, DollarSign, Calendar, Phone, Package } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const [leads, customers, deals, salesOrders, dailyLogs, calls, products] = await Promise.all([
        supabase.from("leads").select("*").eq("user_id", user.id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
        supabase.from("customers").select("*").eq("user_id", user.id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
        supabase.from("deals").select("*").eq("user_id", user.id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
        supabase.from("sales_orders").select("*").eq("user_id", user.id).gte("order_date", startDate).lte("order_date", endDate),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", startDate).lte("log_date", endDate),
        supabase.from("calls").select("*").eq("user_id", user.id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
        supabase.from("products").select("*").eq("user_id", user.id),
      ]);

      const wonDeals = deals.data?.filter(d => d.stage === "closed_won") || [];
      const lostDeals = deals.data?.filter(d => d.stage === "closed_lost") || [];
      const activeDeals = deals.data?.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost") || [];
      const convertedLeads = leads.data?.filter(l => l.status === "qualified") || [];

      const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const totalProfit = wonDeals.reduce((sum, d) => sum + (Number(d.expected_profit) || 0), 0);
      const completedOrders = salesOrders.data?.filter(o => o.status === "delivered") || [];
      const pendingOrders = salesOrders.data?.filter(o => o.status !== "delivered" && o.status !== "cancelled") || [];
      const completedCalls = calls.data?.filter(c => c.status === "completed") || [];
      
      const conversionRate = leads.data && leads.data.length > 0
        ? Math.min((convertedLeads.length / leads.data.length) * 100, 100)
        : 0;

      const leadSourceCounts: Record<string, number> = {};
      leads.data?.forEach(lead => {
        leadSourceCounts[lead.source] = (leadSourceCounts[lead.source] || 0) + 1;
      });

      const dealStageCounts: Record<string, number> = {};
      deals.data?.forEach(deal => {
        dealStageCounts[deal.stage] = (dealStageCounts[deal.stage] || 0) + 1;
      });

      const totalExpenses = dailyLogs.data?.reduce((sum, log) => sum + Number(log.expense_amount || 0), 0) || 0;
      const totalIncome = dailyLogs.data?.reduce((sum, log) => sum + Number(log.income_amount || 0), 0) || 0;
      const totalSales = dailyLogs.data?.reduce((sum, log) => sum + Number(log.sales_amount || 0), 0) || 0;

      setReportData({
        summary: {
          totalLeads: leads.data?.length || 0,
          convertedLeads: convertedLeads.length,
          totalCustomers: customers.data?.length || 0,
          totalDeals: deals.data?.length || 0,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          activeDeals: activeDeals.length,
          totalRevenue,
          totalProfit,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          conversionRate,
          totalExpenses,
          totalIncome,
          totalSales,
          totalCalls: calls.data?.length || 0,
          completedCalls: completedCalls.length,
          totalProducts: products.data?.length || 0,
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

  const downloadReportAsImage = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `crm-report-${startDate}-to-${endDate}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("Report downloaded as image!");
    } catch (error) {
      toast.error("Error downloading report");
    }
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
        <div className="flex gap-2 items-center">
          <Label>From:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Label>To:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={downloadReportAsImage} disabled={!reportData}>
            <Download className="h-4 w-4 mr-2" />
            Download as Image
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="bg-background p-6 space-y-6">
        {reportData && (
          <>
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
                  <p className="text-xs text-muted-foreground">Win rate: {winRate}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{reportData.summary.totalProfit.toLocaleString('en-IN')}</div>
                  <p className="text-xs text-muted-foreground">Expected from won deals</p>
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
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(reportData.summary.totalIncome - reportData.summary.totalExpenses).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From daily logs
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
    </div>
  );
};

export default Reports;