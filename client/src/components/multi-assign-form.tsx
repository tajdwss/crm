import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarIcon, Users, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface MultiAssignFormProps {
  onClose?: () => void;
  editAssignment?: any;
}

export function MultiAssignForm({ onClose, editAssignment }: MultiAssignFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    assignedUsers: editAssignment?.assignedUsers ? JSON.parse(editAssignment.assignedUsers) : [],
    workType: editAssignment?.workType || "",
    workId: editAssignment?.workId || "",
    priority: editAssignment?.priority || "medium",
    assignmentNotes: editAssignment?.assignmentNotes || "",
    dueDate: editAssignment?.dueDate ? new Date(editAssignment.dueDate).toISOString().split('T')[0] : "",
  });

  // Fetch users for assignment
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

  // Filter assignable users (technicians and service engineers)
  const assignableUsers = users.filter((user: any) => 
    user.role === "technician" || user.role === "service_engineer"
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/work-assignments", {
      method: "POST",
      body: data,
    }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
      toast({
        title: "Success",
        description: response.message || "Work assignment created successfully",
      });
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create work assignment",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/work-assignments/${editAssignment.id}`, {
      method: "PATCH",
      body: data,
    }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
      toast({
        title: "Success", 
        description: response.message || "Work assignment updated successfully",
      });
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work assignment",
        variant: "destructive",
      });
    },
  });

  const handleUserToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId) 
        ? prev.assignedUsers.filter((id: number) => id !== userId)
        : [...prev.assignedUsers, userId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.assignedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user to assign the work",
        variant: "destructive",
      });
      return;
    }

    if (!formData.workType || !formData.workId) {
      toast({
        title: "Error",
        description: "Please select a work item",
        variant: "destructive",
      });
      return;
    }

    // Get selected usernames for better UX
    const selectedUsernames = assignableUsers
      .filter((user: any) => formData.assignedUsers.includes(user.id))
      .map((user: any) => user.name || user.username);

    const assignmentData = {
      assignedTo: formData.assignedUsers[0], // Primary assignee for backward compatibility
      assignedUsers: selectedUsernames, // Send usernames as array
      assignedUserIds: formData.assignedUsers, // Send user IDs separately for lookup
      workType: formData.workType,
      workId: parseInt(formData.workId),
      priority: formData.priority,
      assignmentNotes: formData.assignmentNotes,
      dueDate: formData.dueDate || null,
      assignedBy: 1, // Assuming admin user ID is 1
    };

    console.log("Frontend assignment data before sending:", assignmentData);

    if (editAssignment) {
      updateMutation.mutate(assignmentData);
    } else {
      createMutation.mutate(assignmentData);
    }
  };

  const getWorkItems = () => {
    if (formData.workType === "receipt") {
      return receipts.map((receipt: any) => ({
        id: receipt.id,
        label: `${receipt.receiptNumber} - ${receipt.customerName}`,
        subtitle: receipt.product
      }));
    } else if (formData.workType === "service_complaint") {
      return serviceComplaints.map((complaint: any) => ({
        id: complaint.id,
        label: `${complaint.complaintNumber} - ${complaint.customerName}`,
        subtitle: complaint.product
      }));
    }
    return [];
  };

  const getUserName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? (user.name || user.username) : "Unknown User";
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {editAssignment ? "Edit Multi-Engineer Assignment" : "Create Multi-Engineer Assignment"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Engineer Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Engineers</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignableUsers.map((user: any) => (
                <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={formData.assignedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{user.name || user.username}</span>
                      <Badge variant="secondary" className="text-xs">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Selected Users Display */}
            {formData.assignedUsers.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  Selected Engineers ({formData.assignedUsers.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.assignedUsers.map((userId: number) => (
                    <Badge key={userId} variant="default" className="flex items-center gap-1">
                      {getUserName(userId)}
                      <button
                        type="button"
                        onClick={() => handleUserToggle(userId)}
                        className="ml-1 hover:bg-red-500 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="receipt">Receipt Repair</SelectItem>
                  <SelectItem value="service_complaint">Service Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workId">Work Item</Label>
              <Select
                value={formData.workId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workId: value }))}
                disabled={!formData.workType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work item" />
                </SelectTrigger>
                <SelectContent>
                  {getWorkItems().map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.subtitle}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority and Due Date */}
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
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

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignmentNotes">Assignment Notes</Label>
            <Textarea
              placeholder="Add any special instructions or notes for the assigned engineers..."
              value={formData.assignmentNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, assignmentNotes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
               editAssignment ? "Update Assignment" : "Create Assignment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}