const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("./database.js");

let mainWindow;
let db;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  db = new Database();
  await db.init();

  createWindow();

  // Menu Items
  ipcMain.handle("get-order-by-id", (_, orderId) => db.getOrderById(orderId));
  ipcMain.handle("get-menu-items", () => db.getMenuItems());
  ipcMain.handle("add-menu-item", (_, item) => db.addMenuItem(item));
  ipcMain.handle("update-menu-item", (_, id, item) =>
    db.updateMenuItem(id, item)
  );
  ipcMain.handle("delete-menu-item", (_, id) => db.deleteMenuItem(id));

  // Orders
  ipcMain.handle("create-order", (_, order) => db.createOrder(order));
  ipcMain.handle("get-orders", (_, filters) => db.getOrders(filters));
  ipcMain.handle("get-order-details", (_, orderId) =>
    db.getOrderDetails(orderId)
  );
  // Add this line for delete order
  ipcMain.handle("delete-order", (_, orderId) => db.deleteOrder(orderId));

  ipcMain.handle("get-sales-report", (_, period) => db.getSalesReport(period));
  ipcMain.handle("get-dashboard-stats", () => db.getDashboardStats());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});