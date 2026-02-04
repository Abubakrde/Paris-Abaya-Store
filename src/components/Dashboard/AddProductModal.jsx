import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AddProductModal = ({ isOpen, onClose, onProductAdded, productToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        collection: '',
        price: '',
        stock: '',
        capacity: '100',
        status: 'In Stock',
        image_url: '',
        description: '',
        sizes: ['Standard']
    });

    const [categories, setCategories] = useState([]);

    React.useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('name').order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    React.useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                sku: productToEdit.sku,
                category: productToEdit.category,
                collection: productToEdit.collection || '',
                price: productToEdit.price,
                stock: productToEdit.stock,
                capacity: productToEdit.capacity || 100,
                status: productToEdit.status,
                image_url: productToEdit.image_url || '',
                description: productToEdit.description || '',
                sizes: productToEdit.sizes || ['Standard']
            });
            setPreviewUrl(productToEdit.image_url || '');
        } else {
            setFormData({
                name: '',
                sku: '',
                category: '',
                collection: '',
                price: '',
                stock: '',
                capacity: '100',
                status: 'In Stock',
                image_url: '',
                description: '',
                sizes: ['Standard']
            });
            setPreviewUrl('');
        }
        setSelectedFile(null);
    }, [productToEdit, isOpen]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleFile = (file) => {
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File size must be less than 2MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image_url;

            if (selectedFile) {
                imageUrl = await uploadImage(selectedFile);
            } else if (!imageUrl) {
                imageUrl = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=100&h=100';
            }

            const productData = {
                name: formData.name,
                sku: formData.sku,
                category: formData.category,
                collection: formData.collection,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                capacity: parseInt(formData.capacity),
                status: parseInt(formData.stock) === 0 ? 'Out of Stock' : (parseInt(formData.stock) < 20 ? 'Low Stock' : 'In Stock'),
                image_url: imageUrl,
                description: formData.description,
                sizes: formData.sizes
            };

            let error;
            if (productToEdit) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([productData]);
                error = insertError;
            }

            if (error) throw error;

            onProductAdded();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-gray-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {productToEdit ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 font-medium">
                            {productToEdit ? 'Update details below.' : 'Create a new inventory item.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all duration-300 hover:rotate-90"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <form id="productForm" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-gray-50/50">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Image */}
                            <div className="md:col-span-1">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Product Image</label>
                                <div
                                    className={`aspect-square rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group relative overflow-hidden bg-white shadow-sm
                                        ${isDragging ? 'border-cyan-500 bg-cyan-50/30 scale-[1.02]' : 'border-gray-200 hover:border-cyan-400 hover:shadow-md'}
                                    `}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <Upload size={20} className="text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </div>
                            </div>

                            {/* Right Column: Basic Info */}
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 transition-all font-semibold outline-none shadow-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Premium Silk Abaya"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">SKU</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 transition-all font-mono text-sm outline-none shadow-sm"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                            placeholder="SKU-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Category</label>
                                        <select
                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 outline-none shadow-sm font-semibold"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rich Details */}
                        <div className="mt-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Description</label>
                                <textarea
                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 transition-all font-medium outline-none shadow-sm resize-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell the story of this piece..."
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Sizes</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Standard', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => {
                                                const newSizes = formData.sizes.includes(size)
                                                    ? formData.sizes.filter(s => s !== size)
                                                    : [...formData.sizes, size];
                                                setFormData({ ...formData, sizes: newSizes.length > 0 ? newSizes : ['Standard'] });
                                            }}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.sizes.includes(size)
                                                    ? 'bg-red-800 text-white shadow-lg'
                                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-red-200'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Price ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 outline-none shadow-sm font-bold text-lg"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Current Stock</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-cyan-500 outline-none shadow-sm font-bold text-lg"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest">Cancel</button>
                    <button
                        form="productForm"
                        disabled={loading}
                        className="px-10 py-3 bg-red-800 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-red-700 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : (productToEdit ? 'Update Product' : 'Create Product')}
                        <Check size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;
