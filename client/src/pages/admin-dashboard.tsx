import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users,
  Receipt as ReceiptIcon,
  Wrench,
  Plus,
  Search,
  FileText,
  BarChart,
  ClipboardList,
  User,
  Shield,
  Database,
  LogOut,
  Clock,
  MessageSquare
} from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsSection } from "@/components/stats-section";
import { EntryForm } from "@/components/entry-form";
import { RecentReceipts } from "@/components/recent-receipts";
import { ReceiptsTable } from "@/components/receipts-table";
import { ReceiptModal } from "@/components/receipt-modal";
import { OtpModal } from "@/components/otp-modal";
import { RecentServiceComplaints } from "@/components/recent-service-complaints";
import { ServiceComplaintForm } from "@/components/service-complaint-form";
import { ServiceVisitHistory } from "@/components/service-visit-history";
import WhatsAppIntegration from "@/pages/whatsapp-integration";
import { UserForm } from "@/components/user-form";
import { UserEditModal } from "@/components/user-edit-modal";
import { WorkAssignmentForm } from "@/components/work-assignment-form";
import { WorkAssignmentsTable } from "@/components/work-assignments-table";
import { BackupModal } from "@/components/backup-modal";
import { ProfileModal } from "@/components/profile-modal";
import { Receipt } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "receipts" | "users" | "work-assignments" | "customer-search" | "employee-reports">("overview");
  const [selectedServiceComplaint, setSelectedServiceComplaint] = useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  const [multipleCustomers, setMultipleCustomers] = useState<any[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState<any>(null);
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");
  const [showDateRangeExport, setShowDateRangeExport] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeReportDateFrom, setEmployeeReportDateFrom] = useState("");
  const [employeeReportDateTo, setEmployeeReportDateTo] = useState("");
  const [showCreateWorkAssignmentModal, setShowCreateWorkAssignmentModal] = useState(false);


  // Fetch all service visits for admin overview
  const { data: allVisits = [], isLoading: allVisitsLoading, isError: allVisitsError } = useQuery({
    queryKey: ["allServiceVisits"],
    queryFn: () => apiRequest("/api/service-visits/all"),
  });

  // Fetch service complaints
  const { data: serviceComplaints = [], isLoading: serviceComplaintsLoading, isError: serviceComplaintsError } = useQuery({
    queryKey: ["serviceComplaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  // Fetch receipts
  const { data: receipts = [], isLoading: receiptsLoading, isError: receiptsError } = useQuery({
    queryKey: ["receipts"],
    queryFn: () => apiRequest("/api/receipts"),
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest("/api/users"),
  });

  // Fetch work assignments
  const { data: workAssignments = [], isLoading: workAssignmentsLoading, isError: workAssignmentsError } = useQuery({
    queryKey: ["workAssignments"],
    queryFn: () => apiRequest("/api/work-assignments"),
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      setLocation("/admin-login");
    } else {
      // Ensure overview tab is active by default
      setActiveTab("overview");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setLocation("/login");
  };



  const handleGenerateReport = () => {
    if (!selectedEmployeeId || !employeeReportDateFrom || !employeeReportDateTo) {
      alert("Please select employee and date range");
      return;
    }
    
    // Generate report logic here
    console.log("Generating report for employee:", selectedEmployeeId);
  };

  const handleCustomerSelection = (selectedCustomer: any) => {
    const searchTerm = selectedCustomer.name.toLowerCase();
    
    // Search receipts for selected customer
    const customerReceipts = receipts.filter(receipt => 
      receipt.customerName.toLowerCase() === searchTerm &&
      receipt.mobile === selectedCustomer.mobile
    );

    // Search service complaints for selected customer
    const customerServices = serviceComplaints.filter(complaint => 
      complaint.customerName.toLowerCase() === searchTerm &&
      complaint.mobile === selectedCustomer.mobile
    );

    setCustomerSearchResults({
      customerInfo: selectedCustomer,
      receipts: customerReceipts,
      services: customerServices,
      totalRecords: customerReceipts.length + customerServices.length
    });
    
    setShowCustomerSelector(false);
    setMultipleCustomers([]);
    setSelectedCustomerForReport(selectedCustomer);
  };

  // Export functions
  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `${filename}.xlsx`);
  };

  const handleExportCustomerData = () => {
    if (!customerSearchResults || customerSearchResults.totalRecords === 0) {
      alert("No customer data to export");
      return;
    }

    const customerInfo = customerSearchResults.customerInfo;
    
    // Prepare receipts data for export
    const receiptsData = customerSearchResults.receipts.map((receipt: any) => ({
      'Receipt Number': receipt.receiptNumber,
      'Customer Name': receipt.customerName,
      'Mobile': receipt.mobile,
      'Product': receipt.product,
      'Model': receipt.model,
      'Issue': receipt.issueDescription || 'N/A',
      'Status': receipt.status,
      'Estimated Amount': receipt.estimatedAmount,
      'Advance Amount': receipt.advanceAmount || 0,
      'Created Date': new Date(receipt.createdAt).toLocaleDateString(),
      'RGP Number': receipt.rgpNumber || 'N/A'
    }));

    // Prepare services data for export with visit details
    const servicesData = customerSearchResults.services.map((service: any) => {
      const serviceVisits = allVisits.filter((visit: any) => visit.complaintId === service.id);
      const totalWorkingHours = serviceVisits.reduce((total: number, visit: any) => {
        if (visit.checkOutTime) {
          const checkIn = new Date(visit.checkInTime);
          const checkOut = new Date(visit.checkOutTime);
          const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0);

      return {
        'Service Number': service.complaintNumber,
        'Customer Name': service.customerName,
        'Mobile': service.mobile,
        'Product': service.product,
        'Model': service.model,
        'Issue Description': service.issueDescription,
        'Status': service.status,
        'Assigned Engineer': service.assignedEngineerId ? `Engineer #${service.assignedEngineerId}` : 'Unassigned',
        'Created Date': new Date(service.createdAt).toLocaleDateString(),
        'Priority': service.priority || 'Normal',
        'Total Visits': serviceVisits.length,
        'Total Working Hours': totalWorkingHours.toFixed(2),
        'Last Visit': serviceVisits.length > 0 ? new Date(serviceVisits[serviceVisits.length - 1].checkInTime).toLocaleDateString() : 'No visits'
      };
    });

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Customer Info sheet
    const customerInfoData = [{
      'Customer Name': customerInfo.name,
      'Mobile Number': customerInfo.mobile,
      'Total Receipts': customerSearchResults.receipts.length,
      'Total Services': customerSearchResults.services.length,
      'Export Date': new Date().toLocaleDateString(),
      'Export Time': new Date().toLocaleTimeString()
    }];
    const customerInfoWs = XLSX.utils.json_to_sheet(customerInfoData);
    XLSX.utils.book_append_sheet(wb, customerInfoWs, "Customer Info");

    // Receipts sheet
    if (receiptsData.length > 0) {
      const receiptsWs = XLSX.utils.json_to_sheet(receiptsData);
      XLSX.utils.book_append_sheet(wb, receiptsWs, "Receipts");
    }

    // Services sheet
    if (servicesData.length > 0) {
      const servicesWs = XLSX.utils.json_to_sheet(servicesData);
      XLSX.utils.book_append_sheet(wb, servicesWs, "Services");
    }

    // Detailed Service Visits sheet
    const detailedVisitsData: any[] = [];
    customerSearchResults.services.forEach((service: any) => {
      const serviceVisits = allVisits.filter((visit: any) => visit.complaintId === service.id);
      serviceVisits.forEach((visit: any, index: number) => {
        const checkIn = new Date(visit.checkInTime);
        const checkOut = visit.checkOutTime ? new Date(visit.checkOutTime) : null;
        const workingHours = checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'Ongoing';
        
        detailedVisitsData.push({
          'Service Number': service.complaintNumber,
          'Customer Name': service.customerName,
          'Visit Number': index + 1,
          'Engineer ID': visit.engineerId,
          'Check-in Date': checkIn.toLocaleDateString(),
          'Check-in Time': checkIn.toLocaleTimeString(),
          'Check-out Date': checkOut ? checkOut.toLocaleDateString() : 'Not checked out',
          'Check-out Time': checkOut ? checkOut.toLocaleTimeString() : 'Not checked out',
          'Working Hours': workingHours,
          'Visit Notes': visit.notes || 'No notes',
          'Product': service.product,
          'Issue': service.issueDescription,
          'Service Status': service.status
        });
      });
    });

    if (detailedVisitsData.length > 0) {
      const visitsWs = XLSX.utils.json_to_sheet(detailedVisitsData);
      XLSX.utils.book_append_sheet(wb, visitsWs, "Service Visits");
    }

    // Save the file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `Customer_${customerInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDateRangeExport = () => {
    if (!dateRangeFrom || !dateRangeTo) {
      alert("Please select both start and end dates");
      return;
    }

    const fromDate = new Date(dateRangeFrom);
    const toDate = new Date(dateRangeTo);
    toDate.setHours(23, 59, 59, 999); // Include full end date

    // Filter receipts by date range
    const filteredReceipts = receipts.filter((receipt: any) => {
      const receiptDate = new Date(receipt.createdAt);
      return receiptDate >= fromDate && receiptDate <= toDate;
    });

    // Filter services by date range
    const filteredServices = serviceComplaints.filter((service: any) => {
      const serviceDate = new Date(service.createdAt);
      return serviceDate >= fromDate && serviceDate <= toDate;
    });

    if (filteredReceipts.length === 0 && filteredServices.length === 0) {
      alert("No data found for the selected date range");
      return;
    }

    // Prepare receipts data for export
    const receiptsData = filteredReceipts.map((receipt: any) => ({
      'Receipt Number': receipt.receiptNumber,
      'Customer Name': receipt.customerName,
      'Mobile': receipt.mobile,
      'Product': receipt.product,
      'Model': receipt.model,
      'Issue': receipt.issueDescription || 'N/A',
      'Status': receipt.status,
      'Estimated Amount': receipt.estimatedAmount,
      'Advance Amount': receipt.advanceAmount || 0,
      'Created Date': new Date(receipt.createdAt).toLocaleDateString(),
      'RGP Number': receipt.rgpNumber || 'N/A'
    }));

    // Prepare services data for export
    const servicesData = filteredServices.map((service: any) => ({
      'Service Number': service.complaintNumber,
      'Customer Name': service.customerName,
      'Mobile': service.mobile,
      'Product': service.product,
      'Model': service.model,
      'Issue Description': service.issueDescription,
      'Status': service.status,
      'Assigned Engineer': service.assignedEngineerId ? `Engineer #${service.assignedEngineerId}` : 'Unassigned',
      'Created Date': new Date(service.createdAt).toLocaleDateString(),
      'Priority': service.priority || 'Normal'
    }));

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [{
      'Report Type': 'Date Range Export',
      'From Date': dateRangeFrom,
      'To Date': dateRangeTo,
      'Total Receipts': filteredReceipts.length,
      'Total Services': filteredServices.length,
      'Total Revenue': filteredReceipts.reduce((sum: number, r: any) => sum + (r.estimatedAmount || 0), 0),
      'Export Date': new Date().toLocaleDateString(),
      'Export Time': new Date().toLocaleTimeString()
    }];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Receipts sheet
    if (receiptsData.length > 0) {
      const receiptsWs = XLSX.utils.json_to_sheet(receiptsData);
      XLSX.utils.book_append_sheet(wb, receiptsWs, "Receipts");
    }

    // Services sheet
    if (servicesData.length > 0) {
      const servicesWs = XLSX.utils.json_to_sheet(servicesData);
      XLSX.utils.book_append_sheet(wb, servicesWs, "Services");
    }

    // All Service Visits within date range
    const filteredVisitsData: any[] = [];
    allVisits.forEach((visit: any) => {
      const visitDate = new Date(visit.checkInTime);
      if (visitDate >= fromDate && visitDate <= toDate) {
        const service = serviceComplaints.find((s: any) => s.id === visit.complaintId);
        if (service) {
          const checkIn = new Date(visit.checkInTime);
          const checkOut = visit.checkOutTime ? new Date(visit.checkOutTime) : null;
          const workingHours = checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'Ongoing';
          
          filteredVisitsData.push({
            'Service Number': service.complaintNumber,
            'Customer Name': service.customerName,
            'Mobile': service.mobile,
            'Product': service.product,
            'Engineer ID': visit.engineerId,
            'Check-in Date': checkIn.toLocaleDateString(),
            'Check-in Time': checkIn.toLocaleTimeString(),
            'Check-in Location': visit.checkInAddress || (visit.checkInLatitude && visit.checkInLongitude ? `${visit.checkInLatitude}, ${visit.checkInLongitude}` : 'Not available'),
            'Check-out Date': checkOut ? checkOut.toLocaleDateString() : 'Not checked out',
            'Check-out Time': checkOut ? checkOut.toLocaleTimeString() : 'Not checked out',
            'Check-out Location': visit.checkOutAddress || (visit.checkOutLatitude && visit.checkOutLongitude ? `${visit.checkOutLatitude}, ${visit.checkOutLongitude}` : 'Not available'),
            'Working Hours': workingHours,
            'Distance Traveled (km)': (visit.checkInLatitude && visit.checkInLongitude && visit.checkOutLatitude && visit.checkOutLongitude) 
              ? (() => {
                  const R = 6371;
                  const dLat = (parseFloat(visit.checkOutLatitude) - parseFloat(visit.checkInLatitude)) * Math.PI / 180;
                  const dLon = (parseFloat(visit.checkOutLongitude) - parseFloat(visit.checkInLongitude)) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(parseFloat(visit.checkInLatitude) * Math.PI / 180) * Math.cos(parseFloat(visit.checkOutLatitude) * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  return (R * c).toFixed(2);
                })() 
              : 'Not available',
            'Visit Notes': visit.visitNotes || 'No notes',
            'Parts Issued': visit.partsIssued || 'None',
            'Work Description': visit.workDescription || 'No description',
            'Issue Description': service.issueDescription,
            'Service Status': service.status
          });
        }
      }
    });

    if (filteredVisitsData.length > 0) {
      const visitsWs = XLSX.utils.json_to_sheet(filteredVisitsData);
      XLSX.utils.book_append_sheet(wb, visitsWs, "Service Visits");
    }

    // Save the file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `TAJ_CRM_Report_${dateRangeFrom}_to_${dateRangeTo}.xlsx`);
  };

  const handlePrintCustomerReport = () => {
    if (!customerSearchResults || customerSearchResults.totalRecords === 0) {
      alert("No customer data to print");
      return;
    }

    const customerInfo = customerSearchResults.customerInfo;
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Report - ${customerInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .report-title { font-size: 18px; color: #6b7280; }
            .customer-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .info-item { display: flex; flex-direction: column; }
            .info-label { font-weight: bold; color: #4b5563; font-size: 12px; text-transform: uppercase; }
            .info-value { font-size: 16px; color: #111827; margin-top: 2px; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 12px 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-ready { background-color: #dbeafe; color: #1e40af; }
            .status-process { background-color: #fef3c7; color: #92400e; }
            .status-pending { background-color: #f3f4f6; color: #374151; }
            .status-completed { background-color: #d1fae5; color: #065f46; }
            .status-progress { background-color: #dbeafe; color: #1e40af; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">TAJ CRM System</div>
            <div class="report-title">Customer Complete Report</div>
          </div>

          <div class="customer-info">
            <h3 style="margin-top: 0; color: #1f2937;">Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Customer Name</span>
                <span class="info-value">${customerInfo.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Mobile Number</span>
                <span class="info-value">${customerInfo.mobile}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Records</span>
                <span class="info-value">${customerSearchResults.totalRecords}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Report Generated</span>
                <span class="info-value">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          ${customerSearchResults.receipts.length > 0 ? `
          <div class="section">
            <div class="section-title">Receipt History (${customerSearchResults.receipts.length} records)</div>
            <table>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Product</th>
                  <th>Model</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${customerSearchResults.receipts.map((receipt: any) => `
                  <tr>
                    <td><strong>${receipt.receiptNumber}</strong></td>
                    <td>${receipt.product}</td>
                    <td>${receipt.model}</td>
                    <td>₹${receipt.estimatedAmount.toLocaleString()}</td>
                    <td>
                      <span class="status ${
                        receipt.status === 'Delivered' ? 'status-delivered' :
                        receipt.status === 'Ready to Deliver' ? 'status-ready' :
                        receipt.status === 'In Process' ? 'status-process' : 'status-pending'
                      }">${receipt.status}</span>
                    </td>
                    <td>${new Date(receipt.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${customerSearchResults.services.length > 0 ? `
          <div class="section">
            <div class="section-title">Service History (${customerSearchResults.services.length} records)</div>
            ${customerSearchResults.services.map((service: any) => {
              const serviceVisits = allVisits.filter((visit: any) => visit.complaintId === service.id);
              const totalWorkingHours = serviceVisits.reduce((total: number, visit: any) => {
                if (visit.checkOutTime) {
                  const checkIn = new Date(visit.checkInTime);
                  const checkOut = new Date(visit.checkOutTime);
                  const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                  return total + hours;
                }
                return total;
              }, 0);

              return `
              <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">${service.complaintNumber} - ${service.product} ${service.model}</h4>
                
                <table style="margin-bottom: 20px;">
                  <tr>
                    <td style="background-color: #f9fafb; font-weight: bold; width: 120px;">Issue:</td>
                    <td>${service.issueDescription}</td>
                    <td style="background-color: #f9fafb; font-weight: bold; width: 100px;">Status:</td>
                    <td>
                      <span class="status ${
                        service.status === 'Completed' ? 'status-completed' :
                        service.status === 'In Progress' ? 'status-progress' : 'status-pending'
                      }">${service.status}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; font-weight: bold;">Engineer:</td>
                    <td>${service.assignedEngineerId ? `Engineer #${service.assignedEngineerId}` : 'Unassigned'}</td>
                    <td style="background-color: #f9fafb; font-weight: bold;">Created:</td>
                    <td>${new Date(service.createdAt).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; font-weight: bold;">Total Visits:</td>
                    <td>${serviceVisits.length}</td>
                    <td style="background-color: #f9fafb; font-weight: bold;">Working Hours:</td>
                    <td>${totalWorkingHours.toFixed(2)} hrs</td>
                  </tr>
                </table>

                ${serviceVisits.length > 0 ? `
                <h5 style="margin: 20px 0 10px 0; color: #4b5563; font-size: 14px;">Visit Details:</h5>
                <table style="font-size: 12px;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th>Visit #</th>
                      <th>Engineer</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Duration</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${serviceVisits.map((visit: any, index: number) => {
                      const checkIn = new Date(visit.checkInTime);
                      const checkOut = visit.checkOutTime ? new Date(visit.checkOutTime) : null;
                      const workingHours = checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'Ongoing';
                      
                      return `
                      <tr>
                        <td>${index + 1}</td>
                        <td>Eng #${visit.engineerId}</td>
                        <td>${checkIn.toLocaleDateString()} ${checkIn.toLocaleTimeString()}</td>
                        <td>${checkOut ? `${checkOut.toLocaleDateString()} ${checkOut.toLocaleTimeString()}` : 'Not checked out'}</td>
                        <td>${workingHours} ${typeof workingHours === 'number' ? 'hrs' : ''}</td>
                        <td>${visit.notes || 'No notes'}</td>
                      </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
                ` : '<p style="color: #6b7280; font-style: italic;">No visits recorded for this service.</p>'}
              </div>
              `;
            }).join('')}
          </div>
          ` : ''}

          <div class="footer">
            <p>This report was generated from TAJ CRM System on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    console.log("handlePrintReceipt called with:", receipt);
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const handleMarkDelivered = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowOtpModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TAJ CRM</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Panel Access Buttons - Desktop Only */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/technician-dashboard")}
                className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-3 text-xs"
              >
                <User className="w-3 h-3" />
                <span>Technician Panel</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/service-engineer-dashboard")}
                className="flex items-center space-x-1 text-purple-600 border-purple-200 hover:bg-purple-50 h-8 px-3 text-xs"
              >
                <Wrench className="w-3 h-3" />
                <span>Service Engineer</span>
              </Button>
            </div>

            {/* Mobile User Menu */}
            <div className="lg:hidden flex items-center space-x-1">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50 h-8 px-2 text-xs"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-xl">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TAJ CRM</h1>
                  <p className="text-sm text-gray-500">Admin Dashboard</p>
                </div>
              </div>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {/* Desktop Navigation */}
              {[
                { id: 'overview', label: 'Overview', icon: BarChart },
                { id: 'receipts', label: 'Receipts', icon: FileText },
                { id: 'services', label: 'Services', icon: Wrench },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'work-assignments', label: 'Work Assignments', icon: ClipboardList },
                { id: 'customer-search', label: 'Customer Management', icon: Search },
                { id: 'employee-reports', label: 'Employee Reports', icon: BarChart },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'customer-search') {
                        setLocation("/customer-search");
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4 flex-col space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowBackupModal(true)}
            >
              <Database className="mr-3 h-5 w-5" />
              Database Backup
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowProfileModal(true)}
            >
              <User className="mr-3 h-5 w-5" />
              Profile Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {/* Mobile Navigation Tabs */}
          <div className="lg:hidden bg-white border-b border-gray-200 sticky top-16 z-40">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-1 p-2 min-w-max">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart },
                  { id: 'receipts', label: 'Receipts', icon: FileText },
                  { id: 'services', label: 'Services', icon: Wrench },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'work-assignments', label: 'Work', icon: ClipboardList },
                  { id: 'customer-search', label: 'Customers', icon: Search },
                  { id: 'employee-reports', label: 'Reports', icon: BarChart },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'customer-search') {
                          setLocation("/customer-search");
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-all min-w-[70px] ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Overview Section */}
            {activeTab === "overview" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BarChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Dashboard Overview</h2>
                        <p className="text-sm sm:text-base text-blue-100 opacity-90">
                          Welcome back! Here's what's happening today.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="w-full sm:w-auto bg-white/20 text-white border-white/30 hover:bg-white/30"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Logout</span>
                        <span className="sm:hidden">Logout</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-blue-700">Total Receipts</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                            {receipts?.length || 0}
                          </p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-green-700">Active Services</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">
                            {serviceComplaints?.filter(s => s.status !== 'completed').length || 0}
                          </p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-200 rounded-lg flex items-center justify-center">
                          <ReceiptIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-purple-700">Total Users</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">
                            {users?.length || 0}
                          </p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-orange-700">Pending Work</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">
                            {workAssignments?.filter(w => w.status === 'pending').length || 0}
                          </p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-700" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Recent Receipts */}
                  <Card className="shadow-sm border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                          Recent Receipts
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('receipts')}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {receipts?.slice(0, 3).map((receipt: any) => (
                          <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {receipt.receiptNumber}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {receipt.customerName} • {receipt.product}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                receipt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                receipt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {receipt.status}
                            </Badge>
                          </div>
                        ))}
                        {(!receipts || receipts.length === 0) && (
                          <div className="text-center py-6 text-gray-500">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No receipts found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Services */}
                  <Card className="shadow-sm border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                          Recent Services
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('services')}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {serviceComplaints?.slice(0, 3).map((service: any) => (
                          <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {service.complaintNumber}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {service.customerName} • {service.product}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                service.status === 'completed' ? 'bg-green-100 text-green-800' :
                                service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {service.status}
                            </Badge>
                          </div>
                        ))}
                        {(!serviceComplaints || serviceComplaints.length === 0) && (
                          <div className="text-center py-6 text-gray-500">
                            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No services found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Receipts Section */}
            {activeTab === "receipts" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Receipts Management</h2>
                    <p className="text-sm text-gray-600">Manage all repair receipts</p>
                  </div>
                  <Button
                    onClick={() => setShowCreateReceiptModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Receipt
                  </Button>
                </div>
                <ReceiptsTable
                  onPrintReceipt={handlePrintReceipt}
                  onMarkDelivered={handleMarkDelivered}
                />
              </div>
            )}

            {/* Services Section */}
            {activeTab === "services" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Service Management</h2>
                    <p className="text-sm text-gray-600">Manage service complaints and requests</p>
                  </div>
                  <Button onClick={() => setShowCreateServiceModal(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Service
                  </Button>
                </div>
                <RecentServiceComplaints />
              </div>
            )}

            {/* WhatsApp Section */}
            {activeTab === "whatsapp" && (
              <div className="h-full">
                <WhatsAppIntegration />
              </div>
            )}

            {/* Users Section */}
            {activeTab === "users" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-600">Manage system users and permissions</p>
                  </div>
                  <Button onClick={() => setShowCreateUserModal(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {users?.map((user: any) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-500">{user.role}</p>
                        </div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Work Assignments Section */}
            {activeTab === "work-assignments" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Work Assignments</h2>
                    <p className="text-sm text-gray-600">Manage work assignments and tasks</p>
                  </div>
                  <Button onClick={() => setShowCreateWorkAssignmentModal(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {workAssignments && workAssignments.length > 0 ? (
                        <div className="grid gap-4">
                          {workAssignments.map((assignment: any) => (
                            <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">Assignment #{assignment.id}</h3>
                                  <p className="text-sm text-gray-500">
                                    Type: {assignment.workType} | Priority: {assignment.priority}
                                  </p>
                                </div>
                                <Badge 
                                  className={
                                    assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {assignment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No Work Assignments</h3>
                          <p className="text-sm">Create your first work assignment to get started.</p>
                          <Button 
                            onClick={() => setShowCreateWorkAssignmentModal(true)}
                            className="mt-4"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Assignment
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}



            {/* Employee Reports Section */}
            {activeTab === "employee-reports" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Reports</h2>
                  <p className="text-sm text-gray-600">View employee performance and work reports</p>
                </div>
                
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <Select onValueChange={(value) => setSelectedEmployeeId(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.role !== 'admin').map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="date"
                      value={employeeReportDateFrom}
                      onChange={(e) => setEmployeeReportDateFrom(e.target.value)}
                      placeholder="From Date"
                    />
                    
                    <Input
                      type="date"
                      value={employeeReportDateTo}
                      onChange={(e) => setEmployeeReportDateTo(e.target.value)}
                      placeholder="To Date"
                    />
                  </div>
                  
                  <Button onClick={handleGenerateReport} className="w-full sm:w-auto">
                    <BarChart className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <Dialog
        open={showCreateReceiptModal}
        onOpenChange={setShowCreateReceiptModal}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Create New Receipt</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            <EntryForm
              isModal={true}
              onReceiptCreated={(receipt) => {
                setShowCreateReceiptModal(false);
                handlePrintReceipt(receipt);
              }}
              onBack={() => setShowCreateReceiptModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm onClose={() => setShowCreateUserModal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateWorkAssignmentModal} onOpenChange={setShowCreateWorkAssignmentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Assignment</DialogTitle>
          </DialogHeader>
          <WorkAssignmentForm onClose={() => setShowCreateWorkAssignmentModal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateServiceModal} onOpenChange={setShowCreateServiceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Service Request</DialogTitle>
          </DialogHeader>
          <ServiceComplaintForm onClose={() => setShowCreateServiceModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <ProfileModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        userId={parseInt(localStorage.getItem("userId") || "1")}
      />

      {/* Backup Modal */}
      <BackupModal 
        open={showBackupModal} 
        onOpenChange={setShowBackupModal} 
      />

      {/* Receipt Modal */}
      <ReceiptModal 
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
      />
    </div>
  );
}








