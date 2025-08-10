
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings, BarChart3, Database, Smartphone, Wrench, Phone, Mail, MapPin, Clock, Award } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/Logo";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Professional Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Wrench className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TAJ Electronics</h1>
                <p className="text-sm text-gray-600">Professional Service Management</p>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="hidden lg:flex items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="font-medium">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>service@tajelectronics.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Professional Service Center</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Wrench className="text-white text-3xl" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                New Taj Electronics
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Advanced Customer Relationship Management & Service Tracking System
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">24/7</h3>
                <p className="text-gray-600">Service Support</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">15+</h3>
                <p className="text-gray-600">Years Experience</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">10K+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Access Panel */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border border-gray-200/50">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              System Access Portal
            </CardTitle>
            <p className="text-gray-600">
              Secure access to our comprehensive service management platform
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary Access */}
            <div className="space-y-4">
              <Button 
                onClick={() => setLocation("/login")}
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <Shield className="w-6 h-6 mr-3" />
                Access Management System
              </Button>
              <p className="text-sm text-center text-gray-500">
                Administrative, technical, and service personnel access
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Quick Access</span>
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => setLocation("/customer-tracking")}
                variant="outline"
                className="h-14 bg-gray-50/80 hover:bg-gray-100 border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Track Service</div>
                  <div className="text-xs text-gray-500">Customer Portal</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setLocation("/customer-service-request")}
                variant="outline"
                className="h-14 bg-gray-50/80 hover:bg-gray-100 border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-2 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Service Request</div>
                  <div className="text-xs text-gray-500">New Request</div>
                </div>
              </Button>
            </div>

            {/* Footer Links */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <BarChart3 className="w-5 h-5 text-blue-600 mx-auto" />
                  <p className="text-xs text-gray-600 font-medium">Analytics</p>
                </div>
                <div className="space-y-1">
                  <Database className="w-5 h-5 text-green-600 mx-auto" />
                  <p className="text-xs text-gray-600 font-medium">Database</p>
                </div>
                <div className="space-y-1">
                  <Users className="w-5 h-5 text-purple-600 mx-auto" />
                  <p className="text-xs text-gray-600 font-medium">Team</p>
                </div>
                <div className="space-y-1">
                  <Settings className="w-5 h-5 text-orange-600 mx-auto" />
                  <p className="text-xs text-gray-600 font-medium">Settings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Wrench className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-bold">TAJ Electronics</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional electronics repair and service management with advanced CRM capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Electronics Repair</li>
                <li>Warranty Management</li>
                <li>Customer Support</li>
                <li>Technical Consultation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>service@tajelectronics.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Professional Service Center</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 TAJ Electronics. All rights reserved. Professional Service Management System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
