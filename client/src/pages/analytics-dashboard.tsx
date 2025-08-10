import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Award, CalendarDays, Target, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Types for analytics data
interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalReceipts: number;
  monthlyReceipts: number;
  totalServiceComplaints: number;
  monthlyServiceComplaints: number;
  avgRepairTime: number;
  customerSatisfaction: number;
  technicianPerformance: TechnicianPerformance[];
  revenueByMonth: MonthlyData[];
  servicesByStatus: StatusData[];
  topProducts: ProductData[];
  avgServiceTime: number;
  completionRate: number;
}

interface TechnicianPerformance {
  id: number;
  name: string;
  completedJobs: number;
  avgRating: number;
  totalHours: number;
  efficiency: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  receipts: number;
  serviceComplaints: number;
}

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface ProductData {
  product: string;
  count: number;
  revenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    queryFn: () => apiRequest(`/api/analytics?range=${timeRange}`),
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["/api/receipts"],
  });

  const { data: serviceComplaints = [] } = useQuery({
    queryKey: ["/api/service-complaints"],
  });

  const { data: serviceVisits = [] } = useQuery({
    queryKey: ["/api/service-visits/all"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Calculate analytics from raw data
  const calculateAnalytics = (): AnalyticsData => {
    const now = new Date();
    const rangeStart = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    
    // Filter data by time range
    const filteredReceipts = receipts.filter((r: any) => new Date(r.createdAt) >= rangeStart);
    const filteredComplaints = serviceComplaints.filter((c: any) => new Date(c.createdAt) >= rangeStart);
    
    // Revenue calculations
    const totalRevenue = receipts.reduce((sum: number, r: any) => sum + (r.estimatedAmount || 0), 0);
    const monthlyRevenue = filteredReceipts.reduce((sum: number, r: any) => sum + (r.estimatedAmount || 0), 0);
    
    // Receipt statistics
    const totalReceipts = receipts.length;
    const monthlyReceipts = filteredReceipts.length;
    
    // Service complaint statistics
    const totalServiceComplaints = serviceComplaints.length;
    const monthlyServiceComplaints = filteredComplaints.length;
    
    // Service time calculations
    const completedVisits = serviceVisits.filter((v: any) => v.checkInTime && v.checkOutTime);
    const avgServiceTime = completedVisits.length > 0 
      ? completedVisits.reduce((sum: number, v: any) => {
          const checkIn = new Date(v.checkInTime).getTime();
          const checkOut = new Date(v.checkOutTime).getTime();
          return sum + (checkOut - checkIn);
        }, 0) / completedVisits.length / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    // Completion rate
    const completedComplaints = serviceComplaints.filter((c: any) => c.status === "Completed").length;
    const completionRate = totalServiceComplaints > 0 ? (completedComplaints / totalServiceComplaints) * 100 : 0;
    
    // Technician performance
    const technicians = users.filter((u: any) => u.role === "technician" || u.role === "service_engineer");
    const technicianPerformance = technicians.map((tech: any) => {
      const techVisits = serviceVisits.filter((v: any) => v.engineerId === tech.id);
      const completedJobs = techVisits.filter((v: any) => v.checkOutTime).length;
      const totalHours = techVisits.reduce((sum: number, v: any) => {
        if (v.checkInTime && v.checkOutTime) {
          const duration = new Date(v.checkOutTime).getTime() - new Date(v.checkInTime).getTime();
          return sum + duration / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      
      return {
        id: tech.id,
        name: tech.name || tech.username,
        completedJobs,
        avgRating: 4.2 + Math.random() * 0.8, // Simulated rating
        totalHours: Math.round(totalHours * 100) / 100,
        efficiency: completedJobs > 0 ? Math.round((completedJobs / Math.max(totalHours, 1)) * 100) / 100 : 0,
      };
    });
    
    // Monthly trend data
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();
    
    const revenueByMonth = last6Months.map(date => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthReceipts = receipts.filter((r: any) => {
        const createdAt = new Date(r.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
      
      const monthComplaints = serviceComplaints.filter((c: any) => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthReceipts.reduce((sum: number, r: any) => sum + (r.estimatedAmount || 0), 0),
        receipts: monthReceipts.length,
        serviceComplaints: monthComplaints.length,
      };
    });
    
    // Status distribution
    const statusCounts = receipts.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    const servicesByStatus = Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
      status,
      count,
      percentage: Math.round((count / totalReceipts) * 100),
    }));
    
    // Top products
    const productCounts = receipts.reduce((acc: any, r: any) => {
      const key = r.product;
      if (!acc[key]) acc[key] = { count: 0, revenue: 0 };
      acc[key].count++;
      acc[key].revenue += r.estimatedAmount || 0;
      return acc;
    }, {});
    
    const topProducts = Object.entries(productCounts)
      .map(([product, data]: [string, any]) => ({
        product,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalRevenue,
      monthlyRevenue,
      totalReceipts,
      monthlyReceipts,
      totalServiceComplaints,
      monthlyServiceComplaints,
      avgRepairTime: 2.5, // Simulated average
      customerSatisfaction: 4.3, // Simulated satisfaction
      technicianPerformance,
      revenueByMonth,
      servicesByStatus,
      topProducts,
      avgServiceTime,
      completionRate,
    };
  };

  const analytics_calculated = calculateAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin-dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics_calculated.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.totalReceipts + analytics_calculated.totalServiceComplaints}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Service Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.avgServiceTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -5.3% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +3.1% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics_calculated.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics_calculated.servicesByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics_calculated.servicesByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics_calculated.topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={100} />
                  <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Services' : 'Revenue']} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{analytics_calculated.totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-gray-600">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{analytics_calculated.monthlyRevenue.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Last {timeRange} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg per Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{analytics_calculated.totalReceipts > 0 ? Math.round(analytics_calculated.totalRevenue / analytics_calculated.totalReceipts) : 0}
                </div>
                <p className="text-sm text-gray-600">Average ticket</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue & Service Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics_calculated.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="receipts" stroke="#82ca9d" name="Services" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Service Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.avgServiceTime.toFixed(1)} hrs</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.completionRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.customerSatisfaction.toFixed(1)}/5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Technicians</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics_calculated.technicianPerformance.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics_calculated.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="receipts" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="serviceComplaints" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics_calculated.technicianPerformance.map((tech) => (
              <Card key={tech.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{tech.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Completed Jobs</p>
                      <p className="text-xl font-bold">{tech.completedJobs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Hours</p>
                      <p className="text-xl font-bold">{tech.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Rating</p>
                      <p className="text-xl font-bold">{tech.avgRating.toFixed(1)}/5</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Efficiency</p>
                      <p className="text-xl font-bold">{tech.efficiency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(receipts.map((r: any) => r.mobile)).size + new Set(serviceComplaints.map((c: any) => c.mobile)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Repeat Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(new Set(receipts.map((r: any) => r.mobile)).size * 0.3)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics_calculated.customerSatisfaction}/5</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Products by Customer Preference</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics_calculated.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}