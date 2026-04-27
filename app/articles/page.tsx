"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
export const dynamic = 'force-dynamic'; // This tells Vercel to skip static generation and wait for the browser

export default function ArticlesPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) console.error("Error fetching library:", error.message);
            if (data) setArticles(data);
            setLoading(false);
        };
        fetchAll();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">

                {/* NAVIGATION */}
                <Link href="/dashboard" className="flex items-center gap-2 text-purple-500 hover:text-purple-400 mb-8 transition-all group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Back to Dashboard</span>
                </Link>

                <header className="mb-12">
                    <h1 className="text-6xl font-black tracking-tighter mb-2 italic">
                        RESEARCH <span className="text-purple-600">LIBRARY</span>
                    </h1>
                    <p className="text-gray-500 font-medium tracking-wide">
                        Explore the full archive of Machine Learning documentation.
                    </p>
                </header>

                {/* LOADING STATE */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-purple-900">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Database...</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {articles.length > 0 ? (
                            articles.map((art) => (
                                /* THE FIX: Using string interpolation for the ID */
                                <Link key={art.id} href={`/articles/${art.id.toString()}`} className="block">
                                    <div className="group p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-purple-500/50 hover:bg-[#0f0f0f] transition-all flex justify-between items-center cursor-pointer shadow-2xl">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                <h3 className="text-xl font-bold group-hover:text-purple-400 transition-colors">
                                                    {art.title}
                                                </h3>
                                            </div>
                                            <p className="text-gray-500 text-sm line-clamp-1 font-medium">
                                                {art.content || "No preview available for this research log."}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-gray-800 group-hover:text-purple-500 group-hover:translate-x-2 transition-all flex-shrink-0" size={24} />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                                <p className="text-gray-600 uppercase text-[10px] font-black tracking-widest">No Articles Found In Archive</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}