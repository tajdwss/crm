import { useState, useEffect } from "react";
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
  MessageSquare,
  Edit,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

type UsageKey =
  | "receipt_created"
  | "receipt_status_update"
  | "service_complaint_created"
  | "service_status_update"
  | "delivery_otp"
  | "ready_for_delivery"
  | "payment_reminder"
  | "auto_reply";
interface Template {
  id: number;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  status: "PENDING" | "APPROVED" | "REJECTED";

  headerType?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerContent?: string;
  bodyContent: string;
  footerContent?: string;
  variables: string[];
  createdAt: Date;
}

// Mapping utility types/constants
const usageKeys: { key: UsageKey; label: string }[] = [
  { key: "receipt_created", label: "Receipt Created" },
  { key: "receipt_status_update", label: "Receipt Status Update" },
  { key: "service_complaint_created", label: "Service Complaint Created" },
  { key: "service_status_update", label: "Service Status Update" },
  { key: "ready_for_delivery", label: "Ready for Delivery" },
  { key: "delivery_otp", label: "Delivery OTP" },
  { key: "payment_reminder", label: "Payment Reminder" },
  { key: "auto_reply", label: "Auto Reply" },
];

export function WhatsappTemplates() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templates] = useState<Template[]>([
    {
      id: 1,
      name: "receipt_created",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      headerType: "TEXT",
      headerContent: "Receipt Created",
      bodyContent: "Dear {{1}}, your receipt {{2}} has been created successfully. Track your repair: {{3}}",
      footerContent: "TAJ Electronics",
      variables: ["customer_name", "receipt_number", "tracking_url"],
      createdAt: new Date("2024-01-01"),
    },
    {
      id: 2,
      name: "service_reminder",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      bodyContent: "Hi {{1}}, this is a reminder about your service appointment for {{2}} scheduled for {{3}}.",
      footerContent: "TAJ Electronics",
      variables: ["customer_name", "product", "appointment_date"],
      createdAt: new Date("2024-01-05"),
    },
    {
      id: 3,
      name: "promotion_offer",
      category: "MARKETING",
      language: "en",
      status: "PENDING",
      headerType: "IMAGE",
      bodyContent: "🎉 Special offer for {{1}}! Get {{2}}% off on all repairs. Valid until {{3}}.",
      footerContent: "TAJ Electronics",
      variables: ["customer_name", "discount_percentage", "expiry_date"],
      createdAt: new Date("2024-01-10"),
    },
  ]);

  // Mapping state (with defaults)
  const [usageMapping, setUsageMapping] = useState<Record<UsageKey, { name: string; language: string; paramsOrder: string }>>({
    receipt_created: { name: "receipt_created", language: "en", paramsOrder: "customerName,receiptNumber,trackingUrl" },
    receipt_status_update: { name: "status_update", language: "en", paramsOrder: "customerName,receiptNumber,status,trackingUrl,estimatedAmount" },
    service_complaint_created: { name: "service_complaint_created", language: "en", paramsOrder: "customerName,complaintNumber,product,model,issueDescription,status" },
    service_status_update: { name: "service_status_update", language: "en", paramsOrder: "customerName,complaintNumber,status,oldStatus,product" },
    delivery_otp: { name: "otp_verification", language: "en", paramsOrder: "receiptNumber,otp,validityWindow" },
    ready_for_delivery: { name: "ready_for_delivery", language: "en", paramsOrder: "customerName,receiptNumber,estimatedAmount" },
    payment_reminder: { name: "payment_reminder", language: "en", paramsOrder: "customerName,receiptNumber,estimatedAmount,dueDate" },
    auto_reply: { name: "auto_reply", language: "en", paramsOrder: "trackUrl,phone1,phone2,email" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/whatsapp/settings");
        const data = await res.json();
        if (data?.templateUsage) setUsageMapping((prev) => ({ ...prev, ...data.templateUsage }));
      } catch {}
    };
    load();
  }, []);


  const getStatusBadge = (status: Template["status"]) => {
    const statusConfig = {
      PENDING: { icon: Clock, color: "bg-yellow-500", text: "Pending" },
      APPROVED: { icon: CheckCircle, color: "bg-green-500", text: "Approved" },
      REJECTED: { icon: XCircle, color: "bg-red-500", text: "Rejected" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getCategoryBadge = (category: Template["category"]) => {
    const categoryConfig = {
      MARKETING: { color: "bg-purple-100 text-purple-800", text: "Marketing" },
      UTILITY: { color: "bg-blue-100 text-blue-800", text: "Utility" },
      AUTHENTICATION: { color: "bg-orange-100 text-orange-800", text: "Authentication" },
    };

    const config = categoryConfig[category];
    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const previewTemplate = (template: Template) => {
    let preview = template.bodyContent;
    template.variables.forEach((variable, index) => {
      preview = preview.replace(`{{${index + 1}}}`, `[${variable}]`);
    });
    return preview;
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h2>
          <p className="text-gray-600">Manage your approved message templates</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., order_confirmation"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="header">Header (Optional)</Label>
                <Input
                  id="header"
                  placeholder="Header text"
                />
              </div>

              <div>
                <Label htmlFor="body">Body Content</Label>
                <Textarea
                  id="body"
                  placeholder="Your message content. Use {{1}}, {{2}}, etc. for variables"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="footer">Footer (Optional)</Label>
                <Input
                  id="footer"
                  placeholder="Footer text"
                />
              </div>

              <div>
                <Label htmlFor="variables">Variables</Label>
                <Input
                  id="variables"
                  placeholder="customer_name, order_id, amount (comma separated)"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Submit for Approval
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {templates.filter(t => t.status === "APPROVED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {templates.filter(t => t.status === "PENDING").length}
                </p>
              </div>

	          <div className="mt-8">
	            <Card>
	              <CardHeader>
	                <CardTitle>Template Usage Mapping</CardTitle>
	              </CardHeader>
	              <CardContent className="space-y-4">
	                {(usageKeys as {key: UsageKey; label: string}[]).map(({ key, label }) => (
	                  <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
	                    <div>
	                      <Label>{label} - Template Name</Label>
	                      <Input
	                        value={usageMapping[key].name}
	                        onChange={(e) => setUsageMapping(prev => ({ ...prev, [key]: { ...prev[key], name: e.target.value } }))}
	                        placeholder="template_name"
	                      />
	                    </div>
	                    <div>
	                      <Label>Language</Label>
	                      <Input
	                        value={usageMapping[key].language}
	                        onChange={(e) => setUsageMapping(prev => ({ ...prev, [key]: { ...prev[key], language: e.target.value } }))}
	                        placeholder="en"
	                      />
	                    </div>
	                    <div>
	                      <Label>Parameters Order</Label>
	                      <Input
	                        value={usageMapping[key].paramsOrder}
	                        onChange={(e) => setUsageMapping(prev => ({ ...prev, [key]: { ...prev[key], paramsOrder: e.target.value } }))}
	                        placeholder="comma,separated,tokens"
	                      />
	                    </div>
	                  </div>
	                ))}
	              </CardContent>
	            </Card>
	          </div>

            </div>

	      <div className="flex justify-end mt-4">
	        <Button
	          className="bg-green-600 hover:bg-green-700"
	          onClick={async () => {
	            try {
	              // Merge with existing settings to avoid overwriting
	              const current = await fetch("/api/whatsapp/settings").then(r => r.json()).catch(() => ({}));
	              const payload = {
	                apiSettings: current.apiSettings || {},
	                notificationSettings: current.notificationSettings || {},
	                templateSettings: current.templateSettings || {},
	                templateUsage: usageMapping,
	              };
	              await fetch("/api/whatsapp/settings", {
	                method: "POST",
	                headers: { "Content-Type": "application/json" },
	                body: JSON.stringify(payload),
	              });
	            } catch (e) {
	              console.error(e);
	            }
	          }}
	        >
	          Save Mapping
	        </Button>
	      </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">
                  {templates.filter(t => t.status === "REJECTED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">Create your first WhatsApp message template</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-lg">{template.name}</h3>
                      {getStatusBadge(template.status)}
                      {getCategoryBadge(template.category)}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    {template.headerContent && (
                      <div className="font-medium text-gray-900 mb-2">
                        {template.headerContent}
                      </div>
                    )}
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {previewTemplate(template)}
                    </div>
                    {template.footerContent && (
                      <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                        {template.footerContent}
                      </div>
                    )}
                  </div>

                  {/* Template Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Language</p>
                      <p className="font-medium">{template.language.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Variables</p>
                      <p className="font-medium">{template.variables.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Header Type</p>
                      <p className="font-medium">{template.headerType || "None"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">
                        {template.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Variables List */}
                  {template.variables.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {`{${index + 1}} = ${variable}`}
                          </Badge>
                        ))}
                      </div>
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
