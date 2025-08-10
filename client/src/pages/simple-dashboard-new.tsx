import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Search, User } from "lucide-react";

export default function SimpleDashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        <div className="card-modern p-10 text-center relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 opacity-60"></div>
          
          <div className="relative z-10">
            {/* Logo and Title */}
            <div className="mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:rotate-12 transition-transform duration-300">
                <Wrench className="text-white text-4xl" />
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TAJ CRM
              </h1>
              <p className="text-gray-600 text-xl font-medium">Professional Repair Management System</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Main Login Button */}
            <div className="space-y-6 mb-10">
              <button 
                onClick={() => setLocation("/login")}
                className="btn-primary w-full h-16 text-xl font-black flex items-center justify-center gap-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-500"></div>
                <User className="w-7 h-7 relative z-10" />
                <span className="relative z-10">Access System</span>
              </button>
              
              <p className="text-sm text-gray-500 font-medium">
                Secure access to admin, technician, and service panels
              </p>
            </div>

            {/* Customer Tracking */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                <Search className="w-6 h-6 text-blue-600" />
                Customer Services
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => setLocation("/track/TD001")}
                  className="btn-secondary w-full h-14 text-base font-bold flex items-center justify-center gap-3 group"
                >
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Track Your Repair Status
                </button>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-white rounded-xl border">
                    <div className="text-2xl font-black text-blue-600">24/7</div>
                    <div className="text-xs text-gray-600 font-medium">Support</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border">
                    <div className="text-2xl font-black text-green-600">Fast</div>
                    <div className="text-xs text-gray-600 font-medium">Service</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 font-medium">© 2025 TAJ CRM. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-1000"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse animation-delay-2000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}