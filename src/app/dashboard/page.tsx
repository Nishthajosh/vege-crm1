import { requireAuth } from "@/lib/auth";
import { db, mockDb } from "@/lib/db";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  iconBg?: string;
}

function MetricCard({ title, value, trend, icon, iconBg = "bg-blue-100" }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend !== undefined && (
              <span className={`ml-2 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`${iconBg} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-primary">
      {children}
    </th>
  );
}

function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
      {children}
    </td>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();

  // Use mock data temporarily
  const useMock = true;
  const dataSource = useMock ? mockDb : db;

  // Fetch data from mock DB
  const [totalBrokers, totalRetailers] = await Promise.all([
    dataSource.getUsersByRole("broker"),
    dataSource.getUsersByRole("retailer")
  ]);
  const vegetables = await dataSource.getAllVegetables();
  const orders = await dataSource.getAllOrders();

  // Today's date range (UTC) in seconds
  const now = new Date();
  const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const endOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() / 1000) - 1;

  // Calculate metrics
  let todaysCollection = 0;
  let monthlyRevenue = 0;
  const priceList: number[] = [];
  const demandMap = new Map<string, number>();

  for (const order of orders) {
    const orderTime = typeof order.createdAt === 'string' ? new Date(order.createdAt).getTime() : order.createdAt;
    if (orderTime >= startOfDay && orderTime <= endOfDay) {
      todaysCollection += order.quantity || 0;
    }
    monthlyRevenue += order.totalPrice || 0;

    try {
      const items = await dataSource.getOrderItemsByOrderId(order.id);
      for (const it of items) {
        const count = demandMap.get(it.vegetableId) || 0;
        demandMap.set(it.vegetableId, count + (it.quantity || 0));
        if (it.price !== undefined && it.price !== null) {
          priceList.push(it.price);
        }
      }
    } catch (e) {
      console.error('Error fetching order items:', e);
    }
  }

  // Calculate price statistics
  const highestPrice = priceList.length ? Math.max(...priceList) : 0;
  const lowestPrice = priceList.length ? Math.min(...priceList) : 0;
  const avgPrice = priceList.length ? priceList.reduce((a, b) => a + b, 0) / priceList.length : 0;

  // Find highest demand vegetable
  let highestDemandName = "-";
  let highestDemandQty = 0;
  if (demandMap.size > 0) {
    let topId: string | null = null;
    let topCount = -1;
    for (const [id, cnt] of demandMap.entries()) {
      if (cnt > topCount) {
        topCount = cnt;
        topId = id;
      }
    }
    if (topId) {
      const veg = await dataSource.getVegetableById(topId);
      highestDemandName = veg?.name || topId;
      highestDemandQty = topCount;
    }
  }

  // Recent orders with items (limit 5)
  const recentOrders = await Promise.all(
    orders
      .sort((a, b) => {
        const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt;
        const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(async (order) => {
        const items = await dataSource.getOrderItemsByOrderId(order.id);
        const itemsWithVegetables = await Promise.all(
          items.map(async (item) => {
            const vegetable = await dataSource.getVegetableById(item.vegetableId);
            return {
              ...item,
              vegetableName: vegetable?.name || 'Unknown'
            };
          })
        );
        return {
          ...order,
          items: itemsWithVegetables
        };
      })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#0A1A2B] min-h-screen p-4">
          <div className="text-white text-xl font-bold mb-8">Vegetable CRM</div>
          <nav className="space-y-2">
            <a href="/dashboard" className="flex items-center text-white p-3 rounded-lg bg-blue-600">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a href="/broker/vegetables" className="flex items-center text-gray-300 hover:text-white p-3 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Products
            </a>
            <a href="/add-farmer" className="flex items-center text-gray-300 hover:text-white p-3 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Farmer
            </a>
            <a href="/add-retailer" className="flex items-center text-gray-300 hover:text-white p-3 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
               Retailer
            </a>
            <a href="/broker/orders" className="flex items-center text-gray-300 hover:text-white p-3 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Orders
            </a>
            <a href="/settings" className="flex items-center text-gray-300 hover:text-white p-3 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
              </div>
              <button className="flex items-center px-4 py-2 text-sm text-gray-600 bg-white rounded-lg shadow hover:bg-gray-50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Today's Vegetable Collection"
                value={`${todaysCollection} kg`}
                trend={5.2}
                iconBg="bg-blue-100"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />
              <MetricCard
                title="Total Farmers"
                value={totalBrokers}
                trend={4.1}
                iconBg="bg-green-100"
                icon={
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <MetricCard
                title="Total Retailers"
                value={totalRetailers}
                trend={2.8}
                iconBg="bg-yellow-100"
                icon={
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <MetricCard
                title="Highest Demand Vegetable"
                value={highestDemandName}
                trend={12.5}
                iconBg="bg-purple-100"
                icon={
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
              <MetricCard
                title="Today's Highest Price"
                value={`₹${highestPrice.toFixed(2)}`}
                trend={3.2}
                iconBg="bg-red-100"
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                }
              />
              <MetricCard
                title="Today's Lowest Price"
                value={`₹${lowestPrice.toFixed(2)}`}
                trend={-1.5}
                iconBg="bg-indigo-100"
                icon={
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                }
              />
              <MetricCard
                title="Average Price"
                value={`₹${avgPrice.toFixed(2)}`}
                trend={0.8}
                iconBg="bg-teal-100"
                icon={
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform transform hover:scale-105 duration-300">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <a href="/orders" className="text-sm text-primary hover:text-accent font-medium transition-colors">View All</a>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <TableHeader>Order ID</TableHeader>
                        <TableHeader>Retailer</TableHeader>
                        <TableHeader>Vegetable Name</TableHeader>
                        <TableHeader>Quantity</TableHeader>
                        <TableHeader>Price</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.flatMap(order => 
                        order.items.map(item => (
                          <tr key={`${order.id}-${item.id}`}>
                            <TableCell>{order.id.slice(0, 8)}</TableCell>
                            <TableCell>{order.name}</TableCell>
                            <TableCell>{item.vegetableName}</TableCell>
                            <TableCell>{item.quantity} kg</TableCell>
                            <TableCell className="text-gray-900">₹{item.price.toFixed(2)}</TableCell>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Today's Vegetables */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform transform hover:scale-105 duration-300">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Vegetables</h2>
                    <a href="/vegetables" className="text-sm text-primary hover:text-accent font-medium transition-colors">View All</a>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Description</TableHeader>
                        <TableHeader>Price</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vegetables.slice(0, 5).map((veg) => (
                        <tr key={veg.id}>
                          <TableCell>{veg.name}</TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate">{veg.description}</p>
                          </TableCell>
                          <TableCell className="text-gray-900">₹{veg.price.toFixed(2)}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
