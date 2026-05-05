'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const router = useRouter();
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [accountType, setAccountType] = useState<'user' | 'admin'>('user');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const isInvalidRefreshError = (error: any) =>
        typeof error?.message === 'string' && /refresh token/i.test(error.message);

    const handleInvalidSession = async (error?: any) => {
        console.warn('Invalid refresh token detected:', error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMessage('Session expired. Please log in again.');
        setLoading(false);
        router.push('/auth');
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                const session = data?.session;
                if (session) {
                    setIsLoggedIn(true);
                    setEmail(session.user.email || '');
                }
            } catch (error: any) {
                if (isInvalidRefreshError(error)) {
                    await handleInvalidSession(error);
                    return;
                }
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setIsLoggedIn(true);
                setEmail(session.user.email || '');
            } else {
                setIsLoggedIn(false);
            }
        });

        checkUser();

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
        if (processing) return;
        setProcessing(true);
        setMessage('Processing...');

        if (type === 'LOGIN') {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            setProcessing(false);

            if (error) {
                setMessage(error.message);
                return;
            }

            if (data.user) {
                setIsLoggedIn(true);
                setMessage(`Login successful as ${accountType === 'admin' ? 'Admin' : 'User'}.`);
                router.push('/dashboard');
            } else {
                setMessage('Login successful.');
            }
            return;
        }

        if (!username.trim()) {
            setMessage('Please enter a username for registration.');
            setProcessing(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setProcessing(false);
            setMessage(error.message);
            return;
        }

        const user = data.user;
        if (!user) {
            setProcessing(false);
            setMessage('Account created! Check your email to verify your address.');
            return;
        }

        try {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: user.id,
                full_name: username.trim(),
                email,
                is_admin: accountType === 'admin',
                role: accountType === 'admin' ? 'admin' : 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            if (profileError) {
                console.warn('Profile creation failed:', profileError.message);
            }
        } catch (err) {
            console.warn('Profile creation error:', err);
        }

        setProcessing(false);
        setMessage('Account created! Check your email to verify.');
        setAuthMode('LOGIN');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMessage('Successfully logged out.');
    };

    if (loading) return <div className="min-h-screen bg-[#050505]" />;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.2),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.12),_transparent_20%)] pointer-events-none" />
            <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="absolute left-0 bottom-24 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-12 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="lg:w-1/2">
                    <span className="inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-purple-200 shadow-sm shadow-purple-500/10">
                        Welcome to vibe
                    </span>
                    <h1 className="mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                        Create, connect, and collaborate with a modern AI workspace.
                    </h1>
                    <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                        A seamless login and registration experience for users and admins, complete with rich role controls and a polished design that feels premium.
                    </p>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-50px_rgba(255,255,255,0.24)] backdrop-blur-xl">
                            <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Faster onboarding</p>
                            <p className="mt-4 text-sm text-slate-300">Create accounts quickly and get straight to your dashboard.</p>
                        </div>
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-50px_rgba(255,255,255,0.24)] backdrop-blur-xl">
                            <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Admin ready</p>
                            <p className="mt-4 text-sm text-slate-300">Switch between user and admin flows with one tap.</p>
                        </div>
                    </div>
                </div>

                <div className="lg:w-[420px]">
                    <div className="rounded-[2rem] border border-white/10 bg-[#111111]/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.35em] text-purple-300">{isLoggedIn ? 'Account ready' : 'Sign in / Register'}</p>
                                <h2 className="mt-3 text-3xl font-black text-white">{isLoggedIn ? 'Welcome back' : 'Access your vibe'}</h2>
                            </div>
                            <div className="rounded-3xl bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.35em] text-slate-200">{accountType === 'admin' ? 'Admin mode' : 'User mode'}</div>
                        </div>

                        {isLoggedIn ? (
                            <div className="mt-8 space-y-4 text-center">
                                <p className="text-sm text-slate-300">You are signed in as</p>
                                <p className="text-lg font-semibold text-white">{email}</p>
                                <div className="grid gap-3 pt-6">
                                    <button onClick={() => router.push('/dashboard')} className="rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400">
                                        Go to Dashboard
                                    </button>
                                    <button onClick={handleLogout} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-purple-200 transition hover:bg-white/10">
                                        Log out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-4">
                                <div className="grid grid-cols-2 rounded-3xl bg-white/5 p-1 text-xs font-black uppercase tracking-[0.35em] text-slate-300">
                                    <button onClick={() => setAuthMode('LOGIN')} className={`rounded-3xl px-4 py-3 transition ${authMode === 'LOGIN' ? 'bg-purple-500 text-white' : 'hover:bg-white/10'}`}>
                                        Login
                                    </button>
                                    <button onClick={() => setAuthMode('REGISTER')} className={`rounded-3xl px-4 py-3 transition ${authMode === 'REGISTER' ? 'bg-purple-500 text-white' : 'hover:bg-white/10'}`}>
                                        Register
                                    </button>
                                </div>

                                {authMode === 'REGISTER' && (
                                    <label className="block text-sm text-slate-300">
                                        Username
                                        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your display name" className="mt-2 w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-purple-500/50" />
                                    </label>
                                )}

                                <label className="block text-sm text-slate-300">
                                    Email
                                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-2 w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-purple-500/50" />
                                </label>

                                <label className="block text-sm text-slate-300">
                                    Password
                                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="mt-2 w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-purple-500/50" />
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setAccountType('user')} className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${accountType === 'user' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                                        User
                                    </button>
                                    <button onClick={() => setAccountType('admin')} className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${accountType === 'admin' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                                        Admin
                                    </button>
                                </div>

                                <button onClick={() => handleAuth(authMode === 'LOGIN' ? 'LOGIN' : 'SIGNUP')} disabled={processing} className="mt-4 w-full rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-purple-500/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
                                    {processing ? 'Processing...' : authMode === 'LOGIN' ? 'Log In' : 'Create account'}
                                </button>

                                <div className="text-center pt-4 text-sm text-slate-400">
                                    {authMode === 'LOGIN' ? (
                                        <button onClick={() => setAuthMode('REGISTER')} className="font-semibold text-purple-300 hover:text-purple-100">Don’t have an account? Register</button>
                                    ) : (
                                        <button onClick={() => setAuthMode('LOGIN')} className="font-semibold text-purple-300 hover:text-purple-100">Already have an account? Login</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {message && (
                            <p className={`mt-6 text-center text-sm font-medium ${message.toLowerCase().includes('success') || message.toLowerCase().includes('created') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
