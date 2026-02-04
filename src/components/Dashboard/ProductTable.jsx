
import React, { useState } from 'react';
import { Edit2, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ProductTable = ({ activeTab, refreshTrigger, searchQuery, onEdit, userRole }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const pageSize = 8;

    React.useEffect(() => {
        fetchProducts();
    }, [refreshTrigger, activeTab, searchQuery, page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' });

            // Search Filter
            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
            }

            // Tab Filter
            if (activeTab === 'In Stock') {
                query = query.gt('stock', 0);
            } else if (activeTab === 'Low Stock') {
                query = query.lt('stock', 20).gt('stock', 0);
            } else if (activeTab === 'Out of Stock') {
                query = query.eq('stock', 0);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await query
                .order('id', { ascending: true })
                .range(from, to);

            if (error) throw error;
            setProducts(data);
            if (count !== null) {
                setTotalCount(count);
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
            if (error) throw error;
            fetchProducts();
            setDeleteModalOpen(false);
            setProductToDelete(null);
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    };

    const handleQuickStock = async (product, amount) => {
        const newStock = Math.max(0, product.stock + amount);
        const newStatus = newStock === 0 ? 'Out of Stock' : (newStock < 20 ? 'Low Stock' : 'In Stock');

        try {
            const { error } = await supabase
                .from('products')
                .update({
                    stock: newStock,
                    status: newStatus
                })
                .eq('id', product.id);

            if (error) throw error;
            fetchProducts();
        } catch (error) {
            alert('Error updating stock: ' + error.message);
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Stock': return '#e6f7eb'; // light green bg
            case 'Low Stock': return '#fff4e5'; // light orange bg
            case 'Out of Stock': return '#ffebee'; // light red bg
            default: return '#eee';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'In Stock': return '#2e7d32';
            case 'Low Stock': return '#ed6c02';
            case 'Out of Stock': return '#d32f2f';
            default: return '#666';
        }
    };

    const getProgressColor = (stock, capacity) => {
        const percentage = (stock / capacity) * 100;
        if (stock === 0) return '#d32f2f';
        if (percentage < 20) return '#ed6c02';
        return '#00bcd4';
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}>
            {/* Table Header Controls */}
            <div className="p-4 flex gap-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium"
                    style={{ borderColor: 'var(--color-border)' }}>
                    Filter By Category
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium"
                    style={{ borderColor: 'var(--color-border)' }}>
                    Sort: Latest
                </button>
                <div className="ml-auto text-sm text-gray-500 flex items-center">
                    Showing {products.length} of {totalCount} products
                </div>
            </div>

            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead className="bg-gray-50" style={{ background: '#f9fafb' }}>
                    <tr style={{ fontSize: 12, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>
                        <th className="px-6 py-4 font-semibold">Product Name</th>
                        <th className="px-6 py-4 font-semibold">SKU</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Price</th>
                        <th className="px-6 py-4 font-semibold">Stock Level</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: 14 }}>
                    {products.map((product) => (
                        <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: '#f3f4f6' }}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={product.image_url}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shadow-sm"
                                        style={{ width: 40, height: 40 }}
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.collection}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-cyan-600" style={{ color: 'var(--color-primary)' }}>
                                {product.sku}
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                    {product.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                                ${product.price}
                            </td>
                            <td className="px-6 py-4 w-48">
                                <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: getProgressColor(product.stock, product.capacity), fontWeight: 700 }}>
                                        {Math.round((product.stock / product.capacity) * 100)}%
                                    </span>
                                    <span className="text-gray-500">{product.stock} pcs</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(product.stock / product.capacity) * 100}% `,
                                            backgroundColor: getProgressColor(product.stock, product.capacity)
                                        }}
                                    />
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span
                                    className="px-2.5 py-1 rounded-md text-xs font-semibold"
                                    style={{
                                        backgroundColor: getStatusColor(product.status),
                                        color: getStatusTextColor(product.status)
                                    }}
                                >
                                    {product.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleQuickStock(product, 10)}
                                        className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                                        title="Quick Add +10"
                                    >
                                        <PlusCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleQuickStock(product, -10)}
                                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                        title="Quick Reduce -10"
                                    >
                                        <MinusCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => onEdit && onEdit(product)}
                                        className="p-1 px-1 text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() => handleDeleteClick(product)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Delete (Admin Only)"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 disabled:opacity-50"
                    style={{ borderColor: '#e5e7eb' }}
                >
                    Previous
                </button>
                <div className="flex gap-2 text-sm">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg font-medium transition-colors ${page === p ? 'bg-cyan-500 text-white' : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            style={{
                                background: page === p ? 'var(--color-primary)' : 'transparent',
                                color: page === p ? 'white' : 'inherit'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 flex items-center gap-1 disabled:opacity-50"
                    style={{ borderColor: '#e5e7eb' }}
                >
                    Next
                </button>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={productToDelete?.name}
            />
        </div>
    );
};

export default ProductTable;
