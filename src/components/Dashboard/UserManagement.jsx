import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Shield, Search, Plus, X, Check, Lock, Mail } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add User Modal State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'sales' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user profile?')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user: ' + error.message);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            // NOTE: Client-side user creation without logging out the admin is limited.
            // In a real production app, this should call a generic "Invite User" Edge Function.
            // For this demo, we will try to insert a profile stub. 
            // If we used supabase.auth.signUp() here, it would log the 'Admin' out and log the 'New User' in.

            // Validation
            if (!newUser.email || !newUser.password) {
                alert("Email and Password are required.");
                setCreating(false);
                return;
            }

            // IMPORTANT: This demonstration assumes we can't create Auth users client-side without session loss.
            // We'll show an alert explaining this limitation for a pure client-side demo, 
            // OR we could try to create a profile entry that waits for the user to sign up.

            alert("Note: To create a fully functional user with login capabilities, you would typically use a server-side Admin API to avoid logging out the current administrator.\n\nFor this UI demo, we will verify the inputs are valid.");

            // Reset and close
            setIsAddUserOpen(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'sales' });

        } catch (error) {
            alert('Error creating user: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-8 text-gray-400">Loading users...</div>;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500">Manage user access and roles.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-sm transition-all text-sm"
                        />
                    </div>

                    <button
                        onClick={() => setIsAddUserOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                                alt=""
                                                className="w-10 h-10 rounded-full bg-gray-100 object-cover border-2 border-white shadow-sm"
                                            />
                                            <span className="font-semibold text-gray-900">{user.full_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 font-medium text-sm">{user.email}</td>
                                    <td className="py-4 px-6">
                                        <select
                                            value={user.role || 'sales'}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${user.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100 focus:ring-purple-500 hover:bg-purple-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100 focus:ring-blue-500 hover:bg-blue-100'
                                                }`}
                                        >
                                            <option value="sales">Sales</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-4 px-6 text-gray-400 text-sm font-medium">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <User size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">No users found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-all"
                        onClick={() => setIsAddUserOpen(false)}
                    />
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                            <button
                                onClick={() => setIsAddUserOpen(false)}
                                className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-semibold text-gray-700"
                                        placeholder="John Doe"
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-semibold text-gray-700"
                                        placeholder="john@example.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Temporary Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="password"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-semibold text-gray-700"
                                        placeholder="••••••••"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'sales' })}
                                        className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${newUser.role === 'sales'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        Sales
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                                        className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${newUser.role === 'admin'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <Shield size={16} />
                                        Admin
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4"
                            >
                                {creating ? 'Creating User...' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
