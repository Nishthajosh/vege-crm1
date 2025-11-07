'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface CartItem {
  vegetableId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = localStorage.getItem('vegetableCart');
      if (!savedCart) {
        setLoading(false);
        return;
      }

      const cart: { [key: string]: number } = JSON.parse(savedCart);
      
      // Fetch vegetable details
      const response = await fetch('/api/vegetables');
      if (response.ok) {
        const vegetables = await response.json();
        
        const items: CartItem[] = [];
        Object.entries(cart).forEach(([id, quantity]) => {
          const veg = vegetables.find((v: any) => v.id === id);
          if (veg) {
            items.push({
              vegetableId: veg.id,
              name: veg.name,
              quantity: quantity,
              price: veg.price,
              image: veg.image,
            });
          }
        });
        
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (vegetableId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(vegetableId);
      return;
    }

    const savedCart = localStorage.getItem('vegetableCart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      cart[vegetableId] = newQuantity;
      localStorage.setItem('vegetableCart', JSON.stringify(cart));
      loadCart();
    }
  };

  const removeItem = (vegetableId: string) => {
    const savedCart = localStorage.getItem('vegetableCart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      delete cart[vegetableId];
      localStorage.setItem('vegetableCart', JSON.stringify(cart));
      loadCart();
    }
  };

  const clearCart = () => {
    localStorage.removeItem('vegetableCart');
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setCheckingOut(true);

    try {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = calculateTotal();
      const todayDate = new Date().toISOString().split('T')[0];

      const orderItems = cartItems.map((item) => ({
        vegetableId: item.vegetableId,
        vegetableName: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayDate,
          name: 'Retailer Order',
          quantity: totalQuantity,
          totalPrice: totalPrice,
          items: orderItems
        }),
      });

      if (response.ok) {
        clearCart();
        router.push('/retailer/orders');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to place order');
        setCheckingOut(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="mt-2 text-sm text-gray-600">Review your items and proceed to checkout</p>
            </div>
            <Link
              href="/retailer/vegetables"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
            >
              Continue Shopping
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Start adding vegetables to your cart</p>
              <div className="mt-6">
                <Link
                  href="/retailer/vegetables"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Vegetables
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cart Items ({cartItems.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div key={item.vegetableId} className="p-6 flex items-center">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 object-contain mr-4"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">₹{item.price}/kg</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => updateQuantity(item.vegetableId, item.quantity - 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-x border-gray-300">{item.quantity} kg</span>
                            <button
                              onClick={() => updateQuantity(item.vegetableId, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <div className="w-24 text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.vegetableId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (0%)</span>
                      <span className="font-medium text-gray-900">₹0.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-green-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium disabled:bg-gray-400"
                  >
                    {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
