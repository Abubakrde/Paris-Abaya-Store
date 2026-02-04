import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Search, DollarSign, Package, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewSaleModal = ({ isOpen, onClose, onSaleComplete, session }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [customerId, setCustomerId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchCustomers();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSelectedProduct(null);
        setQuantity(1);
        setSearchTerm('');
        setCustomerName('Walk-in Customer');
        setCustomerId(null);
        setPaymentMethod('CASH');
        setPaymentStatus('Paid');
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, sku, price, stock, image_url')
                .gt('stock', 0) // Only show available products
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products for sale:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchTerm(''); // Clear search to show selection clearly
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (quantity > selectedProduct.stock) {
            alert(`Not enough stock! Only ${selectedProduct.stock} available.`);
            return;
        }

        setSubmitting(true);
        try {
            // Call the RPC function defined in schema_bills.sql
            const { data, error } = await supabase.rpc('process_sale', {
                p_product_id: selectedProduct.id,
                p_quantity: parseInt(quantity),
                p_seller_id: session?.user?.id,
                p_customer_name: customerName,
                p_payment_method: paymentMethod,
                p_customer_id: customerId,
                p_status: paymentStatus
            });

            if (error) throw error;

            onSaleComplete();
            onClose();
            alert('Sale recorded successfully!');
        } catch (error) {
            console.error('Sale error:', error);
            alert('Failed to process sale: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-all"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="text-red-600" size={24} />
                            New Sale
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Record a new transaction</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Step 1: Select Product */}
                    {!selectedProduct ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search product by name or SKU..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 mt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Available Products</p>
                                <div className="grid gap-2">
                                    {loading ? (
                                        <div className="text-center py-8 text-gray-400">Loading products...</div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">No products found.</div>
                                    ) : (
                                        filteredProducts.slice(0, 5).map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleProductSelect(product)}
                                                className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all text-left w-full group"
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 group-hover:shadow-md transition-all"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-red-700">{product.name}</h4>
                                                    <p className="text-xs text-gray-500 font-medium">{product.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">${product.price}</div>
                                                    <div className="text-xs text-gray-500">{product.stock} in stock</div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Sale Details */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <img
                                    src={selectedProduct.image_url}
                                    alt=""
                                    className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{selectedProduct.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{selectedProduct.sku}</p>
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-600">
                                        <Package size={12} />
                                        {selectedProduct.stock} Available
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline mt-1"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Customer Selection</label>
                                        <select
                                            value={customerId || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomerId(val || null);
                                                if (val) {
                                                    const cust = customers.find(c => c.id.toString() === val);
                                                    if (cust) setCustomerName(cust.name);
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-semibold outline-none"
                                        >
                                            <option value="">Guest (Manual Name)</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Customer Name</label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            disabled={!!customerId}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-semibold disabled:bg-gray-50 disabled:text-gray-400 outline-none"
                                            placeholder="Walk-in Customer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedProduct.stock}
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-lg text-center outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold outline-none"
                                        >
                                            <option value="CASH">CASH</option>
                                            <option value="DOLLAR">DOLLAR</option>
                                            <option value="ZAAD-USD">ZAAD-USD</option>
                                            <option value="ZAAD-SHL">ZAAD-SHL</option>
                                            <option value="EDAHAB-USD">EDAHAB-USD</option>
                                            <option value="EDAHAB-SHL">EDAHAB-SHL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Status</label>
                                        <select
                                            value={paymentStatus}
                                            onChange={(e) => setPaymentStatus(e.target.value)}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-sm outline-none ${paymentStatus === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}
                                        >
                                            <option value="Paid">PAID</option>
                                            <option value="Unpaid">UNPAID</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Total Price</label>
                                    <div className="w-full px-4 py-4 bg-red-50 border border-red-100 rounded-xl font-black text-2xl text-center text-red-700 flex items-center justify-center gap-1 shadow-inner">
                                        <DollarSign size={20} className="text-red-400" />
                                        {(selectedProduct.price * quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                                style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}
                            >
                                {submitting ? 'Processing...' : (
                                    <>
                                        <CheckCircle size={20} strokeWidth={2.5} />
                                        Complete Sale
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewSaleModal;
