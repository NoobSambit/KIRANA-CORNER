import React, { useState, useEffect } from 'react';
import { X, Save, Package, Hash } from 'lucide-react';
import { updateProduct } from '../utils/productService';
import Toast from './Toast';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSuccess: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  products,
  onSuccess
}) => {
  const [inventoryData, setInventoryData] = useState<Record<string, { stock: number; inStock: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (isOpen && products.length > 0) {
      const initialData: Record<string, { stock: number; inStock: boolean }> = {};
      products.forEach(product => {
        initialData[product.id] = {
          stock: product.stock || 0,
          inStock: product.inStock !== false
        };
      });
      setInventoryData(initialData);
    }
  }, [isOpen, products]);

  const handleStockChange = (productId: string, stock: number) => {
    setInventoryData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock: Math.max(0, stock),
        inStock: stock > 0 ? true : prev[productId]?.inStock || false
      }
    }));
  };

  const handleInStockToggle = (productId: string) => {
    setInventoryData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        inStock: !prev[productId]?.inStock
      }
    }));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const updatePromises = Object.entries(inventoryData).map(([productId, data]) => {
        return updateProduct(productId, {
          stock: data.stock,
          inStock: data.inStock
        });
      });

      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter(result => !result.success);

      if (failedUpdates.length === 0) {
        showToast('Inventory updated successfully! 🎉', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(`${failedUpdates.length} products failed to update`, 'error');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      showToast('Failed to update inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] border border-white/20 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Package className="h-6 w-6 text-emerald-600 mr-2" />
              Update Inventory
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-emerald-600" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      <p className="text-sm text-slate-600">{product.category}</p>
                      <p className="text-sm font-medium text-slate-900">₹{product.price}</p>
                    </div>

                    {/* Stock Input */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-slate-500" />
                        <input
                          type="number"
                          min="0"
                          value={inventoryData[product.id]?.stock || 0}
                          onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center bg-white/70"
                        />
                      </div>

                      {/* In Stock Toggle */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleInStockToggle(product.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            inventoryData[product.id]?.inStock ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              inventoryData[product.id]?.inStock ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-slate-700">
                          {inventoryData[product.id]?.inStock ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center space-x-3 p-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryModal;