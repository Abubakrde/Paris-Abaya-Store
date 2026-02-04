import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Phone, Mail, MapPin, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name');
            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(formData)
                    .eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([formData]);
                if (error) throw error;
            }
            fetchCustomers();
            closeModal();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchCustomers();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Customer Database</h1>
                    <p className="text-gray-500 font-medium">Manage your relationships and client profiles.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}
                >
                    <Plus size={20} strokeWidth={3} />
                    Add Customer
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                {/* Search Bar */}
                <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center p-12 text-gray-400 font-bold">
                            Searching client records...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[2rem] text-center">
                            <User size={48} className="text-gray-200 mb-4" />
                            <p className="text-lg font-bold text-gray-900">No customers found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search or add a new customer.</p>
                        </div>
                    ) : (
                        filteredCustomers.map((customer) => (
                            <div key={customer.id} className="group p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-gray-200/50 transition-all hover:-translate-y-1 relative">
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(customer)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-700 transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-4">
                                    <User size={24} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-4">{customer.name}</h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                        <Phone size={14} className="text-gray-300" />
                                        {customer.phone || 'No phone'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                        <Mail size={14} className="text-gray-300" />
                                        {customer.email || 'No email'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                        <MapPin size={14} className="text-gray-300" />
                                        <span className="truncate">{customer.address || 'No address'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in-95">
                        <h2 className="text-2xl font-black text-gray-900 mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {editingCustomer ? 'Edit Profile' : 'New Customer'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-gray-900"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-gray-900"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+252..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-gray-900"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Address</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-gray-900 resize-none"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter physical address..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl text-white font-black shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-1 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}
                                >
                                    {editingCustomer ? 'Update Profile' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManager;
