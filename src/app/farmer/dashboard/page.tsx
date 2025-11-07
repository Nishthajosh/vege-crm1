'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

interface DashboardStats {
  totalVegetables: number;
  totalRevenue: number;
  totalOrders: number;
  topDemand: string;
}

export default function FarmerDashboard() {
  const { user, loading: authLoading, isFarmer } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalVegetables: 0,
    totalRevenue: 0,
    totalOrders: 0,
    topDemand: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isFarmer) {
      router.push('/');
    }
  }, [authLoading, isFarmer, router]);

  useEffect(() => {
    if (isFarmer) {
      fetchStats();
    }
  }, [isFarmer]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalVegetables: data.totalVegetables || 0,
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          topDemand: data.topDemand || 'N/A',
        });

        // If no vegetables exist, automatically initialize them
        if (data.totalVegetables === 0) {
          await initializeVegetables();
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeVegetables = async () => {
    try {
      const response = await fetch('/api/vegetables/init', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh stats after initialization
        const statsResponse = await fetch('/api/stats');
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats({
            totalVegetables: data.totalVegetables || 0,
            totalRevenue: data.totalRevenue || 0,
            totalOrders: data.totalOrders || 0,
            topDemand: data.topDemand || 'N/A',
          });
        }
      }
    } catch (error) {
      console.error('Error initializing vegetables:', error);
    }
  };

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

  if (!isFarmer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Manage your vegetables and track sales.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Total Vegetables</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVegetables}</h3>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{stats.totalRevenue.toFixed(2)}</h3>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</h3>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Top Demand</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.topDemand}</h3>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/farmer/vegetables/add" className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-center font-medium">
                Add New Vegetable
              </Link>
              <Link href="/farmer/vegetables" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-center font-medium">
                View All Vegetables
              </Link>
              <Link href="/farmer/demand" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-center font-medium">
                View Demand
              </Link>
              <Link href="/farmer/sales" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg text-center font-medium">
                Sales Results
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
