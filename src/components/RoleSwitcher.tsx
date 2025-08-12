import React from 'react';
import { User, Store, ArrowRightLeft } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'customer' | 'shopowner';
  onRoleSwitch: () => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleSwitch }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${
            currentRole === 'customer' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {currentRole === 'customer' ? (
              <User className="h-5 w-5" />
            ) : (
              <Store className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600">You are logged in as:</p>
            <p className="font-semibold text-slate-900 capitalize">
              {currentRole === 'customer' ? 'Customer' : 'Shop Owner'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onRoleSwitch}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span className="text-sm font-medium">
            Switch to {currentRole === 'customer' ? 'Shop Owner' : 'Customer'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;