import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Settings, User, MapPin, ExternalLink, Users } from "lucide-react";
import { formatLocation, generateMapsLink, calculateDistance } from "@/lib/location";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ServiceVisit {
  id: number;
  complaintId: number;
  engineerId: number;
  teamMembers?: string | null; // JSON array of user IDs
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLatitude?: string | null;
  checkInLongitude?: string | null;
  checkInAddress?: string | null;
  checkOutLatitude?: string | null;
  checkOutLongitude?: string | null;
  checkOutAddress?: string | null;
  partsIssued: string | null;
  workDescription: string | null;
  visitNotes: string | null;
  createdAt: string;
}

interface ServiceVisitHistoryProps {
  visits: ServiceVisit[];
  title?: string;
  showTotal?: boolean;
}

export function ServiceVisitHistory({ visits, title = "Service Visit History", showTotal = true }: ServiceVisitHistoryProps) {
  // Fetch users to show team member names
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  // Helper function to get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? (user.name || user.username) : `User #${userId}`;
  };

  // Helper function to parse team members
  const parseTeamMembers = (teamMembersJson: string | null) => {
    if (!teamMembersJson) return [];
    try {
      return JSON.parse(teamMembersJson);
    } catch {
      return [];
    }
  };

  // Helper function to calculate time difference in hours and minutes
  const calculateTimeDifference = (checkIn: string, checkOut: string) => {
    const startTime = new Date(checkIn);
    const endTime = new Date(checkOut);
    const diffInMs = endTime.getTime() - startTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return { hours, minutes, totalMinutes: diffInMinutes };
  };

  // Calculate total working time for all visits
  const calculateTotalWorkingTime = (visits: ServiceVisit[]) => {
    let totalMinutes = 0;
    visits.forEach(visit => {
      if (visit.checkInTime && visit.checkOutTime) {
        const { totalMinutes: visitMinutes } = calculateTimeDifference(visit.checkInTime, visit.checkOutTime);
        totalMinutes += visitMinutes;
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
  };

  if (visits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No service visits recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTime = calculateTotalWorkingTime(visits);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          {showTotal && (
            <div className="text-sm text-gray-600">
              Total Time: <strong>{totalTime.hours}h {totalTime.minutes}m</strong>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visits.map((visit, index) => (
            <div key={visit.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Visit #{index + 1}</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    <span>Lead: {getUserName(visit.engineerId)}</span>
                  </div>
                  {(() => {
                    const teamMembers = parseTeamMembers(visit.teamMembers);
                    if (teamMembers.length > 0) {
                      return (
                        <div className="flex items-center space-x-1 text-sm text-blue-600">
                          <Users className="w-4 h-4" />
                          <span>Team: {teamMembers.map((id: number) => getUserName(id)).join(', ')}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex items-center space-x-2">
                  {visit.checkInTime && !visit.checkOutTime && (
                    <Badge className="bg-green-100 text-green-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {visit.checkInTime && visit.checkOutTime && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {(() => {
                        const duration = calculateTimeDifference(visit.checkInTime, visit.checkOutTime);
                        return `${duration.hours}h ${duration.minutes}m`;
                      })()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">
                      {visit.checkInTime ? new Date(visit.checkInTime).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">
                      {visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString() : 'In Progress'}
                    </span>
                  </div>
                  
                  {/* Check-in Location */}
                  {(visit.checkInLatitude && visit.checkInLongitude) && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Check-in Location:</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">
                          {formatLocation(visit.checkInLatitude, visit.checkInLongitude, visit.checkInAddress)}
                        </span>
                        {generateMapsLink(visit.checkInLatitude, visit.checkInLongitude) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => window.open(generateMapsLink(visit.checkInLatitude!, visit.checkInLongitude!), '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Check-out Location */}
                  {(visit.checkOutLatitude && visit.checkOutLongitude) && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Check-out Location:</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">
                          {formatLocation(visit.checkOutLatitude, visit.checkOutLongitude, visit.checkOutAddress)}
                        </span>
                        {generateMapsLink(visit.checkOutLatitude, visit.checkOutLongitude) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => window.open(generateMapsLink(visit.checkOutLatitude!, visit.checkOutLongitude!), '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Distance between locations */}
                  {(visit.checkInLatitude && visit.checkInLongitude && visit.checkOutLatitude && visit.checkOutLongitude) && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Distance Traveled:</span>
                      </div>
                      <span className="font-medium text-xs">
                        {calculateDistance(
                          visit.checkInLatitude,
                          visit.checkInLongitude,
                          visit.checkOutLatitude,
                          visit.checkOutLongitude
                        )} km
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {visit.partsIssued && (
                    <div>
                      <span className="text-gray-600">Parts Issued:</span>
                      <p className="font-medium">{visit.partsIssued}</p>
                    </div>
                  )}
                </div>
              </div>

              {visit.workDescription && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-600 text-sm">Work Description:</span>
                  <p className="font-medium mt-1">{visit.workDescription}</p>
                </div>
              )}

              {visit.visitNotes && (
                <div className="mt-2">
                  <span className="text-gray-600 text-sm">Notes:</span>
                  <p className="font-medium mt-1">{visit.visitNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}