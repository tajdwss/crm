import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, User, Phone, MapPin, Wrench, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import { useFindOrCreateCustomer } from "@/hooks/use-customers";

export default function CustomerServiceRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState("");
  const findOrCreateCustomer = useFindOrCreateCustomer();

  const [formData, setFormData] = useState({
    customerName: "",
    mobile: "",
    location: "",
    product: "",
    issueDescription: "",
    priority: "Normal"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customer: { name: string; mobile: string; address?: string | null }) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      mobile: customer.mobile,
      location: customer.address || prev.location
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerName || !formData.mobile || !formData.location || !formData.product || !formData.issueDescription) {
      toast({
        title: "Please fill all required fields",
        description: "All fields marked with * are required",
        variant: "destructive"
      });
      return;
    }

    // Mobile number validation
    if (formData.mobile.length < 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, save customer to database (find existing or create new)
      const customerData = {
        name: formData.customerName,
        mobile: formData.mobile,
        email: null,
        address: formData.location || null,
        whoBought: null,
      };

      await findOrCreateCustomer.mutateAsync(customerData);

      // Create service complaint
      const response = await apiRequest("/api/service-complaints", {
        method: "POST",
        body: {
          customerName: formData.customerName,
          mobile: formData.mobile,
          address: formData.location || "", // Use location as address
          product: formData.product,
          model: "", // Optional field, set as empty string
          issueDescription: formData.issueDescription,
          priority: formData.priority,
          status: "Pending",
          assignedEngineerId: null
        }
      });

      setComplaintNumber(response.complaintNumber);
      setIsSubmitted(true);
      
      toast({
        title: "Service Request Submitted Successfully!",
        description: `Your service complaint number is: ${response.complaintNumber}`,
      });

    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "Error submitting request",
        description: "Please try again later or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Service Request</h1>
                  <p className="text-sm text-gray-600">Request Submitted Successfully</p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Request Submitted Successfully!
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">Your Service Complaint Number:</p>
                <p className="text-3xl font-bold text-blue-600">{complaintNumber}</p>
              </div>

              <div className="text-left space-y-3 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Service Assignment</p>
                    <p className="text-xs text-gray-600">Our team will assign a service engineer to your request</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Engineer Contact</p>
                    <p className="text-xs text-gray-600">The engineer will contact you to schedule a visit</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Service Visit</p>
                    <p className="text-xs text-gray-600">The engineer will visit your location to resolve the issue</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setLocation("/customer-tracking")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Track Your Request
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1"
                >
                  Back to Home
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Keep your complaint number <strong>{complaintNumber}</strong> for future reference
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Service Request</h1>
                <p className="text-sm text-gray-600">Submit your repair service request</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-green-600" />
              <span>Submit Service Request</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Fill out the form below to request a service engineer visit for your device repair.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <CustomerAutocomplete
                  id="customerName"
                  label="Customer Name"
                  value={formData.customerName}
                  onChange={(value) => handleInputChange("customerName", value)}
                  onCustomerSelect={handleCustomerSelect}
                  placeholder="Enter or select your name"
                  type="name"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <CustomerAutocomplete
                  id="mobile"
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={(value) => handleInputChange("mobile", value)}
                  onCustomerSelect={handleCustomerSelect}
                  placeholder="Enter or select your mobile number"
                  type="mobile"
                  required
                />
              </div>

              {/* Service Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Service Location *</span>
                </label>
                <Textarea
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter your complete address where service is required"
                  required
                  rows={3}
                />
              </div>

              {/* Product/Device */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Device/Product Type *
                </label>
                <Select onValueChange={(value) => handleInputChange("product", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile Phone">Mobile Phone</SelectItem>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Desktop Computer">Desktop Computer</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Television">Television</SelectItem>
                    <SelectItem value="Air Conditioner">Air Conditioner</SelectItem>
                    <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                    <SelectItem value="Washing Machine">Washing Machine</SelectItem>
                    <SelectItem value="Microwave">Microwave</SelectItem>
                    <SelectItem value="Printer">Printer</SelectItem>
                    <SelectItem value="Other Electronics">Other Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Issue Description *
                </label>
                <Textarea
                  value={formData.issueDescription}
                  onChange={(e) => handleInputChange("issueDescription", e.target.value)}
                  placeholder="Describe the problem with your device in detail"
                  required
                  rows={4}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Priority Level
                </label>
                <Select 
                  defaultValue="Normal" 
                  onValueChange={(value) => handleInputChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low - Non-urgent</SelectItem>
                    <SelectItem value="Normal">Normal - Standard service</SelectItem>
                    <SelectItem value="High">High - Urgent repair needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting Request...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Service Request
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                * Required fields. Our team will contact you within 24 hours to schedule the service visit.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
