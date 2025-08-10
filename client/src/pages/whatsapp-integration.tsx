import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Search,
  Clock,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  Bot,
  MoreVertical,
  MessageCircle
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
  const [greetingMessage] = useState("Hello! Welcome to TAJ Electronics. How can we help you today?");
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
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  const syncCustomersMutation = useMutation({
    mutationFn: () => apiRequest("/api/whatsapp/sync-customers", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({ title: "Sync Complete", description: `Synced: ${data.synced}, Skipped: ${data.skipped}` });
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
    <div className="min-h-screen bg-[#ECE5DD] flex flex-col">
      {/* Tab Buttons */}
      <div className="bg-[#075E54] text-white flex">
        <Button
          variant={activeTab === "messages" ? "secondary" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("messages")}
        >
          Messages
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "templates" ? "secondary" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </Button>
        <Button
          variant={activeTab === "settings" ? "secondary" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "messages" && (
          <>
            {/* Left Sidebar - Contacts */}
            <div className={`${selectedContact ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 bg-white border-r`}>
              {/* Header */}
              <div className="bg-[#075E54] text-white p-4 flex justify-between items-center">
                <MessageSquare className="text-white" />
                <div className="flex items-center gap-2">
                  <Badge
                    variant={connectionStatus === "connected" ? "default" : "destructive"}
                    className="bg-white text-black"
                  >
                    {connectionStatus === "connected" ? <Wifi size={12} /> : <WifiOff size={12} />}
                  </Badge>
                </div>
              </div>

              {/* Search */}
              <div className="p-2 border-b bg-[#f6f6f6]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    placeholder="Search or start new chat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 border-b flex gap-2">
                <Button
                  size="sm"
                  onClick={() => syncCustomersMutation.mutate()}
                  disabled={syncCustomersMutation.isPending}
                >
                  <RefreshCw size={14} className={syncCustomersMutation.isPending ? "animate-spin" : ""} />
                </Button>
                <Button size="sm" variant="outline">
                  <Plus size={14} />
                </Button>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Label className="text-xs">Auto</Label>
              </div>

              {/* Contact List */}
              <ScrollArea className="flex-1">
                {contactsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : (
                  filteredContacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 ${
                        selectedContact?.id === contact.id ? "bg-gray-200" : ""
                      }`}
                    >
                      <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-900">
                        {contact.name?.charAt(0)?.toUpperCase() || contact.phoneNumber.slice(-2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendGreeting(contact);
                        }}
                      >
                        <Bot size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Right Side - Chat */}
            <div className={`${selectedContact ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-[#075E54] text-white p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedContact(null)}
                        className="lg:hidden text-white"
                      >
                        ←
                      </Button>
                      <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-900">
                        {selectedContact.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedContact.name || "Unknown"}</p>
                        <p className="text-xs">{selectedContact.phoneNumber}</p>
                      </div>
                    </div>
                    <MoreVertical />
                  </div>

                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 p-4 space-y-2">
                    {conversation.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.direction === 'outbound'
                              ? 'bg-[#DCF8C6] text-black'
                              : 'bg-white text-black'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className="text-[11px] text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.direction === 'outbound' && (
                              <>
                                {message.status === 'read' ? (
                                  <span className="text-blue-500">✔✔</span>
                                ) : message.status === 'delivered' ? (
                                  <span>✔✔</span>
                                ) : (
                                  <Clock size={12} />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="bg-[#f0f0f0] p-3 flex gap-2">
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message"
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
                      disabled={!messageText.trim()}
                      className="bg-[#128C7E] hover:bg-[#075E54]"
                    >
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center flex-col text-gray-500">
                  <MessageCircle size={64} />
                  <p>Select a conversation</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "templates" && (
          <div className="flex-1 p-4 bg-white">
            <WhatsappTemplates />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 p-4 bg-white">
            <WhatsappSettings />
          </div>
        )}
      </div>
    </div>
  );
}
