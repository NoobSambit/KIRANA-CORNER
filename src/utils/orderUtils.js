import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      orderTime: new Date().toISOString(),
      orderStatus: 'Pending'
    });
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// Get orders for a customer
export const getCustomerOrders = (customerId, callback) => {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('orderTime', 'desc')
  );
  
  return onSnapshot(q, callback);
};

// Get orders for a shop
export const getShopOrders = (shopId, callback) => {
  const q = query(
    collection(db, 'orders'),
    where('shopId', '==', shopId)
  );
  
  return onSnapshot(q, callback);
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      orderStatus: newStatus,
      lastUpdated: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

// Get user data
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error: error.message };
  }
};

// Address utilities for user subcollection
export const getUserAddresses = async (userId) => {
  try {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const snapshot = await getDocs(addressesCol);
    const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, addresses };
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return { success: false, error: error.message };
  }
};

export const addUserAddress = async (userId, addressData) => {
  try {
    const newRef = doc(collection(db, 'users', userId, 'addresses'));
    await setDoc(newRef, addressData);
    return { success: true, id: newRef.id };
  } catch (error) {
    console.error('Error adding address:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserAddress = async (userId, addressId, addressData) => {
  try {
    const addrRef = doc(db, 'users', userId, 'addresses', addressId);
    await setDoc(addrRef, addressData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating address:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUserAddress = async (userId, addressId) => {
  try {
    const addrRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(addrRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting address:', error);
    return { success: false, error: error.message };
  }
};