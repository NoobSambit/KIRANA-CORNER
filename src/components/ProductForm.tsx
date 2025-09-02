import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Tag, Image as ImageIcon, Hash } from 'lucide-react';
import { addProduct, updateProduct, validateProductData } from '../utils/productService';
import Toast from './Toast';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  product?: any; // For editing existing product
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  shopId,
  product,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
    inStock: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (product) {
      // Editing existing product
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        imageUrl: product.imageUrl || '',
        inStock: product.inStock !== false
      });
    } else {
      // Adding new product
      setFormData({
        name: '',
        category: '',
        price: '',
        stock: '',
        imageUrl: '',
        inStock: true
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for validation
    const dataToValidate = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0
    };
    
    // Validate data
    const validation = validateProductData(dataToValidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the errors before saving', 'error');
      return;
    }
    
    setLoading(true);
    try {
      let result;
      if (product) {
        // Update existing product
        result = await updateProduct(product.id, dataToValidate);
      } else {
        // Add new product
        result = await addProduct(shopId, dataToValidate);
      }
      
      if (result.success) {
        showToast(
          product ? 'Product updated successfully! 🎉' : 'Product added successfully! 🎉',
          'success'
        );
        onSuccess();
        onClose();
      } else {
        showToast('Failed to save product', 'error');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Failed to save product', 'error');
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
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Package className="h-6 w-6 text-emerald-600 mr-2" />
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Package className="h-4 w-4 inline mr-2" />
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/70 ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Tag className="h-4 w-4 inline mr-2" />
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/70 ${
                  errors.category ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., Grocery, Dairy, Spices"
              />
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/70 ${
                    errors.price ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Hash className="h-4 w-4 inline mr-2" />
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/70 ${
                    errors.stock ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="0"
                />
                {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/70 ${
                  errors.imageUrl ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="https://example.com/product-image.jpg"
              />
              {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>}
            </div>

            {/* In Stock Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Availability
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('inStock', !formData.inStock)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    formData.inStock ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.inStock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-slate-700">
                  {formData.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{product ? 'Update' : 'Add'} Product</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProductForm;