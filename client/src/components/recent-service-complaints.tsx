import { Settings, MapPin, Clock, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  createdAt: string;
}

export function RecentServiceComplaints() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["/api/service-complaints"],
    queryFn: () => apiRequest("/api/service-complaints"),
  });

  const recentComplaints = complaints.slice(0, 5);

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

  const handleWhatsApp = (complaint: ServiceComplaint) => {
    const message = `Hello ${complaint.customerName}, this is regarding your service complaint ${complaint.complaintNumber}. We will keep you updated on the progress.`;
    const whatsappUrl = `https://wa.me/${complaint.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-orange-600" />
          <span>Recent Service Complaints</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No service complaints logged yet</p>
            <p className="text-sm text-gray-500 mt-1">Service complaints will appear here when logged</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-orange-600">{complaint.complaintNumber}</span>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{complaint.customerName}</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{complaint.mobile}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{complaint.address}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{complaint.product}</span>
                    {complaint.model && <span className="text-gray-600"> - {complaint.model}</span>}
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2">{complaint.issueDescription}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">Service Call</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWhatsApp(complaint)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}