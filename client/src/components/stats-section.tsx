import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Hash, Truck, Loader2 } from "lucide-react";
import { useStats } from "@/hooks/use-stats";

export function StatsSection() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Today's Receipts */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Today's Receipts</p>
              <p className="text-3xl font-bold text-blue-900">{stats?.todayReceipts || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Total entries today</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Receipt className="text-white text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Receipt Number */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Last Receipt Number</p>
              <p className="text-3xl font-bold text-green-900">{stats?.lastReceiptNumber || "TD000"}</p>
              <p className="text-xs text-green-600 mt-1">Most recent entry</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Hash className="text-white text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready to Deliver */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Ready to Deliver</p>
              <p className="text-3xl font-bold text-orange-900">{stats?.readyToDeliver || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Awaiting pickup</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="text-white text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
