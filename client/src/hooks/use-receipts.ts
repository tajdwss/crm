import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

export function useReceipts() {
  return useQuery({
    queryKey: ["/api/receipts"],
    queryFn: getQueryFn<Receipt[]>({
      on401: "returnNull",
    }),
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (receiptData: Omit<Receipt, "id" | "receiptNumber" | "createdAt">) => {
      const response = await apiRequest("/api/receipts", {
        method: "POST",
        body: receiptData,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Receipt Created",
        description: `Receipt ${data.receiptNumber} has been generated successfully.`,
      });
      // WhatsApp send result (if server attached it)
      const notif = (data as any)._whatsappNotification;
      if (notif) {
        if (notif.success) {
          toast({ title: "WhatsApp", description: "Message sent to customer on WhatsApp." });
        } else {
          toast({ title: "WhatsApp Failed", description: notif.error || "Could not send WhatsApp message.", variant: "destructive" });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create receipt. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Receipt> }) => {
      const response = await apiRequest(`/api/receipts/${id}`, {
        method: "PATCH",
        body: updates,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Receipt Updated",
        description: "Receipt has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
        variant: "destructive",
      });
    },
  });
}
