"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Send, ArrowLeft, ThumbsUp, MessageCircle, Share2, User } from 'lucide-react';
import Link from 'next/link';

export default function ArticleDetailPage() {
    const { id } = useParams();
    const [article, setArticle] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- NEW STATES FOR LIKES ---
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        // 1. Get Article
        const { data: art } = await supabase.from('articles').select('*').eq('id', id).single();
        if (art) {
            setArticle(art);
            setLikesCount(art.likes_count || 0); // Initialize likes
        }

        // 2. Get Comments + Profiles
        const { data: comms } = await supabase
            .from('article_comments')
            .select(`*, profiles (full_name, avatar_url)`)
            .eq('article_id', id)
            .order('created_at', { ascending: true });

        if (comms) setComments(comms);
        setLoading(false);
    }

    async function handleLike() {
        // Optimistic Update: Change the UI immediately so it feels fast
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        setIsLiked(true);

        // Now update the database in the background
        const { error } = await supabase
            .from('articles')
            .update({ likes_count: newCount })
            .eq('id', id);

        if (error) {
            console.error("Like failed:", error.message);
            // Rollback if database fails
            setLikesCount(likesCount);
            setIsLiked(false);
            alert("Could not save like: " + error.message);
        }
    }

    async function handleShare() {
        const url = window.location.href;
        const title = article?.title;

        // This creates a custom popup with platform options
        const shareOptions = `
        Choose a platform:
        1. WhatsApp: https://wa.me/?text=${encodeURIComponent(title + " " + url)}
        2. Facebook: https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}
        3. Twitter/X: https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}
    `;

        // Try native share first (Works on Mobile)
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (err) { console.log("Share dismissed"); }
        } else {
            // Fallback: Just copy to clipboard and tell them they can paste it
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard! You can now paste it on Facebook, WhatsApp, or X.");
        }
    }

    async function handlePost(parentId: string | null = null) {
        if (!commentInput.trim()) return;

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        // Prepare data
        const commentData: any = {
            article_id: id,
            content: commentInput,
            parent_id: parentId,
            // If user exists, we send their ID. If not, this remains undefined (NULL in DB)
            user_id: user ? user.id : null
        };

        const { error } = await supabase.from('article_comments').insert(commentData);

        if (error) {
            console.error("Insert Error:", error.message);
            alert("Error: " + error.message);
        } else {
            setCommentInput("");
            setActiveReplyId(null);
            await fetchData(); // Refresh the list
        }
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-black animate-pulse">SYNCING...</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <div className="max-w-2xl mx-auto px-4 pt-10">
                <Link href="/articles" className="flex items-center gap-2 text-purple-500 mb-8 text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back to Library
                </Link>

                {/* ARTICLE CARD */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">V</div>
                        <div>
                            <p className="text-sm font-bold">Vibe Intelligence</p>
                            <p className="text-[10px] text-gray-500 uppercase">Featured Research</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black mb-4 tracking-tighter">{article?.title}</h1>
                    <p className="text-gray-400 leading-relaxed mb-6">{article?.content}</p>

                    {/* UPDATED ACTION BUTTONS */}
                    <div className="flex gap-6 pt-4 border-t border-white/5 text-gray-500 text-[10px] font-bold uppercase">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-purple-500' : 'hover:text-purple-500'}`}
                        >
                            <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                            {likesCount} Likes
                        </button>
                        <button className="flex items-center gap-2 hover:text-purple-500">
                            <MessageCircle size={16} /> Comment
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 hover:text-purple-500"
                        >
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </div>

                {/* COMMENTS SECTION (Rest of your code stays the same) */}
                <div className="space-y-6">
                    <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center"><User size={16} className="text-gray-500" /></div>
                        <div className="flex-1 relative">
                            <input
                                className="w-full bg-[#111] border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-purple-600 transition-all"
                                placeholder="Write a comment..."
                                value={activeReplyId === null ? commentInput : ""}
                                onChange={(e) => { setActiveReplyId(null); setCommentInput(e.target.value); }}
                                onKeyDown={(e) => e.key === 'Enter' && handlePost(null)}
                            />
                            <button onClick={() => handlePost(null)} className="absolute right-4 top-3 text-purple-500"><Send size={18} /></button>
                        </div>
                    </div>

                    {comments.filter(c => !c.parent_id).map(parent => (
                        <div key={parent.id} className="group">
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-900/20 border border-purple-500/20 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-purple-500">{parent.profiles?.full_name?.charAt(0) || "U"}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-block bg-[#111] px-4 py-2.5 rounded-2xl border border-white/5">
                                        <p className="text-[11px] font-black text-purple-400 uppercase tracking-tighter mb-0.5">
                                            {parent.profiles?.full_name || "Anonymous User"}
                                        </p>
                                        <p className="text-sm text-gray-200">{parent.content}</p>
                                    </div>
                                    <div className="flex gap-4 ml-3 mt-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                        <button className="hover:text-white">Like</button>
                                        <button onClick={() => setActiveReplyId(parent.id)} className="hover:text-white">Reply</button>
                                    </div>

                                    <div className="ml-5 mt-4 border-l-2 border-white/5 pl-5 space-y-4">
                                        {comments.filter(r => r.parent_id === parent.id).map(reply => (
                                            <div key={reply.id} className="flex gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-900 border border-white/5 flex-shrink-0" />
                                                <div className="bg-[#111] px-4 py-2 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-bold text-gray-500 italic">{reply.profiles?.full_name || "User"}</p>
                                                    <p className="text-xs text-gray-300">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {activeReplyId === parent.id && (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    autoFocus
                                                    className="flex-1 bg-black border border-white/10 rounded-full px-4 py-1.5 text-xs outline-none focus:border-purple-600"
                                                    placeholder="Reply to thread..."
                                                    value={commentInput}
                                                    onChange={(e) => setCommentInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handlePost(parent.id)}
                                                />
                                                <button onClick={() => handlePost(parent.id)} className="text-purple-500"><Send size={16} /></button>
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