import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, LogOut, User as UserIcon, Settings as SettingsIcon, Check, X, ShoppingBag, Eye, Phone, MapPin, Package } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Header = ({ searchQuery, onSearchChange, userProfile, onNavigate }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isFetchingOrder, setIsFetchingOrder] = useState(false); // Loading state for details
    const notificationRef = useRef(null);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('any')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, payload => {
                setNotifications(prev => [payload.new, ...prev]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const fetchFullOrderDetails = async (notif) => {
        if (!notif.data?.sale_id) {
            setSelectedOrder(notif);
            return;
        }

        setIsFetchingOrder(true);
        setShowNotifications(false); // Close the small list

        try {
            // Fetch everything related to this sale
            const { data: saleData, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    product:products (
                        name,
                        image_url,
                        sku,
                        price,
                        category
                    )
                `)
                .eq('id', notif.data.sale_id)
                .single();

            if (error) throw error;

            // Merge everything into a "Super Order" object
            setSelectedOrder({
                ...notif,
                fullDetails: saleData
            });

        } catch (error) {
            console.error('Failed to fetch full info:', error);
            // Fallback to notification data if DB fetch fails
            setSelectedOrder(notif);
        } finally {
            setIsFetchingOrder(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const markAsRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const approveOrder = async (notif) => {
        try {
            const saleId = notif.data.sale_id;
            const { error: saleError } = await supabase.from('sales').update({ is_approved: true }).eq('id', saleId);
            if (saleError) throw saleError;
            await markAsRead(notif.id);
            setSelectedOrder(null);
            alert('Order Approved!');
        } catch (error) {
            alert('Approval failed: ' + error.message);
        }
    };

    const rejectOrder = async (notif) => {
        if (!window.confirm('Reject and return stock?')) return;
        try {
            const saleId = notif.data.sale_id;
            const { data: sale } = await supabase.from('sales').select('product_id, quantity').eq('id', saleId).single();
            if (sale) {
                await supabase.rpc('return_stock', { p_product_id: sale.product_id, p_quantity: sale.quantity });
                await supabase.from('sales').delete().eq('id', saleId);
            }
            await markAsRead(notif.id);
            setSelectedOrder(null);
        } catch (error) {
            alert('Rejection failed: ' + error.message);
        }
    };

    return (
        <header className="flex items-center justify-between px-6 bg-white sticky top-0 z-40 transition-all"
            style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--color-border)' }}>

            {/* Search Bar */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: '#f0f2f5', width: 400 }}>
                <Search size={18} className="text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search products or orders..."
                    className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 relative" ref={notificationRef}>
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 hover:bg-gray-50 rounded-full transition-all">
                        <Bell size={20} className="text-gray-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Center</h4>
                                {unreadCount > 0 && <span className="text-[9px] font-black text-red-600 px-3 py-1 bg-red-50 rounded-full uppercase tracking-widest">{unreadCount} New</span>}
                            </div>
                            <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-gray-300 font-bold italic">Silence in the studio...</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all cursor-pointer ${!notif.is_read ? 'bg-red-50/10' : ''}`}
                                            onClick={() => fetchFullOrderDetails(notif)}>
                                            <div className="flex gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center text-red-800 shrink-0 shadow-sm">
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-black text-gray-900 leading-tight">{notif.message}</p>
                                                        <span className="text-[9px] font-bold text-gray-300 whitespace-nowrap ml-2 uppercase">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-[10px] font-black text-red-800 uppercase tracking-widest px-2 py-0.5 bg-red-50 rounded-md">
                                                            Detail Requested
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400">ID: ...{notif.data?.sale_id?.slice(-6)}</span>
                                                    </div>

                                                    {notif.type === 'new_order' && !notif.is_read && (
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); fetchFullOrderDetails(notif); }} className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all flex items-center justify-center gap-1.5 shadow-md">
                                                                <Eye size={12} /> Full Insight
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 pl-6 border-l hover:opacity-80 transition-opacity text-left" style={{ borderColor: 'var(--color-border)' }}>
                        <img src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.email}`} alt="User" className="object-cover w-10 h-10 rounded-full bg-gray-100" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{userProfile?.full_name || 'Admin'}</span>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{userProfile?.role || 'Principal'}</span>
                        </div>
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                            <button onClick={() => { setShowUserMenu(false); onNavigate('Settings'); }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><UserIcon size={16} /> Profile</button>
                            <button onClick={() => { setShowUserMenu(false); onNavigate('Settings'); }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><SettingsIcon size={16} /> Settings</button>
                            <div className="border-t border-gray-100 my-2" />
                            <button onClick={handleLogout} className="w-full text-left px-5 py-4 text-sm font-black text-red-600 hover:bg-red-50 flex items-center gap-3"><LogOut size={16} /> Logout</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Order Insight</h3>
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">Ref: {selectedOrder.fullDetails?.id || selectedOrder.data?.sale_id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-white rounded-full transition-all text-gray-300 hover:text-red-600"><X size={24} /></button>
                        </div>

                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            {/* Product Info */}
                            <div className="flex gap-5 items-center p-5 bg-red-50/30 rounded-3xl border border-red-100/50">
                                <div className="w-16 h-20 rounded-2xl bg-white overflow-hidden shadow-lg border border-white shrink-0">
                                    {(selectedOrder.fullDetails?.product?.image_url || selectedOrder.data?.image_url) ? (
                                        <img
                                            src={selectedOrder.fullDetails?.product?.image_url || selectedOrder.data?.image_url}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-red-800 text-white flex items-center justify-center">
                                            <Package size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-red-950 uppercase leading-none mb-1">
                                        {selectedOrder.fullDetails?.product?.name || selectedOrder.data?.product_name || "Luxury Abaya"}
                                    </h4>
                                    <p className="text-[10px] font-bold text-red-800/60 uppercase tracking-widest mt-1">
                                        SKU: {selectedOrder.fullDetails?.product?.sku || 'N/A'}
                                    </p>
                                    <p className="text-xs font-bold text-red-800/60 uppercase tracking-widest mt-2 px-2 py-0.5 bg-red-100/50 inline-block rounded-md">
                                        Qty: {selectedOrder.fullDetails?.quantity || selectedOrder.data?.quantity || 1} • Total: ${selectedOrder.fullDetails?.total_price || selectedOrder.data?.total_price}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><UserIcon size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Customer Name</p>
                                        <p className="text-md font-bold text-gray-900">{selectedOrder.fullDetails?.customer_name || selectedOrder.data?.customer_name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Phone size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Contact Portal</p>
                                        <p className="text-md font-bold text-gray-900">{selectedOrder.fullDetails?.delivery_info?.phone || selectedOrder.data?.delivery_info?.phone || "Phone N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><MapPin size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Shipping Terminal</p>
                                        <p className="text-sm font-bold text-gray-700 leading-relaxed">
                                            {selectedOrder.fullDetails?.delivery_info?.address || selectedOrder.data?.delivery_info?.address || "Address Not Provided"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><ShoppingBag size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Payment Method</p>
                                        <p className="text-md font-bold text-emerald-600 uppercase italic">{selectedOrder.fullDetails?.payment_method || 'CASH'}</p>
                                    </div>
                                </div>
                            </div>

                            {!selectedOrder.is_read && (
                                <div className="pt-8 flex gap-4">
                                    <button onClick={() => rejectOrder(selectedOrder)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100">Reject Order</button>
                                    <button onClick={() => approveOrder(selectedOrder)} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2">
                                        <Check size={18} strokeWidth={3} /> Confirm Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay for Fetching Order */}
            {isFetchingOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-[10px] font-black text-red-800 uppercase tracking-[0.3em] animate-pulse">Accessing Server Registry...</p>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
