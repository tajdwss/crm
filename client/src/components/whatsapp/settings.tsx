
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Settings,
  Key,
  Webhook,
  MessageSquare,
  Shield,
  Bell,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  FileText,
  Send,
  Eye,
  Copy,
  RefreshCw
} from "lucide-react";

interface WhatsappSettingsData {
  apiSettings: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    apiBaseUrl: string;
    webhookUrl: string;
    verifyToken: string;
  };
  notificationSettings: {
    enableIncomingMessages: boolean;
    enableDeliveryReports: boolean;
    enableReadReceipts: boolean;
    enableAutoReply: boolean;
    autoReplyMessage: string;
  };
  templateSettings: {
    receiptTemplateName: string;
    receiptTemplateLanguage: string;
    receiptTemplateParamsOrder: string;
  };
  templateUsage: Record<string, any>;
}

  const DEFAULT_SETTINGS: WhatsappSettingsData = {
    apiSettings: {
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      apiBaseUrl: "https://graph.facebook.com/v22.0",
      webhookUrl: "",
      verifyToken: "TAJ_ELECTRONICS_2025",
    },
    notificationSettings: {
      enableIncomingMessages: true,
      enableDeliveryReports: true,
      enableReadReceipts: true,
      enableAutoReply: false,
      autoReplyMessage: "Thank you for your message. We'll get back to you soon!",
    },
    templateSettings: {
      receiptTemplateName: "receipt_created",
      receiptTemplateLanguage: "en",
      receiptTemplateParamsOrder: "customerName,receiptNumber,trackingUrl",
    },
    templateUsage: {},
  };

