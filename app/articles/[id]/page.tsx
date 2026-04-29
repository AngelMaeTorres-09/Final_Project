"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, MessageSquare, Share2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function ArticleDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                setLoading(true);

                // 1. Fetch the main article
                const { data, error: fetchError } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Article not found");

                setArticle(data);

                // 2. Increment View Count automatically
                await supabase
                    .from('articles')
                    .update({ view_count: (data.view_count || 0) + 1 })
                    .eq('id', id);

            } catch (err: any) {
                console.error("Error fetching article:", err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArticleData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-500 font-black tracking-widest animate-pulse uppercase">Initializing Neural Link...</p>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-black text-white mb-4">404: DISCONNECTED</h1>
                <p className="text-gray-500 mb-8">The neural link could not be established with this article.</p>
                <Link href="/dashboard">
                    <button className="px-8 py-3 bg-purple-600 rounded-full font-bold hover:bg-purple-700 transition-all">
                        Return to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
            {/* Header / Nav */}
            <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 h-20 flex items-center px-6 md:px-12">
                <button onClick={() => router.back()} className="p-3 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-purple-500">
                    <ArrowLeft size={24} />
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="space-y-8">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-purple-500">
                        <span>Article</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span className="text-gray-500">{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                        {article.title}
                    </h1>

                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-6 py-6 border-y border-white/5">
                        <div className="flex items-center gap-2">
                            <Heart size={18} className="text-purple-500 fill-purple-500" />
                            <span className="font-bold">{article.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare size={18} className="text-gray-400" />
                            <span className="font-bold">{article.comment_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Share2 size={18} className="text-gray-400" />
                            <span className="font-bold text-gray-400">{article.share_count || 0}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-purple max-w-none">
                        <p className="text-xl text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {article.content}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}