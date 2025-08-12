import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getCustomerOrders } from '../utils/orderUtils';
import { Clock, CheckCircle, Truck, Package, ArrowLeft, Star } from 'lucide-react';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Listen for real-time order updates
        const unsubscribeOrders = getCustomerOrders(currentUser.uid, (snapshot) => {
          const orderList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(orderList);
          setLoading(false);
        });

        return () => unsubscribeOrders();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Accepted':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'Preparing':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'Ready':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'Delivered':
        return <Truck className="h-5 w-5 text-emerald-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Accepted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Preparing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Orders 📦
          </h1>
          <p className="text-slate-600">Track your orders and delivery status</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-600 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Order #{order.id.slice(-6)}</h3>
                      <p className="text-sm text-slate-600">{order.shopName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      <span>{order.orderStatus}</span>
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Items */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Info */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Order Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Order Time</span>
                        <span className="font-medium text-slate-900">{formatDate(order.orderTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Amount</span>
                        <span className="text-xl font-bold text-slate-900">₹{order.totalAmount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Payment</span>
                        <span className="font-medium text-emerald-600">Cash on Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                {order.orderStatus === 'Delivered' && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Rate your experience</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 text-yellow-400 fill-current cursor-pointer hover:scale-110 transition-transform" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;