import React, { useEffect, useState } from 'react';
import { X, Plus, MapPin } from 'lucide-react';
// @ts-expect-error: Importing from JS module without type declaration
import { getUserAddresses, addUserAddress } from '../utils/orderUtils';
import { auth } from '../firebase';

interface Address {
  id: string;
  label: string;
  address: string;
  [key: string]: any;
}

interface AddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
  selectedAddressId?: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ isOpen, onClose, onSelect, selectedAddressId }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(selectedAddressId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', address: '' });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAddresses = async () => {
      setLoading(true);
      if (auth.currentUser) {
        const res = await getUserAddresses(auth.currentUser.uid);
        if (res.success) setAddresses(res.addresses);
      }
      setLoading(false);
    };
    fetchAddresses();
  }, [isOpen]);

  useEffect(() => {
    setSelected(selectedAddressId);
  }, [selectedAddressId]);

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleContinue = () => {
    const addr = addresses.find(a => a.id === selected);
    if (addr) onSelect(addr);
  };

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setAddLoading(true);
    const res = await addUserAddress(auth.currentUser.uid, addForm);
    setAddLoading(false);
    if (res.success) {
      setShowAddForm(false);
      setAddForm({ label: '', address: '' });
      // Refresh addresses and select new
      const addrRes = await getUserAddresses(auth.currentUser.uid);
      if (addrRes.success) {
        setAddresses(addrRes.addresses);
        setSelected(res.id);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close address selector"
      />
      {/* Bottom Sheet */}
      <div className={`relative w-full sm:max-w-md bg-white rounded-t-2xl shadow-2xl p-6 transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-all" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <h2 className="text-xl font-bold mb-4">Select delivery address</h2>
        <button className="flex items-center gap-2 text-green-600 font-medium mb-4" onClick={() => setShowAddForm(true)}>
          <Plus className="h-5 w-5" /> Add a new address
        </button>
        {loading ? (
          <div className="text-slate-500">Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="text-slate-400">No addresses saved yet.</div>
        ) : (
          <div className="space-y-3 mb-6">
            {addresses.map(addr => (
              <button
                key={addr.id}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${selected === addr.id ? 'border-green-500 bg-green-50 shadow' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                onClick={() => handleSelect(addr.id)}
              >
                <MapPin className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{addr.label}</div>
                  <div className="text-slate-600 text-sm whitespace-pre-line">{addr.address}</div>
                </div>
                <span className={`ml-2 h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected === addr.id ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'}`}>
                  {selected === addr.id && <span className="h-3 w-3 rounded-full bg-white block" />}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all ${selected ? '' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleContinue}
          disabled={!selected}
        >
          Continue to Checkout
        </button>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100 relative">
              <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100" onClick={() => setShowAddForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-slate-500" />
              </button>
              <h3 className="text-lg font-bold mb-4">Add New Address</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                  <input
                    name="label"
                    value={addForm.label}
                    onChange={handleAddFormChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. Home, Work, Other"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={addForm.address}
                    onChange={handleAddFormChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Enter your address"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all" disabled={addLoading}>
                    {addLoading ? 'Saving...' : 'Save Address'}
                  </button>
                  <button type="button" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSelector; 