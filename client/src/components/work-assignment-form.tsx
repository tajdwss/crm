import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Plus, Save, X } from "lucide-react";

interface WorkAssignmentFormProps {
  onClose?: () => void;
  editAssignment?: any;
}

export function WorkAssignmentForm({ onClose, editAssignment }: WorkAssignmentFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    assignedTo: editAssignment?.assignedTo || "",
    workType: editAssignment?.workType || "",
    workId: editAssignment?.workId || "",
    priority: editAssignment?.priority || "medium",
    assignmentNotes: editAssignment?.assignmentNotes || "",
    dueDate: editAssignment?.dueDate ? new Date(editAssignment.dueDate).toISOString().split('T')[0] : "",
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  // Fetch receipts and service complaints for work selection
  const { data: receipts = [] } = useQuery({
    queryKey: ["/api/receipts"],
    queryFn: () => apiRequest("/api/receipts"),
  });

  const { data: serviceComplaints = [] } = useQuery({
    queryKey: ["/api/service-complaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/work-assignments", {
      method: "POST",
      body: data,
    }),
    onSuccess: (result) => {
      console.log("Assignment created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
      // Reset form
      setFormData({
        assignedTo: "",
        workType: "receipt",
        workId: "",
        priority: "medium",
        assignmentNotes: "",
        dueDate: "",
      });
      toast({
        title: "Success",
        description: "Work assignment created successfully!",
      });
      onClose?.();
    },
    onError: (error) => {
      console.error("Failed to create assignment:", error);
      toast({
        title: "Error",
        description: "Failed to create work assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/work-assignments/${editAssignment.id}`, {
      method: "PATCH",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
      toast({
        title: "Success",
        description: "Work assignment updated successfully!",
      });
      onClose?.();
    },
    onError: (error) => {
      console.error("Failed to update assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update work assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedBy = parseInt(localStorage.getItem("userId") || "1"); // Get admin user ID from localStorage
    const submitData = {
      assignedBy,
      assignedTo: parseInt(formData.assignedTo),
      workType: formData.workType,
      workId: parseInt(formData.workId),
      priority: formData.priority,
      assignmentNotes: formData.assignmentNotes || "",
      dueDate: formData.dueDate || null,
    };

    console.log("Submitting assignment data:", submitData);

    if (editAssignment) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getWorkOptions = () => {
    if (formData.workType === "receipt") {
      return receipts.map(receipt => ({
        id: receipt.id,
        label: `${receipt.receiptNumber} - ${receipt.customerName}`,
        value: receipt.id.toString()
      }));
    } else if (formData.workType === "service_complaint") {
      return serviceComplaints.map(complaint => ({
        id: complaint.id,
        label: `${complaint.complaintNumber} - ${complaint.customerName}`,
        value: complaint.id.toString()
      }));
    }
    return [];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Filter users - only technicians and service engineers can be assigned work
  const assignableUsers = users.filter(user => 
    user.role === "technician" || user.role === "service_engineer"
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {editAssignment ? "Edit Work Assignment" : "Create New Work Assignment"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.username} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workType">Work Type</Label>
              <Select
                value={formData.workType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workType: value, workId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Receipt / Repair</SelectItem>
                  <SelectItem value="service_complaint">Service Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.workType && (
            <div className="space-y-2">
              <Label htmlFor="workId">Select Work Item</Label>
              <Select
                value={formData.workId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work item" />
                </SelectTrigger>
                <SelectContent>
                  {getWorkOptions().map(option => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor("low")}`}></div>
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor("medium")}`}></div>
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor("high")}`}></div>
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor("urgent")}`}></div>
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignmentNotes">Assignment Notes</Label>
            <Textarea
              placeholder="Add any instructions or notes for the assignee..."
              value={formData.assignmentNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, assignmentNotes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {editAssignment ? "Update Assignment" : "Create Assignment"}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}