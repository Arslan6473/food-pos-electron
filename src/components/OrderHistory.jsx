import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Printer,
  Trash2,
  Percent,
  Home,
  Package,
  Utensils,
} from "lucide-react";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderType: "",
    paymentMethod: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getOrders(filters);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const details = await window.electronAPI.getOrderDetails(orderId);
      setSelectedOrder(details);
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const success = await window.electronAPI.deleteOrder(orderId);
      if (success) {
        setOrders(orders.filter((order) => order._id !== orderId));
        setShowDeleteConfirm(false);
        setOrderToDelete(null);
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case "takeaway":
        return <Home size={14} className="inline mr-1" />;
      case "parcel":
        return <Package size={14} className="inline mr-1" />;
      case "dine":
        return <Utensils size={14} className="inline mr-1" />;
      default:
        return null;
    }
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case "takeaway":
        return "bg-blue-100 text-blue-700";
      case "parcel":
        return "bg-orange-100 text-orange-700";
      case "dine":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case "takeaway":
        return "Take Away";
      case "parcel":
        return "Parcel";
      case "dine":
        return "Dine In";
      default:
        return type || "-";
    }
  };

  const printReceipt = (order) => {
    const now = new Date(order?.created_at);
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    printFrame.style.left = "-9999px";
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;

    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - Order #${order?.orderNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto !important; margin:2mm !important; }
              body {
                width: 80mm !important;
                font-family: Arial, Verdana, sans-serif !important;
                font-size: 12pt !important;
                color: #000 !important;
                background: #fff !important;
                padding: 5px;
                padding-right:20px !important;
              }

              .header, .order-info, .items-table, .totals, .payment-info, .footer {
                margin-bottom: 8px;
              }

              .header, .order-info {
                text-align: center;
              }

              .restaurant-name {
                font-size: 18pt;
                font-weight: bold;
              }

              .restaurant-info{
              font-size: 11pt;
              margin-top: 1.5px;
              } 
              .info-row, .totals div, .payment-info div {
                font-size: 11pt;
              }

              .order-info .order-line {
                font-weight: bold;
                margin-bottom: 4px;
              }

              .order-number {
                font-size: 13pt;
                text-align: center;
              }

              .order-date-time {
                font-size: 11pt;
                display: flex;
                justify-content: space-between;
                width: 100%;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                font-size: 11pt;
                padding: 2px 0;
              }

              .grand-total {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 13pt;
                border-top: 2px solid #000;
                padding-top: 3px;
                margin-top: 3px;
              }

              .payment-info .info-row {
                display: flex;
                justify-content: space-between;
              }

              .thank-you {
                font-size: 12pt;
                font-weight: bold;
                text-align: center;
                margin: 6px 0;
              }
 .customer-detail{
                font-size: 10pt;
                margin-bottom:4px;
                display: flex;
                justify-content: space-between;
                width: 100%;
              }
              .footer {
              margin-top: 1px;
                font-size: 9pt;
                text-align: center;
              }

              .discount-row {
                margin-top: 1px;
                font-weight: bold;
              }
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11pt;
            }

            th, td {
              padding: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
          <div class="header">
              <div class="restaurant-name">CHEEZENES</div>
              <div class="restaurant-info">63/F Mor Near Al Wahab Motors</div>
              <div class="restaurant-info">Chona Walla Road, Hasilpur</div>
              <div class="restaurant-info">Phone: 0309-5870659 - 0309-7952545</div>
            </div>

            <div class="order-info">
              <div class="order-line order-number">Order #${
                order?.orderNumber
              }</div>
              <div class="order-line order-date-time">
                <span>${dateStr}</span>
                <span>${timeStr}</span>
              </div>
              <div class="info-row customer-detail">
                <span>Order Type</span>
                <span>${getOrderTypeLabel(order?.orderType)}</span>
              </div>
             ${
               order?.orderType === "dine" && order?.tableNumber
                 ? `<div class="info-row customer-detail"><span>Table No</span><span>${order?.tableNumber}</span></div>`
                 : ""
             }

              ${
                order?.customerName
                  ? `<div class="info-row customer-detail"><span>Customer</span><span>${order?.customerName}</span></div>`
                  : ""
              }
            </div>

            <div class="items-table">
              <table>
                <thead>
                  <tr>
                    <th style="text-align:left;">Item</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${order?.items
                    ?.map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td style="text-align:center;">${item.quantity}</td>
                      <td style="text-align:right;">Rs ${
                        item.quantity * item.price
                      }</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>Rs ${order?.subtotal || order?.totalAmount}</span>
              </div>
              ${
                order?.discountPercentage > 0
                  ? `
                <div class="total-row discount-row">
                  <span>Discount (${order?.discountPercentage}%):</span>
                  <span>- Rs ${
                    order?.discountAmount ||
                    ((order?.subtotal || order?.totalAmount) *
                      order?.discountPercentage) /
                      100
                  }</span>
                </div>
              `
                  : ""
              }
              <div class="grand-total">
                <span>TOTAL:</span>
                <span>Rs ${order?.totalAmount}</span>
              </div>
            </div>

            <div class="payment-info">
            
              <div class="info-row"><span>Amount Paid:</span><span>Rs ${
                order?.totalAmount
              }</span></div>
            </div>

            <div class="thank-you">Thank you for your order!</div>
            <div class="footer">
              Built by IA-Solutions Phone: 0303-0212064<br/> --------------------------------
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);

    printDocument.close();
  };

  const handlePrintReceipt = async (orderId) => {
    try {
      const fullOrder = await window.electronAPI.getOrderDetails(orderId);

      const formattedOrder = {
        orderNumber: fullOrder.order_number,
        orderType: fullOrder.order_type,
        tableNumber: fullOrder.table_number,
        customerName: fullOrder.customer_name,
        paymentMethod: fullOrder.payment_method,
        totalAmount: fullOrder.total_amount,
        subtotal: fullOrder.subtotal,
        discountPercentage: fullOrder.discount_percentage,
        discountAmount: fullOrder.discount_amount,
        created_at: fullOrder.created_at,
        items: fullOrder.items?.map((item) => ({
          name: item.item_name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      printReceipt(formattedOrder);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.order_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.table_number &&
        order.table_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesOrderType =
      !filters.orderType || order.order_type === filters.orderType;
    const matchesPaymentMethod =
      !filters.paymentMethod || order.payment_method === filters.paymentMethod;

    return matchesSearch && matchesOrderType && matchesPaymentMethod;
  });

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
        <p className="text-gray-600 mt-1">View and manage past orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Orders
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order number, customer, or table..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              value={filters.orderType}
              onChange={(e) =>
                setFilters({ ...filters, orderType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="takeaway">Take Away</option>
              <option value="parcel">Parcel</option>
              <option value="dine">Dine In</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={loadOrders}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            onClick={() => {
              setFilters({
                startDate: "",
                endDate: "",
                orderType: "",
                paymentMethod: "",
              });
              setSearchTerm("");
            }}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">
                        Loading orders...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${getOrderTypeColor(
                          order.order_type
                        )}`}
                      >
                        {getOrderTypeIcon(order.order_type)}
                        {getOrderTypeLabel(order.order_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.table_number || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customer_name || "-"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.discount_percentage > 0 ? (
                        <span className="text-red-600 font-medium">
                          {order.discount_percentage}%
                          {order.discount_amount > 0 && (
                            <span className="block text-xs">
                              (-Rs {order.discount_amount})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      Rs {order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(order._id)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(order._id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(order)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="text-red-600" size={32} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Delete Order?
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete order{" "}
              <span className="font-bold">#{orderToDelete.order_number}</span>?
              This action cannot be undone and will permanently remove this
              order from the system.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Order Details</p>
                <p className="font-medium text-gray-800">
                  Date:{" "}
                  {new Date(orderToDelete.created_at).toLocaleDateString()}
                </p>
                <p className="font-medium text-gray-800">
                  Type: {getOrderTypeLabel(orderToDelete.order_type)}
                </p>
                {orderToDelete.table_number && (
                  <p className="font-medium text-gray-800">
                    Table: {orderToDelete.table_number}
                  </p>
                )}
                <p className="font-medium text-gray-800">
                  Customer: {orderToDelete.customer_name || "Guest"}
                </p>
                <p className="font-medium text-gray-800">
                  Total: Rs {orderToDelete.total_amount}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setOrderToDelete(null);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(orderToDelete._id)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Details
                </h2>
                <p className="text-gray-600 mt-1">
                  #{selectedOrder.order_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Order Type</p>
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    {getOrderTypeIcon(selectedOrder.order_type)}
                    {getOrderTypeLabel(selectedOrder.order_type)}
                  </p>
                </div>
                {selectedOrder.table_number && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Table Number</p>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.table_number}
                    </p>
                  </div>
                )}

                {selectedOrder.customer_name && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                )}
                {selectedOrder.discount_percentage > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-500 mb-1">
                      Discount Applied
                    </p>
                    <p className="font-medium text-red-700">
                      {selectedOrder.discount_percentage}%
                      {selectedOrder.discount_amount > 0 && (
                        <span className="block text-sm">
                          (-Rs {selectedOrder.discount_amount})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.item_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × Rs {item.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        Rs {item.subtotal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-6 pt-4">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">
                    Rs {selectedOrder.subtotal || selectedOrder.total_amount}
                  </span>
                </div>
                {selectedOrder.discount_percentage > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>
                      Discount ({selectedOrder.discount_percentage}%):
                    </span>
                    <span className="font-semibold">
                      - Rs{" "}
                      {selectedOrder.discount_amount ||
                        ((selectedOrder.subtotal ||
                          selectedOrder.total_amount) *
                          selectedOrder.discount_percentage) /
                          100}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xl font-bold text-gray-800">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rs {selectedOrder.total_amount}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => confirmDelete(selectedOrder)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete Order
                </button>
                <button
                  onClick={() => handlePrintReceipt(selectedOrder._id)}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
