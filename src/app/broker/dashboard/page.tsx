"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";

interface DashboardStats {
  todaysCollection: number;
  totalFarmers: number;
  totalRetailers: number;
  highestDemandVegetable: string;
  todaysHighestPrice: number;
  todaysLowestPrice: number;
  averagePrice: number;
  collectionChange: number;
}

interface RecentOrder {
  id: string;
  retailerId: string;
  retailerName: string;
  vegetableName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface TodaysVegetable {
  name: string;
  description: string;
  price: number;
}

export default function BrokerDashboard() {
  const { user, loading: authLoading, isBroker } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [todaysVegetables, setTodaysVegetables] = useState<TodaysVegetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isBroker) {
      router.push("/");
    }
  }, [authLoading, isBroker, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use mock data
        const useMock = true;
        const dataSource = useMock ? db : db;

        // Get all vegetables
        const vegetables = await dataSource.getAllVegetables();
        
        // Get all orders
        const orders = await dataSource.getAllOrders();
        
        // Calculate today's collection (sum of all order quantities)
        const todaysCollection = orders.reduce((sum, order) => sum + order.quantity, 0);
        
        // Calculate collection change (mock: +6.2%)
        const collectionChange = 6.2;

        // Get users to count farmers and retailers
        const allUsers = await dataSource.getAllUsers();
        const totalFarmers = allUsers.filter(u => u.role === 'broker' || u.role === 'farmer').length;
        const totalRetailers = allUsers.filter(u => u.role === 'retailer').length;

        // Calculate price statistics
        const prices = vegetables.map(v => v.price);
        const todaysHighestPrice = Math.max(...prices);
        const todaysLowestPrice = Math.min(...prices);
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

        // Find highest demand vegetable (most ordered)
        const orderItems = await dataSource.getAllOrderItems();
        const vegetableDemand = new Map<string, number>();
        for (const item of orderItems) {
          const current = vegetableDemand.get(item.vegetableId) || 0;
          vegetableDemand.set(item.vegetableId, current + item.quantity);
        }
        
        let highestDemandVegId = '';
        let maxDemand = 0;
        vegetableDemand.forEach((demand, vegId) => {
          if (demand > maxDemand) {
            maxDemand = demand;
            highestDemandVegId = vegId;
          }
        });
        
        const highestDemandVeg = vegetables.find(v => v.id === highestDemandVegId);
        const highestDemandVegetable = highestDemandVeg?.name || 'N/A';

        setStats({
          todaysCollection,
          totalFarmers,
          totalRetailers,
          highestDemandVegetable,
          todaysHighestPrice,
          todaysLowestPrice,
          averagePrice,
          collectionChange,
        });

        // Prepare recent orders data
        const ordersWithDetails: RecentOrder[] = [];
        for (const order of orders.slice(0, 10)) {
          const items = await dataSource.getOrderItems(order.id);
          for (const item of items) {
            const veg = vegetables.find(v => v.id === item.vegetableId);
            ordersWithDetails.push({
              id: order.id,
              retailerId: order.userId,
              retailerName: order.name,
              vegetableName: veg?.name || 'Unknown',
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.price * item.quantity,
            });
          }
        }
        setRecentOrders(ordersWithDetails.slice(0, 10));

        // Prepare today's vegetables
        const vegList: TodaysVegetable[] = vegetables.map(v => ({
          name: v.name,
          description: v.description || 'Fresh vegetable',
          price: v.price,
        }));
        setTodaysVegetables(vegList);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isBroker) {
      fetchDashboardData();
    }
  }, [isBroker]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isBroker) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Vegetable CRM</h2>
        </div>
        
        <nav className="mt-6">
          <a
            href="/broker/dashboard"
            className="flex items-center px-6 py-3 bg-gray-800 border-l-4 border-primary text-white"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </a>

          <a
            href="/broker/farmers"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Farmers
          </a>

          <a
            href="/broker/retailers"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Retailers
          </a>

          <a
            href="/broker/vegetables"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </a>

          <a
            href="/broker/orders"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </a>

          <a
            href="/broker/settings"
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>

        {/* Dashboard Overview Cards - 7 metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Vegetable Collection */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Vegetable Collection</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.todaysCollection || 0} <span className="text-lg">kg</span>
                </h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">{stats?.collectionChange || 0}%</span>
                </div>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Farmers */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Farmers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalFarmers || 0}</h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">12.5%</span>
                </div>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Retailers */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Retailers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalRetailers || 0}</h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">4.1%</span>
                </div>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Highest Demand Vegetable */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Highest Demand</p>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{stats?.highestDemandVegetable || 'N/A'}</h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">8.7%</span>
                </div>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Highest Price */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Highest Price</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats?.todaysHighestPrice?.toFixed(2) || '0.00'}
                </h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-sm text-red-500 ml-1">3.2%</span>
                </div>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Lowest Price */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Lowest Price</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats?.todaysLowestPrice?.toFixed(2) || '0.00'}
                </h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">2.8%</span>
                </div>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Price */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Price</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats?.averagePrice?.toFixed(2) || '0.00'}
                </h3>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-sm text-green-500 ml-1">8.7%</span>
                </div>
              </div>
              <div className="bg-pink-100 rounded-full p-3">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <a href="/broker/orders" className="text-sm text-primary hover:text-green-700 font-medium">
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Retailer ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Retailer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Vegetable</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.retailerId.slice(0, 8)}...</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.retailerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.vegetableName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{order.price.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No recent orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Vegetables Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Today's Vegetable List</h2>
                <a href="/broker/vegetables" className="text-sm text-primary hover:text-green-700 font-medium">
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Vegetable Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todaysVegetables.length > 0 ? (
                    todaysVegetables.map((veg, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{veg.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{veg.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">₹{veg.price.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        No vegetables available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
