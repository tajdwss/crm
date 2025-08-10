

import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, CheckCircle, Package, Truck, User, Phone, MapPin, FileText } from "lucide-react";
import { Receipt, ServiceComplaint, ServiceVisit } from "@/types";
import { format } from 'date-fns';

// Add ReceiptIcon component
const ReceiptIcon = ({ className }: { className?: string }) => (
  <FileText className={className} />
);

export default function CustomerTracking() {
  const [, params] = useRoute("/track/:receiptNumber");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!params?.receiptNumber) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch tracking data from our backend API
        const response = await fetch(`/api/track/${params.receiptNumber}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Tracking number not found. Please check your receipt or service number.");
          } else {
            setError("Failed to load tracking information.");
          }
          return;
        }
        
        const data = await response.json();
        setTrackingData(data);
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError("Failed to load tracking information.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [params?.receiptNumber]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "In Process":
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case "Product Ordered":
        return <Package className="w-5 h-5 text-purple-600" />;
      case "Ready to Deliver":
        return <Truck className="w-5 h-5 text-green-600" />;
      case "Not Repaired - Return As It Is":
        return <Wrench className="w-5 h-5 text-red-600" />;
      case "Delivered":
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "In Process":
        return "status-in-process";
      case "Product Ordered":
        return "status-product-ordered";
      case "Ready to Deliver":
        return "status-ready-to-deliver";
      case "Not Repaired - Return As It Is":
        return "status-not-repairable";
      case "Delivered":
        return "status-delivered";
      default:
        return "status-pending";
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "Pending":
        return 20;
      case "In Process":
        return 40;
      case "Product Ordered":
        return 60;
      case "Ready to Deliver":
        return 80;
      case "Not Repaired - Return As It Is":
        return 100; // Show as complete since it's ready for pickup
      case "Delivered":
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading repair status...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Number Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "We couldn't find a receipt with this number."}
            </p>
            <p className="text-sm text-gray-500">
              Please check your receipt number (TD###) or service number (TE###) and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render based on tracking data type
  const renderContent = () => {
    if (!trackingData) return null;
    
    if (trackingData.type === "receipt") {
      return renderReceiptTracking(trackingData.data);
    } else if (trackingData.type === "service") {
      return renderServiceTracking(trackingData.data);
    }
    
    return <div>Unknown tracking data type</div>;
  };

  const renderReceiptTracking = (receipt: Receipt) => (
    <>
      {/* Professional Receipt Info Card */}
      <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold">Receipt {receipt.receiptNumber}</span>
                <p className="text-slate-200 text-sm mt-1">Professional Repair Service</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(receipt.status)} text-sm px-3 py-1 font-medium`}>
              {receipt.status === "Not Repaired - Return As It Is" ? "Not Repairable" : receipt.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-5 h-5 text-slate-600" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Customer Name</span>
                    <p className="font-medium text-slate-800">{receipt.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Mobile Number</span>
                    <p className="font-medium text-slate-800">{receipt.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Address</span>
                    <p className="font-medium text-slate-800">{receipt.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-200 pb-2">
                <Package className="w-5 h-5 text-slate-600" />
                Device Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Package className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Product</span>
                    <p className="font-medium text-slate-800">{receipt.product}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Wrench className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Issue Description</span>
                    <p className="font-medium text-slate-800">{receipt.issueDescription}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-600">Received Date</span>
                    <p className="font-medium text-slate-800">{format(receipt.createdAt, "MMM dd, yyyy 'at' HH:mm")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Progress Tracker */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold">Repair Progress</span>
              <p className="text-blue-100 text-sm mt-1">Track your device repair status</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="relative">
            {/* Enhanced Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 mb-12 shadow-inner">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 shadow-lg ${
                  receipt.status === "Not Repaired - Return As It Is" 
                    ? "bg-gradient-to-r from-red-500 to-red-600" 
                    : "bg-gradient-to-r from-blue-500 to-indigo-600"
                }`}
                style={{ width: `${getProgressPercentage(receipt.status)}%` }}
              ></div>
            </div>
            
            {/* Professional Status Steps */}
            <div className="flex justify-between">
              {[
                { status: "Pending", label: "Received", icon: Clock },
                { status: "In Process", label: "In Process", icon: Wrench },
                { status: "Product Ordered", label: "Parts Ordered", icon: Package },
                { status: "Ready to Deliver", label: "Ready", icon: CheckCircle },
                { status: "Delivered", label: "Delivered", icon: Truck }
              ].map((step, index) => {
                const isActive = getProgressPercentage(receipt.status) >= (index + 1) * 20;
                const isCurrent = receipt.status === step.status;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.status} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-110' 
                        : 'bg-slate-200 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-blue-200 animate-pulse' : ''}`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-sm text-center font-medium ${
                      isActive ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Professional Status Messages */}
          {receipt.status === "Delivered" && receipt.deliveredAt && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-green-800 font-bold text-lg">Repair Completed Successfully!</h4>
                  <p className="text-green-700">
                    Your device was delivered on {format(receipt.deliveredAt, "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {receipt.status === "Ready to Deliver" && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-blue-800 font-bold text-lg">Ready for Pickup!</h4>
                  <p className="text-blue-700">
                    Your repair is complete and ready for collection. We'll contact you shortly.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {receipt.status === "Not Repaired - Return As It Is" && (
            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-red-800 font-bold text-lg">Unable to Repair</h4>
                  <p className="text-red-700">
                    Unfortunately, your device could not be repaired. Please collect it as-is from our service center. No charges will be applied.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderServiceTracking = (serviceData: any) => (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <span>Service {serviceData.complaintNumber}</span>
            <Badge className={getStatusColor(serviceData.status)}>
              {serviceData.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Name:</span> {serviceData.customerName}</p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Mobile:</span> {serviceData.mobile}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Address:</span> {serviceData.address}
                </p>
                <p><span className="text-gray-600">Service Date:</span> {format(serviceData.createdAt, "MMM dd, yyyy")}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Product:</span> {serviceData.product}</p>
                <p><span className="text-gray-600">Model:</span> {serviceData.model}</p>
                <p><span className="text-gray-600">Engineer:</span> {serviceData.engineerId ? `Engineer #${serviceData.engineerId}` : 'Not Assigned'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Issue Description</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {serviceData.issueDescription}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Visits */}
      {serviceData.visits && serviceData.visits.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service Visit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceData.visits.map((visit: ServiceVisit, index: number) => (
                <div key={visit.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Visit #{index + 1}</h4>
                    <span className="text-sm text-gray-500">
                      {format(visit.createdAt, "MMM dd, yyyy")}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="text-gray-600">Check-in:</span> {visit.checkInTime ? format(visit.checkInTime, "HH:mm") : 'Not checked in'}</p>
                      <p><span className="text-gray-600">Check-out:</span> {visit.checkOutTime ? format(visit.checkOutTime, "HH:mm") : 'Not checked out'}</p>
                    </div>
                    
                    <div>
                      <p><span className="text-gray-600">Parts Issued:</span> {visit.partsIssued || 'None'}</p>
                      <p><span className="text-gray-600">Work Done:</span> {visit.workDescription || 'No details'}</p>
                    </div>
                  </div>
                  
                  {visit.visitNotes && (
                    <div className="mt-3">
                      <p className="text-sm"><span className="text-gray-600">Notes:</span> {visit.visitNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceData.status === "Completed" && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Your service request has been completed successfully!
              </p>
            </div>
          )}
          
          {serviceData.status === "Assigned" && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                🔧 Your service request has been assigned to an engineer. They will contact you soon.
              </p>
            </div>
          )}
          
          {serviceData.status === "Pending" && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 font-medium">
                ⏳ Your service request is being processed. We'll assign an engineer shortly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Wrench className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">TAJ Electronics</h1>
                <p className="text-sm text-slate-600">Professional Repair Tracking</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Professional Service Center</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}









