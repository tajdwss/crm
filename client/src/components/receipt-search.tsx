import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText } from "lucide-react";

export function ReceiptSearch() {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptNumber.trim()) {
      setLocation(`/track/${receiptNumber.trim()}`);
    }
  };

  return (
    <Card className="card-standard">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <span className="heading-secondary">Track Your Repair</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiptNumber" className="label-standard required">
              Receipt Number
            </Label>
            <Input
              id="receiptNumber"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Enter your receipt number (e.g., TD001)"
              className="input-standard"
              required
            />
            <p className="text-sm text-gray-500">
              Enter the receipt number from your repair receipt to track the status
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="btn-primary-standard w-full"
            disabled={!receiptNumber.trim()}
          >
            <Search className="w-4 h-4 mr-2" />
            Track Repair Status
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Receipt numbers start with "TD" (e.g., TD001, TD002)</li>
            <li>• Check your printed receipt for the exact number</li>
            <li>• Contact us at +91 98765 43210 if you can't find your receipt</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}