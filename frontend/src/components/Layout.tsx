import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Home, PlusCircle, Trophy, User as UserIcon, LayoutDashboard, Menu, X, BarChart3 } from 'lucide-react';

export default function Layout() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Home', path: '/', icon: Home, roles: ['user', 'admin'] },
        { name: 'Leaderboard', path: '/leaderboard', icon: BarChart3, roles: ['user', 'admin'] },
        { name: 'My Results', path: '/history', icon: Trophy, roles: ['user', 'admin'] },
    ];

    if (profile?.role === 'admin') {
        navItems.push(
            { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin'] },
            { name: 'Create Quiz', path: '/admin/create-quiz', icon: PlusCircle, roles: ['admin'] }
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shadow-2xl
      `}>
                <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
                    <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        QuizApp
                    </span>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center space-x-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                            <p className="text-xs text-indigo-300 capitalize font-medium">{profile?.role || 'Guest'}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            <item.icon className={`h-5 w-5 mr-3 transition-colors ${({ isActive }: { isActive: boolean }) => isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'
                                }`} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3.5 text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium group"
                    >
                        <LogOut className="h-5 w-5 mr-3 group-hover:text-red-300" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Mobile Header */}
                <header className="lg:hidden h-16 flex items-center px-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-400 hover:text-white focus:outline-none transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-4 text-lg font-bold text-white">QuizApp</span>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
