import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowRight, Zap } from 'lucide-react';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Append dummy domain - handle spaces for email validity
        const cleanUsername = username.trim().replace(/\s+/g, '');
        const email = `${cleanUsername}@quizapp.local`;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username, // Store original username in metadata
                }
            }
        });

        if (error) {
            if (error.message.includes('rate limit')) {
                setError('Too many attempts. Please wait a minute or try a different username.');
            } else {
                setError(error.message);
            }
        } else {
            // Typically user needs to confirm email, but for dev we might disable it or just show message
            setError('Registration successful! Check Supabase if confirmation is required.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-sm" />

                <div className="relative z-10 max-w-xl text-center">
                    <div className="mb-8 inline-flex p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-pulse">
                        <Zap className="w-12 h-12 text-yellow-400" />
                    </div>
                    <h1 className="text-5xl font-bold mb-6 text-white tracking-tight">
                        Join the Revolution
                    </h1>
                    <p className="text-xl text-purple-200 leading-relaxed">
                        Create an account today and start your journey to mastery. Compete with friends and track your progress.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[100px]" />
                    <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px]" />
                </div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="text-center lg:text-left">
                        <div className="mx-auto lg:mx-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 mb-6">
                            <UserPlus className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">
                            Create Account
                        </h2>
                        <p className="mt-2 text-slate-400">
                            Get started in seconds
                        </p>
                    </div>

                    {error && (
                        <div className={`p-4 rounded-xl text-sm text-center flex items-center justify-center gap-2 border ${error.includes('successful') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-xl shadow-lg shadow-purple-600/20 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
