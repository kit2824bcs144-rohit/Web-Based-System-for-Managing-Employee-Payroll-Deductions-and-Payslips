import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Department } from '@/types';
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
import { Plus, Search, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [employeesRes, departmentsRes] = await Promise.all([
        supabase.from('employees').select('*, department:departments(*)').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
      ]);

      if (employeesRes.data) setEmployees(employeesRes.data as Employee[]);
      if (departmentsRes.data) setDepartments(departmentsRes.data as Department[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      employee_code: formData.get('employee_code') as string,
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      department_id: formData.get('department_id') as string || null,
      designation: formData.get('designation') as string,
      date_of_joining: formData.get('date_of_joining') as string,
      bank_name: formData.get('bank_name') as string || null,
      bank_account_number: formData.get('bank_account_number') as string || null,
      ifsc_code: formData.get('ifsc_code') as string || null,
      pan_number: formData.get('pan_number') as string || null,
      pf_number: formData.get('pf_number') as string || null,
      basic_salary: parseFloat(formData.get('basic_salary') as string) || 0,
      hra: parseFloat(formData.get('hra') as string) || 0,
      conveyance_allowance: parseFloat(formData.get('conveyance_allowance') as string) || 0,
      medical_allowance: parseFloat(formData.get('medical_allowance') as string) || 0,
      special_allowance: parseFloat(formData.get('special_allowance') as string) || 0,
      status: formData.get('status') as 'active' | 'inactive' | 'terminated',
    };

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(data)
          .eq('id', editingEmployee.id);
        if (error) throw error;
        toast.success('Employee updated successfully');
      } else {
        const { error } = await supabase.from('employees').insert([data]);
        if (error) throw error;
        toast.success('Employee added successfully');
      }

      setIsDialogOpen(false);
      setEditingEmployee(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      toast.success('Employee deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
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
      case 'active':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your employee records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEmployee(null); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? 'Update employee information' : 'Fill in the details to add a new employee'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_code">Employee Code *</Label>
                  <Input id="employee_code" name="employee_code" required defaultValue={editingEmployee?.employee_code} placeholder="EMP001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" required defaultValue={editingEmployee?.full_name} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required defaultValue={editingEmployee?.email} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={editingEmployee?.phone ?? ''} placeholder="+91 9876543210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department_id">Department</Label>
                  <Select name="department_id" defaultValue={editingEmployee?.department_id ?? undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input id="designation" name="designation" required defaultValue={editingEmployee?.designation} placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_joining">Date of Joining *</Label>
                  <Input id="date_of_joining" name="date_of_joining" type="date" required defaultValue={editingEmployee?.date_of_joining} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingEmployee?.status ?? 'active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input id="bank_name" name="bank_name" defaultValue={editingEmployee?.bank_name ?? ''} placeholder="State Bank of India" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input id="bank_account_number" name="bank_account_number" defaultValue={editingEmployee?.bank_account_number ?? ''} placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                    <Input id="ifsc_code" name="ifsc_code" defaultValue={editingEmployee?.ifsc_code ?? ''} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Tax & Deduction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input id="pan_number" name="pan_number" defaultValue={editingEmployee?.pan_number ?? ''} placeholder="ABCDE1234F" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf_number">PF Number</Label>
                    <Input id="pf_number" name="pf_number" defaultValue={editingEmployee?.pf_number ?? ''} placeholder="TN/CHE/1234567/000/0001234" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Salary Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary *</Label>
                    <Input id="basic_salary" name="basic_salary" type="number" required defaultValue={editingEmployee?.basic_salary ?? 0} placeholder="30000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA</Label>
                    <Input id="hra" name="hra" type="number" defaultValue={editingEmployee?.hra ?? 0} placeholder="12000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conveyance_allowance">Conveyance</Label>
                    <Input id="conveyance_allowance" name="conveyance_allowance" type="number" defaultValue={editingEmployee?.conveyance_allowance ?? 0} placeholder="1600" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_allowance">Medical</Label>
                    <Input id="medical_allowance" name="medical_allowance" type="number" defaultValue={editingEmployee?.medical_allowance ?? 0} placeholder="1250" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="special_allowance">Special Allowance</Label>
                    <Input id="special_allowance" name="special_allowance" type="number" defaultValue={editingEmployee?.special_allowance ?? 0} placeholder="5000" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingEmployee(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gradient-primary">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
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
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>All Employees</CardTitle>
              <Badge variant="secondary">{filteredEmployees.length}</Badge>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
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
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          <div className="text-sm text-muted-foreground">{employee.employee_code} • {employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department?.name || '-'}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>{formatCurrency(employee.basic_salary)}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
