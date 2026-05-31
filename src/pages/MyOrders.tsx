import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getCustomerOrders } from '../utils/orderUtils';
import { Clock, CheckCircle, Truck, Package, ArrowLeft, Star, ShoppingBag, Store } from 'lucide-react';

type OStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Delivered' | string;
const STEPS: OStatus[] = ['Pending', 'Accepted', 'Preparing', 'Delivered'];

const STATUS: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{className?: string}> }> = {
  Pending:   { label: 'Pending',   color: '#D97706', bg: 'var(--warn-bg)',    Icon: Clock        },
  Accepted:  { label: 'Accepted',  color: '#3B82F6', bg: 'var(--pastel-sky)', Icon: CheckCircle  },
  Preparing: { label: 'Preparing', color: '#8B5CF6', bg: 'var(--pastel-violet)', Icon: Package   },
  Ready:     { label: 'Ready',     color: '#10B981', bg: 'var(--success-bg)', Icon: CheckCircle  },
  Delivered: { label: 'Delivered', color: '#10B981', bg: 'var(--success-bg)', Icon: Truck        },
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { navigate('/login'); return; }
      const unsubOrders = getCustomerOrders(user.uid, (snap: any) => {
        setOrders(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return () => unsubOrders();
    });
    return () => unsub();
  }, [navigate]);

  const fmt = (d: string) => !d ? '' : new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-7 skeleton rounded w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="h-4 skeleton rounded w-1/3" />
              <div className="h-3 skeleton rounded w-1/2" />
              <div className="h-10 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center w-9 h-9 rounded-xl shadow-sm transition-colors flex-shrink-0"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>My Orders</h1>
            {orders.length > 0 && <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{orders.length} orders</p>}
          </div>
        </div>

        {/* Empty */}
        {orders.length === 0 ? (
          <div className="rounded-2xl p-10 text-center flex flex-col items-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--pastel-peach)' }}>
              <ShoppingBag className="h-8 w-8" style={{ color: 'var(--brand)' }} />
            </div>
            <h3 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>No orders yet</h3>
            <p className="text-sm font-medium mb-5" style={{ color: 'var(--text-muted)' }}>Start shopping to see your orders here</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary px-6">Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const cfg = STATUS[order.orderStatus] ?? STATUS.Pending;
              const StatusIcon = cfg.Icon;
              const stepIdx = STEPS.indexOf(order.orderStatus);

              return (
                <div key={order.id} className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--pastel-peach)' }}>
                        <Store className="h-4 w-4" style={{ color: 'var(--brand)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>{order.shopName}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress */}
                  {stepIdx >= 0 && (
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center">
                        {STEPS.map((step, i) => {
                          const done = i <= stepIdx;
                          return (
                            <React.Fragment key={step}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-extrabold transition-colors"
                                style={{
                                  background: done ? 'var(--brand)' : 'var(--bg-elevated)',
                                  color: done ? '#fff' : 'var(--text-muted)',
                                  border: `1px solid ${done ? 'var(--brand)' : 'var(--border)'}`,
                                }}>
                                {i + 1}
                              </div>
                              {i < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-0.5 transition-colors"
                                  style={{ background: done ? 'var(--brand)' : 'var(--border)' }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {STEPS.map((step) => (
                          <span key={step} className="text-[9px] font-semibold text-center" style={{ flex: 1, color: 'var(--text-muted)' }}>{step}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="space-y-1.5 mb-3">
                      {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[13px]">
                          <span className="font-medium truncate max-w-[60%]" style={{ color: 'var(--text-secondary)' }}>
                            {item.name} <span style={{ color: 'var(--text-muted)' }}>× {item.quantity}</span>
                          </span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{fmt(order.orderTime)}</span>
                      <span className="text-[15px] font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Rate */}
                  {order.orderStatus === 'Delivered' && (
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--pastel-amber)' }}>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>Rate your experience</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <button key={s} aria-label={`Rate ${s} star`}>
                            <Star className="h-5 w-5 fill-current text-amber-300 hover:text-amber-400 transition-colors cursor-pointer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;