import { useState } from 'react'
import {  ShoppingCart, Package, FileText, BarChart3 } from 'lucide-react'
import Billing from './components/Billing'
import MenuManagement from './components/MenuManagement'
import OrderHistory from './components/OrderHistory'
import SalesReport from './components/SalesReport'

function App() {
  const [activeTab, setActiveTab] = useState('billing')

  const tabs = [

    { id: 'billing', name: 'Billing', icon: ShoppingCart },
    { id: 'menu', name: 'Menu', icon: Package },
    { id: 'orders', name: 'Orders', icon: FileText },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-48 bg-gradient-to-b from-blue-600 to-blue-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Cheezenes</h1>
          <p className="text-blue-200 text-sm mt-1">Sales & Management</p>
        </div>
        
        <nav className="mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-700 border-l-4 border-white'
                    : 'hover:bg-blue-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'billing' && <Billing />}
          {activeTab === 'menu' && <MenuManagement />}
          {activeTab === 'orders' && <OrderHistory />}
          {activeTab === 'reports' && <SalesReport />}
        </div>
      </div>
    </div>
  )
}

export default App