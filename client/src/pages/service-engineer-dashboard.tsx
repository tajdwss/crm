import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, MapPin, Clock, User, LogOut, CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentLocation } from "@/lib/location"; // Make sure to have this utility function

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
  assignedEngineerId: number | null;
  createdAt: string;
  completedAt: string | null;
  latitude: string | null;
  longitude: string | null;
  priority?: 'High' | 'Normal' | 'Low'; // Added priority to the interface
}

interface ServiceVisit {
  id: number;
  complaintId: number;
  engineerId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  partsIssued: string | null;
  workDescription: string | null;
  visitNotes: string | null;
  createdAt: string;
}

export default function ServiceEngineerDashboard() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent going back to login page
      if (location === "/login" || location === "/service-engineer-login") {
        event.preventDefault();
        setLocation("/service-engineer-dashboard");
        return;
      }
      
      // Handle tab navigation from URL state
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location, setLocation]);

  // Update browser history when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.pushState(
      { tab: tabId }, 
      '', 
      `/service-engineer-dashboard?tab=${tabId}`
    );
  };

  const [selectedComplaint, setSelectedComplaint] = useState<ServiceComplaint | null>(null);
  const [visitForm, setVisitForm] = useState({
    partsIssued: "",
    workDescription: "",
    visitNotes: "",
  });
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "service_engineer" && userRole !== "admin") {
      setLocation("/service-engineer-login");
    }
  }, [setLocation]);

  // Fetch service complaints
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["/api/service-complaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  // Fetch service visits for selected complaint
  const { data: visits = [] } = useQuery({
    queryKey: ["/api/service-visits", selectedComplaint?.id],
    queryFn: () => apiRequest(`/api/service-visits/complaint/${selectedComplaint?.id}`),
    enabled: !!selectedComplaint,
  });

  // Fetch users for team selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  // Get available team members (technicians and service engineers)
  const availableTeamMembers = users.filter((user: any) =>
    user.role === "technician" || user.role === "service_engineer"
  );

  // Create service visit mutation
  const createVisitMutation = useMutation({
    mutationFn: (visitData: any) => apiRequest("/api/service-visits", { method: "POST", body: visitData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-complaints"] });
      setVisitForm({ partsIssued: "", workDescription: "", visitNotes: "" });
      toast({
        title: "Check-in Successful",
        description: "Service visit has been logged successfully",
      });
    },
    onError: (error) => {
      console.error("Visit creation error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to create service visit",
        variant: "destructive",
      });
    },
  });

  // Update service visit mutation (for check-out)
  const updateVisitMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/service-visits/${id}`, { method: "PATCH", body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-complaints"] });
      toast({
        title: "Check-out Successful",
        description: "Service visit has been completed",
      });
    },
    onError: (error) => {
      console.error("Visit update error:", error);
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to update service visit",
        variant: "destructive",
      });
    },
  });

  // Update complaint status mutation
  const updateComplaintMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/service-complaints/${id}`, { method: "PATCH", body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-complaints"] });
      toast({
        title: "Status Updated",
        description: "Complaint status has been updated",
      });
    },
  });

  const handleCheckIn = () => {
    if (!selectedComplaint) {
      toast({
        title: "No Complaint Selected",
        description: "Please select a complaint first",
        variant: "destructive",
      });
      return;
    }
    setShowTeamSelection(true);
  };

  const handleTeamCheckIn = async () => {
    if (!selectedComplaint) return;

    toast({
      title: "Getting Location",
      description: "Please allow location access to check in",
    });

    const locationResult = await getCurrentLocation();

    if (!locationResult.success) {
      toast({
        title: "Location Required",
        description: locationResult.error || "Location access is required for check-in",
        variant: "destructive",
      });
      return;
    }

    const visitData = {
      complaintId: selectedComplaint.id,
      engineerId: 1, // Placeholder for logged-in user ID
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      checkInLatitude: locationResult.data?.latitude || null,
      checkInLongitude: locationResult.data?.longitude || null,
      checkInAddress: locationResult.data?.address || null,
      partsIssued: visitForm.partsIssued || null,
      workDescription: visitForm.workDescription || null,
      visitNotes: visitForm.visitNotes || null,
      teamMembers: selectedTeamMembers.length > 0 ? JSON.stringify(selectedTeamMembers) : null,
    };

    createVisitMutation.mutate(visitData);
    setShowTeamSelection(false);
    setSelectedTeamMembers([]);
  };

  const handleCheckOut = async () => {
    if (!selectedComplaint) return;

    const activeVisit = visits.find(visit => visit.checkInTime && !visit.checkOutTime);

    if (!activeVisit) {
      toast({
        title: "No Active Visit",
        description: "No active check-in found to check out",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Getting Location",
      description: "Please allow location access to check out",
    });

    const locationResult = await getCurrentLocation();

    if (!locationResult.success) {
      toast({
        title: "Location Required",
        description: locationResult.error || "Location access is required for check-out",
        variant: "destructive",
      });
      return;
    }

    const updates = {
      checkOutTime: new Date().toISOString(),
      checkOutLatitude: locationResult.data?.latitude || null,
      checkOutLongitude: locationResult.data?.longitude || null,
      checkOutAddress: locationResult.data?.address || null,
    };

    updateVisitMutation.mutate({ id: activeVisit.id, updates });
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedComplaint) return;

    updateComplaintMutation.mutate({
      id: selectedComplaint.id,
      updates: { status },
    });
  };

  const handleLogout = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      setLocation("/admin-dashboard");
    } else {
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      setLocation("/");
    }
  };

  const hasActiveVisit = visits.some(visit => visit.checkInTime && !visit.checkOutTime);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <AlertCircle className="w-4 h-4" />;
      case "In Progress":
        return <Clock className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Filter and sort complaints
  const activeTasks = complaints
    .filter(complaint => complaint.status !== "Completed" && complaint.status !== "Cancelled")
    .sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Normal': 2, 'Low': 1 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const completedTasks = complaints
    .filter(complaint => complaint.status === "Completed" || complaint.status === "Cancelled")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  New Taj Electronics
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  Service Engineer Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 shrink-0">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {localStorage.getItem("username") || "Engineer"}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-3xl font-bold text-blue-600">{activeTasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Visit</p>
                  <p className="text-3xl font-bold text-orange-600">{hasActiveVisit ? '1' : '0'}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Active Tasks */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Latest Tasks</h3>
                      <p className="text-sm text-gray-600">Priority & Date Sorted</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {activeTasks.length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {activeTasks.length === 0 ? (
                    <div className="p-8 text-center">
                      <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No active tasks assigned</p>
                      <p className="text-sm text-gray-400">New tasks will appear here</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4"> {/* Added padding and spacing here */}
                      {activeTasks.map((complaint) => {
                        const priorityColor = complaint.priority === 'High'
                          ? 'border-red-500'
                          : complaint.priority === 'Normal'
                          ? 'border-yellow-500'
                          : 'border-green-500';

                        return (
                          <Card
                            key={complaint.id}
                            className={`cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg ${
                              selectedComplaint?.id === complaint.id ? "ring-2 ring-blue-500" : ""
                            }`}
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            <div className={`relative border-l-4 rounded-l-md ${priorityColor}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-lg text-gray-900 truncate">
                                      {complaint.complaintNumber}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate">
                                      {complaint.customerName} | {complaint.mobile}
                                    </p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <Badge className={`${getStatusColor(complaint.status)} text-xs`}>
                                      {getStatusIcon(complaint.status)}
                                      <span className="ml-1">{complaint.status}</span>
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(complaint.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">
                                    {complaint.product} - {complaint.model}
                                  </p>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {complaint.issueDescription}
                                  </p>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-500 mt-3 border-t pt-2">
                                  <MapPin className="w-4 h-4 mr-2 shrink-0" />
                                  <span className="truncate">{complaint.address}</span>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Visit Panel & Completed Tasks */}
          <div className="lg:col-span-1 space-y-6">
            {selectedComplaint ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {selectedComplaint.status === "Completed" || selectedComplaint.status === "Cancelled"
                        ? "Task History (Read Only)"
                        : "Service Visit"
                      }
                    </span>
                    {(selectedComplaint.status === "Completed" || selectedComplaint.status === "Cancelled") && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {selectedComplaint.status}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Complaint</Label>
                    <p className="text-sm font-medium">{selectedComplaint.complaintNumber}</p>
                    <p className="text-sm text-gray-600">{selectedComplaint.customerName}</p>
                  </div>

                  {selectedComplaint.status === "Completed" || selectedComplaint.status === "Cancelled" ? (
                    <div className="space-y-2">
                      <Label>Final Status</Label>
                      <div className="p-2 bg-gray-100 rounded border">
                        <Badge className={getStatusColor(selectedComplaint.status)}>
                          {getStatusIcon(selectedComplaint.status)}
                          <span className="ml-1">{selectedComplaint.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={selectedComplaint.status}
                          onValueChange={handleStatusUpdate}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {!(selectedComplaint.status === "Completed" || selectedComplaint.status === "Cancelled") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="partsIssued">Parts Issued</Label>
                        <Input
                          id="partsIssued"
                          value={visitForm.partsIssued}
                          onChange={(e) => setVisitForm({ ...visitForm, partsIssued: e.target.value })}
                          placeholder="Enter parts issued"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workDescription">Work Description</Label>
                        <Textarea
                          id="workDescription"
                          value={visitForm.workDescription}
                          onChange={(e) => setVisitForm({ ...visitForm, workDescription: e.target.value })}
                          placeholder="Describe the work performed"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visitNotes">Visit Notes</Label>
                        <Textarea
                          id="visitNotes"
                          value={visitForm.visitNotes}
                          onChange={(e) => setVisitForm({ ...visitForm, visitNotes: e.target.value })}
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>

                      <div className="flex space-x-2">
                        {!hasActiveVisit ? (
                          <Button
                            onClick={handleCheckIn}
                            className="flex-1 bg-green-600 hover:bg-green-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            disabled={createVisitMutation.isPending}
                          >
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{createVisitMutation.isPending ? "Checking In..." : "Check In"}</span>
                            <span className="sm:hidden">{createVisitMutation.isPending ? "In..." : "In"}</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCheckOut}
                            className="flex-1 bg-red-600 hover:bg-red-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            disabled={updateVisitMutation.isPending}
                          >
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{updateVisitMutation.isPending ? "Checking Out..." : "Check Out"}</span>
                            <span className="sm:hidden">{updateVisitMutation.isPending ? "Out..." : "Out"}</span>
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
                <div className="flex items-center justify-center p-8 text-center border rounded-lg h-96 bg-gray-50/50">
                    <div className="space-y-4">
                        <Settings className="w-16 h-16 text-gray-300 mx-auto" />
                        <p className="text-xl font-semibold text-gray-600">Select a complaint to manage</p>
                        <p className="text-sm text-gray-500">Choose a task from the list on the left to view details and start a visit.</p>
                    </div>
                </div>
            )}
            {/* Completed Tasks Sub-bar */}
            {completedTasks.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-center space-x-2 text-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Completed Tasks</span>
                            <Badge variant="outline" className="ml-2 text-green-700 border-green-300">
                                {completedTasks.length} Completed
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedTasks.slice(0, 5).map((complaint: ServiceComplaint) => (
                                <Card
                                    key={complaint.id}
                                    className="p-3 border border-green-100 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                                    onClick={() => setSelectedComplaint(complaint)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0 text-center">
                                            <h4 className="font-medium text-gray-800 truncate">{complaint.complaintNumber}</h4>
                                            <p className="text-sm text-gray-700 truncate">{complaint.customerName}</p>
                                        </div>
                                        <div className="text-center ml-4">
                                            <Badge className="bg-green-100 text-green-800 justify-center">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                {complaint.status}
                                            </Badge>
                                            <span className="text-xs text-gray-500 block mt-1">
                                                {new Date(complaint.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {completedTasks.length > 5 && (
                                <div className="text-center py-2">
                                    <span className="text-sm text-gray-500">
                                        +{completedTasks.length - 5} more completed tasks
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </main>

      {/* Team Selection Dialog */}
      <Dialog open={showTeamSelection} onOpenChange={setShowTeamSelection}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Team Members</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {availableTeamMembers.length > 0 ? (
              availableTeamMembers.map((member: any) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={selectedTeamMembers.includes(member.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTeamMembers([...selectedTeamMembers, member.id]);
                      } else {
                        setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== member.id));
                      }
                    }}
                  />
                  <Label htmlFor={`member-${member.id}`} className="flex items-center cursor-pointer">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    {member.name} ({member.role})
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No other team members available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamSelection(false)}>Cancel</Button>
            <Button onClick={handleTeamCheckIn} disabled={createVisitMutation.isPending}>
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





