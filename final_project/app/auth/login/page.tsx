"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    // Check if user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        checkUser();
    }, []);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else window.location.reload(); // Refresh to show Logged-In View
    };

    const handleSignUp = async (e: any) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert(error.message);
        else alert("Check your email for confirmation!");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push('/');
    };

    // 3. Optional Logged-In View [cite: 55, 56]
    if (user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2> {/* [cite: 57] */}
                    <p className="text-slate-600 mb-6">Logged in as: {user.email}</p> {/* [cite: 58] */}
                    <div className="flex gap-4">
                        <button onClick={() => router.push('/dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Go to Dashboard</button>
                        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg">Logout</button> {/* [cite: 59] */}
                    </div>
                </div>
            </div>
        );
    }

    // 2. Login/Sign-Up Page View [cite: 47, 48]
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <form className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-4">
                <h2 className="text-xl font-bold text-center">Machine Learning Hub Auth</h2>
                <input
                    type="email"
                    placeholder="Email" // [cite: 49]
                    className="w-full p-3 border rounded-xl"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password" // [cite: 50]
                    className="w-full p-3 border rounded-xl"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex gap-2">
                    <button onClick={handleLogin} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Login</button> {/* [cite: 52] */}
                    <button onClick={handleSignUp} className="flex-1 bg-slate-200 py-2 rounded-lg font-bold">Sign Up</button> {/* [cite: 51] */}
                </div>
            </form>
        </div>
    );
}