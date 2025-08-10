import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  MessageSquare,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  whoBought?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  address: string;
  whoBought: string;
}

export default function CustomerSearch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    mobile: "",
    email: "",
    address: "",
    whoBought: "",
  });

  // Fetch customers
  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiRequest("/api/customers"),
  });

  // Search customers
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["customers", "search", searchTerm],
    queryFn: () => apiRequest(`/api/customers/search/${encodeURIComponent(searchTerm)}`),
    enabled: searchTerm.length > 2,
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiRequest("/api/customers", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) => 
      apiRequest(`/api/customers/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/customers/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  // Import customers mutation
  const importCustomersMutation = useMutation({
    mutationFn: (customersData: any[]) => apiRequest("/api/customers/import", {
      method: "POST",
      body: { customers: customersData },
    }),
    onSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `Imported ${data.imported} customers. ${data.errors} errors.`,
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsImportDialogOpen(false);
      setImportData("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import customers",
        variant: "destructive",
      });
    },
  });

  // Send statement mutation
  const sendStatementMutation = useMutation({
    mutationFn: (customerId: number) => apiRequest(`/api/customers/${customerId}/statement`, {
      method: "POST",
    }),
    onSuccess: (data) => {
      toast({
        title: "Statement Sent",
        description: `Statement sent to ${data.customer} via WhatsApp`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send statement",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      email: "",
      address: "",
      whoBought: "",
    });
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      toast({
        title: "Error",
        description: "Name and mobile number are required",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(formData);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !formData.name || !formData.mobile) {
      toast({
        title: "Error",
        description: "Name and mobile number are required",
        variant: "destructive",
      });
      return;
    }
    updateCustomerMutation.mutate({ id: editingCustomer.id, data: formData });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      address: customer.address || "",
      whoBought: customer.whoBought || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const handleImportCustomers = () => {
    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const customersData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const customer: any = {};
        headers.forEach((header, index) => {
          customer[header] = values[index] || '';
        });
        return customer;
      });
      
      importCustomersMutation.mutate(customersData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid CSV format",
        variant: "destructive",
      });
    }
  };

  const handleExportCustomers = () => {
    const csvData = customers.map(customer => ({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      address: customer.address || '',
      whoBought: customer.whoBought || '',
      createdAt: customer.createdAt
    }));

    const csvHeaders = 'Name,Mobile,Email,Address,Who Bought,Created At\n';
    const csvRows = csvData.map(row => 
      `"${row.name}","${row.mobile}","${row.email}","${row.address}","${row.whoBought}","${row.createdAt}"`
    ).join('\n');
    
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendStatement = (customer: Customer) => {
    if (confirm(`Send statement to ${customer.name} via WhatsApp?`)) {
      sendStatementMutation.mutate(customer.id);
    }
  };

  const displayedCustomers = searchTerm.length > 2 ? searchResults : customers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Management</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage customers, import/export, and send statements</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Actions Bar */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                      placeholder="Search customers by name, mobile, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12"
                  />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCustomer} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Customer Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter customer name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mobile">Mobile Number *</Label>
                          <Input
                            id="mobile"
                            value={formData.mobile}
                            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                            placeholder="Enter mobile number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter address"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="whoBought">Who Bought</Label>
                          <Input
                            id="whoBought"
                            value={formData.whoBought}
                            onChange={(e) => setFormData(prev => ({ ...prev, whoBought: e.target.value }))}
                            placeholder="Who purchased the item"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createCustomerMutation.isPending}>
                            {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Import Customers from CSV</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="importData">CSV Data</Label>
                          <Textarea
                            id="importData"
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            placeholder="Paste CSV data here (Name,Mobile,Email,Address,Who Bought)"
                            rows={10}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                            Cancel
                          </Button>
                <Button 
                            onClick={handleImportCustomers}
                            disabled={importCustomersMutation.isPending}
                          >
                            {importCustomersMutation.isPending ? "Importing..." : "Import Customers"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleExportCustomers}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
            <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Customers ({displayedCustomers.length})
              </h2>
              {isLoading && <div className="text-sm text-gray-600">Loading...</div>}
            </div>

            {displayedCustomers.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
                  <p className="text-gray-600">
                    {searchTerm.length > 2 
                      ? `No customers found for "${searchTerm}". Try a different search term.`
                      : "No customers in the system. Create your first customer to get started."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedCustomers.map((customer: Customer) => (
                  <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                              {customer.mobile}
                              </p>
                            </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCustomer(customer)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCustomer(customer)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                  </div>

                        {customer.email && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {customer.email}
                          </p>
                        )}

                        {customer.address && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{customer.address}</span>
                          </p>
                        )}

                        {customer.whoBought && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Who Bought:</span> {customer.whoBought}
                                </p>
                              )}

                        <div className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendStatement(customer)}
                            disabled={sendStatementMutation.isPending}
                            className="flex-1"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Statement
                          </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
              )}
            </div>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Customer Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-mobile">Mobile Number *</Label>
              <Input
                id="edit-mobile"
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-whoBought">Who Bought</Label>
              <Input
                id="edit-whoBought"
                value={formData.whoBought}
                onChange={(e) => setFormData(prev => ({ ...prev, whoBought: e.target.value }))}
                placeholder="Who purchased the item"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}





