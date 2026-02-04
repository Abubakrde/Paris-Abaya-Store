import React, { useState } from 'react';
import {
    Search, Phone, Video, Info, Send,
    MoreHorizontal, Smile, Paperclip,
    CheckCheck, UserPlus, Image as ImageIcon,
    Hash, Circle, MessageCircle
} from 'lucide-react';

const Messages = ({ session }) => {
    const [activeChat, setActiveChat] = useState(0);
    const [message, setMessage] = useState('');

    const chats = [
        { id: 1, name: "General Team", lastMsg: "System update scheduled for 2AM", time: "11:24 AM", unread: 2, online: true, type: 'channel' },
        { id: 2, name: "Admin Group", lastMsg: "Did the inventory stats sync?", time: "10:15 AM", unread: 0, online: true, type: 'group' },
        { id: 3, name: "Sarah (Sales)", lastMsg: "Customer requested a receipt", time: "Yesterday", unread: 0, online: false, type: 'direct' },
        { id: 4, name: "Mark (Lead)", lastMsg: "New categorical rollout tonight", time: "Monday", unread: 0, online: true, type: 'direct' },
        { id: 5, name: "Inventory Alerts", lastMsg: "Restock: MacBook Pro M2 (Low)", time: "2h ago", unread: 5, online: true, type: 'system' }
    ];

    const currentChat = chats[activeChat];

    return (
        <div className="flex h-[calc(100vh-160px)] bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 shrink-0">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Messages</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1 pb-6">
                    {chats.map((chat, i) => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveChat(i)}
                            className={`w-full p-4 rounded-2xl flex items-start gap-3 transition-all ${activeChat === i ? 'bg-white shadow-md shadow-gray-200/50' : 'hover:bg-gray-100/50'}`}
                        >
                            <div className="relative shrink-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold
                                    ${chat.type === 'channel' ? 'bg-gradient-to-br from-cyan-400 to-cyan-600' :
                                        chat.type === 'group' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' :
                                            chat.type === 'system' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gray-200'}
                                `}>
                                    {chat.type === 'channel' && <Hash size={20} />}
                                    {chat.type === 'group' && <UserPlus size={20} />}
                                    {chat.type === 'system' && <Info size={20} />}
                                    {chat.type === 'direct' && <div className="w-full h-full rounded-xl bg-gray-300" />}
                                </div>
                                {chat.online && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-50 group-hover:border-white transition-colors" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap ml-2">{chat.time}</span>
                                </div>
                                <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>{chat.lastMsg}</p>
                                {chat.unread > 0 && (
                                    <div className="mt-2 inline-flex items-center justify-center bg-cyan-500 text-white min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black">
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs
                            ${currentChat.type === 'channel' ? 'bg-cyan-500' : currentChat.type === 'group' ? 'bg-indigo-500' : 'bg-amber-500'}
                        `}>
                            {currentChat.type === 'channel' && <Hash size={16} />}
                            {currentChat.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{currentChat.name}</h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Circle size={8} fill={currentChat.online ? '#22c55e' : '#cbd5e1'} stroke="none" />
                                {currentChat.online ? 'Active Now' : 'Last seen 2h ago'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all">
                            <Phone size={20} />
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all">
                            <Video size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-100 mx-2" />
                        <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                            <Info size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-gray-50/20">
                    <div className="text-center">
                        <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</span>
                    </div>

                    {/* Someone else's message */}
                    <div className="flex items-start gap-4 max-w-2xl">
                        <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                        <div className="space-y-2">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm font-medium text-gray-700 leading-relaxed">
                                {currentChat.lastMsg} Any updates on the inventory shipment?
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Sarah • 11:24 AM</span>
                        </div>
                    </div>

                    {/* System message */}
                    <div className="flex items-center gap-4 bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100 text-cyan-700 max-w-lg mx-auto">
                        <Info size={20} className="shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">Habraac System: A new sale (ID: #4A2B) has been processed. Stock levels updated.</p>
                    </div>

                    {/* Own message */}
                    <div className="flex flex-row-reverse items-start gap-4 max-w-2xl ml-auto">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center text-white font-black text-xs shrink-0">Y</div>
                        <div className="space-y-2 flex flex-col items-end">
                            <div className="bg-gray-900 text-white p-4 rounded-2xl rounded-tr-none shadow-xl text-sm font-medium leading-relaxed">
                                I'm reviewing the analytics now. We should see the MacBook shipment arrive by tomorrow morning. I'll post the bill records then. 🚀
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mr-1">
                                11:45 AM • <CheckCheck size={12} className="text-cyan-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <button className="p-3 text-gray-400 hover:text-cyan-600 transition-all">
                            <Paperclip size={20} />
                        </button>
                        <button className="p-3 text-gray-400 hover:text-cyan-600 transition-all">
                            <ImageIcon size={20} />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-cyan-500 transition-all">
                                <Smile size={20} />
                            </button>
                        </div>
                        <button className={`p-4 bg-gray-900 text-white rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 ${!message && 'opacity-50'}`}>
                            <Send size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel Placeholder */}
            <div className="hidden xl:flex w-72 border-l border-gray-100 flex-col bg-gray-50/10 p-8 space-y-8">
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Pinned Items</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <MessageCircle size={18} className="text-cyan-500" />
                            <span className="text-xs font-bold text-gray-700">Q3 Sales Target.pdf</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 text-cyan-600">
                            <CheckCheck size={18} />
                            <span className="text-xs font-bold text-gray-700">Inventory Sync OK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;
