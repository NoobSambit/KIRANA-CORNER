import React, { useEffect, useState } from 'react';
import { X, User, Package, MapPin, Heart, LogOut, HelpCircle, Edit, Trash2, Plus } from 'lucide-react';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getUserData, getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '../utils/orderUtils';
import { doc, updateDoc } from 'firebase/firestore';
// @ts-expect-error: Importing from JS module without type declaration
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import { signOut } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { getCustomerOrders } from '../utils/orderUtils';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../components/Navbar';

interface Profile {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  photoURL?: string;
}

const BUILDING_TYPES = [
  { key: 'society', label: 'Society' },
  { key: 'independent', label: 'Independent house' },
  { key: 'standalone', label: 'Standalone' },
  { key: 'office', label: 'Office' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'others', label: 'Others' },
];

interface Address {
  id: string;
  label: string;
  address: string;
  buildingType?: string;
  flatFloor?: string;
  buildingName?: string;
  landmark?: string;
  receiverName?: string;
  receiverPhone?: string;
}

interface Order {
  id: string;
  orderStatus: string;
  orderTime: string;
  totalAmount: number;
  items: { name: string; image?: string }[];
}

const MENU = [
  { key: 'orders', label: 'Orders', icon: <Package className="h-5 w-5" /> },
  { key: 'support', label: 'Customer Support', icon: <HelpCircle className="h-5 w-5" /> },
  { key: 'referrals', label: 'Manage Referrals', icon: <Heart className="h-5 w-5" /> },
  { key: 'addresses', label: 'Addresses', icon: <MapPin className="h-5 w-5" /> },
  { key: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
];

const AccountPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState('orders');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    address: '',
    id: '',
    buildingType: 'society',
    flatFloor: '',
    buildingName: '',
    landmark: '',
    receiverName: '',
    receiverPhone: '',
  });
  const [addressFormMode, setAddressFormMode] = useState<'add' | 'edit'>('add');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!auth.currentUser) return;
    setAddressesLoading(true);
    setAddressesError('');
    const res = await getUserAddresses(auth.currentUser.uid);
    if (res.success) setAddresses(res.addresses);
    else setAddressesError(res.error || 'Failed to load addresses');
    setAddressesLoading(false);
  };

  // Fetch orders
  useEffect(() => {
    if (!auth.currentUser) return;
    setOrdersLoading(true);
    setOrdersError('');
    const unsubscribe = getCustomerOrders(auth.currentUser.uid, (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const orderList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            orderStatus: data.orderStatus || 'Pending',
            orderTime: data.orderTime || '',
            totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
            items: Array.isArray(data.items) ? data.items : [],
          };
        });
        setOrders(orderList);
        setOrdersLoading(false);
      } catch {
        setOrdersError('Failed to load orders');
        setOrdersLoading(false);
      }
    });
    return () => unsubscribe && unsubscribe();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const res = await getUserData(user.uid);
        if (res.success) {
          setProfile({ ...res.data, email: user.email });
          setEditName(res.data.name || '');
          setEditPhone(res.data.phone || '');
        } else {
          setProfile({ email: user.email });
        }
      }
      setLoading(false);
    };
    fetchProfile();
    fetchAddresses();
    // eslint-disable-next-line
  }, []);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
  };
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { name: editName, phone: editPhone });
      setProfile((prev) => ({ ...prev, name: editName, phone: editPhone }));
      setEditMode(false);
    } catch {
      // Optionally show error
    } finally {
      setSaving(false);
    }
  };

  // Address form handlers
  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };
  const handleBuildingTypeChange = (type: string) => {
    setAddressForm({ ...addressForm, buildingType: type });
  };
  const handleAddAddress = () => {
    setAddressForm({
      label: '',
      address: '',
      id: '',
      buildingType: 'society',
      flatFloor: '',
      buildingName: '',
      landmark: '',
      receiverName: '',
      receiverPhone: '',
    });
    setAddressFormMode('add');
    setShowAddressForm(true);
  };
  const handleEditAddress = (addr: Address) => {
    setAddressForm({
      label: addr.label || '',
      address: addr.address || '',
      id: addr.id,
      buildingType: addr.buildingType || 'society',
      flatFloor: addr.flatFloor || '',
      buildingName: addr.buildingName || '',
      landmark: addr.landmark || '',
      receiverName: addr.receiverName || '',
      receiverPhone: addr.receiverPhone || '',
    });
    setAddressFormMode('edit');
    setShowAddressForm(true);
  };
  const handleDeleteAddress = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteUserAddress(auth.currentUser.uid, id);
    fetchAddresses();
  };
  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const data = {
      label: addressForm.label,
      address: addressForm.address,
      buildingType: addressForm.buildingType,
      flatFloor: addressForm.flatFloor,
      buildingName: addressForm.buildingName,
      landmark: addressForm.landmark,
      receiverName: addressForm.receiverName,
      receiverPhone: addressForm.receiverPhone,
    };
    if (addressFormMode === 'add') {
      await addUserAddress(auth.currentUser.uid, data);
    } else {
      await updateUserAddress(auth.currentUser.uid, addressForm.id, data);
    }
    setShowAddressForm(false);
    fetchAddresses();
  };
  const isAddressFormValid =
    !!addressForm.label &&
    !!addressForm.flatFloor &&
    !!addressForm.buildingName &&
    !!addressForm.receiverName &&
    !!addressForm.receiverPhone;

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };
  const confirmLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.currentUser || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarUploading(true);
    setAvatarError('');
    setAvatarPreview(URL.createObjectURL(file));
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `profile_pics/${auth.currentUser.uid}.jpg`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      // Update Firestore user profile
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { photoURL: url });
      setProfile((prev) => prev ? { ...prev, photoURL: url } : prev);
      setAvatarPreview(null);
    } catch {
      setAvatarError('Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex">
        {/* Left Menu */}
        <div className="w-full sm:w-80 bg-white/80 border-r border-slate-100 flex flex-col h-full min-h-screen">
          {/* Profile Card */}
          <div className="flex flex-col items-center gap-2 py-8 px-4 border-b border-slate-100">
            <div className="relative group">
              {avatarUploading ? (
                <div className="w-16 h-16 rounded-full bg-slate-300 animate-pulse flex items-center justify-center" />
              ) : profile?.photoURL || avatarPreview ? (
                <img
                  src={avatarPreview || profile?.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 shadow"
                />
              ) : (
                <div className="bg-slate-200 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-slate-500">
                  <User className="h-8 w-8" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1 cursor-pointer shadow-lg group-hover:scale-110 transition-transform" title="Change Photo">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} title="Upload profile photo" placeholder="Upload profile photo" />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
              </label>
            </div>
            {avatarError && <div className="text-xs text-red-500 mt-1">{avatarError}</div>}
            <div className="font-semibold text-lg text-slate-900 text-center">
              {loading ? <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" /> : profile?.name || 'No Name'}
            </div>
            <div className="text-slate-500 text-sm text-center">
              {loading ? <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /> : profile?.phone || 'No phone'}
            </div>
            <div className="text-xs text-slate-400 mt-1 text-center">Customer</div>
          </div>
          {/* Menu */}
          <nav className="flex-1 flex flex-col gap-1 py-4">
            {MENU.map(item => (
              <button
                key={item.key}
                className={`flex items-center gap-3 px-6 py-3 text-slate-700 font-medium rounded-l-2xl transition-all text-left ${activeMenu === item.key ? 'bg-orange-50 text-orange-600 shadow' : 'hover:bg-slate-100'}`}
                onClick={() => setActiveMenu(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {/* Logout at bottom */}
          <div className="mt-auto p-4">
            <button className="flex items-center gap-3 w-full rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold p-3 shadow transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Section content */}
          {activeMenu === 'orders' && (
            <div className="p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Orders</h2>
              {ordersLoading ? (
                <div className="text-slate-500">Loading orders...</div>
              ) : ordersError ? (
                <div className="text-red-500">{ordersError}</div>
              ) : orders.length === 0 ? (
                <div className="text-slate-400">You have no orders yet.</div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white/90 rounded-2xl shadow p-6 border border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-900">
                          {order.orderStatus === 'Delivered' || order.orderStatus === 'delivered' ? (
                            <span className="text-green-600">Order delivered</span>
                          ) : order.orderStatus === 'Cancelled' || order.orderStatus === 'cancelled' ? (
                            <span className="text-red-500">Order cancelled</span>
                          ) : (
                            <span className="text-orange-500">{order.orderStatus}</span>
                          )}
                        </div>
                        <div className="text-slate-700 font-bold text-lg">
                          ₹{order.totalAmount?.toFixed(2) ?? '--'}
                        </div>
                      </div>
                      <div className="text-slate-500 text-sm mb-2">
                        Placed at {new Date(order.orderTime).toLocaleString()}
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        {order.items && order.items.length > 0 ? (
                          order.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1">
                              {item.image && <img src={item.image} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                              <span className="text-xs text-slate-700">{item.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No items</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeMenu === 'support' && (
            <div className="p-8 max-w-lg mx-auto">
              <h2 className="text-xl font-bold mb-4">Customer Support</h2>
              <div className="bg-white/90 rounded-2xl shadow p-6 border border-slate-100">
                <div className="text-slate-700 mb-2">Need help? Reach out to us:</div>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>Email: <a href="mailto:support@mudibazar.com" className="text-orange-600 hover:underline">support@mudibazar.com</a></li>
                  <li>Phone: <a href="tel:+919999999999" className="text-orange-600 hover:underline">+91 99999 99999</a></li>
                </ul>
                <div className="mt-4 text-xs text-slate-400">We usually respond within 24 hours.</div>
              </div>
            </div>
          )}
          {activeMenu === 'referrals' && (
            <div className="p-8 max-w-lg mx-auto">
              <h2 className="text-xl font-bold mb-4">Manage Referrals</h2>
              <div className="bg-white/90 rounded-2xl shadow p-6 border border-slate-100 flex flex-col items-center">
                <div className="text-slate-700 mb-2">Invite friends and earn rewards!</div>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all mb-2">Copy Referral Link</button>
                <div className="text-xs text-slate-400">Referral program coming soon.</div>
              </div>
            </div>
          )}
          {activeMenu === 'addresses' && (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Saved Addresses</h2>
                <button onClick={handleAddAddress} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all">
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>
              {addressesLoading ? (
                <div className="text-slate-500">Loading addresses...</div>
              ) : addressesError ? (
                <div className="text-red-500 mb-2">{addressesError}</div>
              ) : addresses.length === 0 ? (
                <div className="text-slate-400">No addresses saved yet.</div>
              ) : (
                <div className="space-y-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className="flex flex-col gap-2 bg-white/90 rounded-2xl shadow p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-slate-900">{addr.label}</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-xs font-medium">
                          {BUILDING_TYPES.find(t => t.key === addr.buildingType)?.label || 'Other'}
                        </span>
                      </div>
                      <div className="text-slate-700 text-sm">
                        <span className="font-medium">Flat/Floor:</span> {addr.flatFloor || '-'}<br />
                        <span className="font-medium">Building:</span> {addr.buildingName || '-'}<br />
                        {addr.landmark && <><span className="font-medium">Landmark:</span> {addr.landmark}<br /></>}
                        <span className="font-medium">Address:</span> {addr.address || '-'}
                      </div>
                      <div className="text-slate-700 text-sm">
                        <span className="font-medium">Receiver:</span> {addr.receiverName || '-'}<br />
                        <span className="font-medium">Phone:</span> {addr.receiverPhone || '-'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleEditAddress(addr)} className="p-2 rounded-full hover:bg-orange-50 transition-all" title="Edit">
                          <Edit className="h-4 w-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-full hover:bg-red-50 transition-all" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Address Form Modal */}
              {showAddressForm && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg border border-slate-100 relative">
                    <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100" onClick={() => setShowAddressForm(false)} title="Close">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                    <h3 className="text-lg font-bold mb-4">{addressFormMode === 'add' ? 'Add Address Details' : 'Edit Address Details'}</h3>
                    <form onSubmit={handleAddressFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Type of Building</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {BUILDING_TYPES.map(type => (
                            <button
                              type="button"
                              key={type.key}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${addressForm.buildingType === type.key ? 'bg-orange-100 border-orange-500 text-orange-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                              onClick={() => handleBuildingTypeChange(type.key)}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Flat No. / Floor *</label>
                          <input
                            name="flatFloor"
                            value={addressForm.flatFloor}
                            onChange={handleAddressFormChange}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Flat No. / Floor"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Building name *</label>
                          <input
                            name="buildingName"
                            value={addressForm.buildingName}
                            onChange={handleAddressFormChange}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Building name"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Landmark</label>
                        <input
                          name="landmark"
                          value={addressForm.landmark}
                          onChange={handleAddressFormChange}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Landmark (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                        <textarea
                          name="address"
                          value={addressForm.address}
                          onChange={handleAddressFormChange}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                          placeholder="Enter your address"
                          rows={2}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Save as</label>
                        <input
                          name="label"
                          value={addressForm.label}
                          onChange={handleAddressFormChange}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="e.g. Home, Work, Other"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Name *</label>
                          <input
                            name="receiverName"
                            value={addressForm.receiverName}
                            onChange={handleAddressFormChange}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Receiver Name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Phone *</label>
                          <input
                            name="receiverPhone"
                            value={addressForm.receiverPhone}
                            onChange={handleAddressFormChange}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Receiver Phone"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="submit" className={`px-4 py-2 bg-orange-500 text-white rounded-xl font-medium transition-all ${isAddressFormValid ? 'hover:bg-orange-600' : 'opacity-50 cursor-not-allowed'}`} disabled={!isAddressFormValid}>
                          {addressFormMode === 'add' ? 'Save Address' : 'Save Changes'}
                        </button>
                        <button type="button" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all" onClick={() => setShowAddressForm(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeMenu === 'profile' && (
            <div className="p-8 max-w-lg">
              <h2 className="text-xl font-bold mb-4">Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  {avatarUploading ? (
                    <div className="w-16 h-16 rounded-full bg-slate-300 animate-pulse flex items-center justify-center" />
                  ) : profile?.photoURL || avatarPreview ? (
                    <img
                      src={avatarPreview || profile?.photoURL}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 shadow"
                    />
                  ) : (
                    <div className="bg-slate-200 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-slate-500">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1 cursor-pointer shadow-lg group-hover:scale-110 transition-transform" title="Change Photo">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} title="Upload profile photo" placeholder="Upload profile photo" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
                  </label>
                </div>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={editMode ? editName : (profile?.name || '')}
                    onChange={e => setEditName(e.target.value)}
                    disabled={!editMode || saving}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={editMode ? editPhone : (profile?.phone || '')}
                    onChange={e => setEditPhone(e.target.value)}
                    disabled={!editMode || saving}
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 text-slate-400"
                    value={profile?.email || ''}
                    disabled
                    placeholder="Email"
                  />
                </div>
                {editMode ? (
                  <div className="flex gap-2">
                    <button type="button" className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <button type="button" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all" onClick={handleCancel} disabled={saving}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-medium hover:bg-orange-100 transition-all" onClick={handleEdit}>Edit Profile</button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default AccountPage; 