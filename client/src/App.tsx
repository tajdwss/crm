import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SimpleDashboard from "@/pages/simple-dashboard";
import Login from "@/pages/login-new";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import TechnicianLogin from "@/pages/technician-login";
import TechnicianDashboard from "@/pages/technician-dashboard";
import ServiceEngineerLogin from "@/pages/service-engineer-login";
import ServiceEngineerDashboard from "@/pages/service-engineer-dashboard";
import CustomerTracking from "@/pages/customer-tracking";
import CustomerSearch from "@/pages/customer-search";
import CustomerServiceRequest from "@/pages/customer-service-request";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/technician-login" component={TechnicianLogin} />
      <Route path="/technician-dashboard" component={TechnicianDashboard} />
      <Route path="/service-engineer-login" component={ServiceEngineerLogin} />
      <Route path="/service-engineer-dashboard" component={ServiceEngineerDashboard} />
      <Route path="/customer-search" component={CustomerSearch} />
      <Route path="/customer-service-request" component={CustomerServiceRequest} />
      <Route path="/customer-tracking" component={CustomerTracking} />
      <Route path="/track/:receiptNumber" component={CustomerTracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
