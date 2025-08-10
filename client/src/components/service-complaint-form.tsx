import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import { useFindOrCreateCustomer } from "@/hooks/use-customers";
import { Settings, MapPin, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ServiceComplaint {
  id: number;
  complaintNumber: string;
  customerName: string;
  mobile: string;
  address: string;
  product: string;
  model: string;
  issueDescription: string;
  status: string;
  createdAt: string;
}

interface ServiceComplaintFormProps {
  onComplaintCreated?: (complaint: ServiceComplaint) => void;
}

export function ServiceComplaintForm({ onComplaintCreated }: ServiceComplaintFormProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    mobile: "",
    address: "",
    product: "",
    issueDescription: "",
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const findOrCreateCustomer = useFindOrCreateCustomer();

  const createComplaintMutation = useMutation({
    mutationFn: (complaintData: any) => 
      apiRequest("/api/service-complaints", { method: "POST", body: complaintData }),
    onSuccess: (complaint) => {
      toast({
        title: "Service Complaint Created",
        description: `Complaint ${complaint.complaintNumber} has been logged successfully`,
      });
      setFormData({
        customerName: "",
        mobile: "",
        address: "",
        product: "",
        issueDescription: "",
      });
      setIsExpanded(false);
      onComplaintCreated?.(complaint);
      queryClient.invalidateQueries({ queryKey: ["/api/service-complaints"] });
    },
    onError: (error) => {
      console.error("Service complaint form error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service complaint",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.mobile || !formData.address || !formData.product || !formData.issueDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in: Name, Mobile, Location, Product, and Issue Description",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, save customer to database (find existing or create new)
      const customerData = {
        name: formData.customerName.trim(),
        mobile: formData.mobile.trim(),
        email: null,
        address: formData.address.trim(),
        whoBought: null,
      };

      await findOrCreateCustomer.mutateAsync(customerData);

      // Create service complaint
      const complaintData = {
        customerName: formData.customerName.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        product: formData.product.trim(),
        issueDescription: formData.issueDescription.trim(),
        priority: "Normal",
        status: "Pending",
      };

      console.log("Submitting complaint data:", complaintData);
      createComplaintMutation.mutate(complaintData);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: { name: string; mobile: string }) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      mobile: customer.mobile,
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-orange-600" />
            <span>Create Service Request</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-600 hover:text-orange-700"
          >
            <Plus className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
            {isExpanded ? 'Close' : 'New Request'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomerAutocomplete
                id="customerName"
                label="Customer Name"
                value={formData.customerName}
                onChange={(value) => handleInputChange("customerName", value)}
                onCustomerSelect={handleCustomerSelect}
                placeholder="Enter customer name"
                type="name"
                required
              />
              
              <CustomerAutocomplete
                id="mobile"
                label="Mobile Number"
                value={formData.mobile}
                onChange={(value) => handleInputChange("mobile", value)}
                onCustomerSelect={handleCustomerSelect}
                placeholder="Enter mobile number"
                type="mobile"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Location *</Label>
              <div className="relative">
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter location/address for service"
                  required
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Complaint Regarding (Product/Device) *</Label>
              <Input
                id="product"
                type="text"
                value={formData.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
                placeholder="e.g., Washing Machine, AC, Refrigerator, Mobile Phone"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDescription">Issue Description *</Label>
              <Textarea
                id="issueDescription"
                value={formData.issueDescription}
                onChange={(e) => handleInputChange("issueDescription", e.target.value)}
                placeholder="Describe the problem in detail"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={createComplaintMutation.isPending}
              >
                {createComplaintMutation.isPending ? "Creating..." : "Submit Request"}
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> Service complaints are assigned a TE prefix (TE001, TE002, etc.) 
              and can be tracked by both customers and service engineers.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}