import React, { useRef } from 'react';
import { X, Printer, Download, MapPin, Phone, Mail } from 'lucide-react';

const BillModal = ({ isOpen, onClose, sale }) => {
    const printRef = useRef();

    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;

        // Add printing styles
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * { visibility: hidden; }
                .print-section, .print-section * { visibility: visible; }
                .print-section { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);

        window.print();

        // Cleanup style after printing or cancelling
        document.head.removeChild(style);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-all"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Actions Header */}
                <div className="px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 no-print">
                    <h2 className="text-lg font-bold text-gray-900">Sale Receipt</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="p-12 overflow-y-auto custom-scrollbar print-section flex-1 bg-white">
                    <div className="flex flex-col gap-10">
                        {/* Receipt Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                        H
                                    </div>
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>HABRAAC</h1>
                                </div>
                                <div className="space-y-1 text-sm text-gray-500 font-medium">
                                    <p className="flex items-center gap-2"><MapPin size={14} /> 123 Business Ave, Commerce City</p>
                                    <p className="flex items-center gap-2"><Phone size={14} /> 0633825207</p>
                                    <p className="flex items-center gap-2"><Mail size={14} /> support@habraac.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Receipt</h2>
                                <p className="text-gray-500 font-bold text-sm">#SALE-{sale.id?.slice(0, 8).toUpperCase()}</p>
                                <div className="mt-4 inline-block px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-black uppercase tracking-widest">
                                    Paid
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 border-y border-gray-100 py-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Customer Details</p>
                                <p className="font-bold text-gray-900">{sale.profiles?.full_name || 'Guest Customer'}</p>
                                <p className="text-sm text-gray-500 mt-1">{sale.profiles?.email || 'No email provided'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Sale Date</p>
                                <p className="font-bold text-gray-900">{new Date(sale.sale_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                                <p className="text-sm text-gray-500 mt-1">{new Date(sale.sale_date).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-900 text-left">
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Description</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-6">
                                        <p className="font-bold text-gray-900">{sale.products?.name}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-1">SKU: {sale.products?.sku}</p>
                                    </td>
                                    <td className="py-6 text-center font-bold text-gray-600">x{sale.quantity}</td>
                                    <td className="py-6 text-right font-bold text-gray-600">${(sale.total_price / sale.quantity).toFixed(2)}</td>
                                    <td className="py-6 text-right font-black text-gray-900">${sale.total_price?.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="flex justify-end pt-6">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">Subtotal</span>
                                    <span className="text-gray-900 font-bold">${sale.total_price?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">Tax (0%)</span>
                                    <span className="text-gray-900 font-bold">$0.00</span>
                                </div>
                                <div className="h-px bg-gray-100 my-2" />
                                <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-2xl">
                                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Total Amount</span>
                                    <span className="text-xl font-black">${sale.total_price?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-16 text-center space-y-4 pt-10 border-t border-dashed border-gray-200">
                            <p className="text-sm font-bold text-gray-900 italic">"Thank you for choosing Habraac!"</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
                                If you have any questions regarding this receipt, please contact us at support@habraac.com.
                                Standard return policy applies within 30 days of purchase.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillModal;
