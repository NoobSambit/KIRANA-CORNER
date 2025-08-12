import React, { useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getShopOrders, updateOrderStatus, getUserData } from '../utils/orderUtils';
import { getShopProducts, deleteProduct } from '../utils/productService';
import { getShopById } from '../utils/shopService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  MapPin,
  Star,
  Eye,
  Store
} from 'lucide-react';
import RoleSwitcher from '../components/RoleSwitcher';
import ShopProfileEditor from '../components/ShopProfileEditor';
import ProductForm from '../components/ProductForm';
import ConfirmDialog from '../components/ConfirmDialog';
import InventoryModal from '../components/InventoryModal';
import Toast from '../components/Toast';

const ShopOwnerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // Note: userRole not used in UI currently, keeping for potential future role-gated UI
  const [userRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [productFormOpen, setProductFormOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
  };

  // Live shop data (from Firestore via getUserData -> shop doc)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shopInfo, setShopInfo] = useState<any | null>(null);

  const stats = [
    { label: 'Today\'s Revenue', value: '₹2,847', change: '+12.5%', icon: DollarSign, color: 'emerald' },
    { label: 'Orders Today', value: '23', change: '+8.2%', icon: ShoppingCart, color: 'blue' },
    { label: 'Total Products', value: '156', change: '+5 new', icon: Package, color: 'purple' },
    { label: 'Active Customers', value: '89', change: '+15.3%', icon: Users, color: 'orange' }
  ];

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user data to determine shop ID
        getUserData(currentUser.uid).then((result: any) => {
          if (result.success) {
            
            // Use user ID as shop ID for now
            const shopId = currentUser.uid;
            // Try to load shop info document
            getShopById(shopId).then((shopRes: any) => {
              if (shopRes.success) {
                setShopInfo(shopRes.data);
              }
            });
            
            // Listen for real-time order updates
            const unsubscribeOrders = getShopOrders(shopId, (snapshot: any) => {
              const orderList = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
              }));
              setOrders(orderList);
            });

            // Listen for real-time product updates
            const unsubscribeProducts = getShopProducts(shopId, (snapshot: any) => {
              const productList = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
              }));
              setProducts(productList);
              setLoading(false);
            });

            return () => {
              unsubscribeOrders();
              unsubscribeProducts();
            };
          } else {
            setLoading(false);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Preparing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Delivered': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      console.error('Failed to update order status:', result.error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString('en-IN');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeleteProduct = (product: any) => {
    setDeleteDialog({ open: true, product });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.product) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await deleteProduct((deleteDialog.product as any).id);
      if (result.success) {
        showToast('Product deleted successfully! 🗑️', 'success');
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    } finally {
      setDeleteDialog({ open: false, product: null });
    }
  };

  const handleProductFormSuccess = () => {
    // Products will auto-refresh via onSnapshot
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleInventorySuccess = () => {
    // Products will auto-refresh via onSnapshot
    setInventoryModalOpen(false);
  };

  const handleRoleSwitch = () => {
    console.log('Switch to Customer role');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Switcher */}
        <RoleSwitcher currentRole="shopowner" onRoleSwitch={handleRoleSwitch} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Shop Owner Dashboard 🏪
          </h1>
          <p className="text-slate-600">Manage your store and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className={`h-4 w-4 text-${stat.color}-600 mr-1`} />
                <span className={`text-${stat.color}-600`}>{stat.change}</span>
                <span className="text-slate-500 ml-1">from yesterday</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-white/20 mb-6">
              <div className="flex space-x-2">
                {[
                  { id: 'catalog', label: 'Product Catalog', icon: Package },
                  { id: 'orders', label: 'Orders', icon: ShoppingCart },
                  { id: 'profile', label: 'Shop Profile', icon: Store }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shop Profile Editor */}
            {activeTab === 'profile' && (
              <ShopProfileEditor />
            )}

            {/* Catalog Manager */}
            {activeTab === 'catalog' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
                  <button 
                    onClick={handleAddProduct}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No products yet</h3>
                    <p className="text-slate-600 mb-6">Add your first product to start selling</p>
                    <button
                      onClick={handleAddProduct}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 aspect-square flex flex-col">
                        <div className="relative mb-4 flex-1">
                          <img
                            src={product.imageUrl || 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400'}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400';
                            }}
                          />
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${
                            product.inStock 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-slate-600">{product.category}</p>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
                              <p className="text-sm text-slate-500">Stock: {product.stock || 0}</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="Edit product"
                                aria-label="Edit product"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Delete product"
                                aria-label="Delete product"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Panel */}
            {activeTab === 'orders' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                      Filter
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200">
                      Export
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-white" />
                          </div>
                          <div>
                                <h3 className="font-semibold text-slate-900">Order #{order.id.slice(-6)}</h3>
                                <p className="text-sm text-slate-600">{order.customerName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                              <span className="text-sm text-slate-500">{formatDate(order.orderTime)}</span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="mb-4">
                            <h4 className="font-medium text-slate-900 mb-2">Items:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                                  <span className="text-sm text-slate-700">{item.name} x{item.quantity}</span>
                                  <span className="text-sm font-medium text-slate-900">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Actions */}
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-slate-900">
                              Total: ₹{order.totalAmount}
                            </div>
                            
                            {order.orderStatus !== 'Delivered' && (
                              <select
                                value={order.orderStatus}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                aria-label="Update order status"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready">Ready for Pickup</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Shop Info */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🏪 My Shop Info</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">{shopInfo?.name || 'Your Shop'}</h4>
                    <div className="flex items-center space-x-1 text-sm text-slate-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{shopInfo?.address || 'No address set'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-slate-900">{shopInfo?.rating ?? '—'}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      shopInfo?.status === 'open' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {shopInfo?.status === 'open' ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {shopInfo?.openingTime && shopInfo?.closingTime
                        ? `${shopInfo.openingTime} - ${shopInfo.closingTime}`
                        : 'Hours not set'}
                    </span>
                  </div>
                  
                  {/* Open/Closed toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Status</span>
                    <button
                      onClick={async () => {
                        if (!user?.uid) return;
                        const newStatus = shopInfo?.status === 'open' ? 'closed' : 'open';
                        try {
                          const { doc, updateDoc } = await import('firebase/firestore');
                          // @ts-expect-error: JS module without types
                          const { db } = await import('../firebase');
                          const ref = doc(db, 'shops', user.uid);
                          await updateDoc(ref, { status: newStatus, lastUpdated: new Date().toISOString() });
                          setShopInfo((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
                        } catch (e) {
                          console.error('Failed to update status', e);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        shopInfo?.status === 'open' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {shopInfo?.status === 'open' ? 'Mark as Closed' : 'Mark as Open'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-bold text-slate-900 mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleAddProduct}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                  </button>
                  <button 
                    onClick={() => setInventoryModalOpen(true)}
                    className="w-full flex items-center space-x-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    <span>Update Inventory</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                    <Eye className="h-5 w-5" />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-bold text-slate-900 mb-4">📈 Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Orders this week</span>
                    <span className="font-bold text-slate-900">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Average rating</span>
                    <span className="font-bold text-emerald-600">4.5 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Response time</span>
                    <span className="font-bold text-slate-900">{"< 5 min"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={productFormOpen}
        onClose={() => {
          setProductFormOpen(false);
          setEditingProduct(null);
        }}
        shopId={user?.uid || ''}
        product={editingProduct}
        onSuccess={handleProductFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={inventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
        products={products}
        onSuccess={handleInventorySuccess}
      />
    </div>
  );
};

export default ShopOwnerDashboard;