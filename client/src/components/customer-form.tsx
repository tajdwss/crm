import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CustomerFormProps {
  onClose: () => void;
}

export function CustomerForm({ onClose }: CustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    whoBought: "",
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/customers", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Customer Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter customer name"
          required
        />
      </div>

      <div>
        <Label htmlFor="mobile">Mobile Number *</Label>
        <Input
          id="mobile"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Enter mobile number"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="whoBought">Who Bought</Label>
        <Input
          id="whoBought"
          name="whoBought"
          value={formData.whoBought}
          onChange={handleChange}
          placeholder="Who purchased the item"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createCustomerMutation.isPending}>
          {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
