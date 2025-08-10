import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, MessageSquare, Check, Eye } from "lucide-react";
import { useReceipts } from "@/hooks/use-receipts";
import { Receipt } from "@/types";

interface RecentReceiptsProps {
  onPrintReceipt: (receipt: Receipt) => void;
  onMarkDelivered: (receipt: Receipt) => void;
}

export function RecentReceipts({ onPrintReceipt, onMarkDelivered }: RecentReceiptsProps) {
  const { data: receipts = [], isLoading } = useReceipts();
  
  const recentReceipts = receipts.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "status-badge status-pending";
      case "In Process":
        return "status-badge status-process";
      case "Product Ordered":
        return "status-badge status-process";
      case "Ready to Deliver":
        return "status-badge status-ready";
      case "Delivered":
        return "status-badge status-delivered";
      default:
        return "status-badge status-pending";
    }
  };

  const handleWhatsApp = (receipt: Receipt) => {
    const message = `Hello ${receipt.customerName}, your repair receipt ${receipt.receiptNumber} has been generated. Track your repair status: ${window.location.origin}/track/${receipt.receiptNumber}`;
    const whatsappUrl = `https://wa.me/${receipt.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Receipts</h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card glass-effect shadow-lg hover:shadow-xl transition-all duration-300 border-0">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold gradient-text">Recent Receipts</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Latest 5 repair entries</p>
          </div>
          <Button variant="link" className="modern-button text-xs sm:text-sm font-medium p-0">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {recentReceipts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No receipts found. Create your first repair entry.
            </div>
          ) : (
            recentReceipts.map((receipt) => (
              <div key={receipt.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-lg">{receipt.receiptNumber}</span>
                  <Badge className={`${getStatusColor(receipt.status)} px-3 py-1 text-xs font-medium rounded-full`}>
                    {receipt.status}
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-800 font-medium">{receipt.customerName}</p>
                  <p className="text-sm text-gray-600">{receipt.product} - {receipt.model}</p>
                  <p className="text-xs text-gray-500">₹{receipt.estimatedAmount.toLocaleString()}</p>
                  <p className="text-xs">
                    <Badge className={`${receipt.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} text-xs`}>
                      {receipt.paymentStatus || 'Pending'} Payment
                    </Badge>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8 rounded-lg font-medium"
                    onClick={() => onPrintReceipt(receipt)}
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8 rounded-lg font-medium"
                    onClick={() => handleWhatsApp(receipt)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700 text-xs h-8 px-3 rounded-lg font-medium"
                    onClick={() => onMarkDelivered(receipt)}
                    disabled={receipt.status === "Delivered"}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
