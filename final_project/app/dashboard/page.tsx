"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Home,
    BookOpen,
    User,
    LogOut,
    Search,
    MessageSquare,
    TrendingUp,
    Bell,
    Send,
    Clock
} from 'lucide-react';

export default function Dashboard() {
    const [articles, setArticles] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [adminMsg, setAdminMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchArticles = async () => {
            const { data } = await supabase
                .from('articles')
                .select('*')
                .order('view_count', { ascending: false });
            if (data) setArticles(data);
        };

        const fetchAnnouncements = async () => {
            const { data } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setAnnouncements(data);
        };

        const fetchRecentComments = async () => {
            const { data } = await supabase
                .from('article_comments')
                .select(`
                    id,
                    content,
                    created_at,
                    articles ( title )
                `)
                .order('created_at', { ascending: false })
                .limit(3);
            if (data) setComments(data);
        };

        fetchArticles();
        fetchAnnouncements();
        fetchRecentComments();

        const announcementChannel = supabase
            .channel('db-announcements')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => setAnnouncements((prev) => [payload.new, ...prev])
            ).subscribe();

        const commentChannel = supabase
            .channel('db-comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'article_comments' },
                () => fetchRecentComments()
            ).subscribe();

        return () => {
            supabase.removeChannel(announcementChannel);
            supabase.removeChannel(commentChannel);
        };
    }, []);

    const displayArticles = useMemo(() => {
        if (searchQuery.trim() === "") {
            return articles.slice(0, 5);
        } else {
            return articles.filter((art) =>
                art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                art.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    }, [searchQuery, articles]);

    const handleUpdateAnnouncement = async () => {
        if (!adminMsg.trim()) return;
        const { error } = await supabase.from('announcements').insert({
            title: "System Update",
            content: adminMsg,
            type: 'news'
        });
        if (!error) { setAdminMsg(""); setIsEditMode(false); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 border-r border-white/5 bg-[#050505] hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-10 text-3xl font-black text-purple-600 tracking-tighter italic">vibe.</div>
                <nav className="flex-1 px-6 space-y-4">
                    <Link href="/dashboard" className="block w-full">
                        <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-900/20">
                            <Home size={20} /> <span className="font-bold text-sm">Home</span>
                        </button>
                    </Link>
                    <Link href="/articles" className="block w-full">
                        <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-all rounded-2xl">
                            <BookOpen size={20} /> <span className="font-bold text-sm">Articles</span>
                        </button>
                    </Link>
                    <Link href="/profile" className="block w-full">
                        <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-all rounded-2xl">
                            <User size={20} /> <span className="font-bold text-sm">Profile</span>
                        </button>
                    </Link>
                </nav>
                <div className="p-6 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                        <LogOut size={20} /> <span className="font-bold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                {/* HEADER - Increased padding and height */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="relative w-full max-w-2xl group">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-purple-500' : 'text-gray-500'}`} size={20} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-full py-3.5 pl-14 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-sm transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative ml-8">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-4 rounded-full transition-all relative ${showNotifications ? 'bg-purple-600 text-white' : 'bg-[#111] text-gray-400 hover:text-white border border-white/5'}`}
                        >
                            <Bell size={22} />
                            {announcements.length > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-6 w-96 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50">
                                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111]">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Activity Center</h3>
                                    <button onClick={() => setIsEditMode(!isEditMode)} className="text-[10px] bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold">
                                        {isEditMode ? "Close" : "Admin"}
                                    </button>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {isEditMode ? (
                                        <div className="p-6 space-y-4">
                                            <textarea className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs outline-none focus:ring-1 focus:ring-purple-600" placeholder="Broadcast message..." value={adminMsg} onChange={(e) => setAdminMsg(e.target.value)} />
                                            <button onClick={handleUpdateAnnouncement} className="w-full bg-purple-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                                <Send size={14} /> Send Now
                                            </button>
                                        </div>
                                    ) : (
                                        announcements.map((item, idx) => (
                                            <div key={idx} className="p-6 border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <p className="text-xs font-bold text-purple-400">{item.title}</p>
                                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.content}</p>
                                                <p className="text-[9px] text-gray-600 mt-3 font-mono uppercase tracking-tighter">{new Date(item.created_at).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* MAIN CONTENT - Larger padding and wider grid gap */}
                <div className="p-12 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT SECTION */}
                    <section className="lg:col-span-8 space-y-10">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-purple-500" size={26} />
                            <h2 className="text-2xl font-black tracking-tight">
                                {searchQuery ? `Results (${displayArticles.length})` : 'Top 5 Trending'}
                            </h2>
                        </div>

                        <div className="space-y-6">
                            {displayArticles.map((art, i) => (
                                <Link key={art.id} href={`/articles/${art.id}`}>
                                    <div className="group flex items-center gap-8 bg-[#0a0a0a] border border-white/5 p-7 rounded-[2rem] hover:border-purple-500/40 transition-all cursor-pointer shadow-sm hover:shadow-purple-500/5">
                                        <span className="text-3xl font-black text-white/5 group-hover:text-purple-600/20 transition-colors">
                                            {i + 1 < 10 ? `0${i + 1}` : i + 1}
                                        </span>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-200 group-hover:text-purple-400 transition-colors tracking-tight">
                                                {art.title}
                                            </h4>
                                            <p className="text-gray-500 text-sm mt-2 line-clamp-1 leading-relaxed">{art.content}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
                                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{art.view_count} views</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* RIGHT SIDEBAR */}
                    <section className="lg:col-span-4 space-y-10">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <MessageSquare className="text-purple-500" size={22} />
                                <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400">Recent Activity</h3>
                            </div>
                            <div className="space-y-10">
                                {comments.map((c) => (
                                    <div key={c.id} className="border-l-2 border-purple-600/30 pl-6 space-y-2">
                                        <p className="text-[10px] uppercase font-black text-gray-500 truncate w-full tracking-wider">
                                            {c.articles?.title}
                                        </p>
                                        <p className="text-sm text-gray-300 italic leading-relaxed">"{c.content}"</p>
                                        <div className="flex items-center gap-2 text-[10px] text-purple-400/50 mt-2 font-mono">
                                            <Clock size={12} />
                                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PRO CARD - Added more padding */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/20 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-[10px] font-black text-purple-400 mb-4 uppercase tracking-[0.3em] relative z-10">Premium Dashboard</p>
                            <h4 className="text-2xl font-black mb-8 text-white leading-tight relative z-10">Create your own research model.</h4>
                            <button className="w-full bg-white text-black text-xs font-black py-4 rounded-2xl hover:bg-purple-600 hover:text-white transition-all uppercase tracking-widest relative z-10 shadow-lg">
                                New Model
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}