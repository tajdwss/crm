import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Package, 
  Wrench, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  RotateCcw,
  Building,
  ArrowLeft
} from "lucide-react";
import { useCreateReceipt } from "@/hooks/use-receipts";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import { useFindOrCreateCustomer } from "@/hooks/use-customers";
import { FormData, Receipt } from "@/types";
import { useToast } from "@/hooks/use-toast";

const initialFormData: FormData = {
  customerName: "",
  mobile: "",
  isCompanyItem: false,
  companyName: "",
  companyMobile: "",
  rgpNumber: "",
  rgpDate: "",
  product: "",
  model: "",
  problemDescription: "",
  additionalAccessories: "",
  estimatedAmount: "",
  estimatedDeliveryDate: "",
  status: "Pending",
};

interface EntryFormProps {
  onReceiptCreated?: (receipt: Receipt) => void;
  onBack?: () => void;
  isModal?: boolean;
}

export function EntryForm({
  onReceiptCreated,
  onBack,
  isModal = false
}: EntryFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("customer");

  const createReceipt = useCreateReceipt();
  const findOrCreateCustomer = useFindOrCreateCustomer();
  const { toast } = useToast();

  const tabs = [
    { id: "customer", label: "Customer Information", shortLabel: "Customer", icon: User },
    { id: "product", label: "Product Information", shortLabel: "Product", icon: Package },
    { id: "service", label: "Service Details", shortLabel: "Service", icon: Wrench },
    { id: "pricing", label: "Pricing & Timeline", shortLabel: "Pricing", icon: DollarSign },
    { id: "summary", label: "Summary", shortLabel: "Summary", icon: FileText },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // First, save customer to database (find existing or create new)
      const customerData = {
        name: formData.customerName,
        mobile: formData.mobile,
        email: null,
        address: null,
        whoBought: formData.isCompanyItem ? formData.companyName : null,
      };

      await findOrCreateCustomer.mutateAsync(customerData);

      // If company item, also save company as customer
      if (formData.isCompanyItem && formData.companyName && formData.companyMobile) {
        const companyData = {
          name: formData.companyName,
          mobile: formData.companyMobile,
          email: null,
          address: null,
          whoBought: formData.customerName,
        };
        await findOrCreateCustomer.mutateAsync(companyData);
      }

      // Create receipt
      const receiptData = {
        customerName: formData.customerName,
        mobile: formData.mobile,
        isCompanyItem: formData.isCompanyItem,
        companyName: formData.companyName || undefined,
        companyMobile: formData.companyMobile || undefined,
        rgpNumber: formData.rgpNumber || undefined,
        rgpDate: formData.rgpDate || undefined,
        product: formData.product,
        model: formData.model || "",
        problemDescription: formData.problemDescription || "",
        additionalAccessories: formData.additionalAccessories || "",
        estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : 0,
        estimatedDeliveryDate: formData.estimatedDeliveryDate || "",
        status: formData.status as any,
      };

      console.log("Submitting receipt data:", receiptData);
      const newReceipt = await createReceipt.mutateAsync(receiptData);
      console.log("Receipt created successfully:", newReceipt);

      // Reset form
      setFormData(initialFormData);
      setActiveTab("customer");

      // Show success message
      toast({
        title: "Receipt Created Successfully",
        description: `Receipt ${newReceipt.receiptNumber} has been generated. Customer data saved.`,
      });

      // Call the callback with the new receipt (this will close modal if in modal mode)
      if (onReceiptCreated) {
        onReceiptCreated(newReceipt);
      }

    } catch (error) {
      console.error("Error creating receipt:", error);
      toast({
        title: "Error",
        description: `Failed to create receipt: ${(error as any)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setActiveTab("customer");
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customer: { name: string; mobile: string }) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      mobile: customer.mobile
    }));
  };

  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default behavior - go to admin dashboard
      setLocation("/admin-dashboard");
    }
  };

  return (
    <div className={`w-full ${isModal ? 'bg-white' : 'min-h-screen bg-gray-50'} ${isModal ? '' : 'p-2 sm:p-4'}`}>
      <div className={isModal ? '' : 'max-w-4xl mx-auto'}>
        <div className={`bg-white rounded-lg ${isModal ? '' : 'shadow-sm border'} overflow-hidden`}>
          {/* Header */}
          {!isModal && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-center">Create New Receipt</h1>
              <p className="text-blue-100 text-center mt-1 text-sm">Fill in the details to generate receipt</p>
            </div>
          )}

          {/* Tab Navigation - Mobile Optimized */}
          <div className="border-b bg-gray-50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-w-0 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline text-xs sm:text-sm">{tab.label}</span>
                    <span className="sm:hidden text-xs leading-tight text-center">
                      {tab.shortLabel || tab.label.split(' ')[0]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Content - Mobile Optimized */}
          <div className="p-3 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              
              {/* Customer Tab */}
              {activeTab === "customer" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Customer Information</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Enter customer and company details</p>
                  </div>

                  {/* Company Item Checkbox - Mobile Optimized */}
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="isCompanyItem"
                        checked={formData.isCompanyItem}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, isCompanyItem: checked as boolean }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="isCompanyItem" className="text-sm font-medium text-blue-900 cursor-pointer">
                          This is a company item
                        </Label>
                        <p className="text-xs text-blue-700 mt-1">
                          Check this if the device belongs to a company
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details - Mobile First Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customer Details</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Required</Badge>
                    </div>

                    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-2">
                        <CustomerAutocomplete
                          id="customerName"
                          label="Customer Name"
                          value={formData.customerName}
                          onChange={(value) => updateField("customerName", value)}
                          onCustomerSelect={handleCustomerSelect}
                          placeholder="Enter or select customer name"
                          type="name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <CustomerAutocomplete
                          id="mobile"
                          label="Mobile Number"
                          value={formData.mobile}
                          onChange={(value) => updateField("mobile", value)}
                          onCustomerSelect={handleCustomerSelect}
                          placeholder="Enter or select mobile number"
                          type="mobile"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Details - Mobile Optimized */}
                  {formData.isCompanyItem && (
                    <div className="space-y-4 bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Building className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Company Details</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">Required</Badge>
                      </div>

                      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                        <div className="space-y-2">
                          <CustomerAutocomplete
                            id="companyName"
                            label="Company Name"
                            value={formData.companyName}
                            onChange={(value) => updateField("companyName", value)}
                            onCustomerSelect={(customer) => {
                              setFormData(prev => ({
                                ...prev,
                                companyName: customer.name,
                                companyMobile: customer.mobile
                              }));
                            }}
                            placeholder="Enter or select company name"
                            type="name"
                            required={formData.isCompanyItem}
                          />
                        </div>

                        <div className="space-y-2">
                          <CustomerAutocomplete
                            id="companyMobile"
                            label="Company Mobile"
                            value={formData.companyMobile}
                            onChange={(value) => updateField("companyMobile", value)}
                            onCustomerSelect={(customer) => {
                              setFormData(prev => ({
                                ...prev,
                                companyName: customer.name,
                                companyMobile: customer.mobile
                              }));
                            }}
                            placeholder="Enter or select company mobile"
                            type="mobile"
                            required={formData.isCompanyItem}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Tab */}
              {activeTab === "product" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Information</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Enter device and product details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Device Details</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">Required</Badge>
                    </div>

                    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product" className="text-sm font-medium text-gray-700">
                          Product Type <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="product"
                          value={formData.product}
                          onChange={(e) => updateField("product", e.target.value)}
                          placeholder="e.g., Mobile, Laptop, TV"
                          className="w-full h-11 sm:h-12 text-base"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                          Model <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => updateField("model", e.target.value)}
                          placeholder="e.g., iPhone 13, Dell Inspiron"
                          className="w-full h-11 sm:h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rgpNumber" className="text-sm font-medium text-gray-700">
                          RGP Number
                        </Label>
                        <Input
                          id="rgpNumber"
                          value={formData.rgpNumber}
                          onChange={(e) => updateField("rgpNumber", e.target.value)}
                          placeholder="Enter RGP number if available"
                          className="w-full h-11 sm:h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rgpDate" className="text-sm font-medium text-gray-700">
                          RGP Date
                        </Label>
                        <Input
                          id="rgpDate"
                          type="date"
                          value={formData.rgpDate}
                          onChange={(e) => updateField("rgpDate", e.target.value)}
                          className="w-full h-11 sm:h-12 text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Tab */}
              {activeTab === "service" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Service Details</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Describe the problem and service requirements</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Problem Description</h3>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">Required</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="problemDescription" className="text-sm font-medium text-gray-700">
                        Problem Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="problemDescription"
                        value={formData.problemDescription}
                        onChange={(e) => updateField("problemDescription", e.target.value)}
                        placeholder="Describe the issue with the device..."
                        className="w-full min-h-[100px] text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalAccessories" className="text-sm font-medium text-gray-700">
                        Additional Accessories
                      </Label>
                      <Textarea
                        id="additionalAccessories"
                        value={formData.additionalAccessories}
                        onChange={(e) => updateField("additionalAccessories", e.target.value)}
                        placeholder="List any accessories provided with the device..."
                        className="w-full min-h-[80px] text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === "pricing" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pricing & Timeline</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Set estimated cost and delivery timeline</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cost & Timeline</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Required</Badge>
                    </div>

                    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estimatedAmount" className="text-sm font-medium text-gray-700">
                          Estimated Amount (₹) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="estimatedAmount"
                          type="number"
                          value={formData.estimatedAmount}
                          onChange={(e) => updateField("estimatedAmount", e.target.value)}
                          placeholder="Enter estimated cost"
                          className="w-full h-11 sm:h-12 text-base"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estimatedDeliveryDate" className="text-sm font-medium text-gray-700">
                          Estimated Delivery Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="estimatedDeliveryDate"
                          type="date"
                          value={formData.estimatedDeliveryDate}
                          onChange={(e) => updateField("estimatedDeliveryDate", e.target.value)}
                          className="w-full h-11 sm:h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === "summary" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Summary</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Review all details before creating receipt</p>
                  </div>

                  <div className="space-y-4">
                    {/* Customer Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Customer Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Name:</span> {formData.customerName}</div>
                        <div><span className="font-medium">Mobile:</span> {formData.mobile}</div>
                        {formData.isCompanyItem && (
                          <>
                            <div><span className="font-medium">Company:</span> {formData.companyName}</div>
                            <div><span className="font-medium">Company Mobile:</span> {formData.companyMobile}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Product Summary */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-base font-semibold text-green-900 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Product Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Product:</span> {formData.product}</div>
                        <div><span className="font-medium">Model:</span> {formData.model}</div>
                        {formData.rgpNumber && <div><span className="font-medium">RGP Number:</span> {formData.rgpNumber}</div>}
                        {formData.rgpDate && <div><span className="font-medium">RGP Date:</span> {formData.rgpDate}</div>}
                      </div>
                    </div>

                    {/* Service Summary */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="text-base font-semibold text-orange-900 mb-3 flex items-center">
                        <Wrench className="w-4 h-4 mr-2" />
                        Service Details
                      </h3>
                      <div className="text-sm space-y-2">
                        <div><span className="font-medium">Problem:</span> {formData.problemDescription}</div>
                        {formData.additionalAccessories && (
                          <div><span className="font-medium">Accessories:</span> {formData.additionalAccessories}</div>
                        )}
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="text-base font-semibold text-purple-900 mb-3 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Pricing & Timeline
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Estimated Amount:</span> ₹{formData.estimatedAmount}</div>
                        <div><span className="font-medium">Delivery Date:</span> {formData.estimatedDeliveryDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons - Mobile Optimized */}
              <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base order-2 sm:order-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear Form
                  </Button>
                  
                  <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                    {activeTab !== "customer" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                          if (currentIndex > 0) {
                            setActiveTab(tabs[currentIndex - 1].id);
                          }
                        }}
                        className="flex-1 sm:flex-none h-11 sm:h-12 text-sm sm:text-base"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
                        Previous
                      </Button>
                    )}

                    {isModal && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 sm:flex-none h-11 sm:h-12 text-sm sm:text-base"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                        Close
                      </Button>
                    )}

                    {activeTab !== "summary" ? (
                      <Button
                        type="button"
                        onClick={() => {
                          const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                          if (currentIndex < tabs.length - 1) {
                            setActiveTab(tabs[currentIndex + 1].id);
                          }
                        }}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 h-11 sm:h-12 text-sm sm:text-base"
                      >
                        <span className="hidden xs:inline">Next</span>
                        <span className="xs:hidden">Next</span>
                        <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={createReceipt.isPending}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 h-11 sm:h-12 text-sm sm:text-base"
                      >
                        <Save className="w-4 h-4 mr-1 sm:mr-2" />
                        {createReceipt.isPending ? "Creating..." : "Create Receipt"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}



