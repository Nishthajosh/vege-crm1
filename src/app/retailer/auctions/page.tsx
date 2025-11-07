'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

interface Auction {
  id: string;
  farmerId: string;
  vegetableId: string;
  quantity: number;
  basePrice: number;
  currentBid: number | null;
  highestBidderId: string | null;
  startTime: number;
  endTime: number;
  status: string;
  createdAt: number;
}

interface Vegetable {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
}

interface AuctionWithVegetable extends Auction {
  vegetable?: Vegetable;
  bidCount?: number;
}

export default function RetailerAuctionsPage() {
  const { user, loading: authLoading, isRetailer } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionWithVegetable[]>([]);
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isRetailer) {
      router.push('/');
    }
  }, [authLoading, isRetailer, router]);

  useEffect(() => {
    if (isRetailer) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isRetailer]);

  const fetchData = async () => {
    try {
      // Fetch vegetables
      const vegResponse = await fetch('/api/vegetables');
      if (vegResponse.ok) {
        const vegData = await vegResponse.json();
        setVegetables(vegData);

        // Fetch active auctions
        const auctionResponse = await fetch('/api/auctions/active');
        if (auctionResponse.ok) {
          const auctionData = await auctionResponse.json();
          
          // Enrich with vegetable data
          const enriched = await Promise.all(
            auctionData.map(async (auction: Auction) => {
              // Get bid count
              const bidsResponse = await fetch(`/api/auctions/${auction.id}/bids`);
              const bids = bidsResponse.ok ? await bidsResponse.json() : [];
              
              return {
                ...auction,
                vegetable: vegData.find((v: Vegetable) => v.id === auction.vegetableId),
                bidCount: bids.length,
              };
            })
          );
          
          setAuctions(enriched);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m ${seconds}s`;
  };

  const getUrgencyColor = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    
    if (diff < 3600) return 'text-red-600'; // < 1 hour
    if (diff < 7200) return 'text-yellow-600'; // < 2 hours
    return 'text-gray-700';
  };

  const getBorderColor = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    
    if (diff < 3600) return 'border-red-300 bg-red-50'; // < 1 hour
    if (diff < 7200) return 'border-yellow-300 bg-yellow-50'; // < 2 hours
    return 'border-green-300 bg-green-50';
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

  if (!isRetailer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Active Auctions</h1>
              <p className="mt-2 text-sm text-gray-600">
                Browse and bid on vegetable auctions from farmers
              </p>
            </div>
            <Link
              href="/retailer/my-bids"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              My Bids
            </Link>
          </div>

          {auctions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No active auctions available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className={`border-2 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg ${getBorderColor(auction.endTime)}`}
                >
                  {auction.vegetable?.image && (
                    <div className="h-48 bg-white flex items-center justify-center p-4">
                      <img
                        src={auction.vegetable.image}
                        alt={auction.vegetable.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {auction.vegetable?.name || 'Unknown'}
                    </h3>
                    
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Available:</strong> {auction.quantity} kg
                      </p>
                      <p className="text-gray-600">
                        <strong>Base Price:</strong> ₹{auction.basePrice.toFixed(2)}/kg
                      </p>
                      
                      {auction.currentBid ? (
                        <p className="text-green-700 font-semibold text-base">
                          Current Bid: ₹{auction.currentBid.toFixed(2)}/kg
                        </p>
                      ) : (
                        <p className="text-blue-600 font-semibold">
                          No bids yet - Be the first!
                        </p>
                      )}
                      
                      <p className="text-gray-600">
                        <strong>Total Bids:</strong> {auction.bidCount || 0}
                      </p>
                      
                      <p className={`font-semibold ${getUrgencyColor(auction.endTime)}`}>
                        ⏱️ Ends in: {getTimeRemaining(auction.endTime)}
                      </p>
                    </div>

                    <Link
                      href={`/retailer/auctions/${auction.id}`}
                      className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                    >
                      View & Place Bid
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
