import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users as UsersIcon, Search, Shield, User as UserIcon, Calendar, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfile {
    id: string;
    username: string;
    role: 'admin' | 'user';
    created_at: string;
}


interface UserWithEmail extends UserProfile {
    email?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserWithEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Fetch profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // Try to get emails from auth.users via a backend call or RPC
            // Since we can't access auth.users directly from the client,
            // we'll use the email from the profiles if available, or show username
            const usersWithEmail: UserWithEmail[] = (profiles || []).map((profile: UserProfile) => ({
                ...profile,
                email: undefined, // Will be populated if we have access
            }));

            setUsers(usersWithEmail);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const stats = [
        {
            label: 'Total Users',
            value: users.length,
            icon: UsersIcon,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
        },
        {
            label: 'Admins',
            value: users.filter(u => u.role === 'admin').length,
            icon: Shield,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
        },
        {
            label: 'Regular Users',
            value: users.filter(u => u.role === 'user').length,
            icon: UserIcon,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
        },
    ];

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                        <UsersIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Registered Users</h1>
                </div>
                <p className="text-slate-400">View and manage all registered users.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className={`bg-white/5 backdrop-blur-sm overflow-hidden rounded-2xl border ${stat.border} p-6`}
                    >
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 rounded-xl p-3 ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">{stat.label}</dt>
                                    <dd>
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <UsersIcon className="h-5 w-5 mr-2 text-slate-400" />
                        All Users
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Role Filter */}
                        <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1 border border-white/10">
                            {(['all', 'admin', 'user'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${roleFilter === role
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="bg-slate-900/50 border border-white/10 text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 placeholder-slate-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    User ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, i) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${user.role === 'admin'
                                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                                    }`}>
                                                    {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">
                                                        {user.username || 'Unknown'}
                                                    </span>
                                                    {user.email && (
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.role === 'admin'
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                                {user.role === 'user' && <UserIcon className="h-3 w-3 mr-1" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(user.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                                {user.id.substring(0, 8)}...
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with count */}
                <div className="px-6 py-4 border-t border-white/5 text-sm text-slate-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>
        </div>
    );
}
