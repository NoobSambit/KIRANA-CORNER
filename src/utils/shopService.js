import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Get shop data by owner ID
export const getShopByOwnerId = async (ownerId) => {
  try {
    const shopDoc = await getDoc(doc(db, 'shops', ownerId));
    if (shopDoc.exists()) {
      return { success: true, data: shopDoc.data() };
    } else {
      return { success: false, error: 'Shop not found' };
    }
  } catch (error) {
    console.error('Error getting shop data:', error);
    return { success: false, error: error.message };
  }
};

// Create or update shop information
export const updateShopInfo = async (ownerId, shopData) => {
  try {
    const shopRef = doc(db, 'shops', ownerId);
    
    // Check if shop exists
    const shopDoc = await getDoc(shopRef);
    
    const dataToSave = {
      ...shopData,
      ownerId,
      lastUpdated: new Date().toISOString()
    };

    // Convert latitude and longitude to numbers if they exist
    if (dataToSave.latitude !== undefined && dataToSave.latitude !== '') {
      const lat = parseFloat(dataToSave.latitude);
      if (!isNaN(lat)) {
        dataToSave.latitude = lat;
      } else {
        delete dataToSave.latitude;
      }
    }

    if (dataToSave.longitude !== undefined && dataToSave.longitude !== '') {
      const lng = parseFloat(dataToSave.longitude);
      if (!isNaN(lng)) {
        dataToSave.longitude = lng;
      } else {
        delete dataToSave.longitude;
      }
    }
    // Normalize category to align with seeded schema
    if (dataToSave.category) {
      dataToSave.category = String(dataToSave.category);
    }

    if (shopDoc.exists()) {
      // Update existing shop
      await updateDoc(shopRef, dataToSave);
    } else {
      // Create new shop
      await setDoc(shopRef, {
        ...dataToSave,
        createdAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating shop info:', error);
    return { success: false, error: error.message };
  }
};

// Get all shops (for customer view)
export const getAllShops = (callback) => {
  try {
    console.log('🔄 Setting up Firestore listener for shops collection...');
    const shopsQuery = query(collection(db, 'shops'));
    return onSnapshot(shopsQuery, (snapshot) => {
      console.log(`📡 Firestore snapshot received: ${snapshot.docs.length} documents`);
      callback(snapshot);
    }, (error) => {
      console.error('❌ Firestore listener error:', error);
    });
  } catch (error) {
    console.error('Error getting shops:', error);
    throw error;
  }
};

// Get shops by location (for map filtering)
export const getShopsByLocation = (locationName, callback) => {
  try {
    const shopsQuery = query(
      collection(db, 'shops'),
      where('locationName', '==', locationName)
    );
    return onSnapshot(shopsQuery, callback);
  } catch (error) {
    console.error('Error getting shops by location:', error);
    throw error;
  }
};

// Get shop by ID
export const getShopById = async (shopId) => {
  try {
    const shopDoc = await getDoc(doc(db, 'shops', shopId));
    if (shopDoc.exists()) {
      return { success: true, data: { id: shopDoc.id, ...shopDoc.data() } };
    } else {
      return { success: false, error: 'Shop not found' };
    }
  } catch (error) {
    console.error('Error getting shop by ID:', error);
    return { success: false, error: error.message };
  }
};

// Validate shop data
export const validateShopData = (shopData) => {
  const errors = {};
  
  if (!shopData.name || shopData.name.trim().length < 2) {
    errors.name = 'Shop name must be at least 2 characters long';
  }
  
  if (!shopData.address || shopData.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters long';
  }

  if (!shopData.category || shopData.category.trim().length < 2) {
    errors.category = 'Category is required';
  }
  
  if (!shopData.openingTime) {
    errors.openingTime = 'Opening time is required';
  }
  
  if (!shopData.closingTime) {
    errors.closingTime = 'Closing time is required';
  }
  
  if (shopData.openingTime && shopData.closingTime && shopData.openingTime >= shopData.closingTime) {
    errors.closingTime = 'Closing time must be after opening time';
  }
  
  if (shopData.imageUrl && shopData.imageUrl.trim() && !isValidUrl(shopData.imageUrl)) {
    errors.imageUrl = 'Please enter a valid image URL';
  }
  
  if (shopData.latitude && (isNaN(shopData.latitude) || shopData.latitude < -90 || shopData.latitude > 90)) {
    errors.latitude = 'Latitude must be between -90 and 90';
  }
  
  if (shopData.longitude && (isNaN(shopData.longitude) || shopData.longitude < -180 || shopData.longitude > 180)) {
    errors.longitude = 'Longitude must be between -180 and 180';
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