import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, MessageSquare, Check, Eye, MapPin, Send, CheckCircle, FileText } from "lucide-react";
import { useReceipts } from "@/hooks/use-receipts";
import { Receipt } from "@/types";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ReceiptsTableProps {
  onPrintReceipt: (receipt: Receipt) => void;
  onMarkDelivered: (receipt: Receipt) => void;
}

export function ReceiptsTable({ onPrintReceipt, onMarkDelivered }: ReceiptsTableProps) {
  const { data: receipts = [], isLoading } = useReceipts();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredReceipts = receipts.filter(receipt => {
    const search = searchTerm.toLowerCase();
    const searchName = receipt.isCompanyItem ? receipt.companyName : receipt.customerName;
    const searchMobile = receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile;
    
    const matchesSearch = 
      receipt.receiptNumber.toLowerCase().includes(search) ||
      searchName.toLowerCase().includes(search) ||
      searchMobile.includes(searchTerm) ||
      (receipt.isCompanyItem && receipt.customerName.toLowerCase().includes(search)) ||
      (receipt.rgpNumber && receipt.rgpNumber.toLowerCase().includes(search)) ||
      receipt.product.toLowerCase().includes(search) ||
      receipt.model.toLowerCase().includes(search);
    
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Process":
        return "bg-blue-100 text-blue-800";
      case "Product Ordered":
        return "bg-purple-100 text-purple-800";
      case "Ready to Deliver":
        return "bg-green-100 text-green-800";
      case "Delivered":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleWhatsApp = (receipt: Receipt) => {
    const customerName = receipt.isCompanyItem ? receipt.companyName : receipt.customerName;
    const mobile = receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile;
    const message = `Hello ${customerName}, your repair receipt ${receipt.receiptNumber} has been generated. Track your repair status: ${window.location.origin}/track/${receipt.receiptNumber}`;
    const whatsappUrl = `https://wa.me/${mobile.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTrack = (receipt: Receipt) => {
    window.open(`/track/${receipt.receiptNumber}`, '_blank');
  };

  const handleSendReceiptWhatsApp = async (receipt: Receipt) => {
    try {
      const response = await fetch('/api/send-receipt-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: receipt.id,
          mobile: receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile,
          customerName: receipt.isCompanyItem ? receipt.companyName : receipt.customerName
        }),
      });

      if (response.ok) {
        toast({
          title: "Receipt Sent",
          description: "Receipt has been sent via WhatsApp successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send receipt via WhatsApp",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to send receipt via WhatsApp",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="hidden lg:block">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by receipt number, customer name, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Product Ordered">Product Ordered</SelectItem>
              <SelectItem value="Ready to Deliver">Ready to Deliver</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden">
        {filteredReceipts.map((receipt) => (
          <Card key={receipt.id} className="mb-4 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-blue-600">{receipt.receiptNumber}</h3>
                    <Badge className={getStatusColor(receipt.status)} variant="secondary">
                      {receipt.status}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {format(receipt.createdAt, "dd/MM/yyyy")}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Customer:</span>
                    <span className="text-right">{receipt.isCompanyItem ? receipt.companyName : receipt.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Mobile:</span>
                    <span className="text-right">{receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Device:</span>
                    <span className="text-right">{receipt.product} - {receipt.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Amount:</span>
                    <span className="text-right font-semibold">₹{receipt.estimatedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Payment:</span>
                    <Badge className={`${receipt.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {receipt.paymentStatus || 'Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onPrintReceipt(receipt)}
                    className="text-xs"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleWhatsApp(receipt)}
                    className="text-xs"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTrack(receipt)}
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Track
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onMarkDelivered(receipt)}
                    disabled={receipt.status === "Delivered"}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Deliver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                <TableCell>{receipt.isCompanyItem ? receipt.companyName : receipt.customerName}</TableCell>
                <TableCell>{receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile}</TableCell>
                <TableCell>{receipt.product} - {receipt.model}</TableCell>
                <TableCell>₹{receipt.estimatedAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(receipt.status)}>{receipt.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${receipt.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {receipt.paymentStatus || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>{format(receipt.createdAt, "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onPrintReceipt(receipt)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(receipt)}>
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleTrack(receipt)}>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onMarkDelivered(receipt)} disabled={receipt.status === "Delivered"}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
















