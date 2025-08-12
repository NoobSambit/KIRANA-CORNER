import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { filterShopsByDistance } from './geoUtils';

// Add a new product
export const addProduct = async (shopId, productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      shopId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    return { success: true, productId: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing product
export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...productData,
      lastUpdated: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
};

// Get products for a shop
export const getShopProducts = (shopId, callback) => {
  const q = query(
    collection(db, 'products'),
    where('shopId', '==', shopId)
  );
  
  return onSnapshot(q, callback);
};

// Get products from nearby shops (within radius)
export const getNearbyShopProducts = async (shops, userLocation, radiusKm = 3) => {
  try {
    console.log('🔍 Fetching products from nearby shops...');
    
    // Filter shops by distance
    const nearbyShops = filterShopsByDistance(shops, userLocation, radiusKm);
    console.log(`📍 Found ${nearbyShops.length} shops within ${radiusKm}km`);
    
    if (nearbyShops.length === 0) {
      console.log('❌ No shops found within radius');
      return [];
    }

    const allProducts = [];
    
    // Fetch products from each nearby shop
    for (const shop of nearbyShops) {
      try {
        const productsSnapshot = await getDocs(
          query(collection(db, 'shops', shop.id, 'catalog'))
        );
        
        const shopProducts = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          shopId: shop.id,
          shopName: shop.name,
          shopDistance: shop.distance,
          ...doc.data()
        }));
        
        allProducts.push(...shopProducts);
        console.log(`📦 Found ${shopProducts.length} products from ${shop.name}`);
      } catch (error) {
        console.error(`❌ Error fetching products from shop ${shop.name}:`, error);
      }
    }
    
    console.log(`✅ Total products found: ${allProducts.length}`);
    return allProducts;
  } catch (error) {
    console.error('❌ Error fetching nearby shop products:', error);
    return [];
  }
};

// Update product stock
export const updateProductStock = async (shopId, productId, newStock) => {
  try {
    const productRef = doc(db, 'shops', shopId, 'catalog', productId);
    await updateDoc(productRef, {
      stock: Math.max(0, newStock), // Ensure stock doesn't go below 0
      lastUpdated: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product stock:', error);
    return { success: false, error: error.message };
  }
};

// Decrease product stock (for cart/buy actions)
export const decreaseProductStock = async (shopId, productId, quantity = 1) => {
  try {
    const productRef = doc(db, 'shops', shopId, 'catalog', productId);
    const productDoc = await getDocs(query(collection(db, 'shops', shopId, 'catalog'), where('__name__', '==', productId)));
    
    if (!productDoc.empty) {
      const currentStock = productDoc.docs[0].data().stock || 0;
      const newStock = Math.max(0, currentStock - quantity);
      
      await updateDoc(productRef, {
        stock: newStock,
        lastUpdated: new Date().toISOString()
      });
      
      return { success: true, newStock };
    } else {
      return { success: false, error: 'Product not found' };
    }
  } catch (error) {
    console.error('Error decreasing product stock:', error);
    return { success: false, error: error.message };
  }
};

// New: decrement stock for top-level products/{productId}
export const decrementTopLevelProductStock = async (productId, quantity = 1) => {
  try {
    const productRef = doc(db, 'products', productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) {
      return { success: false, error: 'Product not found' };
    }
    const currentStock = Number(snap.data().stock || 0);
    const newStock = Math.max(0, currentStock - Number(quantity));
    await updateDoc(productRef, {
      stock: newStock,
      inStock: newStock > 0,
      lastUpdated: new Date().toISOString(),
    });
    return { success: true, newStock };
  } catch (error) {
    console.error('Error decrementing product stock:', error);
    return { success: false, error: error.message };
  }
};

// Get products with real-time stock updates
export const getProductsWithStockUpdates = (nearbyShops, callback) => {
  const unsubscribeFunctions = [];
  
  nearbyShops.forEach(shop => {
    const q = query(collection(db, 'shops', shop.id, 'catalog'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        shopId: shop.id,
        shopName: shop.name,
        shopDistance: shop.distance,
        ...doc.data()
      }));
      
      // Call the callback with updated products
      callback(products, shop.id);
    });
    
    unsubscribeFunctions.push(unsubscribe);
  });
  
  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
};

// Validate product data
export const validateProductData = (productData) => {
  const errors = {};
  
  if (!productData.name || productData.name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters long';
  }
  
  if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
    errors.price = 'Price must be a valid number greater than 0';
  }
  
  if (!productData.category || productData.category.trim().length < 2) {
    errors.category = 'Category must be at least 2 characters long';
  }
  
  if (productData.stock !== undefined && (isNaN(productData.stock) || productData.stock < 0)) {
    errors.stock = 'Stock must be a valid number greater than or equal to 0';
  }
  
  if (productData.imageUrl && productData.imageUrl.trim() && !isValidUrl(productData.imageUrl)) {
    errors.imageUrl = 'Please enter a valid image URL';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Helper function to validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};