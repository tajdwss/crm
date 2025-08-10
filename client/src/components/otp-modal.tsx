import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, X, User, Building, Phone } from "lucide-react";
import { Receipt } from "@/types";
import { useUpdateReceipt } from "@/hooks/use-receipts";
import { useToast } from "@/hooks/use-toast";

interface OtpModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OtpModal({ receipt, isOpen, onClose }: OtpModalProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedMobileType, setSelectedMobileType] = useState("person");
  const [customMobile, setCustomMobile] = useState("");
  const [customName, setCustomName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const updateReceipt = useUpdateReceipt();
  const { toast } = useToast();

  const getMobileNumber = () => {
    if (!receipt) return "";
    
    switch (selectedMobileType) {
      case "person":
        return receipt.mobile;
      case "company":
        return receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile;
      case "custom":
        return customMobile;
      default:
        return receipt.mobile;
    }
  };

  const getRecipientName = () => {
    if (!receipt) return "";
    
    switch (selectedMobileType) {
      case "person":
        return receipt.customerName;
      case "company":
        return receipt.isCompanyItem ? receipt.companyName : receipt.customerName;
      case "custom":
        return customName || "Custom Recipient";
      default:
        return receipt.customerName;
    }
  };

  const handleVerifyOtp = async () => {
    if (!receipt || !otp) return;

    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: receipt.id,
          otp: otp.trim()
        }),
      });

      if (response.ok) {
        await updateReceipt.mutateAsync({
          id: receipt.id,
          updates: {
            status: "Delivered",
            deliveredAt: new Date(),
            deliveryNote: deliveryNote || `Delivered to ${getRecipientName()} (${getMobileNumber()})`,
          }
        });
        
        toast({
          title: "Delivery Confirmed",
          description: `Receipt ${receipt.receiptNumber} has been marked as delivered.`,
        });
        
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Invalid OTP", 
          description: error.error || "Please check the OTP and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendOtp = async () => {
    if (!receipt) return;

    const mobile = getMobileNumber();
    if (!mobile) {
      toast({
        title: "Error",
        description: "Please enter a valid mobile number.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMobileType === "custom" && !customName.trim()) {
      toast({
        title: "Error",
        description: "Please enter recipient name for custom delivery.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          receiptId: receipt.id,
          otpType: selectedMobileType,
          recipientName: getRecipientName()
        }),
      });

      if (response.ok) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: `OTP has been sent to ${getRecipientName()} (${mobile}) via SMS and WhatsApp.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resetForm = () => {
    setOtp("");
    setOtpSent(false);
    setSelectedMobileType("person");
    setCustomMobile("");
    setCustomName("");
    setDeliveryNote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!receipt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="text-white text-lg" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Verify Delivery</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Confirm receipt delivery with OTP</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-800 font-medium mb-2">
              Receipt: {receipt.receiptNumber}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              {receipt.isCompanyItem ? "Company" : "Customer"}: {receipt.isCompanyItem ? receipt.companyName : receipt.customerName}
            </p>
          </div>

          {/* Mobile Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Send OTP To:</Label>
            <Select value={selectedMobileType} onValueChange={setSelectedMobileType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Person Who Brought ({receipt.customerName} - {receipt.mobile})</span>
                  </div>
                </SelectItem>
                {receipt.isCompanyItem && (
                  <SelectItem value="company">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>Company ({receipt.companyName} - {receipt.companyMobile})</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="custom">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Custom Number</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Mobile Input */}
          {selectedMobileType === "custom" && (
            <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div>
                <Label htmlFor="customName" className="text-sm font-medium text-gray-700">
                  Recipient Name *
                </Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter recipient name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customMobile" className="text-sm font-medium text-gray-700">
                  Mobile Number *
                </Label>
                <Input
                  id="customMobile"
                  value={customMobile}
                  onChange={(e) => setCustomMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Send OTP Button */}
          {!otpSent ? (
            <Button
              onClick={handleSendOtp}
              disabled={isSendingOtp || (selectedMobileType === "custom" && (!customMobile || !customName))}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-12"
            >
              {isSendingOtp ? "Sending OTP..." : `Send OTP to ${getRecipientName()}`}
            </Button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-medium">
                ✅ OTP sent to {getRecipientName()} ({getMobileNumber()})
              </p>
              <p className="text-green-600 text-xs mt-1">
                Please ask recipient for the 6-digit OTP
              </p>
            </div>
          )}
          
          {/* OTP Input */}
          <div className="space-y-3">
            <Label htmlFor="otp" className="text-sm font-medium text-gray-700">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-bold h-14 rounded-xl border-2 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {/* Delivery Note */}
          <div className="space-y-3">
            <Label htmlFor="deliveryNote" className="text-sm font-medium text-gray-700">
              Delivery Note (Optional)
            </Label>
            <Textarea
              id="deliveryNote"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Add any delivery notes (who collected, condition, etc.)"
              className="min-h-[60px]"
            />
          </div>
          
          {otpSent && (
            <div className="text-xs text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <strong>Note:</strong> OTP is valid for 10 minutes only. Check console logs if SMS/WhatsApp not configured.
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Button 
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleVerifyOtp}
            disabled={!otp || isVerifying || !otpSent}
          >
            {isVerifying ? "Verifying..." : "Verify & Mark Delivered"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="h-12 px-6 border-gray-300 hover:bg-gray-50 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

