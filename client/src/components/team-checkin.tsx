import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Timer, 
  User,
  LogIn,
  LogOut,
  Navigation
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface TeamCheckinProps {
  assignment: any;
  currentUserId: number;
}

export function TeamCheckin({ assignment, currentUserId }: TeamCheckinProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [checkinNotes, setCheckinNotes] = useState("");
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [location, setLocation] = useState<string>("");

  // Fetch users for name display
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  // Fetch checkins for this assignment
  const { data: checkins = [], refetch: refetchCheckins } = useQuery({
    queryKey: ["/api/work-checkins/assignment", assignment.id],
    queryFn: () => apiRequest(`/api/work-checkins/assignment/${assignment.id}`),
  });

  // Get location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use a reverse geocoding service to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            setLocation(address);
          } catch (error) {
            setLocation(`${latitude}, ${longitude}`);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location not available");
        }
      );
    }
  }, []);

  const checkinMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/work-checkins", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-checkins/assignment", assignment.id] });
      toast({
        title: "Success",
        description: "Checked in successfully",
      });
      setIsCheckinModalOpen(false);
      setCheckinNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ checkinId, notes }: { checkinId: number; notes?: string }) => 
      apiRequest(`/api/work-checkins/${checkinId}`, {
        method: "PATCH",
        body: {
          checkOutTime: new Date().toISOString(),
          notes: notes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-checkins/assignment", assignment.id] });
      toast({
        title: "Success",
        description: "Checked out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  // Get assigned users for this assignment
  const getAssignedUsers = () => {
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

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.name || user.username) : "Unknown User";
  };

  const handleCheckin = () => {
    const checkinData = {
      assignmentId: assignment.id,
      userId: currentUserId,
      location: location,
      notes: checkinNotes,
      checkedInWith: JSON.stringify([currentUserId]), // For now, just current user
    };

    checkinMutation.mutate(checkinData);
  };

  const handleCheckout = (checkinId: number) => {
    checkoutMutation.mutate({ checkinId });
  };

  const getUserCheckinStatus = (userId: number) => {
    const userCheckins = checkins.filter(checkin => 
      checkin.userId === userId && !checkin.checkOutTime
    );
    return userCheckins.length > 0 ? userCheckins[0] : null;
  };

  const currentUserCheckin = getUserCheckinStatus(currentUserId);
  const assignedUsers = getAssignedUsers();

  if (assignedUsers.length <= 1) {
    return null; // Don't show team checkin for single assignments
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Check-in Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Members Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {assignedUsers.map(user => {
            const userCheckin = getUserCheckinStatus(user.id);
            const isCheckedIn = !!userCheckin;
            
            return (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{user.name || user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isCheckedIn ? (
                    <>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Checked In
                      </Badge>
                      {userCheckin && userCheckin.checkInTime && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(userCheckin.checkInTime), "HH:mm")}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <Timer className="h-3 w-3 mr-1" />
                      Not Checked In
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current User Actions */}
        <div className="pt-4 border-t">
          {currentUserCheckin ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">You are checked in</span>
                <span className="text-sm text-gray-500">
                  since {format(new Date(currentUserCheckin.checkInTime), "HH:mm")}
                </span>
              </div>
              <Button
                onClick={() => handleCheckout(currentUserCheckin.id)}
                disabled={checkoutMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {checkoutMutation.isPending ? "Checking out..." : "Check Out"}
              </Button>
            </div>
          ) : (
            <Dialog open={isCheckinModalOpen} onOpenChange={setIsCheckinModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Check In to Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check In to Team Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{location || "Getting location..."}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkinNotes">Check-in Notes (Optional)</Label>
                    <Textarea
                      id="checkinNotes"
                      placeholder="Add any notes about your check-in..."
                      value={checkinNotes}
                      onChange={(e) => setCheckinNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCheckinModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCheckin}
                      disabled={checkinMutation.isPending}
                    >
                      {checkinMutation.isPending ? "Checking in..." : "Check In"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Recent Check-ins */}
        {checkins.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {checkins
                .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
                .slice(0, 5)
                .map(checkin => (
                  <div key={checkin.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getUserName(checkin.userId)}</span>
                      <span className="text-gray-500">
                        {checkin.checkOutTime ? "worked" : "checked in"}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {checkin.checkOutTime ? (
                        <span>
                          {format(new Date(checkin.checkInTime), "HH:mm")} - {format(new Date(checkin.checkOutTime), "HH:mm")}
                        </span>
                      ) : (
                        format(new Date(checkin.checkInTime), "HH:mm")
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}