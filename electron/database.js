const initSqlJs = require('sql.js');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class PosDatabase {
  constructor() {
    this.db = null

    const dirPath = path.join("D:", "cheezenes")
    this.dbPath = path.join(dirPath, "pos.db")

    this.ensureDir(dirPath)
    this.init()
  }
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  async init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.initDatabase();
  }

  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  initDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_type TEXT DEFAULT 'dine', -- takeaway, parcel, dine
      table_number TEXT, -- 1, 2, 3, etc. (for dine orders)
        order_number TEXT UNIQUE NOT NULL,
        subtotal REAL NOT NULL,
        discount_percentage REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
      );
    `);


    const result = this.db.exec('SELECT COUNT(*) as count FROM menu_items');
    if (result[0]?.values[0][0] === 0) {
      this.insertSampleData();
    }

    this.save();
  }



  insertSampleData() {
    const items = [
      { name: 'Burger', category: 'Main', price: 500, description: 'Classic beef burger' },
      { name: 'Cheeseburger', category: 'Main', price: 600, description: 'Burger with cheese' },
      { name: 'Fries', category: 'Sides', price: 200, description: 'Crispy french fries' },
      { name: 'Chicken Nuggets', category: 'Main', price: 400, description: '6 piece nuggets' },
      { name: 'Coke', category: 'Drinks', price: 150, description: 'Cold beverage' },
      { name: 'Pizza Slice', category: 'Main', price: 300, description: 'Cheese pizza slice' }
    ];

    items.forEach(item => {
      this.db.run(
        'INSERT INTO menu_items (name, category, price, description) VALUES (?, ?, ?, ?)',
        [item.name, item.category, item.price, item.description]
      );
    });

    this.save();
  }

  getMenuItems() {
    const result = this.db.exec('SELECT * FROM menu_items ORDER BY category, name');
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  addMenuItem(item) {
    this.db.run(
      'INSERT INTO menu_items (name, category, price, description, available) VALUES (?, ?, ?, ?, ?)',
      [item.name, item.category, item.price, item.description, item.available ? 1 : 0]
    );
    this.save();
    return true;
  }

  updateMenuItem(id, item) {
    this.db.run(
      'UPDATE menu_items SET name = ?, category = ?, price = ?, description = ?, available = ? WHERE id = ?',
      [item.name, item.category, item.price, item.description, item.available ? 1 : 0, id]
    );
    this.save();
    return true;
  }

  deleteMenuItem(id) {
    this.db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    this.save();
    return true;
  }

  createOrder(orderData) {
    const result = this.db.exec(`
