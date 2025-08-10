import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  whoBought?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertCustomer {
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  whoBought?: string | null;
}

// Get all customers
export function useCustomers() {
  return useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiRequest("/api/customers"),
  });
}

// Get customer by ID
export function useCustomer(id: number) {
  return useQuery({
    queryKey: ["/api/customers", id],
    queryFn: () => apiRequest(`/api/customers/${id}`),
    enabled: !!id,
  });
}

// Search customers
export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: ["/api/customers/search", query],
    queryFn: () => apiRequest(`/api/customers/search/${encodeURIComponent(query)}`),
    enabled: query.length > 2,
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      const response = await apiRequest("/api/customers", {
        method: "POST",
        body: customerData,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer Created",
        description: `Customer ${data.name} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Customer> }) => {
      const response = await apiRequest(`/api/customers/${id}`, {
        method: "PUT",
        body: updates,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", data.id] });
      toast({
        title: "Customer Updated",
        description: `Customer ${data.name} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/customers/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Find or create customer (for auto-saving during receipt/service creation)
export function useFindOrCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      // First try to find existing customer by mobile
      try {
        const existingCustomer = await apiRequest(`/api/customers/mobile/${customerData.mobile}`);
        if (existingCustomer) {
          return existingCustomer;
        }
      } catch (error) {
        // Customer doesn't exist, continue to create
      }

      // Create new customer
      const response = await apiRequest("/api/customers", {
        method: "POST",
        body: customerData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
  });
}
