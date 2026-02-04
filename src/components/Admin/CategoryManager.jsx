import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Folder, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name: formData.name.toUpperCase() })
                    .eq('id', editingCategory.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{ name: formData.name.toUpperCase() }]);
                if (error) throw error;
            }

            fetchCategories();
            closeModal();
            alert(editingCategory ? 'Category updated!' : 'Category added!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (category) => {
        if (!confirm(`Are you sure? Products in "${category.name}" will be moved to "UNCATEGORIZED" to prevent errors.`)) return;

        try {
            // 1. Ensure an 'UNCATEGORIZED' category exists to catch orphaned products
            const { data: existingUncat } = await supabase
                .from('categories')
                .select('name')
                .eq('name', 'UNCATEGORIZED')
                .single();

            if (!existingUncat) {
                await supabase.from('categories').insert([{ name: 'UNCATEGORIZED' }]);
            }

            // 2. Move products to 'UNCATEGORIZED'
            const { error: updateError } = await supabase
                .from('products')
                .update({ category: 'UNCATEGORIZED' })
                .eq('category', category.name);

            if (updateError) throw updateError;

            // 3. Delete the category
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);

            if (deleteError) throw deleteError;
            fetchCategories();
        } catch (error) {
            console.error('Deletion error:', error);
            alert('Error deleting category. TIP: Ensure you have run the SQL fix to make the product category column nullable.');
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setIsAddModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '' });
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Categories
                    </h1>
                    <p className="text-gray-500 mt-1">Manage product categories.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={20} strokeWidth={3} />
                    Add Category
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex-1 max-w-4xl">
                <div className="p-6 border-b border-gray-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Sort Order</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="px-8 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr><td colSpan="3" className="px-8 py-8 text-center text-gray-400">No categories found.</td></tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                                    <Folder size={16} />
                                                </div>
                                                <span className="font-bold text-gray-900">{category.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm text-gray-500">-</td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(category)}
                                                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
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

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. SUMMER2026"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
