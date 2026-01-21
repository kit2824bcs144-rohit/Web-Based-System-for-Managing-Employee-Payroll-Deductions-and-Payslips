import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Payroll, MONTHS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, DollarSign, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state for calculations
  const [formData, setFormData] = useState({
    basic_salary: 0,
    hra: 0,
    conveyance_allowance: 0,
    medical_allowance: 0,
    special_allowance: 0,
    overtime_hours: 0,
    overtime_amount: 0,
    bonus: 0,
    pf_deduction: 0,
    income_tax: 0,
    other_deductions: 0,
  });

  const fetchData = async () => {
    try {
      const [payrollRes, employeesRes] = await Promise.all([
        supabase.from('payroll').select('*, employee:employees(*, department:departments(*))').order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('employees').select('*').eq('status', 'active'),
      ]);

      if (payrollRes.data) setPayrolls(payrollRes.data as Payroll[]);
      if (employeesRes.data) setEmployees(employeesRes.data as Employee[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateGrossSalary = () => {
    return formData.basic_salary + formData.hra + formData.conveyance_allowance + 
           formData.medical_allowance + formData.special_allowance + 
           formData.overtime_amount + formData.bonus;
  };

  const calculateTotalDeductions = () => {
    return formData.pf_deduction + formData.income_tax + formData.other_deductions;
  };

  const calculateNetSalary = () => {
    return calculateGrossSalary() - calculateTotalDeductions();
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      const pfDeduction = employee.basic_salary * 0.12; // 12% PF
      setFormData({
        basic_salary: employee.basic_salary,
        hra: employee.hra,
        conveyance_allowance: employee.conveyance_allowance,
        medical_allowance: employee.medical_allowance,
        special_allowance: employee.special_allowance,
        overtime_hours: 0,
        overtime_amount: 0,
        bonus: 0,
        pf_deduction: pfDeduction,
        income_tax: 0,
        other_deductions: 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataRaw = new FormData(e.currentTarget);
    const data = {
      employee_id: formDataRaw.get('employee_id') as string,
      month: parseInt(formDataRaw.get('month') as string),
      year: parseInt(formDataRaw.get('year') as string),
      basic_salary: formData.basic_salary,
      hra: formData.hra,
      conveyance_allowance: formData.conveyance_allowance,
      medical_allowance: formData.medical_allowance,
      special_allowance: formData.special_allowance,
      overtime_hours: formData.overtime_hours,
      overtime_amount: formData.overtime_amount,
      bonus: formData.bonus,
      gross_salary: calculateGrossSalary(),
      pf_deduction: formData.pf_deduction,
      income_tax: formData.income_tax,
      other_deductions: formData.other_deductions,
      total_deductions: calculateTotalDeductions(),
      net_salary: calculateNetSalary(),
      payment_status: formDataRaw.get('payment_status') as 'pending' | 'paid' | 'hold',
      payment_date: formDataRaw.get('payment_date') as string || null,
      notes: formDataRaw.get('notes') as string || null,
    };

    try {
      if (editingPayroll) {
        const { error } = await supabase
          .from('payroll')
          .update(data)
          .eq('id', editingPayroll.id);
        if (error) throw error;
        toast.success('Payroll updated successfully');
      } else {
        const { error } = await supabase.from('payroll').insert([data]);
        if (error) throw error;
        toast.success('Payroll created successfully');
      }

      setIsDialogOpen(false);
      setEditingPayroll(null);
      setSelectedEmployee(null);
      setFormData({
        basic_salary: 0, hra: 0, conveyance_allowance: 0, medical_allowance: 0,
        special_allowance: 0, overtime_hours: 0, overtime_amount: 0, bonus: 0,
        pf_deduction: 0, income_tax: 0, other_deductions: 0,
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updateData: any = { payment_status: status };
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      const { error } = await supabase.from('payroll').update(updateData).eq('id', id);
      if (error) throw error;
      toast.success('Status updated successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredPayrolls = payrolls.filter((p) =>
    p.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employee?.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>;
      case 'hold':
        return <Badge variant="destructive">Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Process and manage employee payroll</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingPayroll(null); setSelectedEmployee(null); }}}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Generate Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPayroll ? 'Edit Payroll' : 'Generate New Payroll'}</DialogTitle>
              <DialogDescription>
                {editingPayroll ? 'Update payroll information' : 'Create payroll for an employee'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee *</Label>
                  <Select 
                    name="employee_id" 
                    required 
                    defaultValue={editingPayroll?.employee_id}
                    onValueChange={handleEmployeeSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Select name="month" required defaultValue={editingPayroll?.month?.toString() ?? (new Date().getMonth() + 1).toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select name="year" required defaultValue={editingPayroll?.year?.toString() ?? currentYear.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Earnings
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Basic Salary</Label>
                    <Input type="number" value={formData.basic_salary} onChange={(e) => setFormData({...formData, basic_salary: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>HRA</Label>
                    <Input type="number" value={formData.hra} onChange={(e) => setFormData({...formData, hra: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conveyance</Label>
                    <Input type="number" value={formData.conveyance_allowance} onChange={(e) => setFormData({...formData, conveyance_allowance: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical</Label>
                    <Input type="number" value={formData.medical_allowance} onChange={(e) => setFormData({...formData, medical_allowance: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Special Allowance</Label>
                    <Input type="number" value={formData.special_allowance} onChange={(e) => setFormData({...formData, special_allowance: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Overtime Amount</Label>
                    <Input type="number" value={formData.overtime_amount} onChange={(e) => setFormData({...formData, overtime_amount: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonus</Label>
                    <Input type="number" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <Calculator className="h-4 w-4" />
                  Deductions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>PF Deduction (12%)</Label>
                    <Input type="number" value={formData.pf_deduction} onChange={(e) => setFormData({...formData, pf_deduction: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Income Tax</Label>
                    <Input type="number" value={formData.income_tax} onChange={(e) => setFormData({...formData, income_tax: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Deductions</Label>
                    <Input type="number" value={formData.other_deductions} onChange={(e) => setFormData({...formData, other_deductions: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Gross Salary</div>
                    <div className="text-xl font-bold text-success">{formatCurrency(calculateGrossSalary())}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Deductions</div>
                    <div className="text-xl font-bold text-destructive">{formatCurrency(calculateTotalDeductions())}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Net Salary</div>
                    <div className="text-xl font-bold text-primary">{formatCurrency(calculateNetSalary())}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select name="payment_status" defaultValue={editingPayroll?.payment_status ?? 'pending'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input type="date" name="payment_date" defaultValue={editingPayroll?.payment_date ?? ''} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingPayroll(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gradient-primary">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPayroll ? 'Update Payroll' : 'Generate Payroll'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Payroll Records</CardTitle>
              <Badge variant="secondary">{filteredPayrolls.length}</Badge>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payroll.employee?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{payroll.employee?.employee_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{MONTHS[payroll.month - 1]} {payroll.year}</TableCell>
                      <TableCell className="text-success">{formatCurrency(payroll.gross_salary)}</TableCell>
                      <TableCell className="text-destructive">{formatCurrency(payroll.total_deductions)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(payroll.net_salary)}</TableCell>
                      <TableCell>
                        <Select
                          value={payroll.payment_status}
                          onValueChange={(value) => handleStatusChange(payroll.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="hold">Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPayroll(payroll);
                            setFormData({
                              basic_salary: payroll.basic_salary,
                              hra: payroll.hra,
                              conveyance_allowance: payroll.conveyance_allowance,
                              medical_allowance: payroll.medical_allowance,
                              special_allowance: payroll.special_allowance,
                              overtime_hours: payroll.overtime_hours,
                              overtime_amount: payroll.overtime_amount,
                              bonus: payroll.bonus,
                              pf_deduction: payroll.pf_deduction,
                              income_tax: payroll.income_tax,
                              other_deductions: payroll.other_deductions,
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
