import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Payroll, MONTHS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generatePayslipPDF } from '@/utils/pdfGenerator';

export default function MyPayslips() {
  const { profile } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const fetchData = async () => {
    if (!profile) return;
    
    try {
      // First get the employee record for this user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', profile.email)
        .maybeSingle();

      if (!employee) {
        setIsLoading(false);
        return;
      }

      // Then fetch payroll for this employee
      let query = supabase
        .from('payroll')
        .select('*, employee:employees(*, department:departments(*))')
        .eq('employee_id', employee.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (selectedYear !== 'all') {
        query = query.eq('year', parseInt(selectedYear));
      }

      const { data } = await query;
      if (data) setPayrolls(data as Payroll[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadPDF = (payroll: Payroll) => {
    generatePayslipPDF(payroll);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Calculate summary stats
  const totalEarnings = payrolls
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.net_salary, 0);
  const totalDeductions = payrolls
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.total_deductions, 0);
  const paidPayslips = payrolls.filter(p => p.payment_status === 'paid').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground">View and download your salary payslips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold">{formatCurrency(totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payslips Received</p>
                <p className="text-2xl font-bold">{paidPayslips}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Payslip History</CardTitle>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No payslips found</p>
              <p className="text-sm text-muted-foreground mt-1">Your payslips will appear here once processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div className="font-medium">{MONTHS[payroll.month - 1]} {payroll.year}</div>
                      </TableCell>
                      <TableCell className="text-success">{formatCurrency(payroll.gross_salary)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(payroll.pf_deduction)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(payroll.income_tax)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(payroll.net_salary)}</TableCell>
                      <TableCell>
                        {payroll.payment_status === 'paid' ? (
                          <Badge className="bg-success/10 text-success">Paid</Badge>
                        ) : payroll.payment_status === 'pending' ? (
                          <Badge className="bg-warning/10 text-warning">Pending</Badge>
                        ) : (
                          <Badge variant="destructive">Hold</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {payroll.payment_status === 'paid' && (
                          <Button
                            size="sm"
                            className="gradient-primary"
                            onClick={() => handleDownloadPDF(payroll)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
