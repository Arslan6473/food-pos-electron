const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Menu Items
  getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
  addMenuItem: (item) => ipcRenderer.invoke('add-menu-item', item),
  updateMenuItem: (id, item) => ipcRenderer.invoke('update-menu-item', id, item),
  deleteMenuItem: (id) => ipcRenderer.invoke('delete-menu-item', id),

  // Orders
  createOrder: (order) => ipcRenderer.invoke('create-order', order),
  getOrders: (filters) => ipcRenderer.invoke('get-orders', filters),
  getOrderDetails: (orderId) => ipcRenderer.invoke('get-order-details', orderId),
  // Add this line for delete order
  deleteOrder: (orderId) => ipcRenderer.invoke('delete-order', orderId),

  // Sales Reports
  getSalesReport: (period) => ipcRenderer.invoke('get-sales-report', period),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getOrderById: (orderId) => ipcRenderer.invoke('get-order-by-id', orderId),
});