import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payroll, MONTHS } from '@/types';

export const generatePayslipPDF = (payroll: Payroll) => {
  const doc = new jsPDF();
  const employee = payroll.employee;
  
  // Company Header
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PayrollPro', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Web-Based Payroll Management System', 20, 28);
  
  // Payslip Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY PAYSLIP', 150, 25, { align: 'center' });
  
  // Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MONTHS[payroll.month - 1]} ${payroll.year}`, 150, 32, { align: 'center' });
  
  // Employee Details Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Details', 20, 55);
  
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 58, 190, 58);
  
  const employeeDetails = [
    ['Employee Name', employee?.full_name || 'N/A', 'Employee Code', employee?.employee_code || 'N/A'],
    ['Designation', employee?.designation || 'N/A', 'Department', employee?.department?.name || 'N/A'],
    ['PAN Number', employee?.pan_number || 'N/A', 'PF Number', employee?.pf_number || 'N/A'],
    ['Bank Name', employee?.bank_name || 'N/A', 'Account Number', employee?.bank_account_number ? `****${employee.bank_account_number.slice(-4)}` : 'N/A'],
  ];
  
  autoTable(doc, {
    startY: 62,
    head: [],
    body: employeeDetails,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 100, 100] },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 100, 100] },
      3: { cellWidth: 50 },
    },
    margin: { left: 20, right: 20 },
  });
  
  // Earnings and Deductions
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Earnings', 20, finalY);
  doc.text('Deductions', 115, finalY);
  
  doc.setDrawColor(37, 99, 235);
  doc.line(20, finalY + 3, 100, finalY + 3);
  doc.line(115, finalY + 3, 190, finalY + 3);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const earnings = [
    ['Basic Salary', formatCurrency(payroll.basic_salary)],
    ['HRA', formatCurrency(payroll.hra)],
    ['Conveyance Allowance', formatCurrency(payroll.conveyance_allowance)],
    ['Medical Allowance', formatCurrency(payroll.medical_allowance)],
    ['Special Allowance', formatCurrency(payroll.special_allowance)],
    ['Overtime', formatCurrency(payroll.overtime_amount)],
    ['Bonus', formatCurrency(payroll.bonus)],
  ];
  
  const deductions = [
    ['Provident Fund (PF)', formatCurrency(payroll.pf_deduction)],
    ['Income Tax', formatCurrency(payroll.income_tax)],
    ['Other Deductions', formatCurrency(payroll.other_deductions)],
  ];
  
  autoTable(doc, {
    startY: finalY + 7,
    head: [],
    body: earnings,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 20, right: 110 },
  });
  
  autoTable(doc, {
    startY: finalY + 7,
    head: [],
    body: deductions,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 115, right: 20 },
  });
  
  // Summary Section
  const summaryY = Math.max((doc as any).lastAutoTable.finalY + 15, finalY + 80);
  
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, summaryY, 170, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text('Gross Salary:', 30, summaryY + 12);
  doc.text(formatCurrency(payroll.gross_salary), 90, summaryY + 12);
  
  doc.setTextColor(200, 0, 0);
  doc.text('Total Deductions:', 30, summaryY + 22);
  doc.text(formatCurrency(payroll.total_deductions), 90, summaryY + 22);
  
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(12);
  doc.text('Net Salary:', 110, summaryY + 17);
  doc.setFontSize(14);
  doc.text(formatCurrency(payroll.net_salary), 155, summaryY + 17);
  
  // Payment Details
  if (payroll.payment_date) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Date: ${new Date(payroll.payment_date).toLocaleDateString('en-IN')}`, 30, summaryY + 30);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`Payslip_${employee?.employee_code}_${MONTHS[payroll.month - 1]}_${payroll.year}.pdf`);
};
