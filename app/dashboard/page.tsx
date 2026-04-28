"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Home, BookOpen, User, LogOut, Search, MessageSquare,
    TrendingUp, Bell, Send, Clock, Sparkles
} from 'lucide-react';

export default function Dashboard() {
    const [articles, setArticles] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);

    // --- NEW NOTIFICATION STATES ---
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [adminMsg, setAdminMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Articles
            const { data: artData } = await supabase
                .from('articles')
                .select('*')
                .order('view_count', { ascending: false });
            if (artData) setArticles(artData);

            // 2. Fetch Announcements
            const { data: annData } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            if (annData) setAnnouncements(annData);

            // 3. Fetch Recent Comments
            const { data: comData } = await supabase
                .from('article_comments')
                .select(`id, content, created_at, articles ( title )`)
                .order('created_at', { ascending: false })
                .limit(3);
            if (comData) setComments(comData);

            // 4. FETCH DASHBOARD NOTIFICATIONS (The Feed)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: notifData } = await supabase
                    .from('dashboard_notifications')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (notifData) setNotifications(notifData);
            }
        };

        fetchData();

        // REAL-TIME: Listen for new Notifications (Admin posts)
        const notifChannel = supabase
            .channel('realtime-notifications')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'dashboard_notifications' },
                (payload) => {
                    setNotifications((prev) => [payload.new, ...prev]);
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(notifChannel);
        };
    }, []);

    // Function to mark notification as read
    const markAsRead = async (id: string) => {
        await supabase.from('dashboard_notifications').update({ is_read: true }).eq('id', id);
        setNotifications(notifications.filter(n => n.id !== id));
    };

    // ... (keep your existing displayArticles, handleUpdateAnnouncement, handleLogout logic)

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            {/* ... SIDEBAR (unchanged) ... */}

            <main className="flex-1 flex flex-col">
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="relative w-full max-w-2xl group">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-purple-500' : 'text-gray-500'}`} size={20} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-full py-3.5 pl-14 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-sm"
                        />
                    </div>

                    {/* NOTIFICATION BELL */}
                    <div className="relative ml-8">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-4 rounded-full relative ${showNotifications ? 'bg-purple-600' : 'bg-[#111] border border-white/5'}`}
                        >
                            <Bell size={22} />
                            {notifications.length > 0 && (
                                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-bounce"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-6 w-96 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50">
                                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111]">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Activity Center</h3>
                                    <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded-md font-bold">
                                        {notifications.length} New
                                    </span>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center text-gray-600 text-xs">No new notifications.</div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className="p-6 border-b border-white/5 hover:bg-purple-600/5 transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 p-2 bg-purple-600/20 rounded-lg text-purple-500 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                        <Sparkles size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white mb-1">{notif.title}</p>
                                                        <p className="text-[11px] text-gray-400 leading-relaxed">{notif.message}</p>
                                                        <p className="text-[9px] text-gray-600 mt-3 font-mono">
                                                            {new Date(notif.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* ... REST OF DASHBOARD (Left Section/Right Sidebar unchanged) ... */}
            </main>
        </div>
    );
}