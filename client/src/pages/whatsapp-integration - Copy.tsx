
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Users,
  Settings,
  Send,
  Search,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  MoreVertical,
  Webhook,
  MessageCircle,
  UserCheck,
  Bell,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Bot,
  FileText,
  Check,
  X,
  Eye
} from "lucide-react";

import { WhatsappTemplates } from "@/components/whatsapp/templates";
import { WhatsappSettings } from "@/components/whatsapp/settings";
export default function WhatsAppIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("disconnected");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState("Hello! Welcome to TAJ Electronics. How can we help you today?");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "templates" | "settings">("messages");

  // Queries
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/whatsapp/contacts"],
    queryFn: () => apiRequest("/api/whatsapp/contacts"),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/whatsapp/messages/unread/count"],
    queryFn: () => apiRequest("/api/whatsapp/messages/unread/count").then(d => d.count),
    refetchInterval: 5000,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/whatsapp/settings"],
    queryFn: () => apiRequest("/api/whatsapp/settings"),
  });

  const { data: conversation = [] } = useQuery({
    queryKey: ["/api/whatsapp/contacts", selectedContact?.id, "conversation"],
    queryFn: () => apiRequest(`/api/whatsapp/contacts/${selectedContact.id}/conversation`),
    enabled: !!selectedContact,
    refetchInterval: 3000,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: { to: string; message: string }) =>
      apiRequest("/api/whatsapp/messages/send", { method: "POST", body: data }),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", selectedContact?.id, "conversation"] });
      toast({ title: "Message Sent", description: "Your message has been delivered successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  const syncCustomersMutation = useMutation({
    mutationFn: () => apiRequest("/api/whatsapp/sync-customers", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({
        title: "Sync Complete",
        description: `Synced: ${data.synced}, Skipped: ${data.skipped}`,
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/whatsapp/settings", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/settings"] });
      toast({ title: "Settings Saved", description: "WhatsApp settings updated successfully." });
    },
  });

  // Auto-check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("testing");
        const response = await apiRequest("/api/whatsapp/health");
        setConnectionStatus(response.connected ? "connected" : "disconnected");
      } catch {
        setConnectionStatus("disconnected");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    sendMessageMutation.mutate({
      to: selectedContact.phoneNumber,
      message: messageText,
    });
  };

  const handleSendGreeting = (contact: any) => {
    sendMessageMutation.mutate({
      to: contact.phoneNumber,
      message: greetingMessage,
    });
  };

  const filteredContacts = contacts.filter((contact: any) =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-green-600" size={24} />
            <div>
              <h1 className="font-bold text-lg">WhatsApp Business</h1>
              <p className="text-xs text-gray-500">TAJ Electronics CRM</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
              {connectionStatus === "connected" ? <Wifi size={12} /> : <WifiOff size={12} />}
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="min-w-6 h-6 rounded-full p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Global Tabs */}
      <div className="hidden lg:block border-b bg-white">
        <div className="px-4 py-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab !== "messages" && (
        <div className="hidden lg:block p-4">
          {activeTab === "templates" ? <WhatsappTemplates /> : <WhatsappSettings />}
        </div>
      )}


      <div className="flex h-screen lg:h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar / Mobile Full Screen */}
        <div className={`${selectedContact ? 'hidden lg:block' : 'block'} w-full lg:w-80 bg-white border-r`}>
          {/* Header */}
          <div className="hidden lg:block p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="text-green-600" />
                <h1 className="font-bold text-xl">WhatsApp</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
                  {connectionStatus === "connected" ? <Wifi size={12} /> : <WifiOff size={12} />}
                  <span className="ml-1 capitalize">{connectionStatus}</span>
                </Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </div>


            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Mobile Search */}
          <div className="lg:hidden p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-b bg-gray-50 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => syncCustomersMutation.mutate()}
                disabled={syncCustomersMutation.isPending}
                className="flex-1 lg:flex-none"
              >
                <RefreshCw size={14} className={syncCustomersMutation.isPending ? "animate-spin" : ""} />
                <span className="ml-1">Sync</span>
              </Button>
              <Button size="sm" variant="outline" className="flex-1 lg:flex-none">
                <Plus size={14} />
                <span className="ml-1">Add</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh"
              />
              <Label htmlFor="auto-refresh" className="text-xs">Auto Refresh</Label>
            </div>
          </div>

          {/* Contacts List */}
          <ScrollArea className="h-[calc(100vh-16rem)] lg:h-[calc(100vh-20rem)]">
            <div className="p-2">
              {contactsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold">
                                {contact.name?.charAt(0)?.toUpperCase() || contact.phoneNumber.slice(-2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name || "Unknown"}</p>
                              <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {contact.customerId && (
                            <Badge variant="outline" className="text-xs">Customer</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendGreeting(contact);
                            }}
                            className="h-6 px-2"
                          >
                            <Bot size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`${selectedContact ? 'block' : 'hidden lg:block'} flex-1 flex flex-col bg-gray-100`}>
          {selectedContact ? (
            <>

              {/* Chat Header */}
              <div className="bg-white p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedContact(null)}
                    className="lg:hidden"
                  >
                    ←
                  </Button>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">
                      {selectedContact.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedContact.name || "Unknown Contact"}</h3>
                    <p className="text-sm text-gray-500">{selectedContact.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Phone size={16} />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversation.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'outbound'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-75">
                            {new Date(message.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.direction === 'outbound' && (
                            <div className="ml-2">
                              {message.status === 'delivered' ? (
                                <CheckCircle size={12} className="opacity-75" />
                              ) : message.status === 'read' ? (
                                <div className="flex">
                                  <Check size={12} className="opacity-75" />
                                  <Check size={12} className="opacity-75 -ml-1" />
                                </div>
                              ) : (
                                <Clock size={12} className="opacity-75" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal would go here */}
    </div>
  );
}
