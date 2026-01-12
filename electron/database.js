const mongoose = require("mongoose");

class PosDatabase {
  constructor() {
    this.isReady = false;
    this.initModels();
    this.connectPromise = this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(
        "mongodb+srv://arslansarwarwebdev_db_user:ur9sBHcZkhcz3ev0@cluster0.dmn5ecw.mongodb.net",
        {
          dbName: "cheezeness",
        }
      );
      this.isReady = true;

    } catch (err) {
      console.error("❌ MongoDB connection failed", err);
      throw err;
    }
  }

  async ensureReady() {
    if (!this.isReady) {
      await this.connectPromise;
    }
  }

  initModels() {
    const MenuSchema = new mongoose.Schema(
      {
        name: String,
        category: String,
        price: Number,
        description: String,
        available: { type: Boolean, default: true },
      },
      { timestamps: true }
    );

    const OrderItemSchema = new mongoose.Schema({
      menu_item_id: mongoose.Schema.Types.ObjectId,
      item_name: String,
      quantity: Number,
      price: Number,
      subtotal: Number,
    });

    const OrderSchema = new mongoose.Schema(
      {
        order_type: { type: String, default: "dine" },
        table_number: String,
        order_number: { type: String, unique: true },
        subtotal: Number,
        discount_percentage: Number,
        discount_amount: Number,
        total_amount: Number,
        payment_method: String,
        customer_name: String,
        customer_phone: String,
        status: { type: String, default: "completed" },
        items: [OrderItemSchema],
      },
      { timestamps: true }
    );

    this.Menu = mongoose.models.Menu || mongoose.model("Menu", MenuSchema);
    this.Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
  }

  async getMenuItems() {
    await this.ensureReady();
    const items = await this.Menu.find().sort({ category: 1, name: 1 }).lean();
    return items.map((item) => ({
      ...item,
      _id: item._id.toString(),
    }));
  }

  async addMenuItem(item) {
    await this.ensureReady();
    await this.Menu.create(item);
    return true;
  }

  async updateMenuItem(id, item) {
    await this.ensureReady();
    await this.Menu.findByIdAndUpdate(id, item);
    return true;
  }

  async deleteMenuItem(id) {
    await this.ensureReady();
    await this.Menu.findByIdAndDelete(id);
    return true;
  }

  async createOrder(orderData) {
    await this.ensureReady();
    const lastOrder = await this.Order.findOne()
      .sort({ createdAt: -1 })
      .select('order_number')
      .lean();

    let orderNumber;
    if (lastOrder && lastOrder.order_number) {
      const lastNumber = parseInt(lastOrder.order_number.split('-')[1]) || 0;
      orderNumber = `ORD-${lastNumber + 1}`;
    } else {
      orderNumber = 'ORD-1';
    }

    const order = await this.Order.create({
      order_number: orderNumber,
      order_type: orderData.orderType,
      table_number: orderData.tableNumber,
      subtotal: orderData.subtotal,
      discount_percentage: orderData.discountPercentage,
      discount_amount: orderData.discountAmount,
      total_amount: orderData.totalAmount,
      payment_method: orderData.paymentMethod,
      customer_name: orderData.customerName,
      status: "completed",
      items: orderData.items.map((item) => ({
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    });

    return { orderId: order._id, orderNumber };
  }

  async getOrders(filters = {}) {
    await this.ensureReady();
    const query = {};

    if (filters.paymentMethod) query.payment_method = filters.paymentMethod;

    if (filters.customerName)
      query.customer_name = { $regex: filters.customerName, $options: "i" };

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate)
        query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const orders = await this.Order.find(query)
      .sort({ createdAt: -1 })
      .lean();
    return orders.map((item) => ({
      ...item,
      _id: item._id.toString(),
      created_at: item.createdAt,
    }));
  }

  async getOrderById(id) {
    await this.ensureReady();
    const order = await this.Order.findById(id).lean();
    if (!order) return null;

    return {
      ...order,
      _id: order._id.toString(),
      created_at: order.createdAt,
      items:
        order.items?.map((item) => ({
          ...item,
          _id: item._id ? item._id.toString() : undefined,
          menu_item_id: item.menu_item_id
            ? item.menu_item_id.toString()
            : undefined,
        })) || [],
    };
  }

  async getOrderDetails(orderId) {
    await this.ensureReady();
    const order = await this.Order.findById(orderId).lean();
    if (!order) return null;

    return {
      ...order,
      _id: order._id.toString(),
      created_at: order.createdAt,
      items:
        order.items?.map((item) => ({
          ...item,
          _id: item._id ? item._id.toString() : undefined,
          menu_item_id: item.menu_item_id
            ? item.menu_item_id.toString()
            : undefined,
        })) || [],
    };
  }

  async deleteOrder(id) {
    await this.ensureReady();
    await this.Order.findByIdAndDelete(id);
    return true;
  }

  async getDashboardStats() {
    await this.ensureReady();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = await this.Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          subtotal: { $sum: "$subtotal" },
          discount: { $sum: "$discount_amount" },
          sales: { $sum: "$total_amount" },
        },
      },
    ]);

    return { today: stats[0] || {} };
  }

  async getSalesReport(period) {
    await this.ensureReady();
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const summaryResult = await this.Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total_sales: { $sum: { $ifNull: ["$total_amount", 0] } },
          total_orders: { $sum: 1 },
          total_discount: { $sum: { $ifNull: ["$discount_amount", 0] } },
        },
      },
    ]);

    const summaryData = summaryResult[0] || {
      total_sales: 0,
      total_orders: 0,
      total_discount: 0,
    };

    const average_order =
      summaryData.total_orders > 0
        ? Math.round(
          (summaryData.total_sales / summaryData.total_orders) * 100
        ) / 100
        : 0;

    const summary = {
      ...summaryData,
      average_order,
    };

    const topItems = await this.Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item_name",
          total_quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
          total_sales: { $sum: { $ifNull: ["$items.subtotal", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          item_name: "$_id",
          total_quantity: 1,
          total_sales: 1,
        },
      },
      { $sort: { total_sales: -1 } },
      { $limit: 10 },
    ]);

    const dailySales = await this.Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          sales: { $sum: { $ifNull: ["$total_amount", 0] } },
          orders: { $sum: 1 },
          discount: { $sum: { $ifNull: ["$discount_amount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1,
          orders: 1,
          discount: 1,
        },
      },
      { $sort: { date: -1 } },
      { $limit: 30 },
    ]);

    return {
      summary,
      topItems: topItems || [],
      dailySales: dailySales || [],
    };
  }
}

module.exports = PosDatabase;