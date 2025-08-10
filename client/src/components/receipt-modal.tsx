import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Wrench } from "lucide-react";
import { Receipt } from "@/types";
import { format } from "date-fns";
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
// Logo removed - using text-based branding

interface ReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ receipt, isOpen, onClose }: ReceiptModalProps) {
  const handlePrint = async () => {
    if (!receipt) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get clean text content from the receipt
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      date: format(receipt.createdAt, "dd/MM/yyyy HH:mm"),
      customerName: receipt.isCompanyItem ? receipt.companyName : receipt.customerName,
      whoBought: receipt.isCompanyItem ? receipt.customerName : null,
      mobile: receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile,
      rgpNumber: receipt.rgpNumber,
      rgpDate: receipt.rgpDate ? format(new Date(receipt.rgpDate), "dd/MM/yyyy") : '',
      product: receipt.product,
      model: receipt.model,
      problem: receipt.problemDescription,
      estimatedAmount: receipt.estimatedAmount,
      status: receipt.status,
      estimatedDeliveryDate: receipt.estimatedDeliveryDate ? format(new Date(receipt.estimatedDeliveryDate), "dd/MM/yyyy") : "Not set",
      trackingUrl: `${window.location.origin}/track/${receipt.receiptNumber}`
    };

    // Using text-based branding instead of logo
    const logoBase64 = '';

