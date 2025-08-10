import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkAssignmentForm } from "./work-assignment-form";
import { MultiAssignForm } from "./multi-assign-form";
import { TeamCheckin } from "./team-checkin";
import { apiRequest } from "@/lib/queryClient";
import { MoreHorizontal, Edit, Trash2, Clock, User, Calendar, AlertTriangle, CheckCircle2, XCircle, Play, Users, UserPlus } from "lucide-react";
import { format } from "date-fns";

interface WorkAssignmentsTableProps {
  assignments: any[];
  currentUserId?: number;
}

export function WorkAssignmentsTable({ assignments, currentUserId = 1 }: WorkAssignmentsTableProps) {
  const queryClient = useQueryClient();
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMultiAssignModal, setShowMultiAssignModal] = useState(false);
  const [showTeamCheckinModal, setShowTeamCheckinModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Fetch related data for display
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["/api/receipts"],
    queryFn: () => apiRequest("/api/receipts"),
  });

  const { data: serviceComplaints = [] } = useQuery({
    queryKey: ["/api/service-complaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/work-assignments/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest(`/api/work-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ 
        status,
        ...(status === "in_progress" && { startedAt: new Date() }),
        ...(status === "completed" && { completedAt: new Date() }),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments"] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3 w-3" />;
      case "in_progress": return <Play className="h-3 w-3" />;
      case "completed": return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled": return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.name || user.username) : "Unknown User";
  };

  const getAssignedUsers = (assignment: any) => {
    if (assignment.assignedUsers) {
      try {
        const userIds = JSON.parse(assignment.assignedUsers);
        return users.filter(user => userIds.includes(user.id));
      } catch {
        return [];
      }
    }
    // Fallback to single assignment
    const singleUser = users.find(user => user.id === assignment.assignedTo);
    return singleUser ? [singleUser] : [];
  };

  const isMultiAssignment = (assignment: any) => {
    const assignedUsers = getAssignedUsers(assignment);
    return assignedUsers.length > 1;
  };

  const handleTeamCheckin = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowTeamCheckinModal(true);
  };

  const handleMultiAssign = () => {
    setShowMultiAssignModal(true);
  };

  const getWorkItemDetails = (assignment: any) => {
    if (assignment.workType === "receipt") {
      const receipt = receipts.find(r => r.id === assignment.workId);
      return receipt ? `${receipt.receiptNumber} - ${receipt.customerName}` : "Receipt not found";
    } else if (assignment.workType === "service_complaint") {
      const complaint = serviceComplaints.find(c => c.id === assignment.workId);
      return complaint ? `${complaint.complaintNumber} - ${complaint.customerName}` : "Service not found";
    }
    return "Unknown work item";
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this work assignment?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const isOverdue = (dueDateString: string | null, status: string) => {
    if (!dueDateString || status === "completed" || status === "cancelled") return false;
    return new Date(dueDateString) < new Date();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Work Assignments</h3>
        <div className="flex gap-2">
          <Button onClick={handleMultiAssign} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Multi-Engineer Assignment
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Item</TableHead>
              <TableHead>Assigned Engineers</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No work assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getWorkItemDetails(assignment)}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {assignment.workType.replace("_", " ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isMultiAssignment(assignment) ? (
                        <>
                          <Users className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-wrap gap-1">
                            {getAssignedUsers(assignment).map(user => (
                              <Badge key={user.id} variant="secondary" className="text-xs">
                                {user.name || user.username}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Team Assignment
                          </Badge>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-gray-500" />
                          {getUserName(assignment.assignedTo)}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(assignment.priority)}>
                      {assignment.priority === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(assignment.status)}>
                      {getStatusIcon(assignment.status)}
                      <span className="ml-1 capitalize">{assignment.status.replace("_", " ")}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className={isOverdue(assignment.dueDate, assignment.status) ? "text-red-600 font-medium" : ""}>
                        {formatDate(assignment.dueDate)}
                      </span>
                      {isOverdue(assignment.dueDate, assignment.status) && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <div className="truncate text-sm text-gray-600">
                      {assignment.assignmentNotes || "No notes"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {isMultiAssignment(assignment) && (
                          <DropdownMenuItem onClick={() => handleTeamCheckin(assignment)}>
                            <Users className="h-4 w-4 mr-2" />
                            Team Check-in
                          </DropdownMenuItem>
                        )}
                        {assignment.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, "in_progress")}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Work
                          </DropdownMenuItem>
                        )}
                        {assignment.status === "in_progress" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, "completed")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {(assignment.status === "pending" || assignment.status === "in_progress") && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, "cancelled")}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Work Assignment</DialogTitle>
          </DialogHeader>
          <WorkAssignmentForm 
            editAssignment={editingAssignment}
            onClose={() => {
              setShowEditModal(false);
              setEditingAssignment(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showMultiAssignModal} onOpenChange={setShowMultiAssignModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Multi-Engineer Assignment</DialogTitle>
          </DialogHeader>
          <MultiAssignForm 
            onClose={() => setShowMultiAssignModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTeamCheckinModal} onOpenChange={setShowTeamCheckinModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Team Check-in Status</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <TeamCheckin 
              assignment={selectedAssignment}
              currentUserId={currentUserId}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}