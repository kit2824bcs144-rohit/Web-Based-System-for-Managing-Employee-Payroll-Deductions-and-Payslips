export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  designation: string;
  date_of_joining: string;
  bank_name: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  pan_number: string | null;
  pf_number: string | null;
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  overtime_hours: number;
  overtime_amount: number;
  bonus: number;
  gross_salary: number;
  pf_deduction: number;
  income_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  payment_status: 'pending' | 'paid' | 'hold';
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;