    // Generate barcode for receipt number
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, receipt.receiptNumber, {
      format: "CODE128",
      width: 1,
      height: 25,
      displayValue: true,
      fontSize: 8,
      margin: 0
    });
    const barcodeDataUrl = canvas.toDataURL();

    // Generate QR code for tracking link
    const qrCodeDataUrl = await QRCode.toDataURL(receiptData.trackingUrl, {
      width: 60,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receiptData.receiptNumber}</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: 80mm 130mm;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Courier New', 'Courier', monospace !important;
              font-size: 8px !important;
              line-height: 0.9 !important;
              color: #000 !important;
              background: #fff !important;
              width: 80mm !important;
              height: auto !important;
              max-height: 130mm !important;
              padding: 1mm !important;
              margin: 0 !important;
              overflow: hidden !important;
            }
            .receipt {
              width: 100% !important;
              height: auto !important;
              overflow: hidden !important;
              display: block !important;
            }
            .center { 
              text-align: center !important;
              margin: 0.2mm 0 !important;
            }
            .bold { 
              font-weight: bold !important;
            }
            .line {
              border-bottom: 1px dashed #000 !important;
              margin: 0.2mm 0 !important;
              padding-bottom: 0.2mm !important;
            }
            .row {
              display: flex !important;
              justify-content: space-between !important;
              margin: 0.2mm 0 !important;
              align-items: flex-start !important;
            }
            .label {
              flex-shrink: 0 !important;
              margin-right: 2mm !important;
              font-weight: bold !important;
            }
            .value {
              text-align: right !important;
              word-wrap: break-word !important;
              flex-grow: 1 !important;
            }
            .problem {
              white-space: pre-wrap !important;
              word-break: break-word !important;
              margin: 1mm 0 !important;
              text-align: left !important;
            }
            .logo {
              max-width: 20mm !important;
              height: auto !important;
              margin: 0.5mm auto !important;
              display: block !important;
            }
            .barcode {
              margin: 0.5mm auto !important;
              display: block !important;
              max-width: 60mm !important;
            }
            .qrcode {
              margin: 0.2mm auto !important;
              display: block !important;
              width: 12mm !important;
              height: 12mm !important;
            }
            .company-header {
              font-size: 9px !important;
              font-weight: bold !important;
              margin: 0.3mm 0 !important;
            }
            .company-tagline {
              font-size: 7px !important;
              font-style: italic !important;
              margin: 0.2mm 0 !important;
            }
            .tracking-section {
              background-color: #f9f9f9 !important;
              padding: 0.2mm !important;
              border: 1px solid #ddd !important;
              margin: 0.2mm 0 !important;
            }
            .amount-highlight {
              font-size: 9px !important;
              font-weight: bold !important;
              background-color: #f0f0f0 !important;
              padding: 0.8mm !important;
              border: 1px solid #ccc !important;
            }
            h2 {
              font-size: 8px !important;
              margin: 0.5mm 0 !important;
            }
            p {
              margin: 0.3mm 0 !important;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .tracking-section { background-color: #f9f9f9 !important; }
              .amount-highlight { background-color: #f0f0f0 !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Company Header -->
            <div class="center">
              <div class="company-header">New Taj Electronics</div>
              <div class="company-tagline">Professional Electronics Repair Service</div>
              <div style="font-size: 6px; margin: 0.1mm 0;">www.tajdws.com | Phone: 07272-356183, 07272-220005</div>
            </div>
            
            <!-- Receipt Number Barcode -->
            <div class="center">
              <img src="${barcodeDataUrl}" class="barcode" alt="Receipt Barcode">
            </div>
            
            <div class="line">
              <div class="row">
                <span class="label">Receipt:</span>
                <span class="value bold">${receiptData.receiptNumber}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span class="value">${receiptData.date}</span>
              </div>
            </div>

            <div class="line">
              <div class="row">
                <span class="label">Customer:</span>
                <span class="value">${receiptData.customerName}</span>
              </div>
              ${receiptData.whoBought ? `
              <div class="row">
                <span class="label">Who Bought:</span>
                <span class="value">${receiptData.whoBought}</span>
              </div>
              ` : ''}
              <div class="row">
                <span class="label">Mobile:</span>
                <span class="value">${receiptData.mobile}</span>
              </div>
              ${receiptData.rgpNumber ? `
              <div class="row">
                <span class="label">RGP:</span>
                <span class="value">${receiptData.rgpNumber}</span>
              </div>
              ` : ''}
            </div>

            <div class="line">
              <div class="row">
                <span class="label">Product:</span>
                <span class="value">${receiptData.product}</span>
              </div>
              <div class="row">
                <span class="label">Model:</span>
                <span class="value">${receiptData.model}</span>
              </div>
              <div style="margin: 0.2mm 0;">
                <div class="label">Problem:</div>
                <div class="problem" style="font-size: 7px; margin: 0.1mm 0;">${receiptData.problem}</div>
              </div>
            </div>
            
            <!-- QR Code for Tracking -->
            <div class="center tracking-section">
              <div style="font-weight: bold; margin-bottom: 0.2mm; font-size: 7px;">Track Your Repair</div>
              <img src="${qrCodeDataUrl}" class="qrcode" alt="Tracking QR Code">
              <div style="font-size: 5px; margin-top: 0.1mm;">Scan to track online</div>
            </div>
            
            <!-- Footer -->
            <div class="center" style="margin-top: 0.2mm;">
              <div style="font-weight: bold; font-size: 6px;">Thank you for choosing New Taj Electronics!</div>
              <div style="font-size: 5px;">For queries: tajdws@gmail.com</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!receipt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">Receipt Preview</DialogTitle>
        </DialogHeader>
        
        <div id="receipt-content" className="p-6 font-mono text-sm bg-white">
          <div className="center border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">TAJ</span>
            </div>
            <h2 className="bold text-xl text-gray-900 mb-2">TAJ DWS</h2>
            <p className="text-sm text-gray-700 mb-1">Professional Electronics Repair Service</p>
            <p className="text-sm text-gray-600">Phone: 07272-356183, 07272-220005</p>
          </div>
          
          <div className="mb-3">
            <div className="flex">
              <span>Receipt No:</span>
              <span className="bold">{receipt.receiptNumber}</span>
            </div>
            <div className="flex">
              <span>Date:</span>
              <span>{format(receipt.createdAt, "dd/MM/yyyy HH:mm")}</span>
            </div>
          </div>

          <div className="border-dashed">
            <div className="flex">
              <span>{receipt.isCompanyItem ? "Company:" : "Customer:"}</span>
              <span>{receipt.isCompanyItem ? receipt.companyName : receipt.customerName}</span>
            </div>
            {receipt.isCompanyItem && (
              <div className="flex">
                <span>Who Bought:</span>
                <span>{receipt.customerName}</span>
              </div>
            )}
            <div className="flex">
              <span>Mobile:</span>
              <span>{receipt.isCompanyItem ? receipt.companyMobile : receipt.mobile}</span>
            </div>
            {receipt.rgpNumber && (
              <>
                <div className="flex">
                  <span>RGP No:</span>
                  <span>{receipt.rgpNumber}</span>
                </div>
                {receipt.rgpDate && (
                  <div className="flex">
                    <span>RGP Date:</span>
                    <span>{format(new Date(receipt.rgpDate), "dd/MM/yyyy")}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-dashed">
            <div className="flex">
              <span>Product:</span>
              <span>{receipt.product}</span>
            </div>
            <div className="flex">
              <span>Model:</span>
              <span>{receipt.model}</span>
            </div>
            <div className="mb-2">
              <span>Problem:</span>
              <div className="problem-text text-xs mt-1 text-gray-700">{receipt.problemDescription}</div>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            <div className="flex justify-between">
              <span>Estimated Amount:</span>
              <span className="font-semibold">₹{receipt.estimatedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span>{receipt.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Delivery:</span>
              <span>{receipt.estimatedDeliveryDate ? format(new Date(receipt.estimatedDeliveryDate), "dd/MM/yyyy") : "Not set"}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 mb-3">
            <p>Track your repair status online:</p>
            <p className="font-mono bg-gray-100 p-1 rounded break-all">
              {window.location.origin}/track/{receipt.receiptNumber}
            </p>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Thank you for choosing New Taj Electronics!</p>
            <p>For any queries: tajdws@gmail.com</p>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4 border-t">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}




