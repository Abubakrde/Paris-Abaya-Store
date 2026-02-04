import React, { useState, useEffect } from 'react';
import {
    Zap, Droplets, Wifi, Home,
    Plus, Search, Filter, Calendar,
    DollarSign, CheckCircle2, AlertCircle, Clock,
    MoreHorizontal, Download, Trash2, Edit3, X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UtilityManager = () => {
    const [utilities, setUtilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Electricity',
        due_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        reference_number: ''
    });

    const categories = [
        { name: 'Electricity', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        { name: 'Water', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Internet', icon: Wifi, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { name: 'Rent', icon: Home, color: 'text-rose-500', bg: 'bg-rose-50' },
        { name: 'Maintenance', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50' }
    ];

    useEffect(() => {
        fetchUtilities();
    }, []);

    const fetchUtilities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('utilities')
                .select('*')
                .order('due_date', { ascending: true });

            if (error) throw error;
            setUtilities(data || []);
        } catch (error) {
            console.error('Error fetching utilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUtility = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('utilities')
                .insert([formData]);

            if (error) throw error;

            setIsModalOpen(false);
            fetchUtilities();
            setFormData({
                title: '',
                amount: '',
                category: 'Electricity',
                due_date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                reference_number: ''
            });
        } catch (error) {
            alert('Error adding utility bill: ' + error.message);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
        try {
            const { error } = await supabase
                .from('utilities')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchUtilities();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const deleteUtility = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;
        try {
            const { error } = await supabase
                .from('utilities')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchUtilities();
        } catch (error) {
            console.error('Error deleting utility:', error);
        }
    };

    const filteredUtilities = utilities.filter(u =>
        u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalUnpaid = utilities
        .filter(u => u.status !== 'Paid')
        .reduce((sum, u) => sum + parseFloat(u.amount), 0);

    return (
        <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Utility Center</h1>
                    <p className="text-gray-500 font-medium">Track and manage your business recurring expenses.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search bills..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Add Bill
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <AlertCircle size={80} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unpaid Balance</p>
                    <h3 className="text-3xl font-black text-rose-500">${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-tighter flex items-center gap-1">
                        <Clock size={12} /> Requires Attention
                    </p>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">This Month's Utilities</p>
                    <h3 className="text-3xl font-black text-gray-900">{utilities.length} Bills</h3>
                    <p className="text-[10px] text-emerald-500 mt-2 font-black uppercase tracking-tighter flex items-center gap-1">
                        <CheckCircle2 size={12} /> System Tracked
                    </p>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-none shadow-cyan-500/20">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Quick Action</p>
                    <h3 className="text-xl font-black mb-3">Optimize Expenses</h3>
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-md">
                        View AI Report
                    </button>
                </div>
            </div>

            {/* Bills List */}
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Utility Item</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center font-bold text-gray-300 animate-pulse">Syncing financial data...</td>
                                </tr>
                            ) : filteredUtilities.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300 italic font-black">?</div>
                                        <h3 className="text-lg font-bold text-gray-900">No expense records</h3>
                                        <p className="text-sm text-gray-400 font-medium">Add your first utility bill to start tracking.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUtilities.map((bill) => {
                                    const category = categories.find(c => c.name === bill.category) || categories[0];
                                    return (
                                        <tr key={bill.id} className="hover:bg-gray-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl ${category.bg} ${category.color} flex items-center justify-center shadow-inner`}>
                                                        <category.icon size={22} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-cyan-700 transition-colors uppercase tracking-tight text-sm">{bill.title}</div>
                                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Ref: {bill.reference_number || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${category.bg} ${category.color}`}>
                                                    {bill.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                    <Calendar size={14} className="text-gray-300" />
                                                    {new Date(bill.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="font-black text-gray-900 text-lg">${parseFloat(bill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <button
                                                    onClick={() => toggleStatus(bill.id, bill.status)}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${bill.status === 'Paid'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'}
                                                    `}
                                                >
                                                    {bill.status === 'Paid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                    {bill.status}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUtility(bill.id)}
                                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Bill Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add Utility Bill</h2>
                                <p className="text-sm text-gray-500 font-medium">Log a new business expense.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUtility} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Bill Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold"
                                        placeholder="e.g. Monthly Electricity"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Amount</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Category</label>
                                        <select
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-cyan-500 transition-all"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Due Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-cyan-500 transition-all"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Reference #</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-cyan-500 transition-all"
                                            placeholder="Invoice ID"
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-sm">
                                Record Utility Bill
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UtilityManager;