SELECT MAX(CAST(SUBSTR(order_number, 5) AS INTEGER)) as max_order_number
FROM orders
WHERE order_number LIKE 'Ord-%'
  `);

    let orderNumber;

    if (result[0] && result[0].values.length > 0) {
      const maxOrderNumber = result[0].values[0][0];

      if (maxOrderNumber !== null) {
        const nextNumber = parseInt(maxOrderNumber, 10) + 1;
        orderNumber = `ORD-${nextNumber}`;
      } else {
        orderNumber = "ORD-1";
      }
    } else {
      orderNumber = "ORD-1";
    }

    this.db.run(
      `INSERT INTO orders 
  (
    order_type,
    table_number,
    order_number,
    subtotal,
    discount_percentage,
    discount_amount,
    total_amount,
    payment_method,
    customer_name,
    customer_phone
  ) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.orderType || "dine",
        orderData.tableNumber || null,
        orderNumber,
        orderData.subtotal || orderData.totalAmount,
        orderData.discountPercentage || 0,
        orderData.discountAmount || 0,
        orderData.totalAmount,
        orderData.paymentMethod,
        orderData.customerName || null,
        orderData.customerPhone || null
      ]
    );


    const orderIdResult = this.db.exec('SELECT last_insert_rowid() as id');
    const orderId = orderIdResult[0].values[0][0];

    orderData.items.forEach(item => {
      this.db.run(
        `INSERT INTO order_items 
       (order_id, menu_item_id, item_name, quantity, price, subtotal) 
       VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.quantity, item.price, item.subtotal]
      );
    });

    this.save();
    return { orderId, orderNumber };
  }


  getOrders(filters = {}) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filters.startDate) {
      query += ' AND DATE(created_at) >= DATE(?)';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND DATE(created_at) <= DATE(?)';
      params.push(filters.endDate);
    }

    if (filters.paymentMethod) {
      query += ' AND payment_method = ?';
      params.push(filters.paymentMethod);
    }

    if (filters.customerName) {
      query += ' AND customer_name LIKE ?';
      params.push(`%${filters.customerName}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = this.db.exec(query, params);
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  getOrderDetails(orderId) {
    const orderResult = this.db.exec('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orderResult[0]) return null;

    const order = {};
    orderResult[0].columns.forEach((col, i) => order[col] = orderResult[0].values[0][i]);

    const itemsResult = this.db.exec('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    const items = itemsResult[0] ? itemsResult[0].values.map(row => {
      const obj = {};
      itemsResult[0].columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) : [];

    return { ...order, items };
  }

  getSalesReport(period) {
    let dateFilter = "1=1";

    switch (period) {
      case "today":
        dateFilter = "DATE(created_at) = DATE('now')";
        break;
      case "week":
        dateFilter = "DATE(created_at) >= DATE('now', '-7 days')";
        break;
      case "month":
        dateFilter = "DATE(created_at) >= DATE('now', '-30 days')";
        break;
      case "year":
        dateFilter = "DATE(created_at) >= DATE('now', '-365 days')";
        break;
    }

    const summaryResult = this.db.exec(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(AVG(total_amount), 0) as average_order
    FROM orders
    WHERE ${dateFilter}
  `);

    const summary = {};
    if (summaryResult[0]) {
      summaryResult[0].columns.forEach(
        (col, i) => (summary[col] = summaryResult[0].values[0][i])
      );
    }

    const topItemsResult = this.db.exec(`
    SELECT 
      oi.item_name,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.subtotal) as total_sales
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE ${dateFilter}
    GROUP BY oi.item_name
    ORDER BY total_sales DESC
    LIMIT 10
  `);

    const topItems = topItemsResult[0]
      ? topItemsResult[0].values.map((r) => ({
        item_name: r[0],
        total_quantity: r[1],
        total_sales: r[2],
      }))
      : [];

    const dailySalesResult = this.db.exec(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      COALESCE(SUM(total_amount), 0) as sales
    FROM orders
    WHERE ${dateFilter}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC
  `);

    const dailySales = dailySalesResult[0]
      ? dailySalesResult[0].values.map((r) => ({
        date: r[0],
        orders: r[1],
        sales: r[2],
      }))
      : [];

    return {
      summary,
      topItems,
      dailySales,
    };
  }


  getOrderById(orderId) {
    const orderResult = this.db.exec('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orderResult[0]) return null;

    const order = {};
    orderResult[0].columns.forEach((col, i) => {
      order[col] = orderResult[0].values[0][i];
    });

    const itemsResult = this.db.exec(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const items = itemsResult[0]
      ? itemsResult[0].values.map((row) => {
        const obj = {};
        itemsResult[0].columns.forEach((col, i) => (obj[col] = row[i]));
        return obj;
      })
      : [];

    return { ...order, items };
  }

  getDashboardStats() {
    const todayResult = this.db.exec(`
      SELECT 
        COUNT(*) as orders,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount_amount), 0) as discount,
        COALESCE(SUM(total_amount), 0) as sales
      FROM orders 
      WHERE DATE(created_at) = DATE('now')
    `);

    const parseResult = (result) => {
      if (!result[0]) return { orders: 0, subtotal: 0, discount: 0, sales: 0 };
      const obj = {};
      result[0].columns.forEach((col, i) => obj[col] = result[0].values[0][i]);
      return obj;
    };

    return {
      today: parseResult(todayResult)
    };
  }

  deleteOrder(orderId) {
    try {

      this.db.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      this.db.run('DELETE FROM orders WHERE id = ?', [orderId]);
      this.save();
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

}

module.exports = PosDatabase;