import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Send, 
  Users, 
  Calendar,
  BarChart3,
  Play,
  Pause,
  Trash2,
  Edit
} from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  templateName: string;
  status: "draft" | "scheduled" | "running" | "completed" | "failed";
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  scheduledAt?: Date;
  createdAt: Date;
}

export function WhatsappCampaigns() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: "New Year Promotion",
      templateName: "promotion_template",
      status: "completed",
      totalContacts: 150,
      sentCount: 150,
      deliveredCount: 145,
      readCount: 120,
      failedCount: 5,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: 2,
      name: "Service Reminder",
      templateName: "service_reminder",
      status: "running",
      totalContacts: 80,
      sentCount: 60,
      deliveredCount: 58,
      readCount: 45,
      failedCount: 2,
      createdAt: new Date("2024-01-15"),
    },
  ]);

  const getStatusBadge = (status: Campaign["status"]) => {
    const statusConfig = {
      draft: { color: "bg-gray-500", text: "Draft" },
      scheduled: { color: "bg-blue-500", text: "Scheduled" },
      running: { color: "bg-green-500", text: "Running" },
      completed: { color: "bg-purple-500", text: "Completed" },
      failed: { color: "bg-red-500", text: "Failed" },
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0;
    return Math.round((campaign.deliveredCount / campaign.sentCount) * 100);
  };

  const getReadRate = (campaign: Campaign) => {
    if (campaign.deliveredCount === 0) return 0;
    return Math.round((campaign.readCount / campaign.deliveredCount) * 100);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Campaigns</h2>
          <p className="text-gray-600">Create and manage bulk messaging campaigns</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div>
                <Label htmlFor="template">Message Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotion">Promotion Template</SelectItem>
                    <SelectItem value="reminder">Service Reminder</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                    <SelectItem value="recent">Recent Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="schedule">Schedule</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="When to send" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Now</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Contacts Reached</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg. Delivery Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(campaigns.reduce((sum, c) => sum + getDeliveryRate(c), 0) / campaigns.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Avg. Read Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(campaigns.reduce((sum, c) => sum + getReadRate(c), 0) / campaigns.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Create your first WhatsApp campaign to reach your customers</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-lg">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {campaign.status === "running" && (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {campaign.status === "draft" && (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Template</p>
                      <p className="font-medium">{campaign.templateName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Contacts</p>
                      <p className="font-medium">{campaign.totalContacts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sent</p>
                      <p className="font-medium text-blue-600">{campaign.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Delivered</p>
                      <p className="font-medium text-green-600">
                        {campaign.deliveredCount} ({getDeliveryRate(campaign)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Read</p>
                      <p className="font-medium text-purple-600">
                        {campaign.readCount} ({getReadRate(campaign)}%)
                      </p>
                    </div>
                  </div>
                  
                  {campaign.failedCount > 0 && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        {campaign.failedCount} failed
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
