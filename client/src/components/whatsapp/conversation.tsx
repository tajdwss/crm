import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  useWhatsappConversation,
  useSendWhatsappMessage,
  useMarkWhatsappMessageRead,
  type WhatsappContact,
  type WhatsappMessage
} from "@/hooks/use-whatsapp";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";

interface WhatsappConversationProps {
  contact: WhatsappContact;
}

export function WhatsappConversation({ contact }: WhatsappConversationProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: conversation = [], isLoading } = useWhatsappConversation(contact.id);
  const sendMessage = useSendWhatsappMessage();
  const markAsRead = useMarkWhatsappMessageRead();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Mark unread messages as read when conversation is opened
  useEffect(() => {
    const unreadMessages = conversation.filter(msg => 
      msg.direction === "inbound" && !msg.isRead
    );
    
    unreadMessages.forEach(msg => {
      markAsRead.mutate(msg.id);
    });
  }, [conversation, markAsRead]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const messageText = message.trim();
    setMessage("");
    setIsTyping(true);
    
    try {
      await sendMessage.mutateAsync({
        to: contact.phoneNumber,
        message: messageText,
        contactId: contact.id,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (msg: WhatsappMessage) => {
    if (msg.direction === "inbound") return null;
    
    switch (msg.status) {
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM dd, HH:mm");
    }
  };

  const groupMessagesByDate = (messages: WhatsappMessage[]) => {
    const groups: { [key: string]: WhatsappMessage[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.timestamp);
      let dateKey;
      
      if (isToday(date)) {
        dateKey = "Today";
      } else if (isYesterday(date)) {
        dateKey = "Yesterday";
      } else {
        dateKey = format(date, "MMMM dd, yyyy");
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(conversation);

  return (
    <div className="h-full flex flex-col">
      {/* Contact Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{contact.name}</h3>
            <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={async () => {
                const receiptNumber = prompt("Enter Receipt Number to send");
                if (!receiptNumber) return;
                try {
                  await fetch("/api/whatsapp/send/receipt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiptNumber, to: contact.phoneNumber }),
                  });
                } catch {}
              }}>Send Receipt</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                const complaintNumber = prompt("Enter Complaint Number to send status");
                if (!complaintNumber) return;
                try {
                  await fetch("/api/whatsapp/send/service-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ complaintNumber }),
                  });
                } catch {}
              }}>Send Service Status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([dateKey, messages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {dateKey}
              </div>
            </div>
            
            {/* Messages for this date */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.direction === "outbound"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {/* Message Content */}
                  <div className="break-words">
                    {msg.messageType === "template" ? (
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs">
                          Template: {msg.templateName}
                        </Badge>
                        <p>{msg.content}</p>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  
                  {/* Message Time and Status */}
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    msg.direction === "outbound" ? "text-green-100" : "text-gray-500"
                  }`}>
                    <span className="text-xs">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                    {getMessageStatusIcon(msg)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="sm" className="mb-2">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-32 resize-none"
              rows={1}
            />
          </div>
          
          <Button variant="ghost" size="sm" className="mb-2">
            <Smile className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessage.isPending}
            className="mb-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
