import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Mail, Save, LogOut, Shield, Key, X } from 'lucide-react';

const Settings = ({ session }) => {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (session) {
            setEmail(session.user.email);
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setFullName(data.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
                setAvatarUrl(data.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '');
            } else {
                setFullName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
                setAvatarUrl(session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {
                id: session.user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            alert('Profile updated successfully!');
            // Force reload to update header immediately if needed, or rely on state if passed up
            window.location.reload();
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) alert('Error signing out: ' + error.message);
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'ARE YOU ABSOLUTELY SURE? This will permanently delete your profile data. Sales records will be preserved but disconnected from your name. This action cannot be undone.'
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            // Delete profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', session.user.id);

            if (error) throw error;

            // Sign out
            await supabase.auth.signOut();
            alert('Your account has been deleted.');
        } catch (error) {
            alert('Error deleting account: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Account Settings
                    </h1>
                    <p className="text-gray-500 mt-2">Manage your personal profile and account preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar / Navigation within Settings could go here, for now just profile card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 p-6 border border-gray-100 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-blue-500 mx-auto">
                                <img
                                    src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full bg-white object-cover border-4 border-white"
                                />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-1">{fullName || 'User'}</h2>
                        <p className="text-sm text-gray-500 mb-4">{email}</p>

                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold inline-block uppercase tracking-wider">
                            {session.user.role === 'authenticated' ? 'Team Member' : 'Guest'}
                        </div>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 backdrop-blur-sm">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <User size={20} className="text-cyan-500" />
                                Profile Details
                            </h2>
                        </div>

                        <form onSubmit={updateProfile} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-cyan-500" size={18} />
                                    <input
                                        type="text"
                                        disabled
                                        value={email}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500 font-medium cursor-not-allowed"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Shield size={16} className="text-green-500" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2 pl-1 font-medium flex items-center gap-1">
                                    <Shield size={10} />
                                    This email is linked to your authentication provider.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-bold group-focus-within:text-cyan-500 transition-colors">Az</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-semibold text-gray-700 placeholder-gray-300 shadow-sm"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Avatar URL</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-bold group-focus-within:text-cyan-500 transition-colors">img</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-gray-600 placeholder-gray-300 shadow-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
                                >
                                    {loading ? (
                                        'Saving Changes...'
                                    ) : (
                                        <>
                                            <Save size={18} strokeWidth={2.5} />
                                            Save Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-red-100 overflow-hidden divide-y divide-gray-50">
                        <div className="px-8 py-6 border-b border-red-50 bg-red-50/30 backdrop-blur-sm">
                            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                <Shield size={20} className="text-red-500" />
                                Danger Zone
                            </h2>
                        </div>

                        <div className="p-8 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Sign Out</h3>
                                <p className="text-sm text-gray-500 mt-1">Safely sign out of your account on this device.</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>

                        <div className="p-8 flex items-center justify-between bg-red-50/10">
                            <div>
                                <h3 className="font-bold text-red-900">Delete Account</h3>
                                <p className="text-sm text-red-600/70 mt-1">Permanently remove your profile and personal data.</p>
                            </div>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                            >
                                <X size={18} />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
