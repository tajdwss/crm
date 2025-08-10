import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Clock, Play, XCircle, Calendar, AlertTriangle, User, FileText, Wrench, Eye, Users, LogIn } from "lucide-react";
import { format } from "date-fns";

interface MyAssignmentsProps {
  userId: number;
  userRole: string;
}

export function MyAssignments({ userId, userRole }: MyAssignmentsProps) {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch user's work assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/work-assignments/user", userId],
    queryFn: () => apiRequest(`/api/work-assignments/user/${userId}`),
  });

  // Fetch related data for details
  const { data: receipts = [] } = useQuery({
    queryKey: ["/api/receipts"],
    queryFn: () => apiRequest("/api/receipts"),
  });

  const { data: serviceComplaints = [] } = useQuery({
    queryKey: ["/api/service-complaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  // Fetch users for displaying team members
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
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
      queryClient.invalidateQueries({ queryKey: ["/api/work-assignments/user", userId] });
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

  const getWorkItemDetails = (assignment: any) => {
    if (assignment.workType === "receipt") {
      const receipt = receipts.find(r => r.id === assignment.workId);
      return receipt ? {
        title: `${receipt.receiptNumber} - ${receipt.customerName}`,
        subtitle: `${receipt.product} - ${receipt.issue}`,
        icon: <FileText className="h-4 w-4" />
      } : { title: "Receipt not found", subtitle: "", icon: <FileText className="h-4 w-4" /> };
    } else if (assignment.workType === "service_complaint") {
      const complaint = serviceComplaints.find(c => c.id === assignment.workId);
      return complaint ? {
        title: `${complaint.complaintNumber} - ${complaint.customerName}`,
        subtitle: `${complaint.product} - ${complaint.issueDescription}`,
        icon: <Wrench className="h-4 w-4" />
      } : { title: "Service not found", subtitle: "", icon: <Wrench className="h-4 w-4" /> };
    }
    return { title: "Unknown work item", subtitle: "", icon: <FileText className="h-4 w-4" /> };
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleViewDetails = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const isOverdue = (dueDateString: string | null, status: string) => {
    if (!dueDateString || status === "completed" || status === "cancelled") return false;
    return new Date(dueDateString) < new Date();
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

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.name || user.username) : "Unknown User";
  };

  const getAssignmentCounts = () => {
    const pending = assignments.filter(a => a.status === "pending").length;
    const inProgress = assignments.filter(a => a.status === "in_progress").length;
    const completed = assignments.filter(a => a.status === "completed").length;
    const overdue = assignments.filter(a => isOverdue(a.dueDate, a.status)).length;

    return { pending, inProgress, completed, overdue };
  };

  const counts = getAssignmentCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading assignments...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{counts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{counts.inProgress}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Work Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No work assignments found. Check back later for new assignments.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Item</TableHead>
                    <TableHead>Team Members</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const workDetails = getWorkItemDetails(assignment);
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {workDetails.icon}
                            <div>
                              <div className="font-medium">{workDetails.title}</div>
                              <div className="text-sm text-gray-500">{workDetails.subtitle}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getAssignedUsers(assignment).map((user, index) => (
                              <Badge key={user.id} variant="secondary" className="text-xs">
                                {user.name || user.username}
                                {isMultiAssignment(assignment) && (
                                  <Users className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                            {getAssignedUsers(assignment).length === 0 && (
                              <span className="text-sm text-gray-400">Unassigned</span>
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
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(assignment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {assignment.status === "pending" && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleStatusChange(assignment.id, "in_progress")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                            {assignment.status === "in_progress" && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleStatusChange(assignment.id, "completed")}
                                disabled={updateStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Work Item</h4>
                  <p className="text-sm text-gray-600">{getWorkItemDetails(selectedAssignment).title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Type</h4>
                  <p className="text-sm text-gray-600 capitalize">{selectedAssignment.workType.replace("_", " ")}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Priority</h4>
                  <Badge className={getPriorityColor(selectedAssignment.priority)}>
                    {selectedAssignment.priority.charAt(0).toUpperCase() + selectedAssignment.priority.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <Badge className={getStatusColor(selectedAssignment.status)}>
                    {getStatusIcon(selectedAssignment.status)}
                    <span className="ml-1 capitalize">{selectedAssignment.status.replace("_", " ")}</span>
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Due Date</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedAssignment.dueDate)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Assigned Date</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedAssignment.createdAt)}</p>
                </div>
              </div>
              {selectedAssignment.assignmentNotes && (
                <div>
                  <h4 className="font-medium text-gray-900">Assignment Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedAssignment.assignmentNotes}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {selectedAssignment.status === "pending" && (
                  <Button 
                    onClick={() => {
                      handleStatusChange(selectedAssignment.id, "in_progress");
                      setShowDetailsModal(false);
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Work
                  </Button>
                )}
                {selectedAssignment.status === "in_progress" && (
                  <Button 
                    onClick={() => {
                      handleStatusChange(selectedAssignment.id, "completed");
                      setShowDetailsModal(false);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}