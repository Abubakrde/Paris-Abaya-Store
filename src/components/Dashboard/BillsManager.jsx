import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Download,
    Printer, Eye, MoreHorizontal,
    Calendar, User, CreditCard, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import BillModal from './BillModal';
import NewSaleModal from './NewSaleModal';

const BillsManager = ({ session }) => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    products (name, sku, image_url, price),
                    profiles (full_name)
                `)
                .order('sale_date', { ascending: false });

            if (error) throw error;
            setBills(data || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBill = (bill) => {
        setSelectedBill(bill);
        setIsBillModalOpen(true);
    };

    const handleMarkAsPaid = async (billId) => {
        try {
            const { error } = await supabase
                .from('sales')
                .update({ status: 'Paid' })
                .eq('id', billId);
            if (error) throw error;
            fetchBills();
        } catch (error) {
            alert('Error updating status: ' + error.message);
        }
    };

    const filteredBills = bills.filter(bill =>
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Bills & Invoices</h1>
                    <p className="text-gray-500 font-medium">Manage and track all generated customer receipts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Bill ID or Customer..."
                            className="pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl w-full md:w-80 shadow-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-cyan-600 hover:shadow-md transition-all">
                        <Filter size={20} />
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={18} />
                        Export All
                    </button>
                    <button
                        onClick={() => setIsNewSaleOpen(true)}
                        className="flex items-center gap-2 text-white px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-red-900/40 hover:shadow-red-900/60 hover:-translate-y-1 transition-all duration-300"
                        style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}
                    >
                        <CreditCard size={20} strokeWidth={3} />
                        Pay Bill
                    </button>
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Bill Details</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-gray-400 animate-pulse font-bold text-lg">Loading Bills...</td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <FileText size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">No bills found</h3>
                                        <p className="text-gray-500 font-medium">Try adjusting your search filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 font-black text-xs">
                                                    #{bill.id.slice(0, 4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                                                        {bill.products?.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 flex items-center gap-1 font-bold mt-0.5">
                                                        <Calendar size={10} />
                                                        {new Date(bill.sale_date).toLocaleDateString()} at {new Date(bill.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-300" />
                                                <span className="font-semibold text-gray-700">{bill.customer_name || 'Walk-in'}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold ml-5 uppercase tracking-tighter">Sold by: {bill.profiles?.full_name || 'Staff'}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                                <CreditCard size={12} />
                                                {bill.payment_method || 'CASH'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-900 text-lg">
                                                ${(bill.total_price || 0).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold">Qty: {bill.quantity}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {bill.status === 'Paid' ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    <CheckCircle2 size={12} />
                                                    Paid
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleMarkAsPaid(bill.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors"
                                                >
                                                    Unpaid (Tap to Pay)
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewBill(bill)}
                                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewBill(bill)}
                                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BillModal
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
                sale={selectedBill}
            />

            <NewSaleModal
                isOpen={isNewSaleOpen}
                onClose={() => setIsNewSaleOpen(false)}
                onSaleComplete={fetchBills}
                session={session}
            />
        </div>
    );
};

export default BillsManager;
