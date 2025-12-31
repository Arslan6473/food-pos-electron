import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Calendar } from "lucide-react";

export default function SalesReport() {
  const [period, setPeriod] = useState("today");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getSalesReport(period);
      setReportData(data);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { id: "today", name: "Today" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "year", name: "This Year" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  const summary = reportData?.summary || {};

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Sales Reports</h1>
      <p className="text-gray-600 mb-6">Analyze your sales performance</p>

      {/* Period Selector */}
      <div className="flex gap-3 mb-6">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-6 py-3 rounded-lg font-medium ${
              period === p.id
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-green-600 text-white rounded-lg p-6">
          <DollarSign />
          <p className="text-3xl font-bold">
            Rs: {(summary.total_sales || 0)}
          </p>
          <p>Total Sales</p>
        </div>

        <div className="bg-blue-600 text-white rounded-lg p-6">
          <ShoppingBag />
          <p className="text-3xl font-bold">{summary.total_orders || 0}</p>
          <p>Total Orders</p>
        </div>

        <div className="bg-purple-600 text-white rounded-lg p-6">
          <TrendingUp />
          <p className="text-3xl font-bold">
            Rs: {(summary.average_order || 0)}
          </p>
          <p>Average Order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Top Selling Items</h2>

          {reportData.topItems.length === 0 ? (
            <p className="text-gray-400 text-center">No data available</p>
          ) : (
            reportData.topItems.map((item, i) => (
              <div key={i} className="flex justify-between p-3 bg-gray-50 rounded mb-2">
                <div>
                  <p className="font-medium">{item.item_name}</p>
                  <p className="text-sm text-gray-500">
                    {item.total_quantity} sold
                  </p>
                </div>
                <p className="font-bold text-blue-600">
                  Rs: {item.total_sales}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Daily Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Daily Breakdown</h2>

          {reportData.dailySales.length === 0 ? (
            <p className="text-gray-400 text-center">No data available</p>
          ) : (
            reportData.dailySales.map((day, i) => (
              <div key={i} className="flex justify-between p-3 bg-gray-50 rounded mb-2">
                <div>
                  <p className="font-medium">
                    {new Date(day.date).toDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{day.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    Rs: {day.sales}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rs: {(day.orders ? day.sales / day.orders : 0)} avg
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
