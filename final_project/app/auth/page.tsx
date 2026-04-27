'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(true);
                setEmail(session.user.email || '');
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
        setMessage('Processing...');
        const { data, error } = type === 'LOGIN'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) {
            setMessage(error.message);
        } else {
            if (type === 'SIGNUP') {
                setMessage('Account created! Check your email to verify.');
            } else {
                setIsLoggedIn(true);
                // Optional: You can still redirect to dashboard here if you want
                // router.push('/dashboard'); 
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMessage('Successfully logged out.');
    };

    if (loading) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

                {/* Brand Side */}
                <div className="text-center lg:text-left lg:w-1/2">
                    <h1 className="text-6xl lg:text-7xl font-extrabold text-purple-600 tracking-tighter mb-4">
                        vibe.
                    </h1>
                    <p className="text-2xl lg:text-3xl text-gray-300 font-medium leading-tight">
                        Connect with the world in <span className="text-purple-500">ultra-violet</span>.
                    </p>
                </div>

                {/* Card Side */}
                <div className="w-full max-w-[400px]">
                    {isLoggedIn ? (
                        /* LOGGED IN VIEW */
                        <div className="bg-[#121212] p-8 rounded-2xl shadow-2xl border border-purple-500/30 text-center animate-in fade-in zoom-in duration-300">
                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
                                Welcome back
                            </h2>
                            <p className="mb-8 text-gray-400 text-sm">
                                You are signed in as: <br />
                                <span className="text-purple-300 font-mono">{email}</span>
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-purple-900/20"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 py-3 rounded-lg font-bold transition-all"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* LOGGED OUT VIEW (The Form) */
                        <div className="bg-[#121212] p-5 rounded-xl shadow-2xl border border-white/5 animate-in fade-in slide-in-from-right duration-500">
                            <div className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full p-4 bg-[#1e1e1e] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-gray-500"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full p-4 bg-[#1e1e1e] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-gray-500"
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <button
                                    onClick={() => handleAuth('LOGIN')}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-xl font-bold transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    Log In
                                </button>

                                <div className="text-center border-b border-gray-800 pb-6">
                                    <a href="#" className="text-purple-500 text-sm hover:underline">Forgotten password?</a>
                                </div>

                                <div className="pt-2 flex justify-center">
                                    <button
                                        onClick={() => handleAuth('SIGNUP')}
                                        className="bg-[#2c2c2c] hover:bg-[#3d3d3d] text-white px-6 py-3 rounded-lg font-bold text-md transition-all border border-purple-500/20"
                                    >
                                        Create new account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {message && (
                        <p className={`mt-6 text-center text-sm font-medium ${message.includes('success') || message.includes('Account') || message.includes('out') ? 'text-green-400' : 'text-red-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}