import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.username || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Use the login API endpoint
      const user = await apiRequest("/api/login", {
        method: "POST",
        body: {
          username: formData.username,
          password: formData.password,
        },
      });

      // Store user info in localStorage
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("username", user.username);
      localStorage.setItem("userId", user.id.toString());

      // Redirect based on role
      switch (user.role) {
        case "admin":
          setLocation("/admin-dashboard");
          break;
        case "technician":
          setLocation("/technician-dashboard");
          break;
        case "service_engineer":
          setLocation("/service-engineer-dashboard");
          break;
        default:
          toast({
            title: "Access Error",
            description: "Invalid user role.",
            variant: "destructive",
          });
          setLoading(false);
          return;
      }

      toast({
        title: "Login Successful",
        description: `Welcome ${user.name || user.username}!`,
      });

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="card-modern p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 opacity-60"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Wrench className="text-white text-3xl" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TAJ CRM Login
              </h1>
              <p className="text-base text-gray-600 font-medium">Repair Management System</p>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
            </div>
            </div>
            <Button 
              onClick={() => setLocation("/")}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-bold text-gray-700">Username</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className="input-modern pl-14"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700">Password</Label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="input-modern pl-14"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full h-16 text-lg font-bold relative overflow-hidden group"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-500"></div>
                <span className="relative z-10">{loading ? "Logging in..." : "Access System"}</span>
              </button>
            </form>


            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500 font-medium">© 2025 TAJ CRM. Professional Repair Management.</p>
            </div>
          </div>
        </div>
      </div>

  );
}