import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/formatUtils";

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  net_salary: number;
  payment_date: string | null;
  status: string;
}

interface PayrollAnalyticsProps {
  payroll: PayrollRecord[];
  getEmployeeName: (empId: string) => string;
}

export const PayrollAnalytics = ({ payroll, getEmployeeName }: PayrollAnalyticsProps) => {
  const totalSalaryPaid = payroll
    .filter((record) => record.status === "paid")
    .reduce((sum, record) => sum + record.net_salary, 0);

  const totalSalaryPending = payroll
    .filter((record) => record.status === "pending")
    .reduce((sum, record) => sum + record.net_salary, 0);

  const paymentsByDate = payroll
    .filter((record) => record.payment_date && record.status === "paid")
    .reduce((acc, record) => {
      const date = record.payment_date!;
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0, employees: [] as string[] };
      }
      acc[date].amount += record.net_salary;
      acc[date].count += 1;
      acc[date].employees.push(getEmployeeName(record.employee_id));
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number; employees: string[] }>);

  const paymentsByMonth = payroll
    .filter((record) => record.status === "paid")
    .reduce((acc, record) => {
      const monthKey = `${record.month}-${record.year}`;
      const monthName = new Date(record.year, record.month - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' });
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, amount: 0, count: 0 };
      }
      acc[monthKey].amount += record.net_salary;
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Salary Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(totalSalaryPaid)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {payroll.filter((r) => r.status === "paid").length} payments completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{formatIndianCurrency(totalSalaryPending)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {payroll.filter((r) => r.status === "pending").length} payments pending
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(paymentsByMonth)
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((monthData) => (
                <div key={monthData.month} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{monthData.month}</p>
                    <p className="text-sm text-muted-foreground">{monthData.count} employees</p>
                  </div>
                  <p className="font-bold text-green-600">{formatIndianCurrency(monthData.amount)}</p>
                </div>
              ))}
            {Object.values(paymentsByMonth).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No payment data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.values(paymentsByDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments by Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(paymentsByDate)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((dateData) => (
                  <div key={dateData.date} className="space-y-2 border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{new Date(dateData.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                        <p className="text-sm text-muted-foreground">{dateData.count} employees</p>
                      </div>
                      <p className="font-bold text-green-600">{formatIndianCurrency(dateData.amount)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dateData.employees.map((emp, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                          {emp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};