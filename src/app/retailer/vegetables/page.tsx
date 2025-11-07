'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Vegetable {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  description?: string;
}

export default function BrowseVegetablesPage() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [filteredVegetables, setFilteredVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchVegetables();
    loadCart();
  }, []);

  useEffect(() => {
    filterVegetables();
  }, [searchTerm, vegetables]);

  const fetchVegetables = async () => {
    try {
      const response = await fetch('/api/vegetables');
      if (response.ok) {
        const data = await response.json();
        setVegetables(data);
        setFilteredVegetables(data);
      }
    } catch (error) {
      console.error('Error fetching vegetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVegetables = () => {
    if (!searchTerm) {
      setFilteredVegetables(vegetables);
      return;
    }

    const filtered = vegetables.filter((veg) =>
      veg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVegetables(filtered);
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('vegetableCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart: { [key: string]: number }) => {
    localStorage.setItem('vegetableCart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const addToCart = (vegetableId: string, quantity: number) => {
    const newCart = { ...cart };
    newCart[vegetableId] = (newCart[vegetableId] || 0) + quantity;
    saveCart(newCart);
    alert('Added to cart!');
  };

  const getCartQuantity = (vegetableId: string) => {
    return cart[vegetableId] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-4">
            <Link 
              href="/retailer/dashboard" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Vegetables</h1>
              <p className="mt-2 text-sm text-gray-600">Select vegetables and add them to your cart</p>
            </div>
            <Link href="/retailer/cart" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Cart ({Object.keys(cart).length})
            </Link>
          </div>

          <div className="mb-6">
            <input type="text" placeholder="Search vegetables..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {loading ? (
            <div className="text-center py-12"><p className="text-gray-500">Loading vegetables...</p></div>
          ) : filteredVegetables.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vegetables found</h3>
              <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search terms' : 'No vegetables are available at the moment'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVegetables.map((vegetable) => (
                <div key={vegetable.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    {vegetable.image && <div className="flex justify-center mb-4"><img src={vegetable.image} alt={vegetable.name} className="h-24 w-24 object-contain" /></div>}
                    <h3 className="text-lg font-semibold text-gray-900 text-center">{vegetable.name}</h3>
                    {vegetable.description && <p className="mt-2 text-sm text-gray-600 text-center">{vegetable.description}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Available</p>
                        <p className="text-lg font-semibold text-gray-900">{vegetable.quantity} kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-semibold text-green-600">₹{vegetable.price}/kg</p>
                      </div>
                    </div>
                    {getCartQuantity(vegetable.id) > 0 && (
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{getCartQuantity(vegetable.id)} kg in cart</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input type="number" min="1" max={vegetable.quantity} defaultValue="1" id={`qty-${vegetable.id}`} className="flex-1 border border-gray-300 rounded-md px-3 py-2" />
                      <button onClick={() => { const input = document.getElementById(`qty-${vegetable.id}`) as HTMLInputElement; const qty = parseInt(input.value) || 1; if (qty > 0 && qty <= vegetable.quantity) { addToCart(vegetable.id, qty); } else { alert('Invalid quantity'); }}} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">Add to Cart</button>
                    </div>
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
