import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Wallet, Building2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Stats {
  totalSales: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  avgDailySales: number;
  totalTransactions: number;
  avgClosingStock: number;
  avgCashInHand: number;
  avgBankBalance: number;
  dailyData: any[];
}

const Analytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedDate, viewMode]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: string;
      let endDateStr: string;

      if (viewMode === "daily") {
        startDate = selectedDate;
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        endDateStr = endDate.toISOString().split('T')[0];
      } else {
        startDate = `${selectedMonth}-01`;
        const endDate = new Date(selectedMonth + "-01");
        endDate.setMonth(endDate.getMonth() + 1);
        endDateStr = endDate.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", startDate)
        .lt("log_date", endDateStr)
        .order("log_date", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const totalSales = data.reduce((sum, log) => sum + Number(log.sales_amount), 0);
        const totalExpenses = data.reduce((sum, log) => sum + Number(log.expense_amount), 0);
        const totalIncome = data.reduce((sum, log) => sum + Number(log.income_amount), 0);
        const totalTransactions = data.reduce((sum, log) => sum + log.number_of_sales, 0);
        const avgClosingStock = data.reduce((sum, log) => sum + Number(log.closing_stock), 0) / data.length;
        const avgCashInHand = data.reduce((sum, log) => sum + Number(log.cash_in_hand), 0) / data.length;
        const avgBankBalance = data.reduce((sum, log) => sum + Number(log.bank_balance), 0) / data.length;

        const dailyData = viewMode === "daily" 
          ? data.map((log, index) => ({
              date: `Day ${index + 1}`,
              sales: Number(log.sales_amount),
              expenses: Number(log.expense_amount),
              income: Number(log.income_amount),
              profit: Number(log.income_amount) - Number(log.expense_amount),
            }))
          : data.map(log => ({
              date: new Date(log.log_date).getDate(),
              sales: Number(log.sales_amount),
              expenses: Number(log.expense_amount),
              income: Number(log.income_amount),
              profit: Number(log.income_amount) - Number(log.expense_amount),
            }));

        setStats({
          totalSales,
          totalExpenses,
          totalIncome,
          netProfit: totalIncome - totalExpenses,
          avgDailySales: totalSales / data.length,
          totalTransactions,
          avgClosingStock,
          avgCashInHand,
          avgBankBalance,
          dailyData,
        });
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      title: "Total Sales",
      value: `₹${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Expenses",
      value: `₹${stats.totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Income",
      value: `₹${stats.totalIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Net Profit",
      value: `₹${stats.netProfit.toLocaleString()}`,
      icon: Wallet,
      color: stats.netProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: stats.netProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Avg Daily Sales",
      value: `₹${stats.avgDailySales.toLocaleString()}`,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Avg Closing Stock",
      value: `₹${stats.avgClosingStock.toLocaleString()}`,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Avg Cash in Hand",
      value: `₹${stats.avgCashInHand.toLocaleString()}`,
      icon: Wallet,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Avg Bank Balance",
      value: `₹${stats.avgBankBalance.toLocaleString()}`,
      icon: Building2,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-muted-foreground">View detailed business insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: "monthly" | "daily") => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === "monthly" ? (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = date.toISOString().slice(0, 7);
                  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[200px]"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      ) : !stats ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No data available for this {viewMode === "monthly" ? "month" : "day"}</p>
            <p className="text-sm mt-2">Start adding daily logs to see analytics</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#3b82f6" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daily Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" name="Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
