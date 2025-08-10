import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Save, Wrench, LogOut, Plus, Printer, User, ClipboardList, Clock, CheckCircle, AlertCircle, Package, Settings, FileText, Phone } from "lucide-react";
import { useReceipts, useUpdateReceipt } from "@/hooks/use-receipts";
import { EntryForm } from "@/components/entry-form";
import { ReceiptModal } from "@/components/receipt-modal";
import { ProfileModal } from "@/components/profile-modal";
import { OtpModal } from "@/components/otp-modal";
import { Receipt } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function TechnicianDashboard() {
  const [, setLocation] = useLocation();
  const { data: receipts = [], isLoading } = useReceipts();
  const updateReceipt = useUpdateReceipt();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [status, setStatus] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpReceipt, setOtpReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "technician" && userRole !== "admin") {
      setLocation("/technician-login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      setLocation("/admin-dashboard");
    } else {
      localStorage.removeItem("userRole");
      setLocation("/technician-login");
    }
  };

  // Filter receipts by status
  const pendingReceipts = receipts.filter(r => r.status === "Pending" || r.status === "In Process");
  const partOrderedReceipts = receipts.filter(r => r.status === "Product Ordered");
  const readyToDeliverReceipts = receipts.filter(r => r.status === "Ready to Deliver" || r.status === "Not Repaired - Return As It Is");
  const completedReceipts = receipts.filter(r => r.status === "Delivered");

  // Get filtered receipts based on active tab and search
  const getFilteredReceipts = () => {
    let receiptsToFilter = receipts;
    
    switch (activeTab) {
      case "pending":
        receiptsToFilter = pendingReceipts;
        break;
      case "parts":
        receiptsToFilter = partOrderedReceipts;
        break;
      case "ready":
        receiptsToFilter = readyToDeliverReceipts;
        break;
      case "completed":
        receiptsToFilter = completedReceipts;
        break;
      case "all":
        receiptsToFilter = receipts;
        break;
    }

    if (!searchTerm) return receiptsToFilter;

    const search = searchTerm.toLowerCase();
    return receiptsToFilter.filter(receipt => 
      receipt.receiptNumber.toLowerCase().includes(search) ||
      receipt.customerName.toLowerCase().includes(search) ||
      receipt.mobile.includes(searchTerm) ||
      (receipt.rgpNumber && receipt.rgpNumber.toLowerCase().includes(search)) ||
      receipt.product.toLowerCase().includes(search) ||
      receipt.model.toLowerCase().includes(search)
    );
  };

  const filteredReceipts = getFilteredReceipts();

  const handleSelectReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setTechnicianNotes(receipt.technicianNotes || "");
    setStatus(receipt.status);
    setEstimatedAmount(receipt.estimatedAmount.toString());
    setPaymentStatus(receipt.paymentStatus || "Pending");
    setAmountReceived(receipt.amountReceived?.toString() || "0");
    setShowUpdateModal(true);
  };

  const handleUpdateReceipt = async () => {
    if (!selectedReceipt) return;

    await updateReceipt.mutateAsync({
      id: selectedReceipt.id.toString(),
      updates: {
        status: status as any,
        technicianNotes,
        estimatedAmount: parseInt(estimatedAmount) || selectedReceipt.estimatedAmount,
        paymentStatus: paymentStatus as any,
        amountReceived: parseInt(amountReceived) || 0,
      }
    });

    setSelectedReceipt(null);
    setTechnicianNotes("");
    setStatus("");
    setEstimatedAmount("");
    setPaymentStatus("");
    setAmountReceived("");
    setShowUpdateModal(false);
  };

  const handleQuickStatusUpdate = async (receipt: Receipt, newStatus: string) => {
    // If trying to mark as delivered, show OTP modal instead
    if (newStatus === "Delivered") {
      setOtpReceipt(receipt);
      setShowOtpModal(true);
      return;
    }

    await updateReceipt.mutateAsync({
      id: receipt.id.toString(),
      updates: {
        status: newStatus as any,
      }
    });
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Process": return "bg-blue-100 text-blue-800";
      case "Product Ordered": return "bg-purple-100 text-purple-800";
      case "Ready to Deliver": return "bg-green-100 text-green-800";
      case "Not Repaired - Return As It Is": return "bg-red-100 text-red-800";
      case "Delivered": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading technician dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-background">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 backdrop-blur-md">
        <div className="container-responsive">
          {/* Primary Header */}
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 modern-button rounded-2xl flex items-center justify-center neon-glow">
                <Wrench className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text">New Taj Electronics - Technician Panel</h1>
                <p className="text-xs sm:text-sm text-gray-600">Repair Work & Status Management</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowProfileModal(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">User</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>


        </div>
      </header>

      <div className="container-responsive py-4 sm:py-6">
        {/* Big Clickable Notification Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Pending Work Button */}
          <Button
            onClick={() => setActiveTab("pending")}
            className={`relative p-3 sm:p-4 md:p-6 h-auto bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 ${
              activeTab === "pending" ? "ring-2 sm:ring-4 ring-orange-300 scale-105" : ""
            }`}
          >
            <div className="text-center w-full">
              {pendingReceipts.length > 0 && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold animate-bounce">
                  {pendingReceipts.length}
                </div>
              )}
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{pendingReceipts.length}</div>
              <div className="text-xs sm:text-sm opacity-90">Pending Work</div>
            </div>
          </Button>

          {/* Parts Ordered Button */}
          <Button
            onClick={() => setActiveTab("parts")}
            className={`relative p-3 sm:p-4 md:p-6 h-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 ${
              activeTab === "parts" ? "ring-2 sm:ring-4 ring-purple-300 scale-105" : ""
            }`}
          >
            <div className="text-center w-full">
              {partOrderedReceipts.length > 0 && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold animate-bounce">
                  {partOrderedReceipts.length}
                </div>
              )}
              <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{partOrderedReceipts.length}</div>
              <div className="text-xs sm:text-sm opacity-90">Parts Ordered</div>
            </div>
          </Button>

          {/* Ready to Deliver Button */}
          <Button
            onClick={() => setActiveTab("ready")}
            className={`relative p-3 sm:p-4 md:p-6 h-auto bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 ${
              activeTab === "ready" ? "ring-2 sm:ring-4 ring-green-300 scale-105" : ""
            }`}
          >
            <div className="text-center w-full">
              {readyToDeliverReceipts.length > 0 && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold animate-bounce">
                  {readyToDeliverReceipts.length}
                </div>
              )}
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{readyToDeliverReceipts.length}</div>
              <div className="text-xs sm:text-sm opacity-90">Ready to Deliver</div>
            </div>
          </Button>

          {/* Completed Button */}
          <Button
            onClick={() => setActiveTab("completed")}
            className={`relative p-6 h-auto bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 ${
              activeTab === "completed" ? "ring-4 ring-gray-300" : ""
            }`}
          >
            <div className="text-center w-full">
              {completedReceipts.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-green-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{completedReceipts.length}</div>
              <div className="text-sm opacity-90">Completed</div>
            </div>
          </Button>
        </div>

        {/* Add New Receipt Button */}
        <div className="mb-6 text-center">
          <Button
            onClick={() => setActiveTab("create")}
            className={`p-4 h-auto bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 ${
              activeTab === "create" ? "ring-4 ring-green-300" : ""
            }`}
            size="lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            <span className="text-lg font-medium">Create New Receipt</span>
          </Button>
        </div>

        {/* Search Bar - Only show when viewing work lists */}
        {activeTab !== "create" && (
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <Input
                placeholder="Search receipts by number, customer name, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              <Search className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
            </div>
          </div>
        )}

        {/* Create New Receipt Tab */}
        {activeTab === "create" && (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-green-700">Create New Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <EntryForm onReceiptCreated={handlePrintReceipt} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Receipt Lists for Each Tab */}
        {activeTab !== "create" && (
          <>
            {/* Section Header */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                {activeTab === "pending" && "📋 Pending Work Details"}
                {activeTab === "parts" && "📦 Parts Ordered Details"}
                {activeTab === "ready" && "✅ Ready to Deliver Details"}
                {activeTab === "completed" && "🎉 Completed Work Details"}
              </h2>
              <p className="text-center text-gray-600">
                {activeTab === "pending" && "Items waiting to be processed"}
                {activeTab === "parts" && "Items waiting for parts to arrive"}
                {activeTab === "ready" && "Items ready for customer pickup"}
                {activeTab === "completed" && "Successfully completed repairs"}
              </p>
            </div>

            <div className="grid gap-4">
            {filteredReceipts.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {activeTab === "pending" && "No pending work"}
                  {activeTab === "parts" && "No parts ordered"}
                  {activeTab === "ready" && "No items ready for delivery"}
                  {activeTab === "completed" && "No completed items"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try adjusting your search terms" : "Great! All caught up in this section"}
                </p>
              </Card>
            ) : (
              filteredReceipts.map((receipt) => (
                <Card key={receipt.id} className="modern-card glass-effect shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Receipt Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold gradient-text">{receipt.receiptNumber}</span>
                          <Badge className={getStatusColor(receipt.status)}>{receipt.status}</Badge>
                        </div>
                        <div className="text-gray-700 space-y-1">
                          <p><span className="font-medium">
                            {receipt.isCompanyItem ? "Company:" : "Customer:"}
                          </span> {receipt.isCompanyItem ? receipt.companyName : receipt.customerName}</p>
                          {receipt.isCompanyItem && (
                            <p><span className="font-medium">Who Bought:</span> {receipt.customerName}</p>
                          )}
                          <p><span className="font-medium">Mobile:</span> {receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile}</p>
                          <p><span className="font-medium">Device:</span> {receipt.product} - {receipt.model}</p>
                          <p><span className="font-medium">Issue:</span> {receipt.problemDescription}</p>
                          <p><span className="font-medium">Amount:</span> ₹{receipt.estimatedAmount.toLocaleString()}</p>
                          <p><span className="font-medium">Payment:</span> 
                            <Badge className={`ml-2 ${receipt.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                              {receipt.paymentStatus || 'Pending'}
                            </Badge>
                          </p>
                          {receipt.technicianNotes && (
                            <p><span className="font-medium">Notes:</span> {receipt.technicianNotes}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 md:min-w-[200px]">
                        <Button
                          onClick={() => handleSelectReceipt(receipt)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Update Status
                        </Button>
                        
                        {/* Quick Status Updates */}
                        {receipt.status === "Pending" && (
                          <Button
                            onClick={() => handleQuickStatusUpdate(receipt, "In Process")}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            size="sm"
                          >
                            Start Work
                          </Button>
                        )}
                        
                        {receipt.status === "In Process" && (
                          <Button
                            onClick={() => handleQuickStatusUpdate(receipt, "Product Ordered")}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            Order Parts
                          </Button>
                        )}
                        
                        {receipt.status === "Product Ordered" && (
                          <Button
                            onClick={() => handleQuickStatusUpdate(receipt, "Ready to Deliver")}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            Mark Ready
                          </Button>
                        )}
                        
                        {receipt.status === "Ready to Deliver" && (
                          <Button
                            onClick={() => handleQuickStatusUpdate(receipt, "Delivered")}
                            className="w-full bg-gray-600 hover:bg-gray-700"
                            size="sm"
                          >
                            Mark Delivered
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handlePrintReceipt(receipt)}
                            size="sm"
                            className="flex-1"
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(`/track/${receipt.receiptNumber}`, '_blank')}
                            size="sm"
                            className="flex-1"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Track
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(`tel:${receipt.mobile}`, '_self')}
                            size="sm"
                            className="flex-1"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          </>
        )}
      </div>

      {/* Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Receipt - {selectedReceipt?.receiptNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-6">
              {/* Receipt Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedReceipt.customerName}</p>
                  <p><span className="font-medium">Mobile:</span> {selectedReceipt.mobile}</p>
                  <p><span className="font-medium">Device:</span> {selectedReceipt.product} - {selectedReceipt.model}</p>
                  <p><span className="font-medium">Issue:</span> {selectedReceipt.problemDescription}</p>
                  <p><span className="font-medium">Current Amount:</span> ₹{selectedReceipt.estimatedAmount.toLocaleString()}</p>
                  <p><span className="font-medium">Payment Status:</span> 
                    <Badge className={`ml-2 ${selectedReceipt.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {selectedReceipt.paymentStatus || 'Pending'}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Update Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Update Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">⏳ Pending</SelectItem>
                      <SelectItem value="In Process">🔧 In Process</SelectItem>
                      <SelectItem value="Product Ordered">📦 Product Ordered</SelectItem>
                      <SelectItem value="Ready to Deliver">✅ Ready to Deliver</SelectItem>
                      <SelectItem value="Not Repaired - Return As It Is">❌ Not Repaired - Return As It Is</SelectItem>
                      <SelectItem value="Delivered">📋 Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedAmount">Update Amount (₹)</Label>
                  <Input
                    id="estimatedAmount"
                    type="number"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    placeholder="Enter new amount"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">💰 Pending</SelectItem>
                      <SelectItem value="Partial">📊 Partial Payment</SelectItem>
                      <SelectItem value="Paid">✅ Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountReceived">Amount Received (₹)</Label>
                  <Input
                    id="amountReceived"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter amount received"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Technician Notes</Label>
                <Textarea
                  id="notes"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Add work progress, parts used, issues found, or any updates..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  onClick={handleUpdateReceipt}
                  disabled={updateReceipt.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateReceipt.isPending ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Receipt Modal */}
      <ReceiptModal 
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />

      {/* Profile Modal */}
      <ProfileModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        userId={parseInt(localStorage.getItem("userId") || "3")}
      />

      {/* OTP Modal */}
      <OtpModal 
        receipt={otpReceipt}
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setOtpReceipt(null);
        }}
      />
    </div>
  );
}
