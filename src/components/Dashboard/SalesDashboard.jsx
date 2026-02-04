import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, Calendar, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import NewSaleModal from './NewSaleModal';
import BillModal from './BillModal';

const SalesDashboard = ({ session, userRole }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isBillOpen, setIsBillOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    products (name, image_url, sku),
                    profiles (full_name, email)
                `)
                .order('sale_date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBill = (sale) => {
        setSelectedSale(sale);
        setIsBillOpen(true);
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
    const totalTransactions = sales.length;

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Sales Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Track daily transactions and revenue.</p>
                </div>
                {userRole === 'admin' && (
                    <button
                        onClick={() => setIsNewSaleOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Plus size={20} strokeWidth={3} />
                        New Sale
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                        <TrendingUp size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <ShoppingBag size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-4 opacity-70">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Calendar size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
                        <p className="text-lg font-bold text-gray-600">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex-1">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
                </div>

                {loading ? (
                    <div className="text-center p-12 text-gray-400">Loading sales history...</div>
                ) : sales.length === 0 ? (
                    <div className="text-center p-16">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <ShoppingBag size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No sales yet</h3>
                        <p className="text-gray-500">Record your first sale to see it here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Sold By</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {sale.products?.image_url ? (
                                                        <img src={sale.products.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{sale.products?.name || 'Unknown Product'}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{sale.products?.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-600">x{sale.quantity}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">${sale.total_price?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {sale.profiles?.full_name || 'Staff'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-gray-400 font-medium no-print">
                                                    {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button
                                                    onClick={() => handleViewBill(sale)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-bold hover:bg-cyan-100 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <FileText size={12} />
                                                    Bill
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <NewSaleModal
                isOpen={isNewSaleOpen}
                onClose={() => setIsNewSaleOpen(false)}
                onSaleComplete={() => {
                    fetchSales();
                }}
                session={session}
            />

            <BillModal
                isOpen={isBillOpen}
                onClose={() => setIsBillOpen(false)}
                sale={selectedSale}
            />
        </div>
    );
};

export default SalesDashboard;