export function WhatsappSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("api");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("disconnected");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/whatsapp/settings"],
    queryFn: () => apiRequest("/api/whatsapp/settings"),
  });

  const [localSettings, setLocalSettings] = useState<WhatsappSettingsData>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (settings) {
      // Deep-merge with defaults to avoid undefined nested fields
      setLocalSettings({
        apiSettings: { ...DEFAULT_SETTINGS.apiSettings, ...(settings.apiSettings || {}) },
        notificationSettings: { ...DEFAULT_SETTINGS.notificationSettings, ...(settings.notificationSettings || {}) },
        templateSettings: { ...DEFAULT_SETTINGS.templateSettings, ...(settings.templateSettings || {}) },
        templateUsage: settings.templateUsage || DEFAULT_SETTINGS.templateUsage,
      });
    } else {
      setLocalSettings(DEFAULT_SETTINGS);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (data: WhatsappSettingsData) =>
      apiRequest("/api/whatsapp/settings", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/settings"] });
      toast({
        title: "Settings Saved",
        description: "WhatsApp configuration has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/whatsapp/test-connection", {
        method: "POST",
        body: localSettings.apiSettings,
      }),
    onSuccess: (data) => {
      setConnectionStatus(data.connected ? "connected" : "disconnected");
      toast({
        title: data.connected ? "Connection Successful" : "Connection Failed",
        description: data.connected
          ? `Connected to ${data.phoneNumber || "WhatsApp Business API"}`
          : data.error || "Unable to connect to WhatsApp",
        variant: data.connected ? "default" : "destructive",
      });
    },
    onError: () => {
      setConnectionStatus("disconnected");
      toast({
        title: "Connection Test Failed",
        description: "Unable to test WhatsApp connection",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  const handleTestConnection = () => {
    setConnectionStatus("testing");
    testConnectionMutation.mutate();
  };

  const updateApiSettings = (field: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      apiSettings: {
        ...prev.apiSettings,
        [field]: value,
      },
    }));
  };

  const updateNotificationSettings = (field: string, value: boolean | string) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [field]: value,
      },
    }));
  };

  const updateTemplateSettings = (field: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      templateSettings: {
        ...prev.templateSettings,
        [field]: value,
      },
    }));
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Business Configuration</h1>
          <p className="text-gray-600">Configure your WhatsApp Business API integration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
            {connectionStatus === "connected" ? <CheckCircle size={12} /> : connectionStatus === "testing" ? <RefreshCw size={12} className="animate-spin" /> : <XCircle size={12} />}
            <span className="ml-1 capitalize">{connectionStatus}</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api">API Setup</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="text-blue-600" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Enter WhatsApp Access Token"
                    value={localSettings.apiSettings.accessToken}
                    onChange={(e) => updateApiSettings("accessToken", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="Enter Phone Number ID"
                    value={localSettings.apiSettings.phoneNumberId}
                    onChange={(e) => updateApiSettings("phoneNumberId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessAccountId">Business Account ID</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="Enter Business Account ID (Optional)"
                    value={localSettings.apiSettings.businessAccountId}
                    onChange={(e) => updateApiSettings("businessAccountId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="apiBaseUrl">API Base URL</Label>
                  <Input
                    id="apiBaseUrl"
                    placeholder="https://graph.facebook.com/v22.0"
                    value={localSettings.apiSettings.apiBaseUrl}
                    onChange={(e) => updateApiSettings("apiBaseUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleTestConnection} disabled={testConnectionMutation.isPending}>
                  <TestTube size={16} className="mr-2" />
                  Test Connection
                </Button>
                <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="text-purple-600" />
                <span>Webhook Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="webhookUrl"
                    value={`${window.location.origin}/api/whatsapp/webhook`}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button onClick={copyWebhookUrl} variant="outline">
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Use this URL in your WhatsApp Business API configuration</p>
              </div>
              <div>
                <Label htmlFor="verifyToken">Verify Token</Label>
                <Input
                  id="verifyToken"
                  value={localSettings.apiSettings.verifyToken}
                  onChange={(e) => updateApiSettings("verifyToken", e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">This token will be used to verify webhook requests</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="text-yellow-600 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Webhook Setup Instructions:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-yellow-700">
                      <li>Copy the webhook URL above</li>
                      <li>Go to your Meta Developer Console</li>
                      <li>Add the webhook URL to your WhatsApp Business API configuration</li>
                      <li>Use the verify token shown above</li>
                      <li>Subscribe to messages and message_status events</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="text-green-600" />
                <span>Message Templates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="receiptTemplate">Receipt Template</Label>
                  <Input
                    id="receiptTemplate"
                    value={localSettings.templateSettings?.receiptTemplateName || ""}
                    onChange={(e) => updateTemplateSettings("receiptTemplateName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="templateLanguage">Language</Label>
                  <Select
                    value={localSettings.templateSettings?.receiptTemplateLanguage || "en"}
                    onValueChange={(value) => updateTemplateSettings("receiptTemplateLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="en_US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paramOrder">Parameter Order</Label>
                  <Input
                    id="paramOrder"
                    value={localSettings.templateSettings?.receiptTemplateParamsOrder || "customerName,receiptNumber,trackingUrl"}
                    onChange={(e) => updateTemplateSettings("receiptTemplateParamsOrder", e.target.value)}
                    placeholder="param1,param2,param3"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Template Usage Examples:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div><span className="font-medium">Receipt Created:</span> receipt_created (customerName, receiptNumber, trackingUrl)</div>
                  <div><span className="font-medium">Status Update:</span> status_update (customerName, receiptNumber, status, trackingUrl)</div>
                  <div><span className="font-medium">Service Complaint:</span> service_complaint_created (customerName, complaintNumber, product)</div>
                  <div><span className="font-medium">OTP Verification:</span> otp_verification (receiptNumber, otp, validityWindow)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="text-orange-600" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="incomingMessages">Incoming Messages</Label>
                    <p className="text-sm text-gray-600">Receive notifications for new messages</p>
                  </div>
                  <Switch
                    id="incomingMessages"
                    checked={localSettings.notificationSettings.enableIncomingMessages}
                    onCheckedChange={(value) => updateNotificationSettings("enableIncomingMessages", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deliveryReports">Delivery Reports</Label>
                    <p className="text-sm text-gray-600">Track message delivery status</p>
                  </div>
                  <Switch
                    id="deliveryReports"
                    checked={localSettings.notificationSettings.enableDeliveryReports}
                    onCheckedChange={(value) => updateNotificationSettings("enableDeliveryReports", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="readReceipts">Read Receipts</Label>
                    <p className="text-sm text-gray-600">Track when messages are read</p>
                  </div>
                  <Switch
                    id="readReceipts"
                    checked={localSettings.notificationSettings.enableReadReceipts}
                    onCheckedChange={(value) => updateNotificationSettings("enableReadReceipts", value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="text-green-600" />
                <span>Automation & Auto-Reply</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoReply">Enable Auto-Reply</Label>
                  <p className="text-sm text-gray-600">Automatically respond to incoming messages</p>
                </div>
                <Switch
                  id="autoReply"
                  checked={localSettings.notificationSettings.enableAutoReply}
                  onCheckedChange={(value) => updateNotificationSettings("enableAutoReply", value)}
                />
              </div>

              {localSettings.notificationSettings.enableAutoReply && (
                <div>
                  <Label htmlFor="autoReplyMessage">Auto-Reply Message</Label>
                  <Textarea
                    id="autoReplyMessage"
                    value={localSettings.notificationSettings.autoReplyMessage}
                    onChange={(e) => updateNotificationSettings("autoReplyMessage", e.target.value)}
                    placeholder="Enter your auto-reply message..."
                    rows={3}
                  />
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Available Automation Features:</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div>✓ Auto-reply to customer messages</div>
                  <div>✓ Automatic receipt notifications</div>
                  <div>✓ Service status updates</div>
                  <div>✓ OTP delivery for orders</div>
                  <div>✓ Customer greeting messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/settings"] })}>
          <RefreshCw size={16} className="mr-2" />
          Reset
        </Button>
        <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
          <Save size={16} className="mr-2" />
          {saveSettingsMutation.isPending ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
