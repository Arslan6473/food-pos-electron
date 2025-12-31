import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  Search,
  Percent,
  Home,
  Package,
  Utensils,
} from "lucide-react";

export default function Billing() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [searchQuery, setSearchQuery] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderType, setOrderType] = useState("dine");
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await window.electronAPI.getMenuItems();
      setMenuItems(items.filter((item) => item.available));
    } catch (error) {
      console.error("Failed to load menu:", error);
    }
  };

  const categories = [
    "All",
    ...new Set(menuItems.map((item) => item.category)),
  ];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const calculateSubtotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { subtotal, discount, grandTotal } = useMemo(() => {
    const subtotalValue = calculateSubtotal();
    const discountValue = (subtotalValue * discountPercentage) / 100;
    const grandTotalValue = subtotalValue - discountValue;

    return {
      subtotal: subtotalValue,
      discount: discountValue,
      grandTotal: grandTotalValue,
    };
  }, [cart, discountPercentage]);

  useEffect(() => {
    setDiscountAmount(discount);
  }, [discount]);

  const handleDiscountChange = (value) => {
    const numValue = Number(value);
    const discountValue = Number.isFinite(numValue)
      ? Math.min(Math.max(numValue, 0), 100)
      : 0;
    setDiscountPercentage(discountValue);
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type !== "dine") {
      setSelectedTable(""); // Clear table selection for non-dine orders
    }
  };

  const printReceipt = (orderNumber) => {
    if (cart.length === 0) {
      return;
    }

    const now = new Date();
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
          <title>Receipt - Order #${orderNumber}</title>
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

              .customer-detail{
                font-size: 10pt;
                margin-bottom:4px;
                display: flex;
                justify-content: space-between;
                width: 100%;
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

            @media screen {
              body { 
                font-family: Arial, sans-serif;
                padding: 10px;
                background: #fff; 
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
              <div class="order-line order-number">Order #${orderNumber}</div>
              <div class="order-line order-date-time">
                <span>${dateStr}</span>
                <span>${timeStr}</span>
              </div>
              <div class="info-row  customer-detail">
                <span>Order Type</span>
                <span>${
                  orderType === "takeaway"
                    ? "Take Away"
                    : orderType === "parcel"
                    ? "Parcel"
                    : "Dine In"
                }</span>
              </div>
              ${
                orderType === "dine" && selectedTable
                  ? `<div class="info-row customer-detail"><span>Table No</span><span>${selectedTable}</span></div>`
                  : ""
              }
              ${
                customerName
                  ? `<div class="info-row customer-detail"><span>Customer</span><span>${customerName}</span></div>`
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
                  ${cart
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td style="text-align:center;">${item.quantity}</td>
                      <td style="text-align:right;">Rs ${
                        item.price * item.quantity
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>Rs ${subtotal}</span>
              </div>
              ${
                discountPercentage > 0
                  ? `
                <div class="total-row discount-row">
                  <span>Discount (${discountPercentage}%):</span>
                  <span>- Rs ${discount}</span>
                </div>
              `
                  : ""
              }
              <div class="grand-total">
                <span>TOTAL:</span>
                <span>Rs ${grandTotal}</span>
              </div>
            </div>
            
            <div class="payment-info">
            
              <div class="info-row"><span>Amount Paid:</span><span>Rs ${grandTotal}</span></div>
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
              }, 100);
            }
          </script>
        </body>
      </html>
    `);

    printDocument.close();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return;
    }

    // Validate table selection for dine orders
    if (orderType === "dine" && !selectedTable) {
      alert("Please select a table for Dine In order");
      return;
    }

    const orderData = {
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      totalAmount: Math.floor(grandTotal),
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      discountAmount: discount,
      paymentMethod,
      customerName,
      orderType,
      tableNumber: orderType === "dine" ? selectedTable : null,
    };

    try {
      const result = await window.electronAPI.createOrder(orderData);
      const orderNumber = result.orderNumber;
      printReceipt(orderNumber);
      setCart([]);
      setCustomerName("");
      setDiscountPercentage(0);
      setOrderType("dine");
      setSelectedTable("");
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    }
  };

  return (
    <div className="flex items-start gap-6 h-screen p-4 bg-gray-50">
      {/* Categories & Menu Items */}
      <div className="w-[60%] flex flex-col h-full">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Menu Items</h2>
            <div className="relative w-64">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {item.description}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-bold text-blue-600">
                          Rs {item.price}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Add +
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery
                    ? "No items found matching your search"
                    : "No items found in this category"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-lg w-[40%] shadow-sm p-4 flex flex-col h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Current Order</h2>

        <div className="flex-1 overflow-y-auto max-h-[40%] mb-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 h-full flex items-center justify-center">
              <div>
                <div className="text-lg mb-2">🛒</div>
                <p>Bill is empty</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800 block">
                        {item.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        Rs {item.price} each
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-700">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-blue-600 text-lg">
                      Rs {item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t pt-2 space-y-3 flex-1 overflow-x-hidden px-1 overflow-y-auto">
          {/* Order Type Selection */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Order Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleOrderTypeChange("takeaway")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                  orderType === "takeaway"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Home size={18} /> Take Away
              </button>

              <button
                onClick={() => handleOrderTypeChange("parcel")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                  orderType === "parcel"
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Package size={18} /> Parcel
              </button>

              <button
                onClick={() => handleOrderTypeChange("dine")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                  orderType === "dine"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Utensils size={18} /> Dine In
              </button>
            </div>
          </div>

          {/* Table Selection (only for Dine In) */}
          {orderType === "dine" && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Select Table</h3>

              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Table</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Table {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name */}
          <input
            type="text"
            placeholder="Customer Name (Optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Discount */}
          <div className="relative">
            <Percent
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              min="0"
              max="100"
              step="0.1"
              placeholder="Discount Percentage (0-100)"
              value={discountPercentage}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">Rs {subtotal}</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Discount ({discountPercentage}%):</span>
                <span className="font-semibold">- Rs {discount}</span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">Rs {grandTotal}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={
              cart.length === 0 || (orderType === "dine" && !selectedTable)
            }
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-bold hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Printer size={20} /> Save & Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
