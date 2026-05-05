"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    BookOpen, User, LogOut, Search, MessageSquare,
    Send, Heart, X, LayoutDashboard,
    Sparkles, ArrowLeft, Plus, Bell, Megaphone, Menu, ChevronDown, History, Share2, Reply, Upload
} from 'lucide-react';

type Article = {
    id: string;
    title: string;
    content: string;
    created_at?: string;
    type?: string;
    likes_count?: number;
    comment_count?: number;
    author_id?: string;
    [key: string]: unknown;
};

type CommentItem = {
    id: string;
    content: string;
    created_at?: string;
    article_id?: string;
    user_id?: string;
    parent_id?: string | null;
    articles?: { title?: string }[];
    [key: string]: unknown;
};

type NotificationItem = {
    id: string | number;
    content: string;
    type: string;
    created_at: string;
    read: boolean;
    [key: string]: unknown;
};

type Profile = {
    id: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
    role?: string;
    is_admin?: boolean;
    [key: string]: unknown;
};

export default function Dashboard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [recentGlobalComments, setRecentGlobalComments] = useState<CommentItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'articles' | 'notifications'>('dashboard');

    // UI States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [articleComments, setArticleComments] = useState<CommentItem[]>([]);

    // Likes & Inputs
    const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [replyTo, setReplyTo] = useState<CommentItem | null>(null);

    // Admin & Notification
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([]);
    const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });

    // Admin Broadcast Input
    const [adminUpdateInput, setAdminUpdateInput] = useState("");
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    const router = useRouter();

    const loadReadNotifications = () => {
        if (typeof window === 'undefined') return [] as string[];
        try {
            const stored = window.localStorage.getItem('vibe_read_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };

    const saveReadNotifications = (ids: string[]) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('vibe_read_notifications', JSON.stringify(ids));
    };

    const markNotificationRead = (id: string) => {
        setNotificationHistory(prev => prev.map((item) => item.id === id ? { ...item, read: true } : item));
        setReadNotificationIds(prev => {
            const next = prev.includes(id) ? prev : [...prev, id];
            saveReadNotifications(next);
            return next;
        });
    };

    const markAllNotificationsRead = () => {
        const ids = notificationHistory.map((item) => String(item.id));
        setNotificationHistory(prev => prev.map((item) => ({ ...item, read: true })));
        setReadNotificationIds(ids);
        saveReadNotifications(ids);
    };

    const toggleNotificationRead = (id: string, read: boolean) => {
        setNotificationHistory(prev => prev.map((item) => item.id === id ? { ...item, read } : item));
        setReadNotificationIds(prev => {
            const next = read ? Array.from(new Set([...prev, id])) : prev.filter((itemId) => itemId !== id);
            saveReadNotifications(next);
            return next;
        });
    };

    const hydrateNotification = (notification: { id: string | number; content: string; type: string; created_at: string; [key: string]: unknown }, readIds: string[]) => ({
        ...notification,
        read: readIds.includes(String(notification.id))
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const isInvalidRefreshError = (error: unknown) => {
        if (typeof error !== 'object' || error === null) return false;
        const message = (error as { message?: unknown }).message;
        return typeof message === 'string' && /refresh token/i.test(message);
    };

    const handleInvalidSession = async (error?: unknown) => {
        console.warn('Invalid refresh token detected:', error);
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const fetchAllData = useCallback(async () => {
        try {
            const storedReadIds = loadReadNotifications();
            setReadNotificationIds(storedReadIds);

            const { data, error } = await supabase.auth.getUser();
            if (error) {
                if (isInvalidRefreshError(error)) {
                    await handleInvalidSession(error);
                    return;
                }
                throw error;
            }

            const user = data?.user;
            if (!user) {
                await handleInvalidSession();
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile({ id: user.id, email: user.email ?? undefined, ...(profile ?? {}) });

            const isAdminUser = profile?.role === 'admin' || profile?.is_admin;
            const userRole = isAdminUser ? 'Admin' : 'User';
            setIsAdmin(!!isAdminUser);

            const welcomeMsg = `Greetings! You are currently logged in as ${userRole}.`;
            setAnnouncement(welcomeMsg);

            setNotificationHistory(prev => {
                if (prev.find(n => n.content === welcomeMsg)) return prev;
                return [{ id: 'welcome', content: welcomeMsg, type: 'system', created_at: new Date().toISOString(), read: storedReadIds.includes('welcome') }, ...prev];
            });

            const { data: artData } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
            if (artData) setArticles(artData);

            const { data: comData } = await supabase.from('article_comments').select(`id, content, created_at, articles ( title )`).order('created_at', { ascending: false }).limit(10);
            if (comData) setRecentGlobalComments(comData as CommentItem[]);

            // Load notifications/announcements from database
            const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
            if (notifData && notifData.length > 0) {
                setNotificationHistory(prev => {
                    const existing = new Set(prev.map(n => String(n.id)));
                    const newNotifs = notifData
                        .filter(n => !existing.has(String(n.id)))
                        .map((n) => hydrateNotification(n, loadReadNotifications()));
                    return [...newNotifs, ...prev].slice(0, 50); // Keep last 50
                });
            }
        } catch (error: unknown) {
            if (isInvalidRefreshError(error)) {
                await handleInvalidSession(error);
                return;
            }
            console.error("Error fetching data:", error);
        }
    }, []);

    // BROADCAST HANDLER
    const sendEmailToAllUsers = async (subject: string, message: string) => {
        try {
            const response = await fetch('/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message })
            });

            const text = await response.text();
            let data: unknown;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                console.error('Unexpected non-JSON response from /api/broadcast:', text);
                return { error: 'Email service returned invalid response.' };
            }

            if (!response.ok) {
                const parsed = data as { error?: string };
                return { error: parsed?.error || 'Email service failed' };
            }

            return data as { error?: string; success?: boolean; sentCount?: number; totalRecipients?: number; partialFailure?: boolean; failedCount?: number; message?: string };
        } catch (error: unknown) {
            console.error('Broadcast email error:', error);
            const message = error instanceof Error ? error.message : String(error);
            return { error: message || 'Broadcast email failed' };
        }
    };

    const handleBroadcastUpdate = async () => {
        if (!adminUpdateInput.trim()) {
            setNotification("❌ Please enter a message");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        const msg = adminUpdateInput.trim();
        setBroadcastLoading(true);

        try {
            const { data: notifData, error } = await supabase.from('notifications').insert({
                content: msg,
                type: 'announcement',
                created_at: new Date().toISOString()
            }).select();

            if (error || !notifData || notifData.length === 0) {
                setNotification("❌ Failed to send broadcast: " + (error?.message || 'Unknown error'));
                setTimeout(() => setNotification(null), 5000);
                return;
            }

            const newNotif = notifData[0];
            const emailResult = await sendEmailToAllUsers('Vibe Announcement', msg);

            setAnnouncement(msg);
            const emailMsg = emailResult?.partialFailure ? `⚠️ Announcement posted, some emails failed: ${emailResult.message}` : emailResult?.error ? `⚠️ Announcement posted, email failed: ${emailResult.error}` : `📢 Broadcast sent to all users`;
            setNotification(emailMsg);
            setShowNotifications(true);
            await fetchAllData();

            setAdminUpdateInput("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setNotification("❌ Error: " + (message || "Failed to send broadcast"));
            console.error("Broadcast error:", error);
        } finally {
            setBroadcastLoading(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // UPDATED PUBLISH LOGIC
    const handlePublish = async () => {
        if (!newPost.title.trim()) {
            setNotification("❌ Please enter an article title");
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        if (!newPost.content.trim()) {
            setNotification("❌ Please enter article content");
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        try {
            const { data: postData, error } = await supabase.from('articles').insert({
                title: newPost.title.trim(),
                content: newPost.content.trim(),
                author_id: userProfile?.id,
                likes_count: 0,
                comment_count: 0
            }).select();

            if (error || !postData || postData.length === 0) {
                setNotification("❌ Failed to publish article: " + (error?.message || "Unknown error"));
                setTimeout(() => setNotification(null), 5000);
                return;
            }

            const publishedArticle = postData[0];

            // Send to global notification table so users see it in their "History"
            const { data: notifData, error: notifError } = await supabase.from('notifications').insert({
                content: `New Article Published: "${publishedArticle.title}"`,
                type: 'post',
                created_at: new Date().toISOString()
            }).select();

            if (notifError) {
                setNotification("⚠️ Article published, but notification failed: " + notifError.message);
                console.warn("Notification failed:", notifError.message);
            } else {
                setNotification('✅ Article published and notification created.');
            }

            setNewPost({ title: '', content: '' });
            setShowAdminModal(false);
            setTimeout(() => setNotification(null), 4000);
            await fetchAllData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setNotification("❌ Error: " + (message || "Unexpected error"));
            setTimeout(() => setNotification(null), 5000);
            console.error("Publish error:", error);
        }
    };

    // REAL-TIME LISTENER
    useEffect(() => {
        const channel = supabase.channel('realtime-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
                const msg = payload.new.content;
                const type = payload.new.type;
                
                // Show notification at top
                setNotification(msg);
                
                // Add to history
                setNotificationHistory(prev => [{
                    id: payload.new.id,
                    content: msg,
                    type: type,
                    created_at: payload.new.created_at,
                    read: false
                }, ...prev].slice(0, 50)); // Keep last 50
                
                // Update announcement bar for announcements
                if (type === 'announcement') {
                    setAnnouncement(msg);
                }
                
                setTimeout(() => setNotification(null), 5000);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, () => {
                fetchAllData();
            })
            .subscribe();
        
        return () => { 
            supabase.removeChannel(channel); 
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            await fetchAllData();
        };

        void load();
    }, [fetchAllData]);

    const handleShare = async (art: Article) => {
        if (navigator.share) {
            try {
                await navigator.share({ title: art.title, text: `Check out this vibe: ${art.title}`, url: window.location.href });
            } catch (err) { console.log('Error sharing', err); }
        } else {
            alert("Link copied to clipboard!");
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const openFullView = async (art: Article) => {
        setSelectedArticle(art);
        const { data } = await supabase.from('article_comments').select('*').eq('article_id', art.id).order('created_at', { ascending: true });
        if (data) setArticleComments(data as CommentItem[]);
    };

    const handleLikeArticle = async (articleId: string, currentLikes: number) => {
        const isLiked = userLikedPosts.includes(articleId);
        const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        setArticles((prev: Article[]) => prev.map(a => a.id === articleId ? { ...a, likes_count: newCount } : a));
        if (selectedArticle?.id === articleId) {
            setSelectedArticle((prev: Article | null) => prev ? { ...prev, likes_count: newCount } : prev);
        }
        setUserLikedPosts(prev => isLiked ? prev.filter(id => id !== articleId) : [...prev, articleId]);
        await supabase.from('articles').update({ likes_count: newCount }).eq('id', articleId);
    };

    const handlePostComment = async (articleId: string, parentId: string | null = null) => {
        const text = commentInputs[articleId];
        if (!text?.trim() || !userProfile) return;
        const finalContent = parentId ? `@reply: ${text}` : text;
        const { error } = await supabase.from('article_comments').insert({
            article_id: articleId,
            user_id: userProfile.id,
            content: finalContent,
            parent_id: parentId
        });
        if (!error) {
            setArticles((prev: Article[]) => prev.map(a => a.id === articleId ? { ...a, comment_count: (a.comment_count || 0) + 1 } : a));
            if (selectedArticle?.id === articleId) {
                setSelectedArticle((prev: Article | null) => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev);
            }
            const currentArt = articles.find(a => a.id === articleId);
            await supabase.from('articles').update({ comment_count: (currentArt?.comment_count || 0) + 1 }).eq('id', articleId);
            setCommentInputs(prev => ({ ...prev, [articleId]: "" }));
            setReplyTo(null);
            const { data } = await supabase.from('article_comments').select('*').eq('article_id', articleId).order('created_at', { ascending: true });
            if (data) setArticleComments(data as CommentItem[]);
        }
    };

    const filteredArticles = useMemo(() => {
        if (searchQuery.trim() !== "") return articles.filter(art => art.title.toLowerCase().includes(searchQuery.toLowerCase()));
        return articles;
    }, [searchQuery, articles]);

    const unreadCount = notificationHistory.filter((n) => !n.read).length;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-purple-500/30 font-sans tracking-tight antialiased">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_30%)]" />
            <div className="pointer-events-none absolute left-[-120px] top-20 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="pointer-events-none absolute right-[-100px] top-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            {notification && (
                <div className="fixed top-24 right-8 z-[200] bg-white text-black px-6 py-4 rounded-3xl shadow-2xl shadow-black/30 flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                    <Bell size={20} className="text-purple-600" />
                    <span className="font-bold text-sm tracking-tight">{notification}</span>
                </div>
            )}

            <header className="sticky top-0 z-50 bg-[#09090a]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="relative z-20 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-4 lg:px-8">
                    <div className="relative flex items-center gap-4">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 rounded-3xl border border-white/10 bg-white/5 text-white transition hover:bg-purple-500/10" aria-expanded={isMenuOpen} aria-label="Open navigation menu">
                            <Menu size={20} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full left-0 z-50 mt-3 w-56 rounded-[2rem] border border-white/10 bg-[#090909] p-3 shadow-2xl shadow-black/40">
                                <button onClick={() => { setViewMode('dashboard'); setIsMenuOpen(false); }} className="w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5">
                                    <LayoutDashboard size={16} className="inline-block mr-2" /> Dashboard
                                </button>
                                <button onClick={() => { setViewMode('articles'); setIsMenuOpen(false); }} className="mt-2 w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5">
                                    <BookOpen size={16} className="inline-block mr-2" /> All Articles
                                </button>
                                <button onClick={() => { setViewMode('notifications'); setIsMenuOpen(false); }} className="mt-2 w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5">
                                    <Bell size={16} className="inline-block mr-2" /> Notifications
                                </button>
                                {isAdmin && (
                                    <button onClick={() => { setShowAdminModal(true); setIsMenuOpen(false); }} className="mt-2 w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5">
                                        <Upload size={16} className="inline-block mr-2" /> Admin tools
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="cursor-pointer" onClick={() => setViewMode('dashboard')}>
                            <h1 className="text-3xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">vibe.</h1>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI workspace</p>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-2xl">
                        <div className="relative rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-sm shadow-black/20">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search the vibe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent pl-12 pr-4 text-xs text-white outline-none placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button onClick={() => setShowAdminModal(true)} className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110">
                                <Upload size={14} /> Publish
                            </button>
                        )}

                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className={`relative rounded-full p-3 border border-white/10 bg-white/5 text-white transition ${showNotifications ? 'bg-purple-600 text-white' : 'hover:bg-white/10'}`}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white px-[2px] shadow-xl shadow-red-500/30">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-4 w-96 rounded-[2rem] border border-white/10 bg-[#090909] p-6 shadow-2xl shadow-black/50">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 flex items-center gap-2"><History size={14} /> Quick History</h3>
                                            <p className="mt-1 text-[11px] text-slate-400">Recent unread and read notifications.</p>
                                        </div>
                                        <button onClick={markAllNotificationsRead} className="text-[10px] uppercase tracking-[0.35em] text-purple-500 hover:text-purple-300">Mark all read</button>
                                    </div>
                                    <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
                                        {notificationHistory.length > 0 ? (
                                            notificationHistory.slice(0, 4).map((n, i) => (
                                                <div key={i} className={`rounded-3xl border p-4 transition ${n.read ? 'border-white/10 bg-white/5' : 'border-purple-500/30 bg-purple-900/20'}`}>
                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.35em] ${n.read ? 'text-slate-400' : 'text-emerald-400'}`}>{n.read ? 'Read' : 'Unread'}</span>
                                                        <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-100 leading-6">{n.content}</p>
                                                    <button onClick={() => toggleNotificationRead(String(n.id), !n.read)} className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 hover:text-white">
                                                        {n.read ? 'Mark unread' : 'Mark read'}
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 text-center py-8">No recent notifications yet.</p>
                                        )}
                                    </div>
                                    <button onClick={() => { markAllNotificationsRead(); setViewMode('notifications'); setShowNotifications(false); }} className="mt-4 w-full rounded-full border border-purple-500/20 bg-white/5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-purple-300 hover:bg-white/10 transition">
                                        View Full History
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-sky-500 p-1 overflow-hidden border border-white/10">
                                    {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" /> : <User size={20} className="text-white" />}
                                </div>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isProfileOpen && (
                                <div className="absolute top-full right-0 mt-4 w-56 rounded-[2rem] border border-white/10 bg-[#090909] p-4 shadow-2xl shadow-black/50">
                                    <div className="mb-4 border-b border-white/10 pb-3">
                                        <p className="truncate text-sm font-black text-white">{userProfile?.full_name || 'User'}</p>
                                        <p className="text-[10px] uppercase tracking-[0.35em] text-purple-400">{isAdmin ? 'Admin' : 'User'}</p>
                                    </div>
                                    <button onClick={() => router.push('/profile')} className="mb-2 flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                                        <User size={16} /> Profile
                                    </button>
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {viewMode === 'notifications' ? (
                    <section className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h1 className="text-5xl font-black italic mb-2 tracking-tighter">History</h1>
                                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Your activity log</p>
                            </div>
                            <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl text-sm font-bold border border-white/5 hover:bg-white/10 transition-all"><ArrowLeft size={18} /> Back</button>
                        </div>
                        <div className="space-y-8">
                            {notificationHistory.filter((n) => !n.read).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tighter">Unread updates</h2>
                                            <p className="text-sm text-gray-500">These are new or unread notifications.</p>
                                        </div>
                                        <button onClick={markAllNotificationsRead} className="text-[10px] uppercase tracking-widest text-purple-500 hover:text-purple-300">Mark all read</button>
                                    </div>
                                    <div className="space-y-4">
                                        {notificationHistory.filter((n) => !n.read).map((n, i) => (
                                            <div key={`unread-${i}`} className="bg-purple-900/20 border border-purple-500/40 rounded-3xl p-6">
                                                <div className="flex justify-between items-center gap-3 mb-3">
                                                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Unread</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-lg font-bold tracking-tight leading-relaxed mb-4">{n.content}</p>
                                                <button onClick={() => toggleNotificationRead(String(n.id), true)} className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 transition-all">Mark read</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {notificationHistory.filter((n) => n.read).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tighter">Read updates</h2>
                                            <p className="text-sm text-gray-500">These have already been marked as read.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {notificationHistory.filter((n) => n.read).map((n, i) => (
                                            <div key={`read-${i}`} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 opacity-90">
                                                <div className="flex justify-between items-center gap-3 mb-3">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Read</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-lg font-bold tracking-tight leading-relaxed mb-4">{n.content}</p>
                                                <button onClick={() => toggleNotificationRead(String(n.id), false)} className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-300">Mark unread</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {notificationHistory.length === 0 && (
                                <p className="text-xs text-gray-500 text-center py-10">No notifications yet. When something happens, it will appear here.</p>
                            )}
                        </div>
                    </section>
                ) : (
                    <>
                        {viewMode === 'dashboard' && (
                            <section className="mb-12 grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
                                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <span className="inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-purple-200">Dashboard overview</span>
                                            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">Welcome back, {userProfile?.full_name || 'creator'}</h2>
                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Explore your personalized dashboard and stay updated with the latest news and activities.</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div className="rounded-3xl border border-white/10 bg-[#090909] p-5 text-center min-w-0">
                                                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Unread</p>
                                                <p className="mt-3 text-3xl font-black text-white">{notificationHistory.filter((n) => !n.read).length}</p>
                                            </div>
                                            <div className="rounded-3xl border border-white/10 bg-[#090909] p-5 text-center min-w-0">
                                                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Articles</p>
                                                <p className="mt-3 text-3xl font-black text-white">{articles.length}</p>
                                            </div>
                                            <div className="rounded-3xl border border-white/10 bg-[#090909] p-5 text-center min-w-0">
                                                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Comments</p>
                                                <p className="mt-3 text-3xl font-black text-white">{recentGlobalComments.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {announcement && (
                                        <div className="mt-8 rounded-[2rem] border border-purple-500/20 bg-gradient-to-r from-purple-950/90 to-slate-950/90 p-6 shadow-xl shadow-purple-500/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-300">
                                                        <Megaphone size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-[0.35em] text-purple-300">Announcement</p>
                                                        <p className="mt-3 text-base leading-7 text-slate-200">{announcement}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setAnnouncement(null)} className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">Dismiss</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[2.5rem] border border-white/10 bg-[#0b0b0d]/90 p-6 shadow-2xl shadow-black/20">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300">Quick actions</p>
                                            <h3 className="mt-3 text-2xl font-black text-white">Stay in flow</h3>
                                        </div>
                                        {isAdmin && (
                                            <span className="rounded-full bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-purple-200">Admin tools</span>
                                        )}
                                    </div>
                                    <div className="mt-6 grid gap-4">
                                        <button onClick={() => setViewMode('notifications')} className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white transition hover:border-purple-500/30 hover:bg-purple-500/10">
                                            <p className="text-[11px] uppercase tracking-[0.35em] text-purple-300">Notifications</p>
                                            <p className="mt-2 text-lg font-black">{notificationHistory.filter((n) => !n.read).length} items unread</p>
                                        </button>
                                        <button onClick={() => setViewMode('articles')} className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white transition hover:border-purple-500/30 hover:bg-purple-500/10">
                                            <p className="text-[11px] uppercase tracking-[0.35em] text-purple-300">Article library</p>
                                            <p className="mt-2 text-lg font-black">Browse all posts and drafts</p>
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => setShowAdminModal(true)} className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-4 text-left text-sm font-semibold text-white shadow-xl shadow-purple-500/20 transition hover:brightness-110">
                                                <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Publish</p>
                                                <p className="mt-2 text-lg font-black">Create a new article</p>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {viewMode === 'dashboard' && !searchQuery && (
                            <section className="mb-16">
                                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-8 flex items-center gap-3"><Sparkles size={16} className="text-purple-500" /> Recommended</h2>
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {articles.slice(0, 5).map((art) => (
                                        <div key={art.id} onClick={() => openFullView(art)} className="cursor-pointer rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-purple-500/30 hover:bg-white/10">
                                            <div className="mb-6 h-44 rounded-3xl bg-gradient-to-br from-purple-700 to-slate-900 p-6 text-white flex items-end">
                                                <h3 className="text-3xl font-black leading-tight tracking-tight">{art.title}</h3>
                                            </div>
                                            <p className="text-sm leading-7 text-slate-300 max-h-[6rem] overflow-hidden">{art.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-8">
                                <h2 className="text-4xl font-black tracking-tighter capitalize mb-4">{viewMode}</h2>
                                {filteredArticles.map((art) => (
                                    <div key={art.id} className="group rounded-[2.5rem] border border-white/10 bg-[#08080a] p-8 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-purple-500/30 hover:bg-white/5">
                                        <div className="mb-6 flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-3xl font-black leading-tight tracking-tight text-white cursor-pointer transition-colors hover:text-purple-300" onClick={() => openFullView(art)}>{art.title}</h3>
                                                <p className="mt-3 text-xs uppercase tracking-[0.35em] text-purple-300">{art.type || 'Article'}</p>
                                            </div>
                                            <div className="rounded-3xl bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-300">{new Date(art.created_at || new Date()).toLocaleDateString()}</div>
                                        </div>
                                        <p className="text-sm leading-7 text-slate-400 mb-8 max-w-prose max-h-[8rem] overflow-hidden">{art.content}</p>
                                        <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                                            <button onClick={() => handleLikeArticle(art.id, art.likes_count || 0)} className={`flex items-center gap-2 rounded-3xl border border-white/10 px-4 py-2 transition ${userLikedPosts.includes(art.id) ? 'bg-purple-600 text-white border-purple-500' : 'hover:border-purple-500/30 hover:bg-white/5'}`}>
                                                <Heart size={16} fill={userLikedPosts.includes(art.id) ? 'currentColor' : 'none'} /> {art.likes_count || 0}
                                            </button>
                                            <button onClick={() => openFullView(art)} className="flex items-center gap-2 rounded-3xl border border-white/10 px-4 py-2 hover:border-purple-500/30 hover:bg-white/5 transition text-slate-300">
                                                <MessageSquare size={16} /> {art.comment_count || 0}
                                            </button>
                                            <button onClick={() => handleShare(art)} className="flex items-center gap-2 rounded-3xl border border-white/10 px-4 py-2 hover:border-purple-500/30 hover:bg-white/5 transition text-slate-300">
                                                <Share2 size={16} /> Share
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <aside className="space-y-8">
                                <div className="sticky top-28 space-y-6 rounded-[2.5rem] border border-white/10 bg-[#0b0b0d]/90 p-8 shadow-2xl shadow-black/30">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-300">Recent Activity</h3>
                                            <p className="mt-2 text-sm text-slate-400">Latest comments from the vibe feed.</p>
                                        </div>
                                        <span className="rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">{recentGlobalComments.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {recentGlobalComments.slice(0, 5).map((c) => (
                                            <div key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30 hover:bg-white/10">
                                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-300 truncate">{c.articles?.[0]?.title}</p>
                                                <p className="mt-3 text-sm leading-6 text-slate-300 italic">"{c.content}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </>
                )}
            </main>

            {showAdminModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowAdminModal(false)} />
                    <div className="relative w-full max-w-5xl overflow-hidden rounded-[3rem] border border-white/10 bg-[#09090b] p-10 shadow-2xl shadow-black/60">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Admin tools</p>
                                <h2 className="mt-2 text-3xl font-black text-white">Publish articles & send announcements</h2>
                                <p className="mt-2 text-sm text-slate-400">Create posts, broadcast updates, and email every user instantly.</p>
                            </div>
                            <button onClick={() => setShowAdminModal(false)} className="rounded-full border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10"><X size={20} /></button>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                            <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300">Article post</p>
                                        <h3 className="mt-2 text-xl font-black text-white">Publish to the feed</h3>
                                    </div>
                                    <span className="rounded-full bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-purple-200">In-app only</span>
                                </div>
                                <input
                                    className="w-full rounded-3xl border border-white/10 bg-[#111] px-6 py-4 text-sm text-white outline-none transition focus:border-purple-500"
                                    placeholder="Article Title"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                />
                                <textarea
                                    rows={10}
                                    className="w-full rounded-3xl border border-white/10 bg-[#111] px-6 py-4 text-sm text-white outline-none transition focus:border-purple-500 resize-none"
                                    placeholder="Article Description..."
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                />
                                <button
                                    onClick={handlePublish}
                                    className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-4 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl shadow-purple-500/20 transition hover:brightness-110"
                                >
                                    <Upload size={20} /> Publish Article
                                </button>
                            </div>

                            <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300">Announcement</p>
                                        <h3 className="mt-2 text-xl font-black text-white">Send update to every user</h3>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-200">Email + notification</span>
                                </div>
                                <textarea
                                    rows={12}
                                    className="w-full rounded-3xl border border-white/10 bg-[#111] px-6 py-4 text-sm text-white outline-none transition focus:border-purple-500 resize-none"
                                    placeholder="Write your announcement message here..."
                                    value={adminUpdateInput}
                                    onChange={(e) => setAdminUpdateInput(e.target.value)}
                                />
                                <button
                                    onClick={handleBroadcastUpdate}
                                    disabled={broadcastLoading}
                                    className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Send size={20} /> {broadcastLoading ? 'Sending announcement...' : 'Send Announcement'}
                                </button>
                                <p className="text-xs leading-6 text-slate-400">This message will update the announcement bar, post to notifications, and attempt to email all registered users.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedArticle && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedArticle(null)} />
                    <div className="relative w-full max-w-7xl h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#071015] shadow-2xl shadow-black/70 flex flex-col md:flex-row">
                        <div className="flex-1 overflow-y-auto p-8 lg:p-16 border-r border-white/10 custom-scrollbar">
                            <button onClick={() => setSelectedArticle(null)} className="mb-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 hover:text-white transition">
                                <ArrowLeft size={14} /> Back to feed
                            </button>
                            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">{selectedArticle.title}</h2>
                            <div className="mt-8 h-1 w-28 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                            <div className="prose prose-invert max-w-prose mt-10">
                                <p className="text-base text-slate-300 leading-8 whitespace-pre-wrap">{selectedArticle.content}</p>
                            </div>
                        </div>
                        <div className="w-full md:w-[420px] flex h-full flex-col bg-[#090b12] border-l border-white/10">
                            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#090b12]/95 p-6 backdrop-blur-xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-[0.35em] text-purple-400">Discussion</h3>
                                        <p className="mt-2 text-xs font-black uppercase tracking-[0.35em] text-slate-500">{articleComments.length} comments</p>
                                    </div>
                                    <button onClick={() => handleLikeArticle(selectedArticle.id, selectedArticle.likes_count || 0)} className={`flex items-center gap-2 rounded-3xl px-4 py-2 text-sm font-black transition ${userLikedPosts.includes(selectedArticle.id) ? 'bg-purple-500 text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
                                        <Heart fill={userLikedPosts.includes(selectedArticle.id) ? 'white' : 'none'} size={16} />
                                        <span>{selectedArticle.likes_count || 0}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {articleComments.length > 0 ? (
                                    articleComments.map((comment: CommentItem) => (
                                        <div key={comment.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10">
                                            <p className="text-sm leading-7 text-slate-200">{comment.content}</p>
                                            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-500">
                                                <span>{new Date(comment.created_at || new Date()).toLocaleDateString()}</span>
                                                <button onClick={() => setReplyTo(comment)} className="flex items-center gap-1 text-purple-300 hover:text-white transition"><Reply size={12} /> Reply</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-500">
                                        <MessageSquare size={48} className="mb-4" />
                                        <p className="text-xs font-black uppercase tracking-[0.35em]">No comments yet</p>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-white/10 bg-[#090b12]/95 p-6">
                                {replyTo && (
                                    <div className="mb-4 rounded-3xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-purple-200 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Reply size={10} /> Replying to a comment</span>
                                        <button onClick={() => setReplyTo(null)} className="text-white/60 hover:text-white"><X size={12} /></button>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Add to the vibe..."
                                        value={commentInputs[selectedArticle.id] || ''}
                                        onChange={(e) => setCommentInputs({ ...commentInputs, [selectedArticle.id]: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(selectedArticle.id, replyTo?.id)}
                                        className="w-full rounded-3xl border border-white/10 bg-[#020203] px-5 py-4 pr-16 text-sm text-white outline-none focus:border-purple-500 transition"
                                    />
                                    <button onClick={() => handlePostComment(selectedArticle.id, replyTo?.id)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 p-3 text-white transition hover:brightness-110">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}