"use client";
import { useState, useEffect, use } from 'react'; // Added 'use'
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Send, ArrowLeft, ThumbsUp, MessageCircle, Share2, User } from 'lucide-react';
import Link from 'next/link';

// Define the type for Next.js params
type PageProps = {
    params: Promise<{ id: string }>;
};

export default function ArticleDetailPage({ params }: PageProps) {
    // This resolves the Next.js 15+ "params must be awaited" error
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [article, setArticle] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        try {
            // 1. Get Article
            const { data: art } = await supabase.from('articles').select('*').eq('id', id).single();
            if (art) {
                setArticle(art);
                setLikesCount(art.likes_count || 0);
            }

            // 2. Get Comments + Profiles
            const { data: comms } = await supabase
                .from('article_comments')
                .select(`*, profiles (full_name, avatar_url)`)
                .eq('article_id', id)
                .order('created_at', { ascending: true });

            if (comms) setComments(comms);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleLike() {
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        setIsLiked(true);

        const { error } = await supabase
            .from('articles')
            .update({ likes_count: newCount })
            .eq('id', id);

        if (error) {
            setLikesCount(likesCount);
            setIsLiked(false);
            alert("Could not save like: " + error.message);
        }
    }

    async function handleShare() {
        const url = window.location.href;
        const title = article?.title;

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (err) { console.log("Share dismissed"); }
        } else {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
    }

    async function handlePost(parentId: string | null = null) {
        if (!commentInput.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();

        const commentData: any = {
            article_id: id,
            content: commentInput,
            parent_id: parentId,
            user_id: user ? user.id : null
        };

        const { error } = await supabase.from('article_comments').insert(commentData);

        if (error) {
            alert("Error: " + error.message);
        } else {
            setCommentInput("");
            setActiveReplyId(null);
            await fetchData();
        }
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-black animate-pulse uppercase tracking-[0.2em]">Initializing Neural Link...</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20 font-sans">
            <div className="max-w-2xl mx-auto px-4 pt-10">
                <Link href="/articles" className="flex items-center gap-2 text-purple-500 mb-8 text-[10px] font-black uppercase tracking-widest hover:text-purple-400 transition-colors">
                    <ArrowLeft size={14} /> Back to Library
                </Link>

                {/* ARTICLE CARD */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 mb-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <div className="text-4xl font-black italic uppercase tracking-tighter">Vibe.</div>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-xs">V</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-white">Vibe Intelligence</p>
                            <p className="text-[9px] text-purple-500 font-bold uppercase tracking-widest">Research Division</p>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black mb-6 tracking-tighter leading-tight italic uppercase">{article?.title}</h1>
                    <div className="w-12 h-1 bg-purple-600 mb-6"></div>
                    <p className="text-gray-400 leading-relaxed mb-8 text-sm font-medium">{article?.content}</p>

                    <div className="flex gap-8 pt-6 border-t border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.15em]">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-purple-500' : 'hover:text-purple-400'}`}
                        >
                            <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} />
                            {likesCount} Likes
                        </button>
                        <button className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                            <MessageCircle size={14} /> {comments.length} Comments
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                        >
                            <Share2 size={14} /> Share
                        </button>
                    </div>
                </div>

                {/* COMMENTS SECTION */}
                <div className="space-y-8">
                    <div className="flex gap-4 items-center bg-[#0a0a0a] p-2 rounded-full border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center border border-white/5 ml-1">
                            <User size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1 relative pr-2">
                            <input
                                className="w-full bg-transparent px-2 py-3 text-xs font-bold focus:outline-none placeholder:text-gray-700"
                                placeholder="CONTRIBUTE TO THE RESEARCH..."
                                value={activeReplyId === null ? commentInput : ""}
                                onChange={(e) => { setActiveReplyId(null); setCommentInput(e.target.value); }}
                                onKeyDown={(e) => e.key === 'Enter' && handlePost(null)}
                            />
                            <button onClick={() => handlePost(null)} className="absolute right-2 top-2.5 text-purple-500 hover:text-purple-400 transition-colors">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>

                    {comments.filter(c => !c.parent_id).map(parent => (
                        <div key={parent.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-purple-500/30 flex-shrink-0 flex items-center justify-center shadow-lg">
                                    <span className="text-[10px] font-black text-purple-500 uppercase">{parent.profiles?.full_name?.charAt(0) || "U"}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-[#0a0a0a] px-5 py-4 rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
                                                {parent.profiles?.full_name || "Anonymous Researcher"}
                                            </p>
                                            <span className="text-[8px] font-bold text-gray-700 uppercase">Verified Entry</span>
                                        </div>
                                        <p className="text-sm text-gray-300 font-medium leading-relaxed">{parent.content}</p>
                                    </div>
                                    <div className="flex gap-6 ml-4 mt-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        <button className="hover:text-purple-500 transition-colors">Like</button>
                                        <button onClick={() => setActiveReplyId(parent.id)} className="hover:text-white transition-colors">Reply</button>
                                    </div>

                                    <div className="ml-6 mt-6 border-l border-white/5 pl-6 space-y-4">
                                        {comments.filter(r => r.parent_id === parent.id).map(reply => (
                                            <div key={reply.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#111] border border-white/5 flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-gray-600 uppercase">{reply.profiles?.full_name?.charAt(0) || "R"}</span>
                                                </div>
                                                <div className="bg-[#0a0a0a] px-4 py-3 rounded-2xl border border-white/5">
                                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{reply.profiles?.full_name || "Contributor"}</p>
                                                    <p className="text-xs text-gray-400 font-medium">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {activeReplyId === parent.id && (
                                            <div className="flex gap-2 mt-4 bg-[#111] p-1.5 rounded-full border border-purple-500/20">
                                                <input
                                                    autoFocus
                                                    className="flex-1 bg-transparent px-4 py-1 text-[10px] font-bold outline-none text-white placeholder:text-gray-700 uppercase"
                                                    placeholder="Awaiting response..."
                                                    value={commentInput}
                                                    onChange={(e) => setCommentInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handlePost(parent.id)}
                                                />
                                                <button onClick={() => handlePost(parent.id)} className="p-2 text-purple-500"><Send size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}